from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ..handler.yt_dlp_handler import download_video
from ..handler.list_qualities import list_qualities
from ..config import DOWNLOAD_DIR
import os

router = APIRouter(prefix="/download", tags=["download"])

class ListQualitiesRequest(BaseModel):
    link: str

class DownloadRequest(BaseModel):
    youtube_url: str
    output_path: str = os.path.join(DOWNLOAD_DIR, "%(title)s.%(ext)s")
    video_quality: str = "bestvideo"
    audio_quality: str = "bestaudio"

@router.post("/list-qualities")
def api_list_qualities(req: ListQualitiesRequest):
    try:
        formats = list_qualities(req.link)
        return {"count": len(formats), "results": formats}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/download-video")
def api_download_video(req: DownloadRequest):
    try:
        # Ensure downloads directory exists
        os.makedirs(os.path.dirname(req.output_path), exist_ok=True)
        file_path = download_video(
            req.youtube_url,
            req.output_path,
            req.video_quality,
            req.audio_quality
        )
        return {"file_path": file_path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))