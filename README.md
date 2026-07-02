Civic CoPilot

Civic CoPilot is an AI-powered citizen assistance platform developed for the USAII Hackathon 2026. The platform aims to bridge the gap between citizens and government authorities by simplifying complaint registration, intelligent complaint routing, and civic information access through an intuitive AI-driven interface.

The system leverages modern AI techniques to analyze complaints, identify relevant government departments, assess urgency, and assist citizens in submitting well-structured grievances, making public service interactions faster and more efficient.

---

USAII Hackathon 2026

This project was developed as part of the USAII Hackathon 2026, focusing on the application of Artificial Intelligence to improve civic engagement and public service delivery.

---

Key Features

- AI-powered complaint analysis
- Automatic department recommendation and routing
- Complaint summarization
- Urgency detection
- Location extraction from user input
- Citizen impact assessment
- Confidence scoring for AI predictions
- Formal complaint generation
- Multilingual support (English, Hindi, and Hinglish)
- Rule-based fallback classification
- Interactive dashboard for complaint insights
- Modern web interface with FastAPI backend

---

Technology Stack

Backend

- Python
- FastAPI
- SQLAlchemy
- Alembic

Artificial Intelligence

- Google Gemini API
- Natural Language Processing (NLP)
- Rule-based classification

Frontend

- HTML
- CSS
- JavaScript

Database

- SQLite/PostgreSQL (configurable)

---

Project Structure

civic-copilot/
├── backend/
│   ├── app/
│   ├── alembic/
│   ├── requirements.txt
│   └── README.md
├── static/
├── templates/
├── app.py
└── README.md

---

Installation

Clone the repository:

git clone https://github.com/taneesha-516/civic-copilot.git
cd civic-copilot

Install the required dependencies:

pip install -r backend/requirements.txt

Configure your environment variables:

GEMINI_API_KEY=YOUR_API_KEY

Run the application:

uvicorn backend.app.main:app --reload

---

How It Works

1. Citizens submit a complaint through the platform.
2. The AI analyzes the complaint using Natural Language Processing.
3. The system extracts important information such as location, urgency, and category.
4. The complaint is automatically mapped to the appropriate government department.
5. A structured complaint and relevant insights are generated to assist in efficient grievance resolution.

---

Future Enhancements

- Regional language expansion
- Voice-based complaint submission
- Real-time government API integration
- Mobile application
- Complaint status tracking
- GIS-based complaint visualization
- Predictive analytics for civic issues

---

Contributors

- Taneesha Prasad - ML and CV
- Shreya Jain - NLP
- Anvi Nandwani - backend integration
- Khanak Bhatia - frontend integration 

---

License

This project was created for the USAII Hackathon 2026 and is intended for educational, research, and demonstration purposes.
