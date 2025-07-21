from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from ..handler.yt_dlp_handler import download_video
from ..config import DOWNLOAD_DIR
from ..handler.schedule_db import add_download_job, DownloadJob, get_job_by_task_id, list_jobs, delete_job_by_task_id, list_jobs_by_statuses
import os
import uuid
from typing import Dict, Optional, List
from datetime import datetime, timezone
import subprocess
import json
from typing import List, Dict, Any
from dateutil import parser as dateutil_parser
import logging

router = APIRouter(prefix="/download", tags=["download"])

task_registry: Dict[str, dict] = {}  # task_id -> status dict

class ListQualitiesRequest(BaseModel):
    link: str

class DownloadRequest(BaseModel):
    youtube_url: str
    output_path: str = os.path.join(DOWNLOAD_DIR, "%(title)s.%(ext)s")
    video_quality: str = "bestvideo"
    audio_quality: str = "bestaudio"
    scheduled_time: Optional[str] = None  # Accept as ISO string

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
    logging.info(f"[API] Starting download task: task_id={task_id}, url={req.youtube_url}, output={req.output_path}, video_quality={req.video_quality}, audio_quality={req.audio_quality}")
    task_registry[task_id] = {"status": "in_progress", "file_path": None, "stdout": "", "stderr": ""}
    try:
        os.makedirs(os.path.dirname(req.output_path), exist_ok=True)
        result = download_video(
            req.youtube_url,
            req.output_path,
            req.video_quality,
            req.audio_quality
        )
        logging.info(f"[API] Download task finished: task_id={task_id}, status={result.get('status')}, file_path={result.get('file_path')}, stdout={result.get('stdout')}, stderr={result.get('stderr')}")
        task_registry[task_id] = {
            "status": result.get("status", "error"),
            "file_path": result.get("file_path"),
            "stdout": result.get("stdout", ""),
            "stderr": result.get("stderr", "")
        }
    except Exception as e:
        logging.error(f"[API] Exception in download task: task_id={task_id}, error={str(e)}")
        task_registry[task_id] = {"status": "error", "file_path": None, "stdout": "", "stderr": str(e)}

@router.post("/download-video", response_model=DownloadResponse)
def api_download_video(req: DownloadRequest, background_tasks: BackgroundTasks):
    task_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    logging.info(f"[API] /download-video called: task_id={task_id}, url={req.youtube_url}, output={req.output_path}, video_quality={req.video_quality}, audio_quality={req.audio_quality}")
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
    now = datetime.now(timezone.utc)
    logging.info(f"[API] /schedule-download called: task_id={task_id}, url={req.youtube_url}, output={req.output_path}, video_quality={req.video_quality}, audio_quality={req.audio_quality}, scheduled_time={req.scheduled_time}")
    # Parse scheduled_time as UTC, even if tzinfo is missing
    if not req.scheduled_time:
        raise HTTPException(status_code=400, detail="scheduled_time is required")
    try:
        scheduled_time = dateutil_parser.isoparse(req.scheduled_time)
        # If the string is naive (no tzinfo), treat as UTC
        if scheduled_time.tzinfo is None or scheduled_time.tzinfo.utcoffset(scheduled_time) is None:
            scheduled_time = scheduled_time.replace(tzinfo=timezone.utc)
        else:
            scheduled_time = scheduled_time.astimezone(timezone.utc)
    except Exception:
        logging.error(f"[API] Invalid scheduled_time format: {req.scheduled_time}")
        raise HTTPException(status_code=400, detail="Invalid scheduled_time format")
    if scheduled_time <= now:
        logging.error(f"[API] scheduled_time must be in the future: {scheduled_time} <= {now}")
        raise HTTPException(status_code=400, detail="scheduled_time must be in the future (UTC)")
    job = DownloadJob(
        task_id=task_id,
        youtube_url=req.youtube_url,
        output_path=req.output_path,
        video_quality=req.video_quality,
        audio_quality=req.audio_quality,
        scheduled_time=scheduled_time,
        status="scheduled"
    )
    add_download_job(job)
    logging.info(f"[API] Download job scheduled: task_id={task_id}, scheduled_time={scheduled_time}")
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
        # Ensure scheduled_time is always UTC and timezone-aware
        if scheduled_time.tzinfo is None:
            scheduled_time = scheduled_time.replace(tzinfo=timezone.utc)
        else:
            scheduled_time = scheduled_time.astimezone(timezone.utc)
        time_remaining = (scheduled_time - now).total_seconds() / 60  # minutes
        job_dict = job.dict()
        job_dict["scheduled_time"] = scheduled_time.isoformat()
        job_dict["time_remaining"] = round(time_remaining, 2)
        result.append(DownloadJobResponse(**job_dict))
    return ScheduledDownloadsResponse(current_time=now.isoformat(), scheduled=result)

@router.delete("/scheduled-downloads/{task_id}")
def delete_scheduled_download(task_id: str):
    deleted = delete_job_by_task_id(task_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Task not found or already started/completed")
    return {"status": "deleted", "task_id": task_id}

@router.get("/past-downloads", response_model=List[DownloadJobResponse])
def past_downloads():
    jobs = list_jobs_by_statuses(["completed", "error"])
    result = []
    for job in jobs:
        scheduled_time = job.scheduled_time
        if scheduled_time.tzinfo is None:
            scheduled_time = scheduled_time.replace(tzinfo=timezone.utc)
        else:
            scheduled_time = scheduled_time.astimezone(timezone.utc)
        job_dict = job.dict()
        job_dict["scheduled_time"] = scheduled_time.isoformat()
        result.append(DownloadJobResponse(**job_dict))
    return result

def list_qualities(youtube_url: str) -> List[Dict[str, Any]]:
    """
    Uses yt-dlp -j to get all available formats for a given YouTube URL.
    Parses the JSON output to extract key quality info.
    """
    cmd = [
        "yt-dlp",
        "-j",
        youtube_url
    ]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        info = json.loads(result.stdout)
        formats = info.get("formats", [])
        parsed_formats = []
        for f in formats:
            parsed_formats.append({
                "id": f.get("format_id", ""),
                "ext": f.get("ext", ""),
                "resolution": f.get("resolution") or f.get("height") or "",
                "fps": f.get("fps", ""),
                "ch": f.get("audio_channels", ""),
                "filesize": f.get("filesize") or f.get("filesize_approx", ""),
                "tbr": f.get("tbr", ""),
                "proto": f.get("protocol", ""),
                "vcodec": f.get("vcodec", ""),
                "vbr": f.get("vbr", ""),
                "acodec": f.get("acodec", ""),
            })
        return parsed_formats
    except subprocess.CalledProcessError as e:
        raise RuntimeError(f"yt-dlp error: {e.stderr}")