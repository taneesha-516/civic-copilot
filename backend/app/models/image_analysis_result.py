import enum
import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Enum, ForeignKey, Numeric, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.mixins import UUIDPrimaryKeyMixin


class DamageLevel(str, enum.Enum):
    NONE = "none"
    MINOR = "minor"
    MODERATE = "moderate"
    SEVERE = "severe"
    CRITICAL = "critical"


class ImageAnalysisResult(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "image_analysis_results"

    complaint_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("complaints.id", ondelete="CASCADE"),
        unique=True,
        index=True,
    )
    detected_issue_type: Mapped[str | None] = mapped_column(String(100), index=True)
    severity_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), index=True)
    confidence_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    objects_detected: Mapped[dict | None] = mapped_column(JSONB)
    damage_level: Mapped[DamageLevel | None] = mapped_column(
        Enum(
            DamageLevel,
            name="damage_level",
            values_callable=lambda enum_cls: [item.value for item in enum_cls],
        )
    )
    image_quality_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    raw_response: Mapped[dict | None] = mapped_column(JSONB)
    model_name: Mapped[str | None] = mapped_column(String(100))
    model_version: Mapped[str | None] = mapped_column(String(50))
    analyzed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    complaint = relationship("Complaint", back_populates="image_analysis")
