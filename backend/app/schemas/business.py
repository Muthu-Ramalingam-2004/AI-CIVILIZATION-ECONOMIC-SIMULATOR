from pydantic import BaseModel, Field
from typing import Optional

class BusinessBase(BaseModel):
    name: str = Field(..., min_length=1)
    industry: str = Field(..., min_length=1)
    city: str = Field(..., min_length=1)
    country: str = Field(..., min_length=1)
    employees: int = Field(1, ge=1)
    revenue: float = Field(10000.0, ge=0.0)
    expenses: float = Field(8000.0, ge=0.0)
    growth_rate: float = Field(0.05)
    ai_strategy: str = Field("moderate_growth")
    risk_level: float = Field(10.0, ge=0.0, le=100.0)
    capital: float = Field(50000.0, ge=0.0)
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class BusinessCreate(BusinessBase):
    pass

class BusinessUpdate(BaseModel):
    name: Optional[str] = None
    industry: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    employees: Optional[int] = None
    revenue: Optional[float] = None
    expenses: Optional[float] = None
    growth_rate: Optional[float] = None
    ai_strategy: Optional[str] = None
    risk_level: Optional[float] = None
    capital: Optional[float] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_active: Optional[bool] = None

class BusinessResponse(BusinessBase):
    id: int
    age: int
    is_active: bool

    class Config:
        from_attributes = True
