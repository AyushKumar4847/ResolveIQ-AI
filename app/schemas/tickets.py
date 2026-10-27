from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Literal
import uuid

class CreateTicket(BaseModel):
    subject: str
    description: str

class TicketOwner(BaseModel):
    id: uuid.UUID
    username: str
    email: str
    role: str = "user"
    model_config = ConfigDict(from_attributes=True)

class TicketResponse(BaseModel):
    id: uuid.UUID
    subject: str = Field(min_length=3)
    description: str = Field(min_length=3)
    status: str
    owner_id: uuid.UUID | None = None
    owner: TicketOwner | None = None
    model_config = ConfigDict(from_attributes=True)
    created_at: datetime

class ResolutionResponse(BaseModel):
    id: uuid.UUID
    ticket_id: uuid.UUID
    answer: str = Field(min_length=3)
    evidence: str = Field(min_length=3)
    model_name: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class UpdateTicketStatus(BaseModel):
    status: Literal["open", "resolved", "closed"]