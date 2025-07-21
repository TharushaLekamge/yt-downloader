from sqlmodel import SQLModel, Field, create_engine, Session, select
from typing import Optional
from datetime import datetime
import os

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
    with Session(engine) as session:
        session.add(job)
        session.commit()
        session.refresh(job)
        return job


def get_scheduled_jobs(now: datetime) -> list:
    with Session(engine) as session:
        statement = select(DownloadJob).where(DownloadJob.scheduled_time <= now, DownloadJob.status == "scheduled")
        return session.exec(statement).all()


def get_job_by_task_id(task_id: str) -> Optional[DownloadJob]:
    with Session(engine) as session:
        statement = select(DownloadJob).where(DownloadJob.task_id == task_id)
        return session.exec(statement).first()


def update_job_status(task_id: str, status: str, file_path: Optional[str] = None):
    with Session(engine) as session:
        job = get_job_by_task_id(task_id)
        if job:
            job.status = status
            job.updated_at = datetime.utcnow()
            if file_path:
                job.file_path = file_path
            session.add(job)
            session.commit()


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
    with Session(engine) as session:
        job = get_job_by_task_id(task_id)
        if job:
            session.delete(job)
            session.commit()
            return True
        return False 