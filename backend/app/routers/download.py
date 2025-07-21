from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ..yt_dlp_handler import list_qualities, download_video
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

def simplify_format(fmt):
    return {
        "ID": fmt.get("format_id"),
        "EXT": fmt.get("ext"),
        "RESOLUTION": fmt.get("resolution") or (f"{fmt.get('width', '')}x{fmt.get('height', '')}" if fmt.get('width') and fmt.get('height') else None),
        "FPS": fmt.get("fps"),
        "CH": fmt.get("audio_channels"),
        "FILESIZE": fmt.get("filesize") or fmt.get("filesize_approx"),
        "TBR": fmt.get("tbr"),
        "PROTO": fmt.get("protocol"),
        "VCODEC": fmt.get("vcodec"),
        "VBR": fmt.get("vbr"),
        "ACODEC": fmt.get("acodec"),
        "ABR": fmt.get("abr"),
        "ASR": fmt.get("asr"),
        "MORE_INFO": fmt.get("format_note")
    }

@router.post("/list-qualities")
def api_list_qualities(req: ListQualitiesRequest):
    try:
        formats = list_qualities(req.link)
        simple_formats = [simplify_format(fmt) for fmt in formats]
        return {"formats": simple_formats}
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