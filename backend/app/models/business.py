from sqlalchemy import Column, Integer, String, Float, Boolean
from app.core.database import Base

class Business(Base):
    __tablename__ = "businesses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    industry = Column(String, index=True, nullable=False)
    city = Column(String, index=True, nullable=False)
    country = Column(String, index=True, nullable=False)
    employees = Column(Integer, default=1, nullable=False)
    revenue = Column(Float, default=10000.0, nullable=False)
    expenses = Column(Float, default=8000.0, nullable=False)
    growth_rate = Column(Float, default=0.05, nullable=False)  # Yearly or monthly decimal (e.g. 0.05 = 5%)
    ai_strategy = Column(String, default="moderate_growth", nullable=False)  # "aggressive_expansion", "cost_cutting", "moderate_growth", "r_and_d_focus"
    risk_level = Column(Float, default=10.0, nullable=False)  # 0 to 100 percentage
    capital = Column(Float, default=50000.0, nullable=False)  # Accumulated capital reserve
    age = Column(Integer, default=0, nullable=False)  # Age in months
    is_active = Column(Boolean, default=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
