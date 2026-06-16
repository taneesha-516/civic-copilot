from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.priority_score import PriorityScoreRequest, PriorityScoreResponse
from app.services.priority_engine_service import PriorityEngineService

router = APIRouter()
service = PriorityEngineService()


@router.post("/score", response_model=PriorityScoreResponse)
def score_priority(payload: PriorityScoreRequest) -> PriorityScoreResponse:
    return service.score_inputs(payload)


@router.post("/complaints/{complaint_id}/score", response_model=PriorityScoreResponse)
def score_existing_complaint(
    complaint_id: UUID,
    similar_complaints_nearby: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> PriorityScoreResponse:
    score = service.score_complaint(
        db,
        complaint_id=complaint_id,
        similar_complaints_nearby=similar_complaints_nearby,
    )
    if score is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found",
        )
    return score
