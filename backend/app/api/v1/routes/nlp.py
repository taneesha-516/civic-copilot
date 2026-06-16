from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.nlp import NLPAnalysisRequest, NLPAnalysisResult
from app.services.nlp_integration_service import (
    NLPIntegrationService,
    NLPServiceError,
)

router = APIRouter()
service = NLPIntegrationService()


@router.post("/analyze", response_model=NLPAnalysisResult, status_code=status.HTTP_201_CREATED)
async def analyze_complaint_text(
    payload: NLPAnalysisRequest,
    db: Session = Depends(get_db),
) -> NLPAnalysisResult:
    try:
        return await service.analyze_and_store(db, payload)
    except NLPServiceError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc
