from datetime import UTC, datetime

import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.ai_analysis_result import AIAnalysisResult, UrgencyLevel
from app.models.complaint import Complaint
from app.models.complaint_status import ComplaintStatus
from app.models.department import Department
from app.schemas.nlp import NLPAnalysisRequest, NLPAnalysisResult, NLPServiceResponse


class NLPServiceError(Exception):
    pass


class NLPIntegrationService:
    async def analyze_and_store(
        self,
        db: Session,
        payload: NLPAnalysisRequest,
    ) -> NLPAnalysisResult:
        nlp_response = await self._call_nlp_service(payload.complaint_text)
        status = self._get_or_create_status(db, "processing")
        department = self._get_or_create_department(db, nlp_response.department)

        complaint = Complaint(
            title=nlp_response.issue_type,
            description=nlp_response.formal_complaint or payload.complaint_text,
            issue_type=nlp_response.issue_type,
            location_text=nlp_response.location,
            assigned_department_id=department.id if department else None,
            status_id=status.id,
            submitted_at=datetime.now(UTC),
        )

        complaint.ai_analysis = AIAnalysisResult(
            extracted_issue_type=nlp_response.issue_type,
            extracted_location=nlp_response.location,
            urgency_level=self._normalize_urgency(nlp_response.urgency),
            raw_response=nlp_response.model_dump(),
            model_name="external-nlp-service",
            model_version="v1",
        )

        db.add(complaint)
        db.commit()
        db.refresh(complaint)

        return NLPAnalysisResult(
            complaint_id=complaint.id,
            issue_type=nlp_response.issue_type,
            location=nlp_response.location,
            urgency=nlp_response.urgency,
            formal_complaint=nlp_response.formal_complaint,
            department=nlp_response.department,
            status=status.code,
            created_at=complaint.created_at,
        )

    async def _call_nlp_service(self, complaint_text: str) -> NLPServiceResponse:
        try:
            async with httpx.AsyncClient(
                timeout=settings.NLP_SERVICE_TIMEOUT_SECONDS
            ) as client:
                response = await client.post(
                    settings.NLP_SERVICE_URL,
                    json={"complaint_text": complaint_text},
                )
                response.raise_for_status()
        except httpx.TimeoutException as exc:
            raise NLPServiceError("NLP service timed out") from exc
        except httpx.HTTPStatusError as exc:
            raise NLPServiceError(
                f"NLP service returned HTTP {exc.response.status_code}"
            ) from exc
        except httpx.RequestError as exc:
            raise NLPServiceError("Could not connect to NLP service") from exc

        try:
            return NLPServiceResponse.model_validate(response.json())
        except ValueError as exc:
            raise NLPServiceError("NLP service returned invalid JSON") from exc
        except Exception as exc:
            raise NLPServiceError("NLP service response did not match schema") from exc

    def _get_or_create_status(self, db: Session, code: str) -> ComplaintStatus:
        status = db.scalar(select(ComplaintStatus).where(ComplaintStatus.code == code))
        if status:
            return status

        status = ComplaintStatus(
            name=code.replace("_", " ").title(),
            code=code,
            sort_order=2,
            is_terminal=False,
        )
        db.add(status)
        db.flush()
        return status

    def _get_or_create_department(
        self,
        db: Session,
        department_name: str | None,
    ) -> Department | None:
        if not department_name:
            return None

        code = department_name.strip().lower().replace(" ", "_")
        department = db.scalar(select(Department).where(Department.code == code))
        if department:
            return department

        department = Department(
            name=department_name.strip(),
            code=code,
            is_active=True,
        )
        db.add(department)
        db.flush()
        return department

    def _normalize_urgency(self, urgency: str) -> UrgencyLevel:
        normalized = urgency.strip().lower()
        if normalized == "critical":
            return UrgencyLevel.CRITICAL
        if normalized == "high":
            return UrgencyLevel.HIGH
        if normalized == "medium":
            return UrgencyLevel.MEDIUM
        return UrgencyLevel.LOW
