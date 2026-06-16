from decimal import Decimal

from app.models.priority_score import PriorityLevel
from app.schemas.ai_analysis import AIAnalysisCreate
from app.schemas.image_analysis import ImageAnalysisCreate
from app.schemas.priority_score import (
    PriorityScoreCreate,
    PriorityScoreRequest,
    PriorityScoreResponse,
)


class PriorityService:
    SCORING_VERSION = "v2"

    URGENCY_WEIGHTS = {
        "low": Decimal("25.00"),
        "medium": Decimal("50.00"),
        "high": Decimal("75.00"),
        "critical": Decimal("100.00"),
    }

    ISSUE_WEIGHTS = {
        "pothole": Decimal("85.00"),
        "sewage": Decimal("90.00"),
        "water": Decimal("80.00"),
        "road_damage": Decimal("75.00"),
        "electricity": Decimal("70.00"),
        "garbage": Decimal("55.00"),
        "streetlight": Decimal("50.00"),
        "other": Decimal("40.00"),
    }

    def calculate(
        self,
        ai_result: AIAnalysisCreate,
        image_result: ImageAnalysisCreate,
    ) -> PriorityScoreCreate:
        response = self.calculate_from_inputs(
            PriorityScoreRequest(
                nlp_urgency=(
                    ai_result.urgency_level.value
                    if ai_result.urgency_level
                    else "low"
                ),
                cv_severity_score=image_result.severity_score or Decimal("0.00"),
                similar_complaints_nearby=0,
                complaint_age_hours=0,
                issue_type=ai_result.extracted_issue_type or "other",
            )
        )

        return PriorityScoreCreate(
            final_score=response.final_score,
            urgency_component=response.urgency_component,
            severity_component=response.severity_component,
            issue_weight_component=response.issue_type_component,
            location_density_component=response.similar_complaints_component,
            duplicate_component=Decimal("0.00"),
            priority_level=response.priority_level,
            scoring_version=self.SCORING_VERSION,
            explanation=response.explanation,
        )

    def calculate_from_inputs(
        self,
        payload: PriorityScoreRequest,
    ) -> PriorityScoreResponse:
        urgency_score = self._urgency_score(payload.nlp_urgency)
        severity_score = payload.cv_severity_score
        nearby_score = self._nearby_score(payload.similar_complaints_nearby)
        age_score = self._age_score(payload.complaint_age_hours)
        issue_score = self._issue_score(payload.issue_type)

        urgency_component = urgency_score * Decimal("0.25")
        severity_component = severity_score * Decimal("0.35")
        nearby_component = nearby_score * Decimal("0.15")
        age_component = age_score * Decimal("0.10")
        issue_component = issue_score * Decimal("0.15")

        final_score = self._round_score(
            min(
                Decimal("100.00"),
                urgency_component
                + severity_component
                + nearby_component
                + age_component
                + issue_component,
            )
        )

        return PriorityScoreResponse(
            final_score=final_score,
            priority_level=self._level(final_score),
            urgency_component=self._round_score(urgency_component),
            severity_component=self._round_score(severity_component),
            similar_complaints_component=self._round_score(nearby_component),
            age_component=self._round_score(age_component),
            issue_type_component=self._round_score(issue_component),
            formula=(
                "score = 0.35*cv_severity + 0.25*nlp_urgency + "
                "0.15*similar_nearby + 0.10*complaint_age + 0.15*issue_type_weight"
            ),
            explanation={
                "weights": {
                    "cv_severity": "35%",
                    "nlp_urgency": "25%",
                    "similar_complaints_nearby": "15%",
                    "complaint_age": "10%",
                    "issue_type": "15%",
                },
                "normalized_inputs": {
                    "nlp_urgency": str(urgency_score),
                    "cv_severity_score": str(severity_score),
                    "similar_complaints_nearby": str(nearby_score),
                    "complaint_age_hours": str(age_score),
                    "issue_type": str(issue_score),
                },
                "reasoning": (
                    "Severity and urgency dominate because they indicate public risk. "
                    "Nearby complaint density increases priority when many citizens report "
                    "the same issue. Age prevents older unresolved complaints from being "
                    "buried. Issue type adds civic impact context."
                ),
                "scoring_version": self.SCORING_VERSION,
            },
        )

    def to_persistent_score(
        self,
        response: PriorityScoreResponse,
    ) -> PriorityScoreCreate:
        return PriorityScoreCreate(
            final_score=response.final_score,
            urgency_component=response.urgency_component,
            severity_component=response.severity_component,
            issue_weight_component=response.issue_type_component,
            location_density_component=response.similar_complaints_component,
            duplicate_component=response.age_component,
            priority_level=response.priority_level,
            scoring_version=self.SCORING_VERSION,
            explanation={
                **response.explanation,
                "note": "age_component is stored in duplicate_component for the v1 database schema.",
            },
        )

    def _urgency_score(self, urgency: str) -> Decimal:
        return self.URGENCY_WEIGHTS.get(urgency.strip().lower(), Decimal("25.00"))

    def _nearby_score(self, similar_complaints_nearby: int) -> Decimal:
        # 0 reports => 0, 10+ reports => 100.
        return min(Decimal("100.00"), Decimal(similar_complaints_nearby) * Decimal("10.00"))

    def _age_score(self, age_hours: Decimal) -> Decimal:
        # 0 hours => 0, 72+ hours => 100.
        return min(Decimal("100.00"), (age_hours / Decimal("72.00")) * Decimal("100.00"))

    def _issue_score(self, issue_type: str) -> Decimal:
        normalized_issue = issue_type.strip().lower().replace(" ", "_")
        return self.ISSUE_WEIGHTS.get(normalized_issue, self.ISSUE_WEIGHTS["other"])

    def _round_score(self, score: Decimal) -> Decimal:
        return score.quantize(Decimal("0.01"))

    def _level(self, score: Decimal) -> PriorityLevel:
        if score >= 85:
            return PriorityLevel.CRITICAL
        if score >= 65:
            return PriorityLevel.HIGH
        if score >= 40:
            return PriorityLevel.MEDIUM
        return PriorityLevel.LOW
