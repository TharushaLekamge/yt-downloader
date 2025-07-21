from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def read_root():
    return {"message": "YouTube Video Downloader API is running."}

@router.get("/health")
def health_check():
    return {"status": "ok"}