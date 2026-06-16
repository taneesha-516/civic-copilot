import enum
import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Enum, ForeignKey, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.mixins import UUIDPrimaryKeyMixin


class UrgencyLevel(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class AIAnalysisResult(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "ai_analysis_results"

    complaint_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("complaints.id", ondelete="CASCADE"),
        unique=True,
        index=True,
    )
    extracted_issue_type: Mapped[str | None] = mapped_column(String(100), index=True)
    extracted_location: Mapped[str | None] = mapped_column(Text)
    urgency_level: Mapped[UrgencyLevel | None] = mapped_column(
        Enum(
            UrgencyLevel,
            name="urgency_level",
            values_callable=lambda enum_cls: [item.value for item in enum_cls],
        ),
        index=True,
    )
    urgency_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    sentiment: Mapped[str | None] = mapped_column(String(30))
    language_code: Mapped[str | None] = mapped_column(String(20))
    keywords: Mapped[dict | None] = mapped_column(JSONB)
    raw_response: Mapped[dict | None] = mapped_column(JSONB)
    confidence_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    model_name: Mapped[str | None] = mapped_column(String(100))
    model_version: Mapped[str | None] = mapped_column(String(50))
    analyzed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    complaint = relationship("Complaint", back_populates="ai_analysis")
