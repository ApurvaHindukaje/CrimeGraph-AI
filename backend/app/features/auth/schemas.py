from datetime import datetime
from pydantic import BaseModel, EmailStr
from app.shared.models import UserRole

class UserLogin(BaseModel):
    username: str
    password: str

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.ANALYST

class UserOut(BaseModel):
    id: int
    username: str
    email: str
    role: UserRole
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
