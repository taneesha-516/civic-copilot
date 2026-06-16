# Civic Copilot – NLP Service

AI-powered complaint analysis and department routing service for Civic Copilot.

## Features

* Complaint classification using Gemini AI
* Location extraction
* Urgency detection
* Complaint summarization
* Citizen impact analysis
* Confidence scoring
* Department routing
* Formal complaint generation
* Hindi, English, and Hinglish support
* Rule-based fallback classifier
* FastAPI REST API

---

## Tech Stack

* Python
* FastAPI
* Gemini API
* Pydantic
* dotenv

---

## Installation

### Clone Repository

```bash
git clone <repository-url>
cd civic-copilot-nlp
```

### Create Virtual Environment

Windows:

```bash
python -m venv venv
venv\Scripts\activate
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

---

## Environment Variables

Create a `.env` file:

```env
GEMINI_API_KEY=YOUR_API_KEY
```

---

## Run Server

```bash
uvicorn app:app --reload
```

Server runs on:

```text
http://127.0.0.1:8000
```

Swagger UI:

```text
http://127.0.0.1:8000/docs
```

---

## API Endpoints

### Health Check

```http
GET /health
```

Response:

```json
{
  "status": "healthy"
}
```

---

### Process Complaint

```http
POST /process
```

Request:

```json
{
  "complaint": "Huge pothole near India Gate causing accidents."
}
```

Response:

```json
{
  "analysis": {
    "issue_type": "Road",
    "location": "India Gate",
    "urgency": "High",
    "short_summary": "Large pothole causing accidents",
    "citizen_impact": "Risk to motorists and pedestrians",
    "confidence_score": 95
  },
  "department": "PWD",
  "formal_complaint": "..."
}
```

---

## Department Mapping

| Issue Type  | Department                    |
| ----------- | ----------------------------- |
| Road        | PWD                           |
| Garbage     | Municipal Corporation         |
| Water       | Water Department              |
| Electricity | Electricity Department        |
| Streetlight | Municipal Electrical Division |
| Drainage    | Drainage Department           |

---

## Supported Languages

* English
* Hindi
* Hinglish

Examples:

```text
Huge pothole near India Gate.
```

```text
India Gate ke paas bada gaddha hai.
```

```text
भारत गेट के पास सड़क में बड़ा गड्ढा है।
```

---

## Team Integration

Frontend should call:

```http
POST /process
```

with:

```json
{
  "complaint": "Citizen complaint text"
}
```

The response contains:

* Complaint analysis
* Department assignment
* Formal complaint draft

---

## Author

Civic Copilot – Shreya Jain (NLP & Complaint Processing)
