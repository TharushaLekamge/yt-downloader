from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from ..handler.yt_dlp_handler import download_video
from ..handler.list_qualities import list_qualities
from ..config import DOWNLOAD_DIR
from ..handler.schedule_db import add_download_job, DownloadJob, get_job_by_task_id, list_jobs
import os
import uuid
from typing import Dict, Optional, List
from datetime import datetime, timezone

router = APIRouter(prefix="/download", tags=["download"])

task_registry: Dict[str, dict] = {}  # task_id -> status dict

class ListQualitiesRequest(BaseModel):
    link: str

class DownloadRequest(BaseModel):
    youtube_url: str
    output_path: str = os.path.join(DOWNLOAD_DIR, "%(title)s.%(ext)s")
    video_quality: str = "bestvideo"
    audio_quality: str = "bestaudio"
    scheduled_time: Optional[datetime] = None

class DownloadResponse(BaseModel):
    task_id: str
    status: str

class DownloadJobResponse(BaseModel):
    task_id: str
    youtube_url: str
    output_path: str
    video_quality: str
    audio_quality: str
    scheduled_time: datetime
    status: str
    file_path: Optional[str]
    created_at: datetime
    updated_at: datetime
    time_remaining: Optional[float] = Field(None, description="Minutes until scheduled start")

class ScheduledDownloadsResponse(BaseModel):
    current_time: str
    scheduled: List[DownloadJobResponse]

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
    now = datetime.utcnow()
    # Only allow immediate download
    job = DownloadJob(
        task_id=task_id,
        youtube_url=req.youtube_url,
        output_path=req.output_path,
        video_quality=req.video_quality,
        audio_quality=req.audio_quality,
        scheduled_time=now,
        status="in_progress"
    )
    add_download_job(job)
    background_tasks.add_task(download_task, task_id, req)
    return {"task_id": task_id, "status": "in_progress"}

@router.post("/schedule-download", response_model=DownloadResponse)
def api_schedule_download(req: DownloadRequest):
    task_id = str(uuid.uuid4())
    now = datetime.utcnow()
    if not req.scheduled_time or req.scheduled_time <= now:
        raise HTTPException(status_code=400, detail="scheduled_time must be in the future")
    job = DownloadJob(
        task_id=task_id,
        youtube_url=req.youtube_url,
        output_path=req.output_path,
        video_quality=req.video_quality,
        audio_quality=req.audio_quality,
        scheduled_time=req.scheduled_time,
        status="scheduled"
    )
    add_download_job(job)
    return {"task_id": task_id, "status": "scheduled"}

@router.get("/download-status/{task_id}")
def download_status(task_id: str):
    job = get_job_by_task_id(task_id)
    if not job:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"status": job.status, "file_path": job.file_path}

@router.get("/scheduled-downloads", response_model=ScheduledDownloadsResponse)
def scheduled_downloads():
    jobs = list_jobs(status="scheduled")
    now = datetime.now(timezone.utc)
    result = []
    for job in jobs:
        scheduled_time = job.scheduled_time
        if scheduled_time.tzinfo is None:
            scheduled_time = scheduled_time.replace(tzinfo=timezone.utc)
        time_remaining = (scheduled_time - now).total_seconds() / 60  # minutes
        job_dict = job.dict()
        job_dict["time_remaining"] = round(time_remaining, 2)
        result.append(DownloadJobResponse(**job_dict))
    return ScheduledDownloadsResponse(current_time=now.isoformat(), scheduled=result)

@router.get("/past-downloads", response_model=List[DownloadJobResponse])
def past_downloads():
    jobs = list_jobs()
    # Filter for completed or error
    return [j for j in jobs if j.status in ("completed", "error")]