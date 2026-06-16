from decimal import Decimal

from pydantic import BaseModel, Field


class IssuePredictionRequest(BaseModel):
    horizon_days: int = Field(default=30, ge=1, le=180)
    min_training_records: int = Field(default=12, ge=1)
    limit: int = Field(default=10, ge=1, le=100)


class AreaRiskPrediction(BaseModel):
    area: str
    risk_score: int = Field(ge=0, le=100)
    predicted_issue: str
    predicted_density: Decimal
    hotspot_score: Decimal
    average_severity_score: Decimal
    recurring_complaints: int


class IssuePredictionResponse(BaseModel):
    predictions: list[AreaRiskPrediction]
    model_used: str
    training_records: int
    horizon_days: int
    explanation: str
