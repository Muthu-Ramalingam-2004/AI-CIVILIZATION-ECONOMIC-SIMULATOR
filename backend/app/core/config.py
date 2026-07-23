import os
from pathlib import Path
from pydantic_settings import BaseSettings
from typing import Optional

# Get the absolute path to the backend directory
BACKEND_DIR = Path(__file__).resolve().parents[2] # core -> app -> backend
DEFAULT_DB_PATH = BACKEND_DIR / "simulator.db"

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Civilization Economic Simulator"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "supersecretkeyfor-ai-civilization-economic-simulator")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database
    DATABASE_URL: Optional[str] = os.getenv("DATABASE_URL")
 
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")
    
    class Config:
        case_sensitive = True
        env_file = str(DEFAULT_DB_PATH.parent / ".env")
        extra = "ignore"
        
settings = Settings()

if not settings.DATABASE_URL:
    raise ValueError("CRITICAL CONFIGURATION ERROR: DATABASE_URL environment variable is missing. Application startup aborted.")

print("FRONTEND_URL =", settings.FRONTEND_URL)
