# FastAPI Project — General Implementation Reference

Use this as a starting point for any FastAPI project.
These are the patterns that repeat across every project.

---

## 1. Project Setup

### Folder Structure
```
app/
    core/           # config, security, logging
    api/
        routes/     # one file per feature
    schemas/        # pydantic request and response models
    models/         # sqlalchemy database models
    repositories/   # database queries
    services/       # business logic
    db/             # session and base
    main.py         # entry point
tests/
    unit/
    integration/
alembic/
.env
.env.example
.gitignore
requirements.txt
compose.yaml
```

### Add `__init__.py` to every folder inside app/ and tests/

### Commands
```powershell
python -m venv .venv
.venv\Scripts\activate
pip install fastapi uvicorn
uvicorn app.main:app --reload
```

---

## 2. Entry Point — `app/main.py`

```python
from fastapi import FastAPI

app = FastAPI(title="YourAppName")

@app.get("/health")
def health():
    return {"status": "ok"}
```

Always start with a health endpoint. Verify it works before adding anything else.

---

## 3. Environment Variables — `app/core/config.py`

Never hardcode secrets. Always read from .env.

```python
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str
    APP_ENV: str = "development"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
```

`.env` file:
```
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
APP_ENV=development
```

`.env.example` — same file but with placeholder values. Commit this, not `.env`.

`.gitignore` — always include:
```
.env
.venv/
__pycache__/
```

---

## 4. Database — SQLAlchemy + PostgreSQL

### `app/db/base.py`
```python
from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass
```

### `app/db/session.py`
```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

engine = create_engine(str(settings.DATABASE_URL))
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### Using the session in a route
```python
from fastapi import Depends
from sqlalchemy.orm import Session
from app.db.session import get_db

@router.get("/items")
def get_items(db: Session = Depends(get_db)):
    return db.query(Item).all()
```

---

## 5. Docker Compose — PostgreSQL

### `compose.yaml`
```yaml
services:
  db:
    image: postgres:16
    container_name: myapp_db
    environment:
      POSTGRES_USER: myapp
      POSTGRES_PASSWORD: myapp
      POSTGRES_DB: myapp
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Use `pgvector/pgvector:pg16` instead of `postgres:16` if you need vector search.

### Commands
```powershell
docker compose up -d        # start in background
docker compose ps           # check status
docker compose down         # stop
docker compose down -v      # stop and delete data
```

---

## 6. Alembic — Database Migrations

### Setup (run once per project)
```powershell
alembic init alembic
```

### `alembic.ini` — remove hardcoded URL
```
# Remove this line:
# sqlalchemy.url = driver://user:pass@localhost/dbname
# URL is set dynamically in env.py
```

### `alembic/env.py` — add these two changes
```python
from app.core.config import settings
from app.db.base import Base

config.set_main_option("sqlalchemy.url", str(settings.DATABASE_URL))
target_metadata = Base.metadata
```

### Every time you change a model
```powershell
alembic revision --autogenerate -m "describe the change"
alembic upgrade head
```

### For raw SQL migrations (extensions, custom types)
```powershell
alembic revision -m "describe the change"
# manually edit the generated file
alembic upgrade head
```

### Key commands
| Command | What it does |
|---|---|
| `alembic revision -m "name"` | Create empty migration |
| `alembic revision --autogenerate -m "name"` | Create migration from model changes |
| `alembic upgrade head` | Apply all pending migrations |
| `alembic downgrade -1` | Reverse last migration |
| `alembic current` | Show current migration version |
| `alembic history` | Show all migrations |

---

## 7. SQLAlchemy Models

```python
import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base

class Item(Base):
    __tablename__ = "items"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
```

Always:
- Use UUIDs as primary keys
- Add created_at timestamp
- Import model in `app/db/base.py` before running migrations

---

## 8. Pydantic Schemas

```python
from pydantic import BaseModel
import uuid

# Request — what the client sends
class ItemCreate(BaseModel):
    name: str

# Response — what the API returns
class ItemResponse(BaseModel):
    id: uuid.UUID
    name: str

    model_config = {"from_attributes": True}
```

`from_attributes = True` lets Pydantic read from SQLAlchemy model instances directly.

---

## 9. Repository Pattern

```python
from sqlalchemy.orm import Session
from app.models.item import Item
from app.schemas.item import ItemCreate

def create_item(db: Session, data: ItemCreate) -> Item:
    item = Item(**data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

def get_item(db: Session, item_id: uuid.UUID) -> Item | None:
    return db.query(Item).filter(Item.id == item_id).first()
```

Repository handles all database queries. Service handles business logic. Keep them separate.

---

## 10. API Route Pattern

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.item import ItemCreate, ItemResponse
from app.repositories import items as repo

router = APIRouter(prefix="/items", tags=["items"])

@router.post("/", response_model=ItemResponse, status_code=status.HTTP_201_CREATED)
def create_item(data: ItemCreate, db: Session = Depends(get_db)):
    return repo.create_item(db, data)

@router.get("/{item_id}", response_model=ItemResponse)
def get_item(item_id: uuid.UUID, db: Session = Depends(get_db)):
    item = repo.get_item(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item
```

Register the router in `main.py`:
```python
from app.api.routes import items
app.include_router(items.router)
```

---

## 11. Request → Response Flow

```
Client sends request
        ↓
FastAPI router matches the URL
        ↓
Pydantic validates the request body
        ↓
Route function calls service or repository
        ↓
Repository queries PostgreSQL via SQLAlchemy
        ↓
Result returned to route function
        ↓
Pydantic serializes response
        ↓
Client receives response
```

---

## 12. Common Mistakes

| Mistake | What happens | Fix |
|---|---|---|
| Hardcoding DATABASE_URL | Password in Git | Use .env + pydantic-settings |
| Forgetting `__init__.py` | ModuleNotFoundError | Add to every package folder |
| Wrong uvicorn command | Module not found | Use `uvicorn app.main:app` |
| Using postgres:16 with pgvector | Extension not found | Use pgvector/pgvector:pg16 |
| Forgetting target_metadata in env.py | Alembic cannot detect models | Set target_metadata = Base.metadata |
| Not importing model before migration | Table not generated | Import model in alembic/env.py or base.py |
| autocommit=True in session | Changes saved immediately, no rollback | Always use autocommit=False |
| Returning SQLAlchemy model without from_attributes | Pydantic serialization error | Add model_config = {"from_attributes": True} |
