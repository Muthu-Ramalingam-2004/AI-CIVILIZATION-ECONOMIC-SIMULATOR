import sys
from typing import Optional
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

def resolve_db_url(url: Optional[str]) -> str:
    if not url:
        from app.core.config import DEFAULT_DB_PATH
        return f"sqlite:///{DEFAULT_DB_PATH.resolve().as_posix()}"
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
    # If settings.DATABASE_URL is explicitly set to a non-SQLite string, fail loudly in production!
    if settings.DATABASE_URL and not settings.DATABASE_URL.startswith("sqlite"):
        print(f"CRITICAL DATABASE CONNECTION ERROR: {e}", file=sys.stderr)
        raise e
        
    print(f"Warning: Database connection failed for: {db_url}. Error: {e}", file=sys.stderr)
    from app.core.config import DEFAULT_DB_PATH
    db_url = f"sqlite:///{DEFAULT_DB_PATH.resolve().as_posix()}"
    print(f"Warning: Falling back to local SQLite database: {db_url}", file=sys.stderr)
    connect_args = {"check_same_thread": False}
    engine = create_engine(
        db_url,
        connect_args=connect_args,
        pool_pre_ping=True
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
