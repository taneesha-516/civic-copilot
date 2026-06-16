"""initial schema

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-06-16
"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0001_initial_schema"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


user_role = postgresql.ENUM("citizen", "official", "admin", name="user_role")
complaint_source = postgresql.ENUM("web", "mobile", "admin", "api", name="complaint_source")
urgency_level = postgresql.ENUM("low", "medium", "high", "critical", name="urgency_level")
damage_level = postgresql.ENUM(
    "none",
    "minor",
    "moderate",
    "severe",
    "critical",
    name="damage_level",
)
priority_level = postgresql.ENUM("low", "medium", "high", "critical", name="priority_level")


def upgrade() -> None:
    bind = op.get_bind()
    #user_role.create(bind, checkfirst=True)
    #complaint_source.create(bind, checkfirst=True)
    #urgency_level.create(bind, checkfirst=True)
    #damage_level.create(bind, checkfirst=True)
    #priority_level.create(bind, checkfirst=True)

    op.create_table(
        "departments",
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("code", sa.String(length=50), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("contact_email", sa.String(length=255), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_departments_code", "departments", ["code"], unique=True)
    op.create_index("ix_departments_name", "departments", ["name"], unique=True)

    op.create_table(
        "complaint_statuses",
        sa.Column("name", sa.String(length=50), nullable=False),
        sa.Column("code", sa.String(length=50), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column("is_terminal", sa.Boolean(), nullable=False),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_complaint_statuses_code", "complaint_statuses", ["code"], unique=True)
    op.create_index("ix_complaint_statuses_name", "complaint_statuses", ["name"], unique=True)

    op.create_table(
        "users",
        sa.Column("department_id", sa.UUID(), nullable=True),
        sa.Column("full_name", sa.String(length=150), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("phone", sa.String(length=30), nullable=True),
        sa.Column("role", user_role, nullable=False),
        sa.Column("password_hash", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["department_id"], ["departments.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_department_id", "users", ["department_id"], unique=False)
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_role", "users", ["role"], unique=False)

    op.create_table(
        "complaints",
        sa.Column("submitted_by", sa.UUID(), nullable=True),
        sa.Column("assigned_department_id", sa.UUID(), nullable=True),
        sa.Column("status_id", sa.UUID(), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=True),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("issue_type", sa.String(length=100), nullable=True),
        sa.Column("location_text", sa.Text(), nullable=True),
        sa.Column("latitude", sa.Numeric(precision=10, scale=7), nullable=True),
        sa.Column("longitude", sa.Numeric(precision=10, scale=7), nullable=True),
        sa.Column("image_url", sa.Text(), nullable=True),
        sa.Column("source", complaint_source, nullable=False),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["assigned_department_id"], ["departments.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["status_id"], ["complaint_statuses.id"]),
        sa.ForeignKeyConstraint(["submitted_by"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_complaints_assigned_department_id", "complaints", ["assigned_department_id"], unique=False)
    op.create_index("ix_complaints_issue_type", "complaints", ["issue_type"], unique=False)
    op.create_index("ix_complaints_status_id", "complaints", ["status_id"], unique=False)
    op.create_index("ix_complaints_submitted_by", "complaints", ["submitted_by"], unique=False)

    op.create_table(
        "ai_analysis_results",
        sa.Column("complaint_id", sa.UUID(), nullable=False),
        sa.Column("extracted_issue_type", sa.String(length=100), nullable=True),
        sa.Column("extracted_location", sa.Text(), nullable=True),
        sa.Column("urgency_level", urgency_level, nullable=True),
        sa.Column("urgency_score", sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column("sentiment", sa.String(length=30), nullable=True),
        sa.Column("language_code", sa.String(length=20), nullable=True),
        sa.Column("keywords", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("raw_response", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("confidence_score", sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column("model_name", sa.String(length=100), nullable=True),
        sa.Column("model_version", sa.String(length=50), nullable=True),
        sa.Column("analyzed_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(["complaint_id"], ["complaints.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_ai_analysis_results_complaint_id", "ai_analysis_results", ["complaint_id"], unique=True)
    op.create_index("ix_ai_analysis_results_extracted_issue_type", "ai_analysis_results", ["extracted_issue_type"], unique=False)
    op.create_index("ix_ai_analysis_results_urgency_level", "ai_analysis_results", ["urgency_level"], unique=False)

    op.create_table(
        "image_analysis_results",
        sa.Column("complaint_id", sa.UUID(), nullable=False),
        sa.Column("detected_issue_type", sa.String(length=100), nullable=True),
        sa.Column("severity_score", sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column("confidence_score", sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column("objects_detected", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("damage_level", damage_level, nullable=True),
        sa.Column("image_quality_score", sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column("raw_response", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("model_name", sa.String(length=100), nullable=True),
        sa.Column("model_version", sa.String(length=50), nullable=True),
        sa.Column("analyzed_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(["complaint_id"], ["complaints.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_image_analysis_results_complaint_id", "image_analysis_results", ["complaint_id"], unique=True)
    op.create_index("ix_image_analysis_results_detected_issue_type", "image_analysis_results", ["detected_issue_type"], unique=False)
    op.create_index("ix_image_analysis_results_severity_score", "image_analysis_results", ["severity_score"], unique=False)

    op.create_table(
        "priority_scores",
        sa.Column("complaint_id", sa.UUID(), nullable=False),
        sa.Column("final_score", sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column("urgency_component", sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column("severity_component", sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column("issue_weight_component", sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column("location_density_component", sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column("duplicate_component", sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column("priority_level", priority_level, nullable=False),
        sa.Column("scoring_version", sa.String(length=50), nullable=False),
        sa.Column("explanation", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("calculated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(["complaint_id"], ["complaints.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_priority_scores_complaint_id", "priority_scores", ["complaint_id"], unique=True)
    op.create_index("ix_priority_scores_final_score", "priority_scores", ["final_score"], unique=False)
    op.create_index("ix_priority_scores_priority_level", "priority_scores", ["priority_level"], unique=False)

    op.bulk_insert(
        sa.table(
            "complaint_statuses",
            sa.column("id", sa.UUID()),
            sa.column("name", sa.String()),
            sa.column("code", sa.String()),
            sa.column("sort_order", sa.Integer()),
            sa.column("is_terminal", sa.Boolean()),
        ),
        [
            {
                "id": "00000000-0000-0000-0000-000000000001",
                "name": "Submitted",
                "code": "submitted",
                "sort_order": 1,
                "is_terminal": False,
            },
            {
                "id": "00000000-0000-0000-0000-000000000002",
                "name": "Processing",
                "code": "processing",
                "sort_order": 2,
                "is_terminal": False,
            },
            {
                "id": "00000000-0000-0000-0000-000000000003",
                "name": "Assigned",
                "code": "assigned",
                "sort_order": 3,
                "is_terminal": False,
            },
            {
                "id": "00000000-0000-0000-0000-000000000004",
                "name": "In Progress",
                "code": "in_progress",
                "sort_order": 4,
                "is_terminal": False,
            },
            {
                "id": "00000000-0000-0000-0000-000000000005",
                "name": "Resolved",
                "code": "resolved",
                "sort_order": 5,
                "is_terminal": True,
            },
            {
                "id": "00000000-0000-0000-0000-000000000006",
                "name": "Rejected",
                "code": "rejected",
                "sort_order": 6,
                "is_terminal": True,
            },
        ],
    )


def downgrade() -> None:
    op.drop_index("ix_priority_scores_priority_level", table_name="priority_scores")
    op.drop_index("ix_priority_scores_final_score", table_name="priority_scores")
    op.drop_index("ix_priority_scores_complaint_id", table_name="priority_scores")
    op.drop_table("priority_scores")

    op.drop_index("ix_image_analysis_results_severity_score", table_name="image_analysis_results")
    op.drop_index("ix_image_analysis_results_detected_issue_type", table_name="image_analysis_results")
    op.drop_index("ix_image_analysis_results_complaint_id", table_name="image_analysis_results")
    op.drop_table("image_analysis_results")

    op.drop_index("ix_ai_analysis_results_urgency_level", table_name="ai_analysis_results")
    op.drop_index("ix_ai_analysis_results_extracted_issue_type", table_name="ai_analysis_results")
    op.drop_index("ix_ai_analysis_results_complaint_id", table_name="ai_analysis_results")
    op.drop_table("ai_analysis_results")

    op.drop_index("ix_complaints_submitted_by", table_name="complaints")
    op.drop_index("ix_complaints_status_id", table_name="complaints")
    op.drop_index("ix_complaints_issue_type", table_name="complaints")
    op.drop_index("ix_complaints_assigned_department_id", table_name="complaints")
    op.drop_table("complaints")

    op.drop_index("ix_users_role", table_name="users")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_index("ix_users_department_id", table_name="users")
    op.drop_table("users")

    op.drop_index("ix_complaint_statuses_name", table_name="complaint_statuses")
    op.drop_index("ix_complaint_statuses_code", table_name="complaint_statuses")
    op.drop_table("complaint_statuses")

    op.drop_index("ix_departments_name", table_name="departments")
    op.drop_index("ix_departments_code", table_name="departments")
    op.drop_table("departments")

    priority_level.drop(op.get_bind(), checkfirst=True)
    damage_level.drop(op.get_bind(), checkfirst=True)
    urgency_level.drop(op.get_bind(), checkfirst=True)
    complaint_source.drop(op.get_bind(), checkfirst=True)
    user_role.drop(op.get_bind(), checkfirst=True)
