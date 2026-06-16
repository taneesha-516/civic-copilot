from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.cv import CVDetectionResponse
from app.services.cv_integration_service import (
    CVIntegrationService,
    CVServiceError,
    ComplaintNotFoundError,
)

router = APIRouter()
service = CVIntegrationService()


@router.post("/analyze/{complaint_id}", response_model=CVDetectionResponse)
async def analyze_complaint_image(
    complaint_id: UUID,
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> CVDetectionResponse:
    if image.content_type and not image.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must be an image",
        )

    try:
        return await service.analyze_and_store(db, complaint_id, image)
    except ComplaintNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except CVServiceError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc
