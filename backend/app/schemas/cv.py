from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class CVServiceResponse(BaseModel):
    detected_issue: str
    severity_score: Decimal = Field(ge=0, le=100)
    confidence: Decimal = Field(ge=0, le=1)


class CVDetectionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    complaint_id: UUID
    detected_issue: str
    severity_score: Decimal
    confidence: Decimal
    image_url: str
    analyzed_at: datetime
