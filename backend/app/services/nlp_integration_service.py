from datetime import UTC, datetime
import logging

import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.ai_analysis_result import AIAnalysisResult, UrgencyLevel
from app.models.complaint import Complaint
from app.models.complaint_status import ComplaintStatus
from app.models.department import Department
from app.schemas.nlp import NLPAnalysisRequest, NLPAnalysisResult, NLPServiceResponse

logger = logging.getLogger(__name__)


class NLPServiceError(Exception):
    pass


class NLPIntegrationService:
    async def analyze_and_store(
        self,
        db: Session,
        payload: NLPAnalysisRequest,
    ) -> NLPAnalysisResult:
        logger.info("Starting NLP analysis and storage flow. Input length: %d", len(payload.complaint_text))
        try:
            nlp_response = await self._call_nlp_service(payload.complaint_text)
            logger.info("Successfully received response from NLP service.")
        except Exception as exc:
            logger.error("Failed in NLP service call: %s", str(exc), exc_info=True)
            raise

        logger.info("Retrieving or creating status 'processing'")
        status = self._get_or_create_status(db, "processing")
        
        logger.info("Retrieving or creating department for department name: '%s'", nlp_response.department)
        department = self._get_or_create_department(db, nlp_response.department)

        logger.info("Instantiating Complaint and AIAnalysisResult objects")
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

        logger.info("Adding complaint to DB session and committing")
        db.add(complaint)
        db.commit()
        db.refresh(complaint)
        logger.info("Complaint successfully stored. ID: %s", complaint.id)

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
        logger.info("Calling NLP Service. URL: %s, Timeout: %s", settings.NLP_SERVICE_URL, settings.NLP_SERVICE_TIMEOUT_SECONDS)
        try:
            async with httpx.AsyncClient(
                timeout=settings.NLP_SERVICE_TIMEOUT_SECONDS
            ) as client: 
                response = await client.post(
                    settings.NLP_SERVICE_URL,
                    json={"complaint": complaint_text},
                )
                logger.info("NLP service response status code: %d", response.status_code)
                response.raise_for_status()
        except httpx.TimeoutException as exc:
            logger.error("NLP service call timed out", exc_info=True)
            raise NLPServiceError("NLP service timed out") from exc
        except httpx.HTTPStatusError as exc:
            logger.error("NLP service returned status code %d. Response body: %s", exc.response.status_code, exc.response.text, exc_info=True)
            raise NLPServiceError(
                f"NLP service returned HTTP {exc.response.status_code}"
            ) from exc
        except httpx.RequestError as exc:
            logger.error("Failed to connect to NLP service", exc_info=True)
            raise NLPServiceError("Could not connect to NLP service") from exc

        try:
            data = response.json()
            logger.info("Successfully parsed JSON response from NLP service")
            
            # Map the response keys from the flat structure returned by the external service
            mapped_response = {
                "issue_type": data.get("issue_type"),
                "location": data.get("location"),
                "urgency": data.get("urgency"),
                "formal_complaint": data.get("formal_complaint"),
                "department": data.get("department")
            }
            logger.info("Mapped NLP response keys: %s", mapped_response)

            validated_response = NLPServiceResponse.model_validate(mapped_response)
            logger.info("Validated mapped response with NLPServiceResponse schema")
            return validated_response
        except ValueError as exc:
            logger.error("NLP service response is not valid JSON", exc_info=True)
            raise NLPServiceError("NLP service returned invalid JSON") from exc
        except Exception as exc:
            logger.error("Error mapping/validating NLP service response. Raw data: %s", data, exc_info=True)
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
