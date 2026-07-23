import sys
from typing import Optional
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

def resolve_db_url(url: str) -> str:
    if url.startswith("sqlite://"):
        rest = url[9:]
        if rest.startswith("/"):
            path_str = rest[1:]
        else:
            path_str = rest
        
        # Check if path is relative (does not start with '/' and is not a Windows absolute path like 'C:/')
        if not path_str.startswith("/") and not (len(path_str) > 1 and path_str[1] == ":"):
            from app.core.config import BACKEND_DIR
            absolute_path = (BACKEND_DIR / path_str).resolve().as_posix()
            return f"sqlite:///{absolute_path}"
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql://", 1)
    return url

db_url = resolve_db_url(settings.DATABASE_URL)

# Connect arguments (needed for SQLite check_same_thread)
connect_args = {}
if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

try:
    engine = create_engine(
        db_url,
        connect_args=connect_args,
        pool_pre_ping=True
    )
    # Test connection immediately
    with engine.connect() as conn:
        pass
    print(f"Database connection verified: {db_url.split('@')[-1] if '@' in db_url else db_url}")
except Exception as e:
    print(f"CRITICAL DATABASE CONNECTION ERROR: Failed to connect to {db_url}. Error: {e}", file=sys.stderr)
    raise e

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
