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
    DATABASE_URL: str = ""

    def __init__(self, **values):
        super().__init__(**values)
        db_url = os.getenv("DATABASE_URL", "")
        if not db_url or "sqlite" in db_url:
            # Force sqlite to use absolute path
            abs_db_path = DEFAULT_DB_PATH.resolve().as_posix()
            self.DATABASE_URL = f"sqlite:///{abs_db_path}"
        else:
            self.DATABASE_URL = db_url
    
    class Config:
        case_sensitive = True

settings = Settings()

