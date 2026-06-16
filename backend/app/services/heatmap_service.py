from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.complaint import Complaint
from app.models.priority_score import PriorityScore
from app.schemas.heatmap import AreaComplaintCount, HeatmapPoint, HeatmapResponse


class HeatmapService:
    def get_heatmap(
        self,
        db: Session,
        min_priority: Decimal | None = None,
        area_precision: int = 2,
    ) -> HeatmapResponse:
        rows = self._fetch_complaint_points(db, min_priority=min_priority)
        points = [self._row_to_point(row) for row in rows]

        return HeatmapResponse(
            geojson=self._to_geojson(points),
            heatmap_points=points,
            area_counts=self._fetch_area_counts(
                db,
                min_priority=min_priority,
                area_precision=area_precision,
            ),
        )

    def _fetch_complaint_points(
        self,
        db: Session,
        min_priority: Decimal | None,
    ) -> list:
        priority_score = func.coalesce(PriorityScore.final_score, 0).label(
            "priority_score"
        )
        statement = (
            select(
                Complaint.id.label("complaint_id"),
                Complaint.title,
                Complaint.issue_type,
                Complaint.location_text,
                Complaint.latitude,
                Complaint.longitude,
                priority_score,
            )
            .outerjoin(PriorityScore, PriorityScore.complaint_id == Complaint.id)
            .where(Complaint.latitude.is_not(None))
            .where(Complaint.longitude.is_not(None))
            .order_by(priority_score.desc(), Complaint.created_at.desc())
        )

        if min_priority is not None:
            statement = statement.where(priority_score >= min_priority)

        return list(db.execute(statement).all())

    def _fetch_area_counts(
        self,
        db: Session,
        min_priority: Decimal | None,
        area_precision: int,
    ) -> list[AreaComplaintCount]:
        area_lat = func.round(Complaint.latitude, area_precision).label("area_lat")
        area_lng = func.round(Complaint.longitude, area_precision).label("area_lng")
        priority_score = func.coalesce(PriorityScore.final_score, 0)

        statement = (
            select(
                area_lat,
                area_lng,
                func.count(Complaint.id).label("complaint_count"),
                func.coalesce(func.avg(PriorityScore.final_score), 0).label(
                    "average_priority_score"
                ),
                func.coalesce(func.max(PriorityScore.final_score), 0).label(
                    "max_priority_score"
                ),
            )
            .outerjoin(PriorityScore, PriorityScore.complaint_id == Complaint.id)
            .where(Complaint.latitude.is_not(None))
            .where(Complaint.longitude.is_not(None))
            .group_by(area_lat, area_lng)
            .order_by(func.count(Complaint.id).desc())
        )

        if min_priority is not None:
            statement = statement.where(priority_score >= min_priority)

        return [
            AreaComplaintCount(
                area_key=f"{row.area_lat},{row.area_lng}",
                latitude=row.area_lat,
                longitude=row.area_lng,
                complaint_count=row.complaint_count,
                average_priority_score=Decimal(row.average_priority_score).quantize(
                    Decimal("0.01")
                ),
                max_priority_score=Decimal(row.max_priority_score).quantize(
                    Decimal("0.01")
                ),
            )
            for row in db.execute(statement).all()
        ]

    def _row_to_point(self, row) -> HeatmapPoint:
        priority_score = Decimal(row.priority_score).quantize(Decimal("0.01"))
        return HeatmapPoint(
            complaint_id=row.complaint_id,
            latitude=row.latitude,
            longitude=row.longitude,
            priority_score=priority_score,
            weight=(priority_score / Decimal("100.00")).quantize(Decimal("0.01")),
            issue_type=row.issue_type,
            location=row.location_text,
        )

    def _to_geojson(self, points: list[HeatmapPoint]) -> dict:
        return {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [
                            float(point.longitude),
                            float(point.latitude),
                        ],
                    },
                    "properties": {
                        "complaint_id": str(point.complaint_id),
                        "priority_score": float(point.priority_score),
                        "weight": float(point.weight),
                        "issue_type": point.issue_type,
                        "location": point.location,
                    },
                }
                for point in points
            ],
        }
