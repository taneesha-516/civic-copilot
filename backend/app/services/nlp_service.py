from decimal import Decimal

from app.models.ai_analysis_result import UrgencyLevel
from app.schemas.ai_analysis import AIAnalysisCreate


class NLPService:
    ISSUE_KEYWORDS = {
        "garbage": ["garbage", "trash", "waste", "dump"],
        "road_damage": ["pothole", "road", "broken street", "crack"],
        "water": ["water leak", "flood", "drain", "sewage"],
        "electricity": ["streetlight", "electric", "power", "wire"],
    }

    def analyze(self, text: str, location_hint: str | None = None) -> AIAnalysisCreate:
        lowered = text.lower()
        issue_type = "other"
        for candidate, keywords in self.ISSUE_KEYWORDS.items():
            if any(keyword in lowered for keyword in keywords):
                issue_type = candidate
                break

        urgency_level = self._detect_urgency(lowered)
        urgency_score = {
            UrgencyLevel.LOW: Decimal("25.00"),
            UrgencyLevel.MEDIUM: Decimal("50.00"),
            UrgencyLevel.HIGH: Decimal("75.00"),
            UrgencyLevel.CRITICAL: Decimal("95.00"),
        }[urgency_level]

        return AIAnalysisCreate(
            extracted_issue_type=issue_type,
            extracted_location=location_hint,
            urgency_level=urgency_level,
            urgency_score=urgency_score,
            keywords={"matched_issue_type": issue_type},
            confidence_score=Decimal("70.00"),
            model_name="rule-based-nlp",
            model_version="v1",
            raw_response={"source": "starter heuristic"},
        )

    def _detect_urgency(self, text: str) -> UrgencyLevel:
        if any(word in text for word in ["danger", "emergency", "accident", "fire"]):
            return UrgencyLevel.CRITICAL
        if any(word in text for word in ["urgent", "blocked", "overflowing", "severe"]):
            return UrgencyLevel.HIGH
        if any(word in text for word in ["days", "repeated", "bad"]):
            return UrgencyLevel.MEDIUM
        return UrgencyLevel.LOW
