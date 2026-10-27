import uuid
from pydantic import BaseModel,Field,ConfigDict
from datetime import datetime

class DocumentResponse(BaseModel):
    id: uuid.UUID
    filename: str
    chunk_count: int

    model_config = ConfigDict(from_attributes=True)

class DocumentDetailResponse(BaseModel):
    id: uuid.UUID
    filename: str
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class AnswerRequest(BaseModel):
    question: str = Field(..., min_length=3)

class AnswerResponse(BaseModel):
    answer: str
    evidence:str