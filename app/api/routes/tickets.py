from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.repositories.tickets import (
    create_ticket,
    get_all_tickets,
    get_ticket_by_id,
    delete_ticket,
    create_resolution,
    get_resolutions_by_ticket,
    update_ticket_status
)
from app.services.rag import generate_answers
from app.schemas.tickets import TicketResponse, CreateTicket, ResolutionResponse, UpdateTicketStatus
from app.core.config import settings
from app.api.routes.auth import get_current_user
from app.models.user import User
import uuid
import time

router = APIRouter(
    prefix='/tickets', tags=["tickets"]
)

@router.post('/', response_model=TicketResponse, status_code=201)
def create_new_ticket(ticket: CreateTicket, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ticket = create_ticket(db, ticket.subject, ticket.description, current_user.id)
    return TicketResponse.model_validate(ticket)

@router.get('/', response_model=list[TicketResponse])
def read_all_tickets(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_all_tickets(db, current_user)

@router.get('/{id}', response_model=TicketResponse)
def read_ticket_by_id(id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ticket = get_ticket_by_id(db, id, current_user)
    if ticket is None:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket

@router.delete('/{id}', status_code=204)
def delete_tickets(id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ticket = delete_ticket(db, id, current_user)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return True

@router.post("/{ticket_id}/resolve", response_model=ResolutionResponse)
def resolve_ticket(ticket_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ticket = get_ticket_by_id(db, ticket_id, current_user)
    if ticket is None:
        raise HTTPException(status_code=404, detail="Ticket not found")

    start = time.time()
    answer, evidence = generate_answers(db, ticket.description)
    if not evidence.strip():
        raise HTTPException(status_code=404, detail="No chunks found")
    if not answer.strip():
        raise HTTPException(status_code=502, detail="LLM returned an empty answer")
    resolution = create_resolution(
        db,
        ticket.id,
        answer,
        model_name="openai/gpt-oss-20b",
        evidence=evidence,
        latency_ms=int((time.time() - start) * 1000),
    )
    # Auto mark ticket as resolved
    ticket.status = "resolved"
    db.commit()

    return ResolutionResponse.model_validate(resolution)

@router.get("/{ticket_id}/resolutions", response_model=list[ResolutionResponse])
def get_resolutions(ticket_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_resolutions_by_ticket(db, ticket_id)

@router.patch("/{ticket_id}/status", response_model=TicketResponse)
def change_ticket_status(ticket_id: uuid.UUID, body: UpdateTicketStatus, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ticket = update_ticket_status(db, ticket_id, current_user, body.status)
    if ticket is None:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return TicketResponse.model_validate(ticket) 
