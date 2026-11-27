import boto3
from app.core.config import settings
import uuid
from pathlib import Path

# connect to aws
def get_s3_client():
    # If no S3 bucket is configured, return None so the app falls back to local disk
    if not settings.S3_BUCKET_NAME:
        return None

    # Local dev: use explicit keys from .env if provided
    if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
        return boto3.client(
            "s3",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION,
        )

    # Production EC2: boto3 automatically uses the attached IAM Role
    return boto3.client("s3", region_name=settings.AWS_REGION)

def upload_document_file(file_bytes:bytes, filename:str):

    # 1. Create a unique file name so two users uploading "policy.pdf" don't overwrite each other
    key= f'documents/{uuid.uuid4().hex[:8]}_{filename}'

    s3= get_s3_client()

    # 3. If AWS is connected, upload directly to S3!
    if s3 and settings.S3_BUCKET_NAME:
        s3.put_object(
            Bucket=settings.S3_BUCKET_NAME,
            Key=key,
            Body=file_bytes,
            ContentType="application/pdf"
        )
        return f"s3:{key}"

    # 4. Fallback: If no AWS keys are set, save to your laptop's local "uploads/" folder
    # Path("uploads") / key creates: uploads/documents/<unique_id>_<filename>.pdf at project root
    local_path = Path("uploads") / key

    # Ensure the parent folder (uploads/documents/) exists; exist_ok=True prevents error if already present
    local_path.parent.mkdir(parents=True, exist_ok=True)

    # Write raw binary PDF bytes to the file on disk
    local_path.write_bytes(file_bytes)

    # Return storage pointer with "local:" prefix so the app knows to fetch from disk later
    return f"local:{key}"

# 5 # 3. Get a download link (Pre-Signed URL) or local file path


def get_document_url(storage_key: str, expiration_seconds: int = 900) -> dict:
    if not storage_key:
        return {"type": "none", "url": None}

    # Case A: File is in Amazon S3
    if storage_key.startswith("s3:"):
        # Remove "s3:" label so Amazon receives the clean key (e.g. documents/a1b2_file.pdf)
        key = storage_key.replace("s3:", "")
        s3 = get_s3_client()
        if s3 and settings.S3_BUCKET_NAME:
            # Generate temporary VIP download link valid for 15 minutes (900 seconds)
            url = s3.generate_presigned_url(
                # 1. Action: Allow downloading the file
                "get_object",
                # 2. Target: Which bucket and file key to allow
                Params={"Bucket": settings.S3_BUCKET_NAME, "Key": key},
                # 3. Timer: Valid for 15 minutes (900 seconds)
                ExpiresIn=expiration_seconds,
            )
            return {"type": "s3_url", "url": url}

    # Case B: File is saved locally on your laptop
    # Remove "local:" label to get the relative folder and file name
    raw_key = storage_key.replace("local:", "")

    # Build target path inside the project's uploads folder
    local_file = Path("uploads") / raw_key

    # Check if the file physically exists on your hard drive
    if local_file.exists():
        # .resolve() turns relative path into full absolute path: D:\resolveIQ AI\uploads\...
        return {"type": "local_file", "path": str(local_file.resolve())}

    # Return missing if file was not found in S3 or local disk (allows API to return clean 404)
    return {"type": "missing", "url": None}

# 4. Delete the file from S3 or local disk when a document is deleted
def delete_document_file(storage_key: str) -> bool:
    if not storage_key:
        return True

    # Case A: If stored on S3, delete from Amazon bucket
    if storage_key.startswith("s3:"):
        key = storage_key.replace("s3:", "")
        s3 = get_s3_client()
        if s3 and settings.S3_BUCKET_NAME:
            s3.delete_object(Bucket=settings.S3_BUCKET_NAME, Key=key)
            return True

    # Case B: If stored locally, delete from laptop disk
    raw_key = storage_key.replace("local:", "")
    local_file = Path("uploads") / raw_key
    if local_file.exists():
        local_file.unlink(missing_ok=True)  # unlink means permanently delete file
        return True

    return True