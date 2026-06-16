from classifier import classify_complaint
from router import route_department
from generator import generate_complaint

complaint = """
Huge pothole near India Gate.
Several bikes have slipped there.
"""

analysis = classify_complaint(
    complaint
)

department = route_department(
    analysis["issue_type"]
)

formal_complaint = generate_complaint(
    analysis
)

print("\nANALYSIS")
print(analysis)

print("\nDEPARTMENT")
print(department)

print("\nFORMAL COMPLAINT")
print(formal_complaint)