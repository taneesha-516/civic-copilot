import os
from pathlib import Path
from ultralytics import YOLO

BASE_DIR = Path(__file__).resolve().parent

pothole_model = YOLO(
    str(BASE_DIR / "runs/detect/train/weights/best.pt")
)

garbage_model = YOLO(
    str(BASE_DIR / "garbage/runs/detect/train-3/weights/best.pt")
)


def get_severity(box):

    x1, y1, x2, y2 = box.xyxy[0]

    width = x2 - x1
    height = y2 - y1

    area = width * height

    if area > 5000:
        return "High"
    elif area > 2000:
        return "Medium"
    else:
        return "Low"


def detect_issues(image_source):

    # Load image from bytes if bytes are provided
    if isinstance(image_source, bytes):
        from PIL import Image
        import io
        image = Image.open(io.BytesIO(image_source))
    else:
        image = image_source

    detections = []

    # Detect potholes
    pothole_results = pothole_model(image)

    for box in pothole_results[0].boxes:
        detections.append({
            "detected_issue": "Pothole",
            "confidence": float(box.conf[0]),
            "severity": get_severity(box)
        })

    # Detect garbage
    garbage_results = garbage_model(image)

    for box in garbage_results[0].boxes:
        detections.append({
            "detected_issue": "Garbage",
            "confidence": float(box.conf[0]),
            "severity": get_severity(box)
        })

    # If no issue detected, return fallback response
    if not detections:
        return {
            "detected_issue": "none",
            "severity_score": 0.00,
            "confidence": 0.00
        }

    # Select the primary issue: sort by severity level then confidence
    severity_weights = {"High": 3, "Medium": 2, "Low": 1}
    severity_scores = {"High": 85.00, "Medium": 70.00, "Low": 50.00}

    detections.sort(
        key=lambda d: (severity_weights.get(d["severity"], 0), d["confidence"]),
        reverse=True
    )
    best = detections[0]

    return {
        "detected_issue": best["detected_issue"],
        "severity_score": severity_scores.get(best["severity"], 0.00),
        "confidence": round(best["confidence"], 4)
    }

if __name__ == "__main__":
    test_img_path = str(BASE_DIR / "test3.jpg")
    if os.path.exists(test_img_path):
        print(detect_issues(test_img_path))
    else:
        print("Test image not found at:", test_img_path)