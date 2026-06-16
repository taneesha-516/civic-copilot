from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class NLPAnalysisRequest(BaseModel):
    complaint_text: str = Field(min_length=1)


class NLPServiceResponse(BaseModel):
    issue_type: str
    location: str | None = None
    urgency: str
    formal_complaint: str
    department: str | None = None


class NLPAnalysisResult(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    complaint_id: UUID
    issue_type: str
    location: str | None
    urgency: str
    formal_complaint: str
    department: str | None
    status: str
    created_at: datetime
