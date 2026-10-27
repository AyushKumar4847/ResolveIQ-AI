from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.rag import generate_answers
from app.schemas.documents import AnswerRequest, AnswerResponse
from app.api.routes.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/ask", tags=["ask"])

@router.post('/', response_model=AnswerResponse)
def ask_llm(question: AnswerRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    answer, evidence = generate_answers(db, question.question)
    return AnswerResponse(answer=answer, evidence=evidence)