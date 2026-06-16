from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel


class DepartmentComplaintCount(BaseModel):
    department_id: UUID | None
    department_name: str
    department_code: str | None
    complaint_count: int


class DashboardSummary(BaseModel):
    total_complaints: int
    high_priority_complaints: int
    resolved_complaints: int
    pending_complaints: int
    average_resolution_time_hours: Decimal | None


class DashboardMetrics(DashboardSummary):
    complaints_by_department: list[DepartmentComplaintCount]


class MetricValue(BaseModel):
    value: int


class AverageResolutionTime(BaseModel):
    average_resolution_time_hours: Decimal | None
