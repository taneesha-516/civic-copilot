from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.complaint import ComplaintSource


class ComplaintBase(BaseModel):
    title: str = Field(max_length=200)
    description: str
    issue_type: str | None = None
    location: str | None = None
    latitude: Decimal | None = Field(default=None, ge=-90, le=90)
    longitude: Decimal | None = Field(default=None, ge=-180, le=180)
    image_url: str | None = None
    status: str = "submitted"
    priority_score: Decimal | None = Field(default=None, ge=0, le=100)


class ComplaintCreate(ComplaintBase):
    source: ComplaintSource = ComplaintSource.WEB
    submitted_by: UUID | None = None


class ComplaintPut(ComplaintBase):
    pass


class ComplaintUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    issue_type: str | None = None
    location: str | None = None
    latitude: Decimal | None = Field(default=None, ge=-90, le=90)
    longitude: Decimal | None = Field(default=None, ge=-180, le=180)
    image_url: str | None = None
    status: str | None = None
    priority_score: Decimal | None = Field(default=None, ge=0, le=100)


class ComplaintRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    complaint_id: UUID
    title: str | None
    description: str
    issue_type: str | None
    location: str | None
    latitude: Decimal | None
    longitude: Decimal | None
    image_url: str | None
    status: str
    priority_score: Decimal | None
    created_at: datetime
