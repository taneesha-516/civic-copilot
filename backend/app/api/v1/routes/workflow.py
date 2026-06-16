from decimal import Decimal

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.workflow import ComplaintWorkflowResponse
from app.services.complaint_workflow_service import (
    ComplaintWorkflowError,
    ComplaintWorkflowService,
)

router = APIRouter()
service = ComplaintWorkflowService()


@router.post("/complaints", response_model=ComplaintWorkflowResponse, status_code=status.HTTP_201_CREATED)
async def submit_complaint_workflow(
    complaint_text: str = Form(..., min_length=1),
    latitude: Decimal | None = Form(default=None),
    longitude: Decimal | None = Form(default=None),
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> ComplaintWorkflowResponse:
    try:
        return await service.submit_complaint(
            db=db,
            complaint_text=complaint_text,
            image=image,
            latitude=latitude,
            longitude=longitude,
        )
    except ComplaintWorkflowError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not save complaint workflow results",
        ) from exc
