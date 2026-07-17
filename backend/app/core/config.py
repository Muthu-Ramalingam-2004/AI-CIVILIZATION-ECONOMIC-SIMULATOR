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

    # SMTP Settings for Password Reset
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USERNAME: Optional[str] = os.getenv("SMTP_USERNAME")
    SMTP_PASSWORD: Optional[str] = os.getenv("SMTP_PASSWORD")
    SMTP_FROM_EMAIL: str = os.getenv("SMTP_FROM_EMAIL", "noreply@civilizationsimulator.com")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")
    RESET_TOKEN_SECRET: str = os.getenv("RESET_TOKEN_SECRET", "supersecretresettokenkey-ai-civilization-economic-simulator")
    RESET_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("RESET_TOKEN_EXPIRE_MINUTES", "15"))

    def __init__(self, **values):
        super().__init__(**values)
        db_url = self.DATABASE_URL
        if not db_url or "sqlite" in db_url:
            # Force sqlite to use absolute path
            abs_db_path = DEFAULT_DB_PATH.resolve().as_posix()
            self.DATABASE_URL = f"sqlite:///{abs_db_path}"
        else:
            self.DATABASE_URL = db_url
    
    class Config:
        case_sensitive = True
        env_file = str(DEFAULT_DB_PATH.parent / ".env")
        extra = "ignore"
        
settings = Settings()

print("SMTP_USERNAME =", settings.SMTP_USERNAME)
print("SMTP_PASSWORD =", "SET" if settings.SMTP_PASSWORD else "NOT SET")
print("SMTP_FROM_EMAIL =", settings.SMTP_FROM_EMAIL)
print("FRONTEND_URL =", settings.FRONTEND_URL)
