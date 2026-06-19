from fastapi import FastAPI, HTTPException

from classifier import classify_complaint
from router import route_department
from generator import generate_complaint
from models import ComplaintRequest

app = FastAPI(
    title="Civic Copilot NLP Service",
    description="AI-powered civic complaint analysis and routing service",
    version="1.0.0"
)


@app.get("/")
def root():
    return {
        "message": "Civic Copilot NLP Service is running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }


@app.post("/process")
def process_complaint(request: ComplaintRequest):

    try:

        analysis = classify_complaint(
            request.complaint
        )

        department = route_department(
            analysis["issue_type"]
        )

        formal_complaint = generate_complaint(
            analysis
        )

        return {
               "issue_type": analysis["issue_type"],
               "location": analysis["location"],
               "urgency": analysis["urgency"],
                "department": department,
              "formal_complaint": formal_complaint
        }
    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Error processing complaint: {str(e)}"
        )