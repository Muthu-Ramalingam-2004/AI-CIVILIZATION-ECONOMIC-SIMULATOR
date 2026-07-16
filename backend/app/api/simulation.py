from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.business import Business
from app.models.history import SimulationHistory
from app.models.log import SystemLog
from app.models.notification import Notification
from app.schemas.simulation import (
    SimulationRunRequest,
    SimulationHistoryResponse,
    SystemLogResponse,
    NotificationResponse,
    NotificationUpdate,
    DashboardStats
)
from app.api.auth import get_current_user, get_current_admin
from app.services.simulator import SimulationEngine, seed_initial_data, log_event, trigger_notification

router = APIRouter()

@router.post("/run", status_code=status.HTTP_200_OK)
def run_simulation(
    req: SimulationRunRequest, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if req.months not in [1, 6, 12, 60, 120]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid simulation duration. Choose 1, 6, 12, 60 or 120 months."
        )
    
    # Run simulation
    try:
        new_step = SimulationEngine.run_simulation(db, req.months)
        log_event(db, f"Simulation advanced by {req.months} month(s) to Step {new_step} by user '{current_user.username}'.", "INFO", "simulation")
        return {"message": f"Successfully simulated {req.months} month(s)", "current_step": new_step}
    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        print(f"Error running simulation: {e}\n{tb}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Simulation failed: {str(e)}"
        )

@router.get("/history", response_model=List[SimulationHistoryResponse])
def get_simulation_history(db: Session = Depends(get_db)):
    return db.query(SimulationHistory).order_by(SimulationHistory.step_number.asc()).all()

@router.get("/logs", response_model=List[SystemLogResponse])
def get_system_logs(limit: int = 100, db: Session = Depends(get_db)):
    return db.query(SystemLog).order_by(SystemLog.timestamp.desc()).limit(limit).all()

@router.get("/notifications", response_model=List[NotificationResponse])
def get_notifications(unread_only: bool = False, db: Session = Depends(get_db)):
    query = db.query(Notification)
    if unread_only:
        query = query.filter(Notification.is_read == False)
    return query.order_by(Notification.timestamp.desc()).limit(50).all()

@router.put("/notifications/read-all", status_code=status.HTTP_200_OK)
def mark_all_notifications_read(db: Session = Depends(get_db)):
    db.query(Notification).filter(Notification.is_read == False).update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked as read."}

@router.put("/notifications/{notif_id}", response_model=NotificationResponse)
def update_notification(
    notif_id: int, 
    notif_in: NotificationUpdate, 
    db: Session = Depends(get_db)
):
    notif = db.query(Notification).filter(Notification.id == notif_id).first()
    if not notif:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    
    notif.is_read = notif_in.is_read
    db.commit()
    db.refresh(notif)
    return notif

@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    # Make sure we have some seed data
    seed_initial_data(db)
    
    active_biz = db.query(Business).filter(Business.is_active == True).all()
    total_employees = sum(b.employees for b in active_biz)
    avg_revenue = sum(b.revenue for b in active_biz) / len(active_biz) if active_biz else 0.0
    
    last_history = db.query(SimulationHistory).order_by(SimulationHistory.step_number.desc()).first()
    
    # Calculate average economic health score
    # Score = avg (revenue/expenses) + avg growth * 10
    if active_biz:
        avg_profit_factor = sum(b.revenue / max(b.expenses, 1.0) for b in active_biz) / len(active_biz)
        avg_growth = sum(b.growth_rate for b in active_biz) / len(active_biz)
        health_score = (avg_profit_factor * 50.0) + (avg_growth * 200.0)
        health_score = max(0.0, min(100.0, health_score))
    else:
        health_score = 0.0
        
    active_startups = last_history.active_startups if last_history else 0
    migration_count = db.query(func.sum(SimulationHistory.migration_count)).scalar() or 0
    collapse_risk = last_history.collapse_risk if last_history else 5.0
    gdp_growth = last_history.gdp_growth if last_history else 3.2
    
    return {
        "total_businesses": len(active_biz),
        "total_employees": total_employees,
        "avg_revenue": avg_revenue,
        "active_startups": active_startups,
        "economic_health_score": health_score,
        "migration_count": migration_count,
        "collapse_risk": collapse_risk,
        "gdp_growth_estimate": gdp_growth
    }

@router.post("/reset", status_code=status.HTTP_200_OK)
def reset_simulation(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)  # Only admin can reset system
):
    log_event(db, f"Admin '{current_user.username}' triggered a complete database reset.", "WARNING", "simulation")
    
    # Delete all data
    db.query(SystemLog).delete()
    db.query(Notification).delete()
    db.query(SimulationHistory).delete()
    db.query(Business).delete()
    db.commit()
    
    # Seed initial data again
    seed_initial_data(db)
    
    return {"message": "Simulation environment reset successfully."}
