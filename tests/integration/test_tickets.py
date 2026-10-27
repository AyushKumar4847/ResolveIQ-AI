from fastapi.testclient import TestClient
from app.main import app
from fastapi import Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
import uuid
from app.models.user import User
from app.api.routes.auth import get_current_user

client = TestClient(app)


def fake_agent(db: Session = Depends(get_db)):
    user = db.query(User).filter(User.role == 'agent').first()
    if not user:
        user = User(
            id=uuid.uuid4(),
            username="ci_agent",
            email="ci_agent@resolveiq.ai",
            password="dummy_password",
            role="agent"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


app.dependency_overrides[get_current_user] = fake_agent


def test_create_ticket():
    response = client.post("/tickets/", json={
        "subject": "Test Subject",
        "description": "Test Description"
    })
    assert response.status_code == 201
    data = response.json()
    assert uuid.UUID(data['id'])
    assert data['subject'] == 'Test Subject'
    assert data['description'] == 'Test Description'


def test_get_all_ticket():
    response = client.get("/tickets/")

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

    if data:
        assert "id" in data[0]
        assert "subject" in data[0]
        assert "description" in data[0]
        assert "status" in data[0]


def test_get_ticket_by_id():
    response = client.post("/tickets/", json={
        "subject": "Test Subject 1",
        "description": "Test Description 1"
    })
    assert response.status_code == 201
    id = response.json()['id']

    get_response = client.get(f'/tickets/{id}')
    assert get_response.status_code == 200
    
    data = get_response.json()
    assert uuid.UUID(data['id']) == uuid.UUID(id)
    assert data['subject'] == 'Test Subject 1'
    assert data['description'] == 'Test Description 1'


def test_nonexistent_ticket():
    random_id = uuid.uuid4()
    response = client.get(f"/tickets/{random_id}")
    assert response.status_code == 404


def test_delete_ticket():
    response = client.post("/tickets/", json={
        "subject": "Test Subject 1",
        "description": "Test Description 1"
    })
    assert response.status_code == 201
    ticket_id = response.json()['id']
    response1 = client.delete(f'/tickets/{ticket_id}')
    assert response1.status_code == 204
    
    response2 = client.delete(f'/tickets/{ticket_id}')
    assert response2.status_code == 404
