from fastapi.testclient import TestClient
from app.main import app
from fastapi import Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
import uuid
from app.models.user import User
from app.api.routes.auth import get_current_user

client= TestClient(app)

def fake_agent(db:Session= Depends(get_db)):
    user = db.query(User).filter(User.role.in_(["agent", "admin"])).first() or db.query(User).first()
    return user

app.dependency_overrides[get_current_user] = fake_agent

def test_ask_llm():
    response=client.post('/ask/',json={'question':'as'})
    assert response.status_code==422

def test_ask_question():
    response=client.post('/ask/',json={'question':'What Artificial Intelligence?'})
    assert response.status_code==200
    data = response.json()

    assert data['answer'].strip()!= ""
    assert data['evidence'].strip()!= ""