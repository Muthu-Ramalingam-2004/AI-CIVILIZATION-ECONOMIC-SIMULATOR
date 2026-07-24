from sqlalchemy import Column, Integer, String, Boolean
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="user", nullable=False)  # "user" or "admin"
    is_active = Column(Boolean, default=True)
    full_name = Column(String, nullable=True)
    phone_number = Column(String, nullable=True)
    profile_picture = Column(String, nullable=True)
    theme = Column(String, default="dark", nullable=True)
