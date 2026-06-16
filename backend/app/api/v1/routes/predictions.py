from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.prediction import IssuePredictionRequest, IssuePredictionResponse
from app.services.issue_prediction_service import IssuePredictionService

router = APIRouter()
service = IssuePredictionService()


@router.post("/issues", response_model=IssuePredictionResponse)
def predict_issue_hotspots(
    payload: IssuePredictionRequest,
    db: Session = Depends(get_db),
) -> IssuePredictionResponse:
    return service.predict_area_risks(db, payload)


@router.get("/issues", response_model=IssuePredictionResponse)
def get_issue_hotspots(
    horizon_days: int = 30,
    min_training_records: int = 12,
    limit: int = 10,
    db: Session = Depends(get_db),
) -> IssuePredictionResponse:
    payload = IssuePredictionRequest(
        horizon_days=horizon_days,
        min_training_records=min_training_records,
        limit=limit,
    )
    return service.predict_area_risks(db, payload)
