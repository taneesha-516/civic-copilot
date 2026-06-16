def generate_complaint(data):

    issue_type = data.get("issue_type", "Unknown")
    location = data.get("location", "Unknown")
    urgency = data.get("urgency", "Medium")
    summary = data.get("short_summary", "No summary available")
    impact = data.get("citizen_impact", "No impact information available")

    complaint = f"""
Subject: {issue_type} Issue at {location}

Respected Sir/Madam,

I would like to bring to your attention a civic issue related to {issue_type.lower()} at {location}.

Issue Summary:
{summary}

Impact on Citizens:
{impact}

Urgency Level:
{urgency}

I kindly request the concerned department to investigate and resolve this issue at the earliest convenience.

Thank you for your attention and prompt action.

Sincerely,
Concerned Citizen
"""

    return complaint.strip()