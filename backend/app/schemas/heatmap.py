from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field


class HeatmapPoint(BaseModel):
    complaint_id: UUID
    latitude: Decimal = Field(ge=-90, le=90)
    longitude: Decimal = Field(ge=-180, le=180)
    priority_score: Decimal = Field(ge=0, le=100)
    weight: Decimal = Field(ge=0, le=1)
    issue_type: str | None = None
    location: str | None = None


class AreaComplaintCount(BaseModel):
    area_key: str
    latitude: Decimal
    longitude: Decimal
    complaint_count: int
    average_priority_score: Decimal
    max_priority_score: Decimal


class HeatmapResponse(BaseModel):
    geojson: dict
    heatmap_points: list[HeatmapPoint]
    area_counts: list[AreaComplaintCount]
