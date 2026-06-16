"""heatmap indexes

Revision ID: 0002_heatmap_indexes
Revises: 0001_initial_schema
Create Date: 2026-06-16
"""
from collections.abc import Sequence

from alembic import op

revision: str = "0002_heatmap_indexes"
down_revision: str | None = "0001_initial_schema"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_index(
        "ix_complaints_latitude_longitude",
        "complaints",
        ["latitude", "longitude"],
        unique=False,
    )
    op.create_index(
        "ix_complaints_issue_location",
        "complaints",
        ["issue_type", "latitude", "longitude"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_complaints_issue_location", table_name="complaints")
    op.drop_index("ix_complaints_latitude_longitude", table_name="complaints")
