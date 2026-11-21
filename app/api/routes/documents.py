from fastapi import APIRouter, Depends, UploadFile, HTTPException, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.ingestion import ingest_pdf
from app.services.s3 import upload_document_file, get_document_url, delete_document_file
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
    storage_key = None

    try:
        # 1. Upload raw PDF to S3 (or local disk fallback)
        storage_key = upload_document_file(file_bytes, file.filename)
        # 2. Save document record in PostgreSQL with its storage_key
        document = create_document(db, file.filename, owner_id=current_user.id, storage_key=storage_key)
        chunks = ingest_pdf(file_bytes)
        chunk_count = create_chunks(db, document.id, chunks)
        update_document_status(db, document.id, "completed")
    except Exception as exc:
        # ROLLBACK: If S3 upload happened, delete the file so no orphaned files stay on AWS!
        if storage_key:
            delete_document_file(storage_key)
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
    # If in S3: Send the 15-minute VIP link so the browser downloads directly from Amazon
    if target_type == "s3_url":
        return {"download_url": file_info["url"], "filename": document.filename}

@router.get('/{document_id}/download')
def download_doc_file(document_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Generates a secure S3 pre-signed URL or serves the file locally for download."""
    document = get_document_by_id(db, document_id, current_user)
    if document is None:
        raise HTTPException(status_code=404, detail="Document not found")

    file_info = get_document_url(document.storage_key)
    target_type = file_info.get("type")

    # If in S3: Send the 15-minute VIP link so the browser downloads directly from Amazon
    if target_type == "s3_url":
        return {"download_url": file_info["url"], "filename": document.filename}

    # If local: Send the file directly from your laptop's uploads/ folder
    elif target_type == "local_file":
        return FileResponse(
            path=file_info["path"],
            filename=document.filename,
            media_type="application/pdf",
        )
    else:
        raise HTTPException(status_code=404, detail="Original document file not found")

@router.delete('/{document_id}', status_code=204)
def delete_doc(document_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user_role = (current_user.role or "").strip().lower()
    if user_role not in ("agent", "admin"):
        raise HTTPException(status_code=403, detail="Only Support Agents and Admins can delete knowledge base documents")
    
    document = get_document_by_id(db, document_id, current_user)
    if document is None:
        raise HTTPException(status_code=404, detail="Document not found")

    storage_key = document.storage_key

    # 2. Delete from database
    success = delete_document(db, document_id, current_user)
    if not success:
        raise HTTPException(status_code=404, detail="Document not found")

    # 3. Clean up the file from S3 or local disk
    if storage_key:
        delete_document_file(storage_key)