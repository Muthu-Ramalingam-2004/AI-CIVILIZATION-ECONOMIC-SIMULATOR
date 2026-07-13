from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime, timezone
from app.core.database import Base

class SystemLog(Base):
    __tablename__ = "system_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    message = Column(String, nullable=False)
    level = Column(String, default="INFO", nullable=False)  # "INFO", "WARNING", "ERROR"
    category = Column(String, default="general", nullable=False)  # "simulation", "migration", "merger", "bankruptcy", "startup", "auth"
