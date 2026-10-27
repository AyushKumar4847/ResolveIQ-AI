from pydantic import BaseModel, ConfigDict, EmailStr, Field
import uuid
from datetime import datetime

class RegisterUser(BaseModel):
    username: str
    email: EmailStr
    password: str = Field(min_length=8)
    role: str = "user"

class RegisterResponse(BaseModel):
    id: uuid.UUID
    username: str
    email: EmailStr
    role: str = "user"
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    id: uuid.UUID
    username: str
    email: str
    role: str = "user"

    model_config = ConfigDict(from_attributes=True)

class UserResponse(BaseModel):
    id: uuid.UUID
    username: str
    email: EmailStr
    role: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class UpdateUser(BaseModel):
    username: str | None = None
    email: EmailStr | None = None
    current_password: str | None = None
    new_password: str | None = Field(default=None, min_length=8)

class UpdateUserRole(BaseModel):
    role: str
