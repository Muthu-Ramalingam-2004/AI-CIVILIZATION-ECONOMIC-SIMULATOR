from sqlalchemy import Column, Integer, Float, DateTime
from datetime import datetime, timezone
from app.core.database import Base

class SimulationHistory(Base):
    __tablename__ = "simulation_history"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    step_number = Column(Integer, nullable=False, unique=True)
    
    total_businesses = Column(Integer, nullable=False)
    total_employees = Column(Integer, nullable=False)
    avg_revenue = Column(Float, nullable=False)
    active_startups = Column(Integer, nullable=False)
    collapse_risk = Column(Float, nullable=False)  # 0 to 100%
    gdp_growth = Column(Float, nullable=False)  # Estimate percentage (e.g. 2.5)
    migration_count = Column(Integer, nullable=False)  # Count of relocations in this step
    total_capital = Column(Float, nullable=False)
    unemployment_rate = Column(Float, default=5.0, nullable=False)  # Simulated unemployment rate
    average_risk = Column(Float, default=10.0, nullable=False)  # Avg business risk
