import sys
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

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
    print(f"Warning: Database connection failed for: {db_url}. Error: {e}", file=sys.stderr)
    print("Warning: Falling back to local SQLite database: sqlite:///./simulator.db", file=sys.stderr)
    db_url = "sqlite:///./simulator.db"
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
