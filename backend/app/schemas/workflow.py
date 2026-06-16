from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class WorkflowNLPResult(BaseModel):
    issue_type: str
    location: str | None
    urgency: str
    formal_complaint: str
    department: str | None


class WorkflowCVResult(BaseModel):
    detected_issue: str
    severity_score: Decimal = Field(ge=0, le=100)
    confidence: Decimal = Field(ge=0, le=1)


class ComplaintWorkflowResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    complaint_id: UUID
    title: str
    description: str
    issue_type: str
    location: str | None
    latitude: Decimal | None
    longitude: Decimal | None
    image_url: str
    status: str
    department: str | None
    priority_score: Decimal
    priority_level: str
    nlp: WorkflowNLPResult
    cv: WorkflowCVResult
    created_at: datetime
