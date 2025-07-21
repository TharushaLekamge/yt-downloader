import os

DOWNLOAD_DIR = os.getenv("DOWNLOAD_DIR")
if not DOWNLOAD_DIR:
    raise EnvironmentError("Missing DOWNLOAD_DIR environment variable")
