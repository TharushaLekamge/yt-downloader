from sqlmodel import SQLModel, Field, create_engine, Session, select
from typing import Optional
from datetime import datetime
import os
import logging

DB_PATH = os.getenv("SCHEDULE_DB_PATH", "schedule.db")
engine = create_engine(f"sqlite:///{DB_PATH}", echo=False)

class DownloadJob(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    task_id: str = Field(index=True)
    youtube_url: str
    output_path: str
    video_quality: str
    audio_quality: str
    scheduled_time: datetime
    status: str = "scheduled"  # scheduled, in_progress, completed, error
    file_path: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


def init_db():
    SQLModel.metadata.create_all(engine)


def add_download_job(job: DownloadJob):
    logging.debug(f"[DB] Adding download job: task_id={job.task_id}, url={job.youtube_url}, output={job.output_path}, scheduled_time={job.scheduled_time}, status={job.status}")
    with Session(engine) as session:
        session.add(job)
        session.commit()
        session.refresh(job)
        logging.debug(f"[DB] Download job added: task_id={job.task_id}")
        return job


def get_scheduled_jobs(now: datetime) -> list:
    logging.debug(f"[DB] Querying scheduled jobs at {now.isoformat()}")
    with Session(engine) as session:
        statement = select(DownloadJob).where(DownloadJob.scheduled_time <= now, DownloadJob.status == "scheduled")
        jobs = session.exec(statement).all()
        logging.debug(f"[DB] Found {len(jobs)} scheduled jobs")
        return jobs


def get_job_by_task_id(task_id: str) -> Optional[DownloadJob]:
    logging.debug(f"[DB] Querying job by task_id: {task_id}")
    with Session(engine) as session:
        statement = select(DownloadJob).where(DownloadJob.task_id == task_id)
        job = session.exec(statement).first()
        logging.debug(f"[DB] Job found: {bool(job)} for task_id={task_id}")
        return job


def update_job_status(task_id: str, status: str, file_path: Optional[str] = None):
    logging.debug(f"[DB] Updating job status: task_id={task_id}, status={status}, file_path={file_path}")
    with Session(engine) as session:
        job = get_job_by_task_id(task_id)
        if job:
            job.status = status
            job.updated_at = datetime.utcnow()
            if file_path:
                job.file_path = file_path
            session.add(job)
            session.commit()
            logging.debug(f"[DB] Job status updated: task_id={task_id}, status={status}")


def list_jobs(status: Optional[str] = None):
    with Session(engine) as session:
        statement = select(DownloadJob)
        if status:
            statement = statement.where(DownloadJob.status == status)
        return session.exec(statement).all()


def list_jobs_by_statuses(statuses: list):
    with Session(engine) as session:
        statement = select(DownloadJob).where(DownloadJob.status.in_(statuses))
        return session.exec(statement).all()


def delete_job_by_task_id(task_id: str):
    logging.debug(f"[DB] Deleting job by task_id: {task_id}")
    with Session(engine) as session:
        job = get_job_by_task_id(task_id)
        if job:
            session.delete(job)
            session.commit()
            logging.debug(f"[DB] Job deleted: task_id={task_id}")
            return True
        logging.debug(f"[DB] No job found to delete: task_id={task_id}")
        return False 