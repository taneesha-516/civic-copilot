from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.common import MessageResponse
from app.schemas.complaint import (
    ComplaintCreate,
    ComplaintPut,
    ComplaintRead,
    ComplaintUpdate,
)
from app.services.complaint_service import ComplaintService

router = APIRouter()
service = ComplaintService()


@router.get("", response_model=list[ComplaintRead])
def list_complaints(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
) -> list:
    return service.list_complaints(db, skip=skip, limit=limit)


@router.post("", response_model=ComplaintRead, status_code=status.HTTP_201_CREATED)
def create_complaint(
    payload: ComplaintCreate,
    db: Session = Depends(get_db),
) -> dict:
    return service.create_complaint(db, payload)


@router.get("/{complaint_id}", response_model=ComplaintRead)
def get_complaint(
    complaint_id: UUID,
    db: Session = Depends(get_db),
) -> dict:
    complaint = service.get_complaint(db, complaint_id)
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found",
        )
    return complaint


@router.put("/{complaint_id}", response_model=ComplaintRead)
def replace_complaint(
    complaint_id: UUID,
    payload: ComplaintPut,
    db: Session = Depends(get_db),
) -> dict:
    complaint = service.replace_complaint(db, complaint_id, payload)
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found",
        )
    return complaint


@router.patch("/{complaint_id}", response_model=ComplaintRead)
def update_complaint(
    complaint_id: UUID,
    payload: ComplaintUpdate,
    db: Session = Depends(get_db),
) -> dict:
    complaint = service.update_complaint(db, complaint_id, payload)
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found",
        )
    return complaint


@router.delete("/{complaint_id}", response_model=MessageResponse)
def delete_complaint(
    complaint_id: UUID,
    db: Session = Depends(get_db),
) -> dict[str, str]:
    deleted = service.delete_complaint(db, complaint_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found",
        )
    return {"message": "Complaint deleted successfully"}
