from sqlalchemy import Column, Integer, String, Boolean, DateTime
from datetime import datetime, timezone
from app.core.database import Base

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    type = Column(String, nullable=False)  # "collapse_warning", "startup_boom", "migration", "employment_decline", "saturation"
    is_read = Column(Boolean, default=False, nullable=False)
