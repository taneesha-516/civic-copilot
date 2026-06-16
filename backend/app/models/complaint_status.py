from sqlalchemy import Boolean, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.mixins import UUIDPrimaryKeyMixin


class ComplaintStatus(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "complaint_statuses"

    name: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    sort_order: Mapped[int] = mapped_column(Integer)
    is_terminal: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    complaints = relationship("Complaint", back_populates="status")
