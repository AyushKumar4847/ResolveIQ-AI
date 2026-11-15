FROM python:3.12-slim

WORKDIR /app

# Prevent pip / build tools from using RAM-backed /tmp which hits Errno 28 No Space Left on small cloud instances
ENV TMPDIR=/var/tmp

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install CPU-only PyTorch first to prevent downloading ~7GB of unused NVIDIA CUDA GPU binaries
RUN pip install --default-timeout=1000 --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

RUN pip install --default-timeout=1000 --no-cache-dir -r requirements.txt

COPY app/ app/
COPY alembic/ alembic/
COPY alembic.ini .
COPY tests/ tests/
COPY pdfs/ pdfs/

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
