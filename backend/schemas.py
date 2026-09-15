from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: str = "patient"

class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    role: str

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class MedicalRecordCreate(BaseModel):
    title: str
    description: Optional[str] = None

class MedicalRecordResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ShareRecordRequest(BaseModel):
    doctor_email: EmailStr

class RecordAccessResponse(BaseModel):
    id: int
    record_id: int
    doctor_id: int
    granted_at: datetime

    class Config:
        from_attributes = True

class SharedRecordResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    created_at: datetime
    patient_name: str

    class Config:
        from_attributes = True