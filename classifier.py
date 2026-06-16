import google.generativeai as genai
from dotenv import load_dotenv
import os
import json

load_dotenv()

genai.configure(
    api_key=os.getenv("GEMINI_API_KEY")
)

model = genai.GenerativeModel("gemini-2.5-flash")

# Simple in-memory cache
CACHE = {}


def fallback_classifier(text):
    """
    Rule-based fallback classifier.
    Used when Gemini is unavailable or quota is exceeded.
    """

    text_lower = text.lower()

    # ROAD
    if any(word in text_lower for word in [
        "pothole",
        "road",
        "accident",
        "gaddha",
        "sadak",
        "road damaged",
        "broken road",
        "road repair"
    ]):
        issue_type = "Road"

    # GARBAGE
    elif any(word in text_lower for word in [
        "garbage",
        "trash",
        "waste",
        "kooda",
        "kachra",
        "garbage pile",
        "waste collection"
    ]):
        issue_type = "Garbage"

    # WATER
    elif any(word in text_lower for word in [
        "water leak",
        "water leakage",
        "pipe burst",
        "paani leak",
        "flooded",
        "water pipe",
        "waterlogging",
        "water logging"
    ]):
        issue_type = "Water"

    # ELECTRICITY
    elif any(word in text_lower for word in [
        "electricity",
        "power outage",
        "power cut",
        "transformer",
        "electric pole"
    ]):
        issue_type = "Electricity"

    # STREETLIGHT
    elif any(word in text_lower for word in [
        "streetlight",
        "street light",
        "light kharab",
        "street lamp",
        "lamp post"
    ]):
        issue_type = "Streetlight"

    # DRAINAGE
    elif any(word in text_lower for word in [
        "drain",
        "drainage",
        "sewer"
    ]):
        issue_type = "Drainage"

    else:
        issue_type = "Unknown"

    return {
        "issue_type": issue_type,
        "location": "Unknown",
        "urgency": "Medium",
        "short_summary": text[:100],
        "citizen_impact": "Detected using fallback rules",
        "confidence_score": 50
    }


def classify_complaint(text):

    # Return cached result if already analyzed
    if text in CACHE:
        return CACHE[text]

    prompt = f"""
You are an AI system for civic complaint analysis.

The complaint may be in:
- English
- Hindi
- Hinglish

Analyze the complaint and extract:

1. issue_type
2. location
3. urgency
4. short_summary
5. citizen_impact
6. confidence_score

Allowed issue types:
- Road
- Garbage
- Water
- Electricity
- Streetlight
- Drainage

Urgency must be:
- Low
- Medium
- High

confidence_score must be an integer between 0 and 100.

Return ONLY valid JSON.

Use exactly these keys:

{{
    "issue_type": "",
    "location": "",
    "urgency": "",
    "short_summary": "",
    "citizen_impact": "",
    "confidence_score": 0
}}

Complaint:
{text}
"""

    try:

        response = model.generate_content(prompt)

        result = response.text.strip()

        # Remove markdown formatting if Gemini adds it
        result = result.replace("```json", "")
        result = result.replace("```", "")
        result = result.strip()

        data = json.loads(result)

        required_keys = [
            "issue_type",
            "location",
            "urgency",
            "short_summary",
            "citizen_impact",
            "confidence_score"
        ]

        for key in required_keys:

            if key not in data:

                if key == "confidence_score":
                    data[key] = 0
                else:
                    data[key] = "Unknown"

        # Cache successful response
        CACHE[text] = data

        return data

    except json.JSONDecodeError:
        return fallback_classifier(text)

    except Exception:
        return fallback_classifier(text)