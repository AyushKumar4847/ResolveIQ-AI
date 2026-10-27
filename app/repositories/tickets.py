from sqlalchemy.orm import Session, joinedload  # noqa: I001
from app.models.tickets import Ticket, TicketResolution
from fastapi import HTTPException
import uuid


# tickets
def create_ticket(db, subject, description, owner_id):
    ticket = Ticket(subject=subject, description=description, owner_id=owner_id)
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return db.query(Ticket).options(joinedload(Ticket.owner)).filter(Ticket.id == ticket.id).first()

def get_all_tickets(db, current_user):
    user_role = (current_user.role or "").strip().lower()
    query = db.query(Ticket).options(joinedload(Ticket.owner)).order_by(Ticket.created_at.desc())
    if user_role in ("agent", "admin"):
        return query.all()
    return query.filter(Ticket.owner_id == current_user.id).all()

def get_ticket_by_id(db, ticket_id, current_user):
    user_role = (current_user.role or "").strip().lower()
    query = db.query(Ticket).options(joinedload(Ticket.owner))
    if user_role in ("agent", "admin"):
        return query.filter(Ticket.id == ticket_id).first()
    return query.filter(Ticket.id == ticket_id, Ticket.owner_id == current_user.id).first()

def delete_ticket(db, ticket_id, current_user):
    ticket = get_ticket_by_id(db, ticket_id, current_user)
    if ticket is None:
        return False
    db.delete(ticket)
    db.commit()
    return True

def create_resolution(db, ticket_id, answer, evidence, model_name, latency_ms):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if ticket is None:
        raise ValueError(f"Ticket {ticket_id} was not found")
    resolution = TicketResolution(
        ticket_id=ticket_id,
        answer=answer,
        evidence=evidence,
        model_name=model_name,
        latency=latency_ms
    )
    db.add(resolution)
    db.commit()

    return resolution

def get_resolutions_by_ticket(db: Session, ticket_id: uuid.UUID):
    return db.query(TicketResolution).filter(TicketResolution.ticket_id == ticket_id).all()

def update_ticket_status(db, ticket_id, current_user, status):
    ticket = get_ticket_by_id(db, ticket_id, current_user)
    if ticket is None:
        return None
    valid_statuses = ["open", "resolved", "closed"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {valid_statuses}")
    ticket.status = status
    db.commit()
    db.refresh(ticket)
    return ticket
