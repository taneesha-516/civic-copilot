import enum
import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Enum, ForeignKey, Numeric, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.ai_analysis_result import UrgencyLevel
from app.models.mixins import UUIDPrimaryKeyMixin


class PriorityLevel(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class PriorityScore(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "priority_scores"

    complaint_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("complaints.id", ondelete="CASCADE"),
        unique=True,
        index=True,
    )
    final_score: Mapped[Decimal] = mapped_column(Numeric(5, 2), index=True)
    urgency_component: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=0)
    severity_component: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=0)
    issue_weight_component: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=0)
    location_density_component: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=0)
    duplicate_component: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=0)
    priority_level: Mapped[PriorityLevel] = mapped_column(
        Enum(
            PriorityLevel,
            name="priority_level",
            values_callable=lambda enum_cls: [item.value for item in enum_cls],
        ),
        index=True,
    )
    scoring_version: Mapped[str] = mapped_column(String(50), default="v1")
    explanation: Mapped[dict | None] = mapped_column(JSONB)
    calculated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    complaint = relationship("Complaint", back_populates="priority_score")
