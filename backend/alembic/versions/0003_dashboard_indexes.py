"""dashboard indexes

Revision ID: 0003_dashboard_indexes
Revises: 0002_heatmap_indexes
Create Date: 2026-06-16
"""
from collections.abc import Sequence

from alembic import op

revision: str = "0003_dashboard_indexes"
down_revision: str | None = "0002_heatmap_indexes"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_index(
        "ix_complaints_status_created_at",
        "complaints",
        ["status_id", "created_at"],
        unique=False,
    )
    op.create_index(
        "ix_complaints_department_status",
        "complaints",
        ["assigned_department_id", "status_id"],
        unique=False,
    )
    op.create_index(
        "ix_complaints_resolved_at",
        "complaints",
        ["resolved_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_complaints_resolved_at", table_name="complaints")
    op.drop_index("ix_complaints_department_status", table_name="complaints")
    op.drop_index("ix_complaints_status_created_at", table_name="complaints")
