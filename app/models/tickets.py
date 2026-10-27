import uuid
from datetime import datetime

from pgvector.sqlalchemy import Vector
from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.user import User

class Ticket(Base):
     __tablename__ = "tickets"

     id: Mapped[uuid.UUID] = mapped_column(
         Uuid(as_uuid=True),
         primary_key=True,
         default=uuid.uuid4,
     )
     subject: Mapped[str]= mapped_column(
         String, nullable=False
     )
     description: Mapped[str]= mapped_column(
         Text, nullable=False
     )

     created_at: Mapped[datetime] = mapped_column(
         DateTime(timezone=True),
         server_default=func.now(),
         nullable=False,
     )
     
     owner_id: Mapped[uuid.UUID | None] = mapped_column(
         Uuid(as_uuid=True),
         ForeignKey("users.id", ondelete="SET NULL"),
         nullable=True
     )
     status: Mapped[str] = mapped_column(String, nullable=False, default="open")
     owner: Mapped["User | None"] = relationship("User", foreign_keys=[owner_id])
     resolutions: Mapped[list["TicketResolution"]] = relationship(
     back_populates="ticket", cascade="all, delete-orphan"
)

class TicketResolution(Base):
    __tablename__ = "ticket_resolutions"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    ticket_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("tickets.id"),
        nullable=False,
    )
    answer: Mapped[str] = mapped_column(Text, nullable=True)
    evidence: Mapped[str] = mapped_column(Text, nullable=True)
    model_name: Mapped[str] = mapped_column(String, nullable=True)
    latency: Mapped[int] = mapped_column(Integer, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    ticket: Mapped["Ticket"] = relationship(back_populates="resolutions")
