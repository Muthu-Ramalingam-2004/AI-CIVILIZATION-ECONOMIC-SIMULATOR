from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.predictor import EconomicPredictor

router = APIRouter()

@router.get("/")
def get_predictions(db: Session = Depends(get_db)):
    return EconomicPredictor.get_predictions(db)

@router.get("/recommendations")
def get_recommendations(db: Session = Depends(get_db)):
    return EconomicPredictor.get_recommendations(db)
