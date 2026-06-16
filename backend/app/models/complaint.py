import enum
import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Enum, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class ComplaintSource(str, enum.Enum):
    WEB = "web"
    MOBILE = "mobile"
    ADMIN = "admin"
    API = "api"


class Complaint(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "complaints"

    submitted_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        index=True,
    )
    assigned_department_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("departments.id", ondelete="SET NULL"),
        index=True,
    )
    status_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("complaint_statuses.id"),
        index=True,
    )

    title: Mapped[str | None] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text)
    issue_type: Mapped[str | None] = mapped_column(String(100), index=True)
    location_text: Mapped[str | None] = mapped_column(Text)
    latitude: Mapped[Decimal | None] = mapped_column(Numeric(10, 7))
    longitude: Mapped[Decimal | None] = mapped_column(Numeric(10, 7))
    image_url: Mapped[str | None] = mapped_column(Text)
    source: Mapped[ComplaintSource] = mapped_column(
        Enum(
            ComplaintSource,
            name="complaint_source",
            values_callable=lambda enum_cls: [item.value for item in enum_cls],
        ),
        default=ComplaintSource.WEB,
        nullable=False,
    )
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    submitted_by_user = relationship("User", back_populates="submitted_complaints")
    assigned_department = relationship("Department", back_populates="complaints")
    status = relationship("ComplaintStatus", back_populates="complaints")
    ai_analysis = relationship(
        "AIAnalysisResult",
        back_populates="complaint",
        cascade="all, delete-orphan",
        uselist=False,
    )
    image_analysis = relationship(
        "ImageAnalysisResult",
        back_populates="complaint",
        cascade="all, delete-orphan",
        uselist=False,
    )
    priority_score = relationship(
        "PriorityScore",
        back_populates="complaint",
        cascade="all, delete-orphan",
        uselist=False,
    )
