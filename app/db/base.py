from sqlalchemy.orm import DeclarativeBase  # noqa: I001

class Base(DeclarativeBase):
    pass

from app.models import documents,user, tickets # noqa: F401
