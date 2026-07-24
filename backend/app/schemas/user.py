from pydantic import BaseModel, EmailStr
from typing import Optional

class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    role: str
    is_active: bool
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    profile_picture: Optional[str] = None
    theme: Optional[str] = "dark"

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    username: str

class TokenData(BaseModel):
    username: Optional[str] = None

class ForgotPasswordRequest(BaseModel):
    username_or_email: str
    new_password: str
    confirm_password: str

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    username: str
    email: EmailStr
    phone_number: Optional[str] = None
    profile_picture: Optional[str] = None

class EmailUpdate(BaseModel):
    current_email: EmailStr
    new_email: EmailStr

class PasswordChange(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str

class ThemeUpdate(BaseModel):
    theme: str

