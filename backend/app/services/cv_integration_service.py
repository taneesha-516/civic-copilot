from datetime import UTC, datetime
from decimal import Decimal
from pathlib import Path
from uuid import UUID, uuid4

import anyio
import httpx
from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.complaint import Complaint
from app.models.image_analysis_result import DamageLevel, ImageAnalysisResult
from app.schemas.cv import CVDetectionResponse, CVServiceResponse


class CVServiceError(Exception):
    pass


class ComplaintNotFoundError(Exception):
    pass


class CVIntegrationService:
    async def analyze_and_store(
        self,
        db: Session,
        complaint_id: UUID,
        image: UploadFile,
    ) -> CVDetectionResponse:
        complaint = db.get(Complaint, complaint_id)
        if not complaint:
            raise ComplaintNotFoundError("Complaint not found")

        image_bytes = await image.read()
        if not image_bytes:
            raise CVServiceError("Uploaded image is empty")

        image_url = await self._save_upload(complaint_id, image, image_bytes)
        cv_response = await self._call_cv_service(image, image_bytes)

        complaint.image_url = image_url
        complaint.issue_type = complaint.issue_type or cv_response.detected_issue

        if complaint.image_analysis is None:
            complaint.image_analysis = ImageAnalysisResult(complaint_id=complaint.id)

        complaint.image_analysis.detected_issue_type = cv_response.detected_issue
        complaint.image_analysis.severity_score = cv_response.severity_score
        complaint.image_analysis.confidence_score = cv_response.confidence
        complaint.image_analysis.damage_level = self._damage_level(
            cv_response.severity_score
        )
        complaint.image_analysis.objects_detected = {
            "detected": [cv_response.detected_issue]
        }
        complaint.image_analysis.raw_response = cv_response.model_dump(mode="json")
        complaint.image_analysis.model_name = "external-cv-service"
        complaint.image_analysis.model_version = "v1"
        complaint.image_analysis.analyzed_at = datetime.now(UTC)

        db.add(complaint)
        db.commit()
        db.refresh(complaint.image_analysis)

        return CVDetectionResponse(
            complaint_id=complaint.id,
            detected_issue=cv_response.detected_issue,
            severity_score=cv_response.severity_score,
            confidence=cv_response.confidence,
            image_url=image_url,
            analyzed_at=complaint.image_analysis.analyzed_at,
        )

    async def _save_upload(
        self,
        complaint_id: UUID,
        image: UploadFile,
        image_bytes: bytes,
    ) -> str:
        upload_dir = Path(settings.UPLOAD_DIR) / "complaints" / str(complaint_id)
        extension = Path(image.filename or "image").suffix or ".jpg"
        filename = f"{uuid4()}{extension}"
        destination = upload_dir / filename

        await anyio.to_thread.run_sync(
            lambda: upload_dir.mkdir(parents=True, exist_ok=True)
        )
        await anyio.to_thread.run_sync(destination.write_bytes, image_bytes)

        return str(destination).replace("\\", "/")

    async def _call_cv_service(
        self,
        image: UploadFile,
        image_bytes: bytes,
    ) -> CVServiceResponse:
        content_type = image.content_type or "application/octet-stream"
        files = {
            "image": (
                image.filename or "complaint-image.jpg",
                image_bytes,
                content_type,
            )
        }

        try:
            async with httpx.AsyncClient(
                timeout=settings.CV_SERVICE_TIMEOUT_SECONDS
            ) as client:
                response = await client.post(settings.CV_SERVICE_URL, files=files)
                response.raise_for_status()
        except httpx.TimeoutException as exc:
            raise CVServiceError("CV service timed out") from exc
        except httpx.HTTPStatusError as exc:
            raise CVServiceError(
                f"CV service returned HTTP {exc.response.status_code}"
            ) from exc
        except httpx.RequestError as exc:
            raise CVServiceError("Could not connect to CV service") from exc

        try:
            return CVServiceResponse.model_validate(response.json())
        except ValueError as exc:
            raise CVServiceError("CV service returned invalid JSON") from exc
        except Exception as exc:
            raise CVServiceError("CV service response did not match schema") from exc

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
