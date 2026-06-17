from ultralytics import YOLO

pothole_model = YOLO(
    "runs/detect/train/weights/best.pt"
)

garbage_model = YOLO(
    "garbage/runs/detect/train-3/weights/best.pt"
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


def detect_issues(image_path):

    output = []

    # Detect potholes
    pothole_results = pothole_model(image_path)

    for box in pothole_results[0].boxes:

        output.append({
            "issue": "Pothole",
            "confidence": round(float(box.conf[0]) * 100, 2),
            "severity": get_severity(box)
        })

    # Detect garbage
    garbage_results = garbage_model(image_path)

    for box in garbage_results[0].boxes:

        output.append({
            "issue": "Garbage",
            "confidence": round(float(box.conf[0]) * 100, 2),
            "severity": get_severity(box)
        })

    return output

print(detect_issues("test3.jpg"))