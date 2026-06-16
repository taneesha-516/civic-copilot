from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.complaint_status import ComplaintStatus
from app.schemas.complaint_status import ComplaintStatusRead

router = APIRouter()


@router.get("", response_model=list[ComplaintStatusRead])
def list_statuses(db: Session = Depends(get_db)) -> list[ComplaintStatus]:
    return list(
        db.scalars(
            select(ComplaintStatus).order_by(ComplaintStatus.sort_order)
        ).all()
    )
