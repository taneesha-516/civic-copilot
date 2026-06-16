from decimal import Decimal

from app.models.image_analysis_result import DamageLevel
from app.schemas.image_analysis import ImageAnalysisCreate


class CVService:
    def analyze(self, image_url: str | None, text_issue_type: str | None) -> ImageAnalysisCreate:
        if not image_url:
            return ImageAnalysisCreate(
                detected_issue_type=text_issue_type,
                severity_score=Decimal("0.00"),
                confidence_score=Decimal("0.00"),
                damage_level=DamageLevel.NONE,
                model_name="no-image",
                model_version="v1",
            )

        severity = Decimal("65.00")
        damage_level = DamageLevel.MODERATE
        if text_issue_type in {"road_damage", "water"}:
            severity = Decimal("78.00")
            damage_level = DamageLevel.SEVERE

        return ImageAnalysisCreate(
            detected_issue_type=text_issue_type or "unknown",
            severity_score=severity,
            confidence_score=Decimal("72.00"),
            damage_level=damage_level,
            image_quality_score=Decimal("80.00"),
            objects_detected={"detected": [text_issue_type or "civic_issue"]},
            model_name="stub-cv-detector",
            model_version="v1",
            raw_response={"source": "starter heuristic"},
        )
