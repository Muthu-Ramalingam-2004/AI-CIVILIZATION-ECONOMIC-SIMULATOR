import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Civilization Economic Simulator"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "supersecretkeyfor-ai-civilization-economic-simulator")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database
    # Standard fallback to local SQLite for simple local runs
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./simulator.db")
    
    class Config:
        case_sensitive = True

settings = Settings()
