from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class SimulationRunRequest(BaseModel):
    months: int  # 1, 6, 12 (1 year), 60 (5 years), 120 (10 years)

class SimulationHistoryResponse(BaseModel):
    id: int
    step_number: int
    total_businesses: int
    total_employees: int
    avg_revenue: float
    active_startups: int
    collapse_risk: float
    gdp_growth: float
    migration_count: int
    total_capital: float
    unemployment_rate: float
    average_risk: float
    timestamp: datetime

    class Config:
        from_attributes = True

class SystemLogResponse(BaseModel):
    id: int
    timestamp: datetime
    message: str
    level: str
    category: str

    class Config:
        from_attributes = True

class NotificationResponse(BaseModel):
    id: int
    timestamp: datetime
    title: str
    message: str
    type: str
    is_read: bool

    class Config:
        from_attributes = True

class NotificationUpdate(BaseModel):
    is_read: bool

class DashboardStats(BaseModel):
    total_businesses: int
    total_employees: int
    avg_revenue: float
    active_startups: int
    economic_health_score: float  # computed metric
    migration_count: int
    collapse_risk: float
    gdp_growth_estimate: float
