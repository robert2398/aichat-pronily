"""
Authentication-related Pydantic schemas.
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
import uuid

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordConfirm(BaseModel):
    email: EmailStr
    uid: uuid.UUID
    token: str
    new_password: str = Field(min_length=8)
    


class SetPasswordRequest(BaseModel):
    uid: int
    token: str
    password: str = Field(..., min_length=8)


class ChangePasswordRequest(BaseModel):
    old_password: str = Field(..., min_length=8)
    new_password: str = Field(..., min_length=8)

class MessageResponse(BaseModel):
    message: str
