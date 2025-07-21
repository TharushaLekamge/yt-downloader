from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime
from .schedule_db import get_scheduled_jobs, update_job_status, DownloadJob
from ..handler.yt_dlp_handler import download_video
import threading

scheduler = BackgroundScheduler()

# This lock ensures only one job runner runs at a time
job_runner_lock = threading.Lock()

def run_scheduled_jobs():
    now = datetime.utcnow()
    jobs = get_scheduled_jobs(now)
    for job in jobs:
        # Mark as in_progress
        update_job_status(job.task_id, "in_progress")
        result = download_video(
            job.youtube_url,
            job.output_path,
            job.video_quality,
            job.audio_quality
        )
        update_job_status(
            job.task_id,
            result.get("status", "error"),
            file_path=result.get("file_path")
        )

def start_scheduler():
    scheduler.add_job(run_scheduled_jobs, 'interval', seconds=30)
    scheduler.start() 