from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.business import Business
from app.schemas.business import BusinessCreate, BusinessUpdate, BusinessResponse
from app.api.auth import get_current_user, get_current_admin
from app.services.simulator import CITIES, log_event

router = APIRouter()

@router.get("/", response_model=List[BusinessResponse])
def get_businesses(
    industry: Optional[str] = None,
    city: Optional[str] = None,
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    query = db.query(Business)
    if active_only:
        query = query.filter(Business.is_active == True)
    if industry:
        query = query.filter(Business.industry == industry)
    if city:
        query = query.filter(Business.city == city)
    
    return query.order_by(Business.name).all()

@router.post("/", response_model=BusinessResponse, status_code=status.HTTP_201_CREATED)
def create_business(
    biz_in: BusinessCreate, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Set coordinates based on city if available
    lat, lng = None, None
    if biz_in.city in CITIES:
        lat = CITIES[biz_in.city]["latitude"]
        lng = CITIES[biz_in.city]["longitude"]
    
    biz = Business(
        name=biz_in.name,
        industry=biz_in.industry,
        city=biz_in.city,
        country=biz_in.country,
        employees=biz_in.employees,
        revenue=biz_in.revenue,
        expenses=biz_in.expenses,
        growth_rate=biz_in.growth_rate,
        ai_strategy=biz_in.ai_strategy,
        risk_level=biz_in.risk_level,
        capital=biz_in.capital,
        latitude=lat or biz_in.latitude,
        longitude=lng or biz_in.longitude,
        age=0,
        is_active=True
    )
    db.add(biz)
    db.commit()
    db.refresh(biz)
    
    log_event(db, f"Business '{biz.name}' created manually by user '{current_user.username}' in {biz.city}.", "INFO", "simulation")
    return biz

@router.get("/{biz_id}", response_model=BusinessResponse)
def get_business(biz_id: int, db: Session = Depends(get_db)):
    biz = db.query(Business).filter(Business.id == biz_id).first()
    if not biz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found"
        )
    return biz

@router.put("/{biz_id}", response_model=BusinessResponse)
def update_business(
    biz_id: int, 
    biz_in: BusinessUpdate, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    biz = db.query(Business).filter(Business.id == biz_id).first()
    if not biz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found"
        )
    
    update_data = biz_in.model_dump(exclude_unset=True)
    
    # Check if city changed, update coordinates
    if "city" in update_data and update_data["city"] != biz.city:
        new_city = update_data["city"]
        if new_city in CITIES:
            update_data["country"] = CITIES[new_city]["country"]
            update_data["latitude"] = CITIES[new_city]["latitude"]
            update_data["longitude"] = CITIES[new_city]["longitude"]
            log_event(db, f"Relocated business {biz.name} to {new_city} manually.", "INFO", "migration")

    for field in update_data:
        setattr(biz, field, update_data[field])
        
    db.commit()
    db.refresh(biz)
    log_event(db, f"Business '{biz.name}' updated by user '{current_user.username}'.", "INFO", "simulation")
    return biz

@router.delete("/{biz_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_business(
    biz_id: int, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)  # Only admin can hard delete
):
    biz = db.query(Business).filter(Business.id == biz_id).first()
    if not biz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found"
        )
    
    # Let's perform a hard delete
    db.delete(biz)
    db.commit()
    log_event(db, f"Business '{biz.name}' (ID: {biz_id}) was deleted from the system by Admin '{current_user.username}'.", "WARNING", "simulation")
    return None
