from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from ..handler.yt_dlp_handler import download_video
from ..handler.list_qualities import list_qualities
from ..config import DOWNLOAD_DIR
import os
import uuid
from typing import Dict

router = APIRouter(prefix="/download", tags=["download"])

task_registry: Dict[str, dict] = {}  # task_id -> status dict

class ListQualitiesRequest(BaseModel):
    link: str

class DownloadRequest(BaseModel):
    youtube_url: str
    output_path: str = os.path.join(DOWNLOAD_DIR, "%(title)s.%(ext)s")
    video_quality: str = "bestvideo"
    audio_quality: str = "bestaudio"

class DownloadResponse(BaseModel):
    task_id: str
    status: str

@router.post("/list-qualities")
def api_list_qualities(req: ListQualitiesRequest):
    try:
        formats = list_qualities(req.link)
        return {"count": len(formats), "results": formats}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def download_task(task_id: str, req: DownloadRequest):
    task_registry[task_id] = {"status": "in_progress", "file_path": None, "stdout": "", "stderr": ""}
    try:
        os.makedirs(os.path.dirname(req.output_path), exist_ok=True)
        result = download_video(
            req.youtube_url,
            req.output_path,
            req.video_quality,
            req.audio_quality
        )
        task_registry[task_id] = {
            "status": result.get("status", "error"),
            "file_path": result.get("file_path"),
            "stdout": result.get("stdout", ""),
            "stderr": result.get("stderr", "")
        }
    except Exception as e:
        task_registry[task_id] = {"status": "error", "file_path": None, "stdout": "", "stderr": str(e)}

@router.post("/download-video", response_model=DownloadResponse)
def api_download_video(req: DownloadRequest, background_tasks: BackgroundTasks):
    task_id = str(uuid.uuid4())
    task_registry[task_id] = {"status": "pending", "file_path": None, "stdout": "", "stderr": ""}
    background_tasks.add_task(download_task, task_id, req)
    return {"task_id": task_id, "status": "pending"}

@router.get("/download-status/{task_id}")
def download_status(task_id: str):
    if task_id not in task_registry:
        raise HTTPException(status_code=404, detail="Task not found")
    entry = task_registry[task_id]
    return {"status": entry["status"], "file_path": entry["file_path"]}