from sqlalchemy.orm import Session  # noqa: I001
from app.models.documents import Document, DocumentChunk
import uuid


def create_document(db: Session, filename: str, owner_id) -> Document:
    doc = Document(filename=filename, owner_id=owner_id)
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


def create_chunks(db: Session, document_id: uuid.UUID, chunks: list[dict]) -> int:
    for chunk in chunks:
        document_chunk = DocumentChunk(
            document_id=document_id,
            content=chunk["content"],
            chunk_index=chunk["index"],
            embedding=chunk["embedding"],
            page_number=chunk["page_number"]
        )
        db.add(document_chunk)
    db.commit()
    return len(chunks)

def update_document_status(db: Session, document_id: uuid.UUID, status: str) -> None:
    document = db.query(Document).filter(Document.id == document_id).first()
    if document is None:
        raise ValueError(f"Document {document_id} was not found")

    document.status = status
    db.commit()

def get_all_documents(db: Session, current_user) -> list[Document]:
    return db.query(Document).order_by(Document.created_at.desc()).all()

def get_document_by_id(db: Session, document_id: uuid.UUID, current_user) -> Document | None:
    return db.query(Document).filter(Document.id == document_id).first()

def delete_document(db: Session, document_id: uuid.UUID, current_user) -> bool:
    document = get_document_by_id(db, document_id, current_user)
    if document is None:
        return False

    db.delete(document)
    db.commit()
    return True
