from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.dashboard import (
    AverageResolutionTime,
    DashboardMetrics,
    DashboardSummary,
    DepartmentComplaintCount,
    MetricValue,
)
from app.services.dashboard_service import DashboardService

router = APIRouter()
service = DashboardService()


@router.get("", response_model=DashboardMetrics)
def get_dashboard_metrics(db: Session = Depends(get_db)) -> DashboardMetrics:
    return service.get_metrics(db)


@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(db: Session = Depends(get_db)) -> DashboardSummary:
    return service.get_summary(db)


@router.get("/total-complaints", response_model=MetricValue)
def get_total_complaints(db: Session = Depends(get_db)) -> MetricValue:
    return service.get_total_complaints(db)


@router.get("/complaints-by-department", response_model=list[DepartmentComplaintCount])
def get_complaints_by_department(
    db: Session = Depends(get_db),
) -> list[DepartmentComplaintCount]:
    return service.get_complaints_by_department(db)


@router.get("/high-priority-complaints", response_model=MetricValue)
def get_high_priority_complaints(db: Session = Depends(get_db)) -> MetricValue:
    return service.get_high_priority_complaints(db)


@router.get("/resolved-complaints", response_model=MetricValue)
def get_resolved_complaints(db: Session = Depends(get_db)) -> MetricValue:
    return service.get_resolved_complaints(db)


@router.get("/pending-complaints", response_model=MetricValue)
def get_pending_complaints(db: Session = Depends(get_db)) -> MetricValue:
    return service.get_pending_complaints(db)


@router.get("/average-resolution-time", response_model=AverageResolutionTime)
def get_average_resolution_time(
    db: Session = Depends(get_db),
) -> AverageResolutionTime:
    return service.get_average_resolution_time(db)
