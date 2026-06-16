from datetime import UTC, datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy.orm import Session, selectinload

from app.models.complaint import Complaint
from app.models.priority_score import PriorityScore
from app.schemas.priority_score import PriorityScoreRequest, PriorityScoreResponse
from app.services.priority_service import PriorityService


class PriorityEngineService:
    def __init__(self) -> None:
        self.priority_service = PriorityService()

    def score_inputs(self, payload: PriorityScoreRequest) -> PriorityScoreResponse:
        return self.priority_service.calculate_from_inputs(payload)

    def score_complaint(
        self,
        db: Session,
        complaint_id: UUID,
        similar_complaints_nearby: int = 0,
    ) -> PriorityScoreResponse | None:
        complaint = (
            db.query(Complaint)
            .options(
                selectinload(Complaint.ai_analysis),
                selectinload(Complaint.image_analysis),
                selectinload(Complaint.priority_score),
            )
            .filter(Complaint.id == complaint_id)
            .one_or_none()
        )
        if not complaint:
            return None

        age_hours = Decimal(
            str(
                max(
                    0.0,
                    (
                        datetime.now(UTC) - complaint.created_at.astimezone(UTC)
                    ).total_seconds()
                    / 3600,
                )
            )
        )
        request = PriorityScoreRequest(
            nlp_urgency=(
                complaint.ai_analysis.urgency_level.value
                if complaint.ai_analysis and complaint.ai_analysis.urgency_level
                else "low"
            ),
            cv_severity_score=(
                complaint.image_analysis.severity_score
                if complaint.image_analysis and complaint.image_analysis.severity_score
                else Decimal("0.00")
            ),
            similar_complaints_nearby=similar_complaints_nearby,
            complaint_age_hours=age_hours,
            issue_type=complaint.issue_type or "other",
        )
        response = self.priority_service.calculate_from_inputs(request)
        persistent_score = self.priority_service.to_persistent_score(response)

        if complaint.priority_score is None:
            complaint.priority_score = PriorityScore(**persistent_score.model_dump())
        else:
            for field, value in persistent_score.model_dump().items():
                setattr(complaint.priority_score, field, value)

        db.add(complaint)
        db.commit()
        return response
