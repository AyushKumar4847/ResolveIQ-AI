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
    user = db.query(User).filter(User.role.in_(["agent", "admin"])).first()
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


def fake_agent2(db: Session = Depends(get_db)):
    user = db.query(User).filter(User.role == "user").first()
    return user or User(id=uuid.uuid4(), role="user", username="regular", email="user@test.com", password="dummy_password")


app.dependency_overrides[get_current_user] = fake_agent

PDF_PATH = "pdfs/Rag_book.pdf"


def test_upload_valid_pdf():
    with open(PDF_PATH, "rb") as f:
        response = client.post('/documents/upload',
        files={'file': ("Rag_book.pdf", f, "application/pdf")})

        assert response.status_code == 201
        assert 'id' in response.json()
        assert 'filename' in response.json() 
        assert 'chunk_count' in response.json()


def test_upload_invalid_file_type():
    response = client.post('/documents/upload',
    files={'file': ("test.txt", "dummy content", "text/plain")})
    
    assert response.status_code == 400


def test_get_all_documents():
    response = client.get('/documents/')
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if len(data) > 0:
        assert "id" in data[0]
        assert "filename" in data[0]
        assert "status" in data[0]
        assert "created_at" in data[0]


def test_get_document_by_id():
    with open(PDF_PATH, "rb") as f:
        upload_response = client.post(
            "/documents/upload",
            files={"file": ("Frontend_Coder_Army.pdf", f, "application/pdf")}
        )
    document_id = upload_response.json()["id"]

    response = client.get(f"/documents/{document_id}")
    assert response.status_code == 200
    assert response.json()["id"] == document_id
    assert "filename" in response.json()
    assert "status" in response.json()
    assert "created_at" in response.json()


def test_normal_user_cannot_upload():
    app.dependency_overrides[get_current_user] = fake_agent2
    with open(PDF_PATH, "rb") as f:
        response = client.post('/documents/upload',
        files={'file': ("Rag_book.pdf", f, "application/pdf")})

        assert response.status_code == 403

    app.dependency_overrides[get_current_user] = fake_agent


def test_get_nonexistent_document():
    random_id = uuid.uuid4()
    response = client.get(f"/documents/{random_id}")
    assert response.status_code == 404


def test_delete_document():
    with open(PDF_PATH, 'rb') as f:
        response = client.post('/documents/upload',
        files={'file': ('Frontend_Coder_Army.pdf', f, 'application/pdf')}
    )
    file_id = response.json()['id']
    response1 = client.delete(f'/documents/{file_id}')
    assert response1.status_code == 204

    response2 = client.delete(f'/documents/{file_id}')
    assert response2.status_code == 404
