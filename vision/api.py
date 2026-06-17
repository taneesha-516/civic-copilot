from fastapi import FastAPI
from detect import detect_issues

app = FastAPI()

@app.get("/")
def home():
    return {"message": "API Running"}

@app.get("/detect")
def detect():
    return detect_issues("test3.jpg")