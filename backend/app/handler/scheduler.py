from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime
from .schedule_db import get_scheduled_jobs, update_job_status, DownloadJob
from ..handler.yt_dlp_handler import download_video
import threading
import logging

scheduler = BackgroundScheduler()

# This lock ensures only one job runner runs at a time
job_runner_lock = threading.Lock()

def run_scheduled_jobs():
    now = datetime.utcnow()
    jobs = get_scheduled_jobs(now)
    logging.debug(f"[Scheduler] Checking for scheduled jobs at {now.isoformat()}. Jobs found: {len(jobs)}")
    for job in jobs:
        logging.info(f"[Scheduler] Starting scheduled download: task_id={job.task_id}, url={job.youtube_url}, output={job.output_path}, scheduled_time={job.scheduled_time}")
        update_job_status(job.task_id, "in_progress")
        try:
            result = download_video(
                job.youtube_url,
                job.output_path,
                job.video_quality,
                job.audio_quality
            )
            logging.info(f"[Scheduler] Download finished: task_id={job.task_id}, status={result.get('status')}, file_path={result.get('file_path')}, stdout={result.get('stdout')}, stderr={result.get('stderr')}")
            # Set status to 'completed' if result is 'success'
            final_status = 'completed' if result.get('status') == 'success' else result.get('status', 'error')
            update_job_status(
                job.task_id,
                final_status,
                file_path=result.get("file_path")
            )
        except Exception as e:
            logging.error(f"[Scheduler] Exception during scheduled download: task_id={job.task_id}, error={str(e)}")
            update_job_status(job.task_id, "error")

def start_scheduler():
    logging.info("[Scheduler] Starting background scheduler for downloads.")
    scheduler.add_job(run_scheduled_jobs, 'interval', seconds=30)
    scheduler.start() 