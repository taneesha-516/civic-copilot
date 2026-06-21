from datetime import UTC, datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.ai_analysis_result import AIAnalysisResult
from app.models.complaint import Complaint
from app.models.complaint_status import ComplaintStatus
from app.models.image_analysis_result import ImageAnalysisResult
from app.models.priority_score import PriorityLevel, PriorityScore
from app.schemas.complaint import ComplaintCreate, ComplaintPut, ComplaintUpdate
from app.schemas.priority_score import PriorityScoreCreate
from app.services.cv_service import CVService
from app.services.nlp_service import NLPService
from app.services.priority_service import PriorityService


class ComplaintService:
    def __init__(self) -> None:
        self.nlp_service = NLPService()
        self.cv_service = CVService()
        self.priority_service = PriorityService()

    def list_complaints(self, db: Session, skip: int = 0, limit: int = 50) -> list[dict]:
        statement = (
            select(Complaint)
            .options(
                selectinload(Complaint.status),
                selectinload(Complaint.ai_analysis),
                selectinload(Complaint.image_analysis),
                selectinload(Complaint.priority_score),
            )
            .order_by(Complaint.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return [self._to_response(complaint) for complaint in db.scalars(statement).all()]

    def get_complaint_model(self, db: Session, complaint_id: UUID) -> Complaint | None:
        statement = (
            select(Complaint)
            .options(
                selectinload(Complaint.status),
                selectinload(Complaint.ai_analysis),
                selectinload(Complaint.image_analysis),
                selectinload(Complaint.priority_score),
            )
            .where(Complaint.id == complaint_id)
        )
        return db.scalar(statement)

    def get_complaint(self, db: Session, complaint_id: UUID) -> dict | None:
        complaint = self.get_complaint_model(db, complaint_id)
        if not complaint:
            return None
        return self._to_response(complaint)

    def create_complaint(self, db: Session, payload: ComplaintCreate) -> dict:
        status = self._get_status_by_code(db, payload.status)

        ai_result = self.nlp_service.analyze(payload.description, payload.location)
        image_result = self.cv_service.analyze(
            payload.image_url,
            payload.issue_type or ai_result.extracted_issue_type,
        )
        priority = (
            self._manual_priority_payload(payload.priority_score)
            if payload.priority_score is not None
            else self.priority_service.calculate(ai_result, image_result)
        )

        complaint = Complaint(
            submitted_by=payload.submitted_by,
            status_id=status.id,
            title=payload.title,
            description=payload.description,
            issue_type=payload.issue_type or ai_result.extracted_issue_type,
            location_text=payload.location or ai_result.extracted_location,
            latitude=payload.latitude,
            longitude=payload.longitude,
            image_url=payload.image_url,
            source=payload.source,
            submitted_at=datetime.now(UTC),
        )

        complaint.ai_analysis = AIAnalysisResult(**ai_result.model_dump())
        complaint.image_analysis = ImageAnalysisResult(**image_result.model_dump())
        complaint.priority_score = PriorityScore(**priority.model_dump())

        db.add(complaint)
        db.commit()
        db.refresh(complaint)
        return self.get_complaint(db, complaint.id) or self._to_response(complaint)

    def replace_complaint(
        self,
        db: Session,
        complaint_id: UUID,
        payload: ComplaintPut,
    ) -> dict | None:
        complaint = self.get_complaint_model(db, complaint_id)
        if not complaint:
            return None

        status = self._get_status_by_code(db, payload.status)
        complaint.title = payload.title
        complaint.description = payload.description
        complaint.issue_type = payload.issue_type
        complaint.location_text = payload.location
        complaint.latitude = payload.latitude
        complaint.longitude = payload.longitude
        complaint.image_url = payload.image_url
        complaint.status_id = status.id
        self._upsert_priority_score(complaint, payload.priority_score)

        db.add(complaint)
        db.commit()
        db.refresh(complaint)
        return self.get_complaint(db, complaint.id)

    def update_complaint(
        self,
        db: Session,
        complaint_id: UUID,
        payload: ComplaintUpdate,
    ) -> dict | None:
        complaint = self.get_complaint_model(db, complaint_id)
        if not complaint:
            return None

        updates = payload.model_dump(exclude_unset=True)
        if "status" in updates:
            status_code = updates.pop("status")
            complaint.status_id = self._get_status_by_code(db, status_code).id
            if status_code and status_code.strip().lower().replace(" ", "_") == "resolved":
                complaint.resolved_at = complaint.resolved_at or datetime.now(UTC)
        if "location" in updates:
            complaint.location_text = updates.pop("location")
        if "priority_score" in updates:
            self._upsert_priority_score(complaint, updates.pop("priority_score"))
        for field, value in updates.items():
            setattr(complaint, field, value)

        db.add(complaint)
        db.commit()
        db.refresh(complaint)
        return self.get_complaint(db, complaint.id)

    def delete_complaint(self, db: Session, complaint_id: UUID) -> bool:
        complaint = self.get_complaint_model(db, complaint_id)
        if not complaint:
            return False

        db.delete(complaint)
        db.commit()
        return True

    def _get_status_by_code(self, db: Session, code: str) -> ComplaintStatus:
        normalized_code = code.strip().lower().replace(" ", "_")
        status = db.scalar(
            select(ComplaintStatus).where(ComplaintStatus.code == normalized_code)
        )
        if status:
            return status

        status = ComplaintStatus(
            name=normalized_code.replace("_", " ").title(),
            code=normalized_code,
            sort_order=99,
            is_terminal=False,
        )
        db.add(status)
        db.commit()
        db.refresh(status)
        return status

    def _manual_priority_payload(self, score: Decimal) -> PriorityScoreCreate:
        return PriorityScoreCreate(
            final_score=score,
            urgency_component=Decimal("0.00"),
            severity_component=Decimal("0.00"),
            issue_weight_component=Decimal("0.00"),
            location_density_component=Decimal("0.00"),
            duplicate_component=Decimal("0.00"),
            priority_level=self._priority_level(score),
            scoring_version="manual",
            explanation={"source": "request payload"},
        )

    def _upsert_priority_score(
        self,
        complaint: Complaint,
        score: Decimal | None,
    ) -> None:
        if score is None:
            complaint.priority_score = None
            return

        if complaint.priority_score is None:
            complaint.priority_score = PriorityScore(
                **self._manual_priority_payload(score).model_dump()
            )
            return

        complaint.priority_score.final_score = score
        complaint.priority_score.priority_level = self._priority_level(score)
        complaint.priority_score.scoring_version = "manual"
        complaint.priority_score.explanation = {"source": "request payload"}

    def _priority_level(self, score: Decimal) -> PriorityLevel:
        if score >= 85:
            return PriorityLevel.CRITICAL
        if score >= 65:
            return PriorityLevel.HIGH
        if score >= 40:
            return PriorityLevel.MEDIUM
        return PriorityLevel.LOW

    def _to_response(self, complaint: Complaint) -> dict:
        return {
            "complaint_id": complaint.id,
            "title": complaint.title,
            "description": complaint.description,
            "issue_type": complaint.issue_type,
            "location": complaint.location_text,
            "latitude": complaint.latitude,
            "longitude": complaint.longitude,
            "image_url": complaint.image_url,
            "status": complaint.status.code if complaint.status else "unknown",
            "priority_score": (
                complaint.priority_score.final_score
                if complaint.priority_score
                else None
            ),
            "created_at": complaint.created_at,
        }
