import pytest
from pathlib import Path
from unittest.mock import MagicMock
from app.core.config import settings
from app.services.s3 import (
    upload_document_file,
    get_document_url,
    delete_document_file,
)


def test_s3_upload_and_download_local_fallback(monkeypatch):
    """Test local filesystem fallback when AWS credentials are not configured."""
    # 1. Temporarily pretend AWS key is None
    monkeypatch.setattr(settings, "AWS_ACCESS_KEY_ID", None)

    dummy_bytes = b"%PDF-1.4 dummy pdf bytes for unit testing"
    filename = "test_invoice.pdf"

    # 2. Upload (saves to local uploads/)
    storage_key = upload_document_file(dummy_bytes, filename)
    assert storage_key is not None
    assert storage_key.startswith("local:")

    # 3. Get download link / path
    file_info = get_document_url(storage_key)
    assert file_info["type"] == "local_file"
    assert Path(file_info["path"]).exists()

    # 4. Clean up / delete
    deleted = delete_document_file(storage_key)
    assert deleted is True
    assert not Path(file_info["path"]).exists()


def test_s3_upload_and_download_mocked(monkeypatch):
    """Test S3 interactions with a fake boto3 client (MagicMock)."""
    # 1. Create fake S3 client
    fake_s3 = MagicMock()
    fake_s3.generate_presigned_url.return_value = "https://fake-s3-presigned-url.com/invoice.pdf"

    # 2. Swap the real S3 client with our fake
    monkeypatch.setattr("app.services.s3.get_s3_client", lambda: fake_s3)

    dummy_bytes = b"%PDF-1.4 dummy pdf bytes for unit testing"
    filename = "test_invoice.pdf"

    # 3. Upload — verify put_object was called
    storage_key = upload_document_file(dummy_bytes, filename)
    assert storage_key.startswith("s3:documents/")
    assert fake_s3.put_object.called is True

    # 4. URL — verify pre-signed URL was generated
    file_info = get_document_url(storage_key)
    assert file_info["type"] == "s3_url"
    assert file_info["url"] == "https://fake-s3-presigned-url.com/invoice.pdf"

    # 5. Delete — verify delete_object was called
    deleted = delete_document_file(storage_key)
    assert deleted is True
    assert fake_s3.delete_object.called is True

