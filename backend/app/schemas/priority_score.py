from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.priority_score import PriorityLevel


class PriorityScoreCreate(BaseModel):
    final_score: Decimal = Field(ge=0, le=100)
    urgency_component: Decimal = 0
    severity_component: Decimal = 0
    issue_weight_component: Decimal = 0
    location_density_component: Decimal = 0
    duplicate_component: Decimal = 0
    priority_level: PriorityLevel
    scoring_version: str = "v1"
    explanation: dict | None = None


class PriorityScoreRequest(BaseModel):
    nlp_urgency: str = Field(
        examples=["high"],
        description="Urgency label from NLP: low, medium, high, or critical.",
    )
    cv_severity_score: Decimal = Field(ge=0, le=100)
    similar_complaints_nearby: int = Field(default=0, ge=0)
    complaint_age_hours: Decimal = Field(default=0, ge=0)
    issue_type: str = Field(examples=["pothole"])


class PriorityScoreResponse(BaseModel):
    final_score: Decimal
    priority_level: PriorityLevel
    urgency_component: Decimal
    severity_component: Decimal
    similar_complaints_component: Decimal
    age_component: Decimal
    issue_type_component: Decimal
    formula: str
    explanation: dict


class PriorityScoreRead(PriorityScoreCreate):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    complaint_id: UUID
    calculated_at: datetime
