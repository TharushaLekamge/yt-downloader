from fastapi import FastAPI
from dotenv import load_dotenv
from .routers import health
from .routers import download
import os

# Load environment variables from .env file
load_dotenv()

app = FastAPI()

# Include routers
app.include_router(health.router)
app.include_router(download.router)

# Placeholder for future endpoints (e.g., /download, /progress, /config)

