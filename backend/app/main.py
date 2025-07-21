from fastapi import FastAPI
from dotenv import load_dotenv
from .routers import health
from .routers import download
import os
from .handler.schedule_db import init_db
from .handler.scheduler import start_scheduler
import logging

# Load environment variables from .env file
load_dotenv()

# Initialize logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s [%(levelname)s] %(message)s',
)

app = FastAPI()

# Initialize DB and scheduler
init_db()
start_scheduler()

# Include routers
app.include_router(health.router)
app.include_router(download.router)

# Placeholder for future endpoints (e.g., /download, /progress, /config)

