from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.image_analysis_result import DamageLevel


class ImageAnalysisCreate(BaseModel):
    detected_issue_type: str | None = None
    severity_score: Decimal | None = Field(default=None, ge=0, le=100)
    confidence_score: Decimal | None = Field(default=None, ge=0, le=100)
    objects_detected: dict | None = None
    damage_level: DamageLevel | None = None
    image_quality_score: Decimal | None = Field(default=None, ge=0, le=100)
    raw_response: dict | None = None
    model_name: str | None = None
    model_version: str | None = None


class ImageAnalysisRead(ImageAnalysisCreate):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    complaint_id: UUID
    analyzed_at: datetime
