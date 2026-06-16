from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal

import numpy as np
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.complaint import Complaint
from app.models.image_analysis_result import ImageAnalysisResult
from app.schemas.prediction import (
    AreaRiskPrediction,
    IssuePredictionRequest,
    IssuePredictionResponse,
)


@dataclass(frozen=True)
class HistoricalComplaint:
    area: str
    issue_type: str
    month_index: int
    severity_score: float


class IssuePredictionService:
    def predict_area_risks(
        self,
        db: Session,
        payload: IssuePredictionRequest,
    ) -> IssuePredictionResponse:
        history = self._fetch_history(db)
        if len(history) < payload.min_training_records:
            predictions = self._fallback_predictions(history, payload.limit)
            return IssuePredictionResponse(
                predictions=predictions,
                model_used="aggregation-fallback",
                training_records=len(history),
                horizon_days=payload.horizon_days,
                explanation=(
                    "Not enough historical rows for model training, so risks were "
                    "calculated from recurrence, severity, and complaint density."
                ),
            )

        predictions = self._ml_predictions(history, payload)
        return IssuePredictionResponse(
            predictions=predictions,
            model_used="scikit-learn random-forest pipeline",
            training_records=len(history),
            horizon_days=payload.horizon_days,
            explanation=(
                "The engine groups historical complaints by area, issue type, and "
                "month, predicts future density with a RandomForestRegressor, predicts "
                "dominant issue type with a RandomForestClassifier, then combines "
                "predicted density, severity, and recurrence into a 0-100 risk score."
            ),
        )

    def _fetch_history(self, db: Session) -> list[HistoricalComplaint]:
        severity = func.coalesce(ImageAnalysisResult.severity_score, 50).label(
            "severity_score"
        )
        statement = (
            select(
                Complaint.location_text,
                Complaint.latitude,
                Complaint.longitude,
                Complaint.issue_type,
                Complaint.submitted_at,
                Complaint.created_at,
                severity,
            )
            .select_from(Complaint)
            .outerjoin(
                ImageAnalysisResult,
                ImageAnalysisResult.complaint_id == Complaint.id,
            )
            .where(Complaint.issue_type.is_not(None))
            .order_by(Complaint.created_at.asc())
        )

        history: list[HistoricalComplaint] = []
        for row in db.execute(statement).all():
            event_date = row.submitted_at or row.created_at
            if event_date is None:
                continue

            history.append(
                HistoricalComplaint(
                    area=self._area_name(row.location_text, row.latitude, row.longitude),
                    issue_type=row.issue_type or "other",
                    month_index=self._month_index(event_date),
                    severity_score=float(row.severity_score or 50),
                )
            )
        return history

    def _ml_predictions(
        self,
        history: list[HistoricalComplaint],
        payload: IssuePredictionRequest,
    ) -> list[AreaRiskPrediction]:
        bucket_stats = self._bucket_stats(history)
        density_features, density_targets = self._density_training_data(bucket_stats)
        issue_features, issue_targets = self._issue_training_data(bucket_stats)

        density_model = self._density_model()
        density_model.fit(density_features, density_targets)

        issue_model = self._issue_model()
        issue_model.fit(issue_features, issue_targets)

        latest_month = max(item.month_index for item in history)
        horizon_months = max(1, round(payload.horizon_days / 30))
        prediction_month = latest_month + horizon_months

        areas = sorted({item.area for item in history})
        issues = sorted({item.issue_type for item in history})
        area_predictions: list[AreaRiskPrediction] = []

        for area in areas:
            classifier_input = [self._area_month_features(area, prediction_month, bucket_stats)]
            predicted_issue = str(issue_model.predict(classifier_input)[0])

            candidate_issues = set(issues)
            candidate_issues.add(predicted_issue)

            best_prediction: AreaRiskPrediction | None = None
            for issue in candidate_issues:
                recent_count, average_severity = self._recent_area_issue_stats(
                    bucket_stats,
                    area,
                    issue,
                    latest_month,
                )
                model_input = [
                    {
                        "area": area,
                        "issue_type": issue,
                        "month_index": prediction_month,
                        "recent_count": recent_count,
                        "average_severity": average_severity,
                    }
                ]
                predicted_density = max(0.0, float(density_model.predict(model_input)[0]))
                recurring_count = self._recurring_count(bucket_stats, area, issue)
                hotspot_score = self._hotspot_score(recurring_count)
                risk_score = self._risk_score(
                    predicted_density=predicted_density,
                    average_severity=average_severity,
                    hotspot_score=float(hotspot_score),
                )
                prediction = AreaRiskPrediction(
                    area=area,
                    risk_score=risk_score,
                    predicted_issue=issue,
                    predicted_density=self._decimal(predicted_density),
                    hotspot_score=hotspot_score,
                    average_severity_score=self._decimal(average_severity),
                    recurring_complaints=recurring_count,
                )
                if best_prediction is None or prediction.risk_score > best_prediction.risk_score:
                    best_prediction = prediction

            if best_prediction:
                area_predictions.append(best_prediction)

        return sorted(
            area_predictions,
            key=lambda item: item.risk_score,
            reverse=True,
        )[: payload.limit]

    def _fallback_predictions(
        self,
        history: list[HistoricalComplaint],
        limit: int,
    ) -> list[AreaRiskPrediction]:
        grouped: dict[str, list[HistoricalComplaint]] = defaultdict(list)
        for item in history:
            grouped[item.area].append(item)

        predictions: list[AreaRiskPrediction] = []
        for area, complaints in grouped.items():
            issue_counter = Counter(item.issue_type for item in complaints)
            predicted_issue = issue_counter.most_common(1)[0][0]
            severities = [item.severity_score for item in complaints]
            recurring_count = len(complaints)
            hotspot_score = self._hotspot_score(recurring_count)
            density_score = min(100.0, recurring_count * 12.0)
            average_severity = float(np.mean(severities)) if severities else 50.0
            risk_score = self._risk_score(
                predicted_density=density_score / 10,
                average_severity=average_severity,
                hotspot_score=float(hotspot_score),
            )
            predictions.append(
                AreaRiskPrediction(
                    area=area,
                    risk_score=risk_score,
                    predicted_issue=predicted_issue,
                    predicted_density=self._decimal(density_score / 10),
                    hotspot_score=hotspot_score,
                    average_severity_score=self._decimal(average_severity),
                    recurring_complaints=recurring_count,
                )
            )

        return sorted(predictions, key=lambda item: item.risk_score, reverse=True)[:limit]

    def _density_model(self) -> Pipeline:
        preprocessor = ColumnTransformer(
            transformers=[
                (
                    "categorical",
                    OneHotEncoder(handle_unknown="ignore"),
                    ["area", "issue_type"],
                ),
                (
                    "numeric",
                    "passthrough",
                    ["month_index", "recent_count", "average_severity"],
                ),
            ]
        )
        return Pipeline(
            steps=[
                ("preprocessor", preprocessor),
                (
                    "model",
                    RandomForestRegressor(
                        n_estimators=80,
                        random_state=42,
                        min_samples_leaf=1,
                    ),
                ),
            ]
        )

    def _issue_model(self) -> Pipeline:
        preprocessor = ColumnTransformer(
            transformers=[
                ("categorical", OneHotEncoder(handle_unknown="ignore"), ["area"]),
                (
                    "numeric",
                    "passthrough",
                    ["month_index", "total_count", "average_severity"],
                ),
            ]
        )
        return Pipeline(
            steps=[
                ("preprocessor", preprocessor),
                (
                    "model",
                    RandomForestClassifier(
                        n_estimators=80,
                        random_state=42,
                    ),
                ),
            ]
        )

    def _bucket_stats(self, history: list[HistoricalComplaint]) -> dict[tuple, dict]:
        buckets: dict[tuple, list[HistoricalComplaint]] = defaultdict(list)
        for item in history:
            buckets[(item.area, item.issue_type, item.month_index)].append(item)

        return {
            key: {
                "count": len(items),
                "average_severity": float(np.mean([item.severity_score for item in items])),
            }
            for key, items in buckets.items()
        }

    def _density_training_data(self, bucket_stats: dict[tuple, dict]) -> tuple[list[dict], list[float]]:
        features: list[dict] = []
        targets: list[float] = []
        for (area, issue_type, month_index), stats in bucket_stats.items():
            next_stats = bucket_stats.get((area, issue_type, month_index + 1), {"count": 0})
            features.append(
                {
                    "area": area,
                    "issue_type": issue_type,
                    "month_index": month_index,
                    "recent_count": stats["count"],
                    "average_severity": stats["average_severity"],
                }
            )
            targets.append(float(next_stats["count"]))
        return features, targets

    def _issue_training_data(self, bucket_stats: dict[tuple, dict]) -> tuple[list[dict], list[str]]:
        area_month: dict[tuple[str, int], list[tuple[str, dict]]] = defaultdict(list)
        for (area, issue_type, month_index), stats in bucket_stats.items():
            area_month[(area, month_index)].append((issue_type, stats))

        features: list[dict] = []
        targets: list[str] = []
        for (area, month_index), issue_rows in area_month.items():
            total_count = sum(stats["count"] for _, stats in issue_rows)
            weighted_severity = sum(
                stats["average_severity"] * stats["count"] for _, stats in issue_rows
            ) / max(total_count, 1)
            dominant_issue = max(issue_rows, key=lambda row: row[1]["count"])[0]
            features.append(
                {
                    "area": area,
                    "month_index": month_index,
                    "total_count": total_count,
                    "average_severity": weighted_severity,
                }
            )
            targets.append(dominant_issue)
        return features, targets

    def _area_month_features(
        self,
        area: str,
        month_index: int,
        bucket_stats: dict[tuple, dict],
    ) -> dict:
        area_rows = [
            stats
            for (bucket_area, _, _), stats in bucket_stats.items()
            if bucket_area == area
        ]
        total_count = sum(stats["count"] for stats in area_rows)
        average_severity = (
            sum(stats["average_severity"] * stats["count"] for stats in area_rows)
            / max(total_count, 1)
        )
        return {
            "area": area,
            "month_index": month_index,
            "total_count": total_count,
            "average_severity": average_severity,
        }

    def _recent_area_issue_stats(
        self,
        bucket_stats: dict[tuple, dict],
        area: str,
        issue_type: str,
        latest_month: int,
    ) -> tuple[int, float]:
        recent_rows = [
            stats
            for (bucket_area, bucket_issue, month_index), stats in bucket_stats.items()
            if bucket_area == area
            and bucket_issue == issue_type
            and month_index >= latest_month - 2
        ]
        if not recent_rows:
            return 0, 50.0

        total_count = sum(stats["count"] for stats in recent_rows)
        average_severity = sum(
            stats["average_severity"] * stats["count"] for stats in recent_rows
        ) / max(total_count, 1)
        return total_count, average_severity

    def _recurring_count(
        self,
        bucket_stats: dict[tuple, dict],
        area: str,
        issue_type: str,
    ) -> int:
        return sum(
            stats["count"]
            for (bucket_area, bucket_issue, _), stats in bucket_stats.items()
            if bucket_area == area and bucket_issue == issue_type
        )

    def _risk_score(
        self,
        predicted_density: float,
        average_severity: float,
        hotspot_score: float,
    ) -> int:
        density_score = min(100.0, predicted_density * 20.0)
        risk = (density_score * 0.45) + (average_severity * 0.35) + (hotspot_score * 0.20)
        return int(round(max(0.0, min(100.0, risk))))

    def _hotspot_score(self, recurring_count: int) -> Decimal:
        return self._decimal(min(100.0, recurring_count * 10.0))

    def _area_name(self, location_text, latitude, longitude) -> str:
        if location_text:
            return str(location_text).strip()
        if latitude is not None and longitude is not None:
            return f"{Decimal(latitude).quantize(Decimal('0.01'))},{Decimal(longitude).quantize(Decimal('0.01'))}"
        return "Unknown Area"

    def _month_index(self, value: datetime) -> int:
        return value.year * 12 + value.month

    def _decimal(self, value: float) -> Decimal:
        return Decimal(str(value)).quantize(Decimal("0.01"))
