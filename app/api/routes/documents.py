from fastapi import APIRouter, Depends, UploadFile, HTTPException, File
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.ingestion import ingest_pdf
from app.repositories.documents import (
    create_document,
    create_chunks,
    update_document_status,
    get_all_documents,
    get_document_by_id,
    delete_document,
)
from app.schemas.documents import DocumentResponse, DocumentDetailResponse
from app.core.config import settings
from app.api.routes.auth import get_current_user
from app.models.user import User
import uuid

router = APIRouter(prefix="/documents", tags=["documents"])


@router.post('/upload', response_model=DocumentResponse, status_code=201)
def upload_file(db: Session = Depends(get_db), file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    user_role = (current_user.role or "").strip().lower()
    if user_role not in ("agent", "admin"):
        raise HTTPException(status_code=403, detail="Only Support Agents and Admins can upload knowledge base documents")

    if file.content_type != 'application/pdf':
        raise HTTPException(status_code=400, detail='Invalid file type')
    if not file.filename:
        raise HTTPException(status_code=400, detail='Filename is required')

    file_bytes = file.file.read()
    if len(file_bytes) > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Max size is 10MB")
    document = None
    chunk_count = 0

    try:
        document = create_document(db, file.filename, owner_id=current_user.id)
        chunks = ingest_pdf(file_bytes)
        chunk_count = create_chunks(db, document.id, chunks)
        update_document_status(db, document.id, "completed")
    except Exception as exc:
        if document:
            try:
                update_document_status(db, document.id, "failed")
            except Exception:
                db.rollback()
        raise HTTPException(status_code=500, detail="Ingestion failed") from exc

    return DocumentResponse(
        id=document.id,
        filename=document.filename,
        chunk_count=chunk_count,
    )

@router.get('/', response_model=list[DocumentDetailResponse])
def get_all_docs(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_all_documents(db, current_user)

@router.get('/{document_id}', response_model=DocumentDetailResponse)
def get_doc_by_id(document_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    document = get_document_by_id(db, document_id, current_user)
    if document is None:
        raise HTTPException(status_code=404, detail="Document not found")
    return document

@router.delete('/{document_id}', status_code=204)
def delete_doc(document_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user_role = (current_user.role or "").strip().lower()
    if user_role not in ("agent", "admin"):
        raise HTTPException(status_code=403, detail="Only Support Agents and Admins can delete knowledge base documents")
    success = delete_document(db, document_id, current_user)
    if not success:
        raise HTTPException(status_code=404, detail="Document not found")
