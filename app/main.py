from fastapi import FastAPI
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "YouTube Video Downloader API is running."}

# Placeholder for future endpoints (e.g., /download, /progress, /config)
