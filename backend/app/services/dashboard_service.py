from decimal import Decimal

from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from app.models.complaint import Complaint
from app.models.complaint_status import ComplaintStatus
from app.models.department import Department
from app.models.priority_score import PriorityScore
from app.schemas.dashboard import (
    AverageResolutionTime,
    DashboardMetrics,
    DashboardSummary,
    DepartmentComplaintCount,
    MetricValue,
)


class DashboardService:
    HIGH_PRIORITY_THRESHOLD = Decimal("70.00")

    def get_metrics(self, db: Session) -> DashboardMetrics:
        summary = self.get_summary(db)
        return DashboardMetrics(
            **summary.model_dump(),
            complaints_by_department=self.get_complaints_by_department(db),
        )

    def get_summary(self, db: Session) -> DashboardSummary:
        statement = (
            select(
                func.count(Complaint.id).label("total_complaints"),
                func.count(Complaint.id)
                .filter(PriorityScore.final_score >= self.HIGH_PRIORITY_THRESHOLD)
                .label("high_priority_complaints"),
                func.count(Complaint.id)
                .filter(ComplaintStatus.code == "resolved")
                .label("resolved_complaints"),
                func.count(Complaint.id)
                .filter(
                    case(
                        (ComplaintStatus.is_terminal.is_(False), True),
                        else_=False,
                    )
                )
                .label("pending_complaints"),
                (
                    func.avg(
                        func.extract(
                            "epoch",
                            Complaint.resolved_at - Complaint.created_at,
                        )
                    )
                    / 3600
                ).label("average_resolution_time_hours"),
            )
            .select_from(Complaint)
            .join(ComplaintStatus, ComplaintStatus.id == Complaint.status_id)
            .outerjoin(PriorityScore, PriorityScore.complaint_id == Complaint.id)
        )
        row = db.execute(statement).one()

        return DashboardSummary(
            total_complaints=row.total_complaints,
            high_priority_complaints=row.high_priority_complaints,
            resolved_complaints=row.resolved_complaints,
            pending_complaints=row.pending_complaints,
            average_resolution_time_hours=self._optional_decimal(
                row.average_resolution_time_hours
            ),
        )

    def get_total_complaints(self, db: Session) -> MetricValue:
        return MetricValue(value=db.scalar(select(func.count(Complaint.id))) or 0)

    def get_high_priority_complaints(self, db: Session) -> MetricValue:
        statement = (
            select(func.count(Complaint.id))
            .select_from(Complaint)
            .join(PriorityScore, PriorityScore.complaint_id == Complaint.id)
            .where(PriorityScore.final_score >= self.HIGH_PRIORITY_THRESHOLD)
        )
        return MetricValue(value=db.scalar(statement) or 0)

    def get_resolved_complaints(self, db: Session) -> MetricValue:
        statement = (
            select(func.count(Complaint.id))
            .select_from(Complaint)
            .join(ComplaintStatus, ComplaintStatus.id == Complaint.status_id)
            .where(ComplaintStatus.code == "resolved")
        )
        return MetricValue(value=db.scalar(statement) or 0)

    def get_pending_complaints(self, db: Session) -> MetricValue:
        statement = (
            select(func.count(Complaint.id))
            .select_from(Complaint)
            .join(ComplaintStatus, ComplaintStatus.id == Complaint.status_id)
            .where(ComplaintStatus.is_terminal.is_(False))
        )
        return MetricValue(value=db.scalar(statement) or 0)

    def get_average_resolution_time(self, db: Session) -> AverageResolutionTime:
        statement = (
            select(
                (
                    func.avg(
                        func.extract(
                            "epoch",
                            Complaint.resolved_at - Complaint.created_at,
                        )
                    )
                    / 3600
                ).label("average_resolution_time_hours")
            )
            .select_from(Complaint)
            .join(ComplaintStatus, ComplaintStatus.id == Complaint.status_id)
            .where(ComplaintStatus.code == "resolved")
            .where(Complaint.resolved_at.is_not(None))
        )
        return AverageResolutionTime(
            average_resolution_time_hours=self._optional_decimal(db.scalar(statement))
        )

    def get_complaints_by_department(
        self,
        db: Session,
    ) -> list[DepartmentComplaintCount]:
        statement = (
            select(
                Department.id.label("department_id"),
                func.coalesce(Department.name, "Unassigned").label("department_name"),
                Department.code.label("department_code"),
                func.count(Complaint.id).label("complaint_count"),
            )
            .select_from(Complaint)
            .outerjoin(Department, Department.id == Complaint.assigned_department_id)
            .group_by(Department.id, Department.name, Department.code)
            .order_by(func.count(Complaint.id).desc())
        )
        return [
            DepartmentComplaintCount(
                department_id=row.department_id,
                department_name=row.department_name,
                department_code=row.department_code,
                complaint_count=row.complaint_count,
            )
            for row in db.execute(statement).all()
        ]

    def _optional_decimal(self, value) -> Decimal | None:
        if value is None:
            return None
        return Decimal(str(value)).quantize(Decimal("0.01"))
