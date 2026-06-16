from collections.abc import Awaitable, Callable
from datetime import UTC, datetime
from decimal import Decimal
from pathlib import Path
from uuid import UUID, uuid4

import anyio
import httpx
from fastapi import UploadFile
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.ai_analysis_result import AIAnalysisResult, UrgencyLevel
from app.models.complaint import Complaint
from app.models.complaint_status import ComplaintStatus
from app.models.department import Department
from app.models.image_analysis_result import DamageLevel, ImageAnalysisResult
from app.models.priority_score import PriorityScore
from app.schemas.cv import CVServiceResponse
from app.schemas.nlp import NLPServiceResponse
from app.schemas.priority_score import PriorityScoreRequest
from app.schemas.workflow import (
    ComplaintWorkflowResponse,
    WorkflowCVResult,
    WorkflowNLPResult,
)
from app.services.priority_service import PriorityService


class ComplaintWorkflowError(Exception):
    status_code = 500


class UpstreamServiceError(ComplaintWorkflowError):
    status_code = 502


class InvalidUploadError(ComplaintWorkflowError):
    status_code = 400


class ComplaintWorkflowService:
    def __init__(self) -> None:
        self.priority_service = PriorityService()

    async def submit_complaint(
        self,
        db: Session,
        complaint_text: str,
        image: UploadFile,
        latitude: Decimal | None = None,
        longitude: Decimal | None = None,
    ) -> ComplaintWorkflowResponse:
        image_bytes = await image.read()
        if not image_bytes:
            raise InvalidUploadError("Uploaded image is empty")
        if image.content_type and not image.content_type.startswith("image/"):
            raise InvalidUploadError("Uploaded file must be an image")

        # Keep network calls outside the DB transaction. The transaction is only
        # opened once all enrichment data is ready to persist atomically.
        async with httpx.AsyncClient() as client:
            nlp_result = await self._with_retries(
                "NLP service",
                lambda: self._call_nlp_service(client, complaint_text),
            )
            cv_result = await self._with_retries(
                "CV service",
                lambda: self._call_cv_service(client, image, image_bytes),
            )

        complaint_id = uuid4()
        image_url = await self._save_upload(complaint_id, image, image_bytes)
        urgency_level = self._normalize_urgency(nlp_result.urgency)
        similar_nearby = self._count_similar_complaints(
            db,
            issue_type=nlp_result.issue_type,
            location=nlp_result.location,
            latitude=latitude,
            longitude=longitude,
        )
        if db.in_transaction():
            db.rollback()

        priority_response = self.priority_service.calculate_from_inputs(
            PriorityScoreRequest(
                nlp_urgency=urgency_level.value,
                cv_severity_score=cv_result.severity_score,
                similar_complaints_nearby=similar_nearby,
                complaint_age_hours=Decimal("0.00"),
                issue_type=nlp_result.issue_type,
            )
        )
        persistent_priority = self.priority_service.to_persistent_score(
            priority_response
        )

        try:
            with db.begin():
                status = self._get_or_create_status(db, "submitted")
                department = self._get_or_create_department(db, nlp_result.department)
                complaint = Complaint(
                    id=complaint_id,
                    title=nlp_result.issue_type,
                    description=nlp_result.formal_complaint or complaint_text,
                    issue_type=nlp_result.issue_type,
                    location_text=nlp_result.location,
                    latitude=latitude,
                    longitude=longitude,
                    image_url=image_url,
                    assigned_department_id=department.id if department else None,
                    status_id=status.id,
                    submitted_at=datetime.now(UTC),
                )
                complaint.ai_analysis = AIAnalysisResult(
                    extracted_issue_type=nlp_result.issue_type,
                    extracted_location=nlp_result.location,
                    urgency_level=urgency_level,
                    raw_response=nlp_result.model_dump(),
                    confidence_score=Decimal("100.00"),
                    model_name="external-nlp-service",
                    model_version="v1",
                )
                complaint.image_analysis = ImageAnalysisResult(
                    detected_issue_type=cv_result.detected_issue,
                    severity_score=cv_result.severity_score,
                    confidence_score=cv_result.confidence,
                    damage_level=self._damage_level(cv_result.severity_score),
                    objects_detected={"detected": [cv_result.detected_issue]},
                    raw_response=cv_result.model_dump(mode="json"),
                    model_name="external-cv-service",
                    model_version="v1",
                )
                complaint.priority_score = PriorityScore(
                    **persistent_priority.model_dump()
                )
                db.add(complaint)
                db.flush()
                created_at = complaint.created_at
                department_name = department.name if department else None
                status_code = status.code
        except Exception:
            db.rollback()
            raise

        return ComplaintWorkflowResponse(
            complaint_id=complaint_id,
            title=nlp_result.issue_type,
            description=nlp_result.formal_complaint or complaint_text,
            issue_type=nlp_result.issue_type,
            location=nlp_result.location,
            latitude=latitude,
            longitude=longitude,
            image_url=image_url,
            status=status_code,
            department=department_name,
            priority_score=priority_response.final_score,
            priority_level=priority_response.priority_level.value,
            nlp=WorkflowNLPResult(
                issue_type=nlp_result.issue_type,
                location=nlp_result.location,
                urgency=nlp_result.urgency,
                formal_complaint=nlp_result.formal_complaint,
                department=nlp_result.department,
            ),
            cv=WorkflowCVResult(
                detected_issue=cv_result.detected_issue,
                severity_score=cv_result.severity_score,
                confidence=cv_result.confidence,
            ),
            created_at=created_at,
        )

    async def _with_retries(
        self,
        service_name: str,
        operation: Callable[[], Awaitable],
    ):
        last_error: Exception | None = None
        for attempt in range(1, settings.INTEGRATION_RETRY_ATTEMPTS + 1):
            try:
                return await operation()
            except (httpx.TimeoutException, httpx.RequestError, httpx.HTTPStatusError) as exc:
                last_error = exc
                if not self._should_retry(exc) or attempt == settings.INTEGRATION_RETRY_ATTEMPTS:
                    break
                delay = settings.INTEGRATION_RETRY_BACKOFF_SECONDS * (2 ** (attempt - 1))
                await anyio.sleep(delay)

        raise UpstreamServiceError(
            f"{service_name} failed after {settings.INTEGRATION_RETRY_ATTEMPTS} attempts"
        ) from last_error

    async def _call_nlp_service(
        self,
        client: httpx.AsyncClient,
        complaint_text: str,
    ) -> NLPServiceResponse:
        response = await client.post(
            settings.NLP_SERVICE_URL,
            json={"complaint_text": complaint_text},
            timeout=settings.NLP_SERVICE_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
        try:
            return NLPServiceResponse.model_validate(response.json())
        except Exception as exc:
            raise UpstreamServiceError("NLP service response did not match schema") from exc

    async def _call_cv_service(
        self,
        client: httpx.AsyncClient,
        image: UploadFile,
        image_bytes: bytes,
    ) -> CVServiceResponse:
        response = await client.post(
            settings.CV_SERVICE_URL,
            files={
                "image": (
                    image.filename or "complaint-image.jpg",
                    image_bytes,
                    image.content_type or "application/octet-stream",
                )
            },
            timeout=settings.CV_SERVICE_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
        try:
            return CVServiceResponse.model_validate(response.json())
        except Exception as exc:
            raise UpstreamServiceError("CV service response did not match schema") from exc

    def _should_retry(self, exc: Exception) -> bool:
        if isinstance(exc, httpx.HTTPStatusError):
            return exc.response.status_code in {408, 429, 500, 502, 503, 504}
        return True

    async def _save_upload(
        self,
        complaint_id: UUID,
        image: UploadFile,
        image_bytes: bytes,
    ) -> str:
        upload_dir = Path(settings.UPLOAD_DIR) / "complaints" / str(complaint_id)
        extension = Path(image.filename or "image").suffix or ".jpg"
        destination = upload_dir / f"{uuid4()}{extension}"

        await anyio.to_thread.run_sync(
            lambda: upload_dir.mkdir(parents=True, exist_ok=True)
        )
        await anyio.to_thread.run_sync(destination.write_bytes, image_bytes)
        return str(destination).replace("\\", "/")

    def _count_similar_complaints(
        self,
        db: Session,
        issue_type: str,
        location: str | None,
        latitude: Decimal | None,
        longitude: Decimal | None,
    ) -> int:
        statement = select(func.count(Complaint.id)).where(
            func.lower(Complaint.issue_type) == issue_type.lower()
        )
        if latitude is not None and longitude is not None:
            statement = statement.where(
                func.abs(Complaint.latitude - latitude) <= Decimal("0.01"),
                func.abs(Complaint.longitude - longitude) <= Decimal("0.01"),
            )
        elif location:
            statement = statement.where(
                func.lower(Complaint.location_text) == location.lower()
            )
        return db.scalar(statement) or 0

    def _get_or_create_status(self, db: Session, code: str) -> ComplaintStatus:
        status = db.scalar(select(ComplaintStatus).where(ComplaintStatus.code == code))
        if status:
            return status
        status = ComplaintStatus(
            name=code.replace("_", " ").title(),
            code=code,
            sort_order=1,
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
        department = Department(name=department_name.strip(), code=code, is_active=True)
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

    def _damage_level(self, severity_score: Decimal) -> DamageLevel:
        if severity_score >= 85:
            return DamageLevel.CRITICAL
        if severity_score >= 65:
            return DamageLevel.SEVERE
        if severity_score >= 40:
            return DamageLevel.MODERATE
        if severity_score > 0:
            return DamageLevel.MINOR
        return DamageLevel.NONE
