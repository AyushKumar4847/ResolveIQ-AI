from fastapi.testclient import TestClient
from app.main import app
from app.services.ingestion import ingest_pdf

client = TestClient(app)

PDF_PATH = "pdfs/Rag_book.pdf"

def test_ingest():
    with open(PDF_PATH, "rb") as f:
        file_bytes = f.read()

    chunks = ingest_pdf(file_bytes)
    assert isinstance(chunks, list)
    assert len(chunks) > 0

    chunk = chunks[0]
    assert "content" in chunk
    assert "index" in chunk
    assert "embedding" in chunk
    assert "page_number" in chunk
    assert len(chunk["embedding"]) == 384
    






