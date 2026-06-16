from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.ai_analysis_result import UrgencyLevel


class AIAnalysisCreate(BaseModel):
    extracted_issue_type: str | None = None
    extracted_location: str | None = None
    urgency_level: UrgencyLevel | None = None
    urgency_score: Decimal | None = Field(default=None, ge=0, le=100)
    sentiment: str | None = None
    language_code: str | None = None
    keywords: dict | None = None
    raw_response: dict | None = None
    confidence_score: Decimal | None = Field(default=None, ge=0, le=100)
    model_name: str | None = None
    model_version: str | None = None


class AIAnalysisRead(AIAnalysisCreate):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    complaint_id: UUID
    analyzed_at: datetime
