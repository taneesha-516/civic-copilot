from decimal import Decimal

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.heatmap import HeatmapResponse
from app.services.heatmap_service import HeatmapService

router = APIRouter()
service = HeatmapService()


@router.get("", response_model=HeatmapResponse)
def get_heatmap(
    area_precision: int = Query(default=2, ge=0, le=4),
    db: Session = Depends(get_db),
) -> HeatmapResponse:
    return service.get_heatmap(db, area_precision=area_precision)


@router.get("/high-priority", response_model=HeatmapResponse)
def get_high_priority_heatmap(
    min_priority: Decimal = Query(default=Decimal("70.00"), ge=0, le=100),
    area_precision: int = Query(default=2, ge=0, le=4),
    db: Session = Depends(get_db),
) -> HeatmapResponse:
    return service.get_heatmap(
        db,
        min_priority=min_priority,
        area_precision=area_precision,
    )
