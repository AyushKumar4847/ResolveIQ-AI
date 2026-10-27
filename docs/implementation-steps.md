# ResolveIQ — Implementation Steps Reference

Use this as a reference when implementing features from scratch.
Each milestone lists the exact steps in order.

---

## Milestone 1 — Project Scaffold + Health Endpoint

1. Create the folder structure
   - app/, app/core/, app/api/, app/api/routes/
   - app/schemas/, app/models/, app/repositories/
   - app/services/, app/db/
   - tests/unit/, tests/integration/, tests/evaluation/
   - scripts/, alembic/, docs/

2. Add `__init__.py` to every folder inside app/ and tests/

3. Create `app/main.py`
   - Import FastAPI
   - Create app instance with title
   - Add GET /health route returning {"status": "ok"}

4. Create `requirements.txt` with pinned dependencies

5. Create `.env.example` with all required environment variables

6. Create `.gitignore` — include .env, __pycache__, .venv, uploads/

7. Create virtual environment and install fastapi + uvicorn
   ```
   python -m venv .venv
   .venv\Scripts\activate
   pip install fastapi uvicorn
   ```

8. Run the app and verify
   ```
   uvicorn app.main:app --reload
   ```
   - GET /health should return {"status": "ok"}
   - GET /docs should show Swagger UI

---

## Milestone 2 — PostgreSQL + SQLAlchemy + Alembic

### Part A — Start the database

1. Create `compose.yaml`
   - Use image: pgvector/pgvector:pg16 (not plain postgres:16)
   - Set POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB
   - Map port 5432:5432
   - Add a named volume for persistent storage

2. Copy .env.example to .env and fill in DATABASE_URL
   ```
   DATABASE_URL=postgresql://resolveiq:resolveiq@localhost:5432/resolveiq
   ```

3. Start the database
   ```
   docker compose up -d
   docker compose ps   ← verify it is running
   ```

### Part B — Configure SQLAlchemy

4. Install dependencies
   ```
   pip install sqlalchemy psycopg2-binary pydantic-settings alembic
   ```

5. Create `app/core/config.py`
   - Use pydantic BaseSettings to read DATABASE_URL from .env
   - Create a settings instance at module level

6. Create `app/db/session.py`
   - Import settings
   - Create engine using settings.DATABASE_URL
   - Create SessionLocal with autocommit=False, autoflush=False
   - Define get_db() using yield

7. Create `app/db/base.py`
   - Import DeclarativeBase from sqlalchemy.orm
   - Define Base class inheriting from DeclarativeBase

### Part C — Configure Alembic

8. Initialise Alembic
   ```
   alembic init alembic
   ```

9. Edit `alembic.ini`
   - Remove the hardcoded sqlalchemy.url line
   - Replace with a comment explaining it is set in env.py

10. Edit `alembic/env.py`
    - Import settings from app.core.config
    - Import Base from app.db.base
    - Add: config.set_main_option("sqlalchemy.url", str(settings.DATABASE_URL))
    - Change: target_metadata = Base.metadata

### Part D — First migration

11. Create the pgvector migration
    ```
    alembic revision -m "enable_pgvector"
    ```

12. Edit the generated file in alembic/versions/
    - upgrade(): op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    - downgrade(): op.execute("DROP EXTENSION IF EXISTS vector")

13. Apply the migration
    ```
    alembic upgrade head
    ```

14. Verify the app still starts correctly
    ```
    uvicorn app.main:app --reload
    ```

---

## Key Commands Reference

| Command | What it does |
|---|---|
| `docker compose up -d` | Start containers in background |
| `docker compose down -v` | Stop containers and remove volumes |
| `docker compose ps` | Check running containers |
| `alembic revision -m "name"` | Create empty migration file |
| `alembic revision --autogenerate -m "name"` | Create migration from model changes |
| `alembic upgrade head` | Apply all pending migrations |
| `alembic downgrade -1` | Reverse the last migration |
| `uvicorn app.main:app --reload` | Start FastAPI with auto-reload |

---

## Common Mistakes

| Mistake | What happens | Fix |
|---|---|---|
| Using postgres:16 image | pgvector extension not found | Use pgvector/pgvector:pg16 |
| Hardcoding DATABASE_URL in alembic.ini | Password exposed in Git | Read from .env in env.py |
| Forgetting target_metadata = Base.metadata | Alembic cannot see models | Import Base and set target_metadata |
| Forgetting __init__.py | ModuleNotFoundError on imports | Add __init__.py to every package folder |
| Running uvicorn main:app | Module not found | Run uvicorn app.main:app |

---

## How Things Connect

```
Docker starts PostgreSQL
        ↓
Alembic creates tables (migrations)
        ↓
FastAPI app starts
        ↓
Request comes in
        ↓
SQLAlchemy reads/writes data in PostgreSQL
        ↓
Response goes back to client
```

---

## Error Log

| Symptom | Root Cause | Fix | Lesson |
|---|---|---|---|
| extension "vector" is not available | postgres:16 does not include pgvector | Use pgvector/pgvector:pg16 image | Always check if extensions need a special image |
