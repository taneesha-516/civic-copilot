from fastapi import FastAPI, File, UploadFile
from detect import detect_issues

app = FastAPI()

@app.get("/")
def home():
    return {"message": "API Running"}

@app.post("/detect")
async def detect(image: UploadFile = File(...)):
    image_bytes = await image.read()
    return detect_issues(image_bytes)

@app.get("/detect")
def detect_get():
    return detect_issues("test3.jpg")