import os
import uuid
import threading
from datetime import datetime
from typing import Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

redis_enabled = False
redis_conn = None
email_queue = None
in_memory_jobs: Dict[str, Any] = {}
in_memory_worker_thread: Optional[threading.Thread] = None
active_campaign_jobs: Dict[int, str] = {}
job_registry_lock = threading.Lock()


class CampaignAlreadyQueuedError(Exception):
    """Raised when a campaign already has an active background job."""

    def __init__(self, job_id: str):
        super().__init__("Campaign already has an active background job")
        self.job_id = job_id

try:
    import redis
    from rq import Queue

    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
    redis_conn = redis.from_url(redis_url)
    # Test connection
    redis_conn.ping()
    email_queue = Queue("email_campaigns", connection=redis_conn)
    redis_enabled = True
    print("📧 Using Redis-backed job queue")
except Exception:
    print("⚠️  Redis unavailable, falling back to in-memory job queue")
    redis_enabled = False
    email_queue = None


def _run_in_memory_job(job_id: str, campaign_id: int, user_id: int, force_send: bool = False) -> None:
    from .email_sender import send_campaign_emails

    job = in_memory_jobs.get(job_id)
    if not job:
        return

    job["status"] = "started"
    job["started_at"] = datetime.utcnow().isoformat()
    try:
        send_campaign_emails(campaign_id, user_id, force_send=force_send)
        job["status"] = "finished"
        job["result"] = "completed"
    except Exception as worker_exc:
        job["status"] = "failed"
        job["error"] = str(worker_exc)
        print(f"❌ In-memory job {job_id} failed: {worker_exc}")
    finally:
        job["ended_at"] = datetime.utcnow().isoformat()
        with job_registry_lock:
            if active_campaign_jobs.get(campaign_id) == job_id:
                active_campaign_jobs.pop(campaign_id, None)


def enqueue_campaign(campaign_id: int, user_id: int, force_send: bool = False):
    """Enqueue a campaign for background processing."""
    with job_registry_lock:
        existing_job_id = active_campaign_jobs.get(campaign_id)
        if existing_job_id:
            existing_job = in_memory_jobs.get(existing_job_id)
            if existing_job and existing_job.get("status") not in {"finished", "failed", "cancelled"}:
                raise CampaignAlreadyQueuedError(existing_job_id)
            active_campaign_jobs.pop(campaign_id, None)

    if redis_enabled and email_queue is not None:
        from .email_sender import send_campaign_emails
        job = email_queue.enqueue(send_campaign_emails, campaign_id, user_id, force_send, job_timeout=86400)
        with job_registry_lock:
            active_campaign_jobs[campaign_id] = str(job.id)
        return str(job.id)

    job_id = str(uuid.uuid4())
    in_memory_jobs[job_id] = {
        "campaign_id": campaign_id,
        "user_id": user_id,
        "force_send": force_send,
        "status": "queued",
        "created_at": datetime.utcnow().isoformat(),
        "result": None,
        "error": None,
    }
    with job_registry_lock:
        active_campaign_jobs[campaign_id] = job_id
    print(f"📧 Job {job_id} queued (in-memory mode)")
    worker_thread = threading.Thread(
        target=_run_in_memory_job,
        args=(job_id, campaign_id, user_id, force_send),
        daemon=True,
        name=f"in_memory_job_{job_id}"
    )
    worker_thread.start()
    return job_id


def get_job_status(job_id: str):
    """Get the status of a background job."""
    if redis_enabled and redis_conn is not None:
        try:
            from rq.job import Job
            job = Job.fetch(job_id, connection=redis_conn)
            return {
                "id": job_id,
                "status": job.get_status(),
                "enqueued_at": job.enqueued_at.isoformat() if job.enqueued_at else None,
                "started_at": job.started_at.isoformat() if job.started_at else None,
                "ended_at": job.ended_at.isoformat() if job.ended_at else None,
                "result": job.result,
                "exc_info": job.exc_info,
            }
        except Exception:
            pass

    job = in_memory_jobs.get(job_id)
    if job:
        return {
            "id": job_id,
            "status": job.get("status", "unknown"),
            "result": job.get("result"),
            "error": job.get("error"),
            "created_at": job.get("created_at"),
        }
    return {"error": "Job not found"}


def cancel_job(job_id: str):
    """Cancel a running job."""
    if redis_enabled and redis_conn is not None:
        try:
            from rq.job import Job
            job = Job.fetch(job_id, connection=redis_conn)
            if job.is_started or job.is_queued:
                campaign_id = job.args[0] if job.args else None
                job.cancel()
                job.save()
                if campaign_id is not None:
                    with job_registry_lock:
                        if active_campaign_jobs.get(campaign_id) == job_id:
                            active_campaign_jobs.pop(campaign_id, None)
                return True
        except Exception:
            pass

    if job_id in in_memory_jobs:
        in_memory_jobs[job_id]["status"] = "cancelled"
        campaign_id = in_memory_jobs[job_id].get("campaign_id")
        if campaign_id is not None:
            with job_registry_lock:
                if active_campaign_jobs.get(campaign_id) == job_id:
                    active_campaign_jobs.pop(campaign_id, None)
        return True
    return False


def uses_persistent_queue() -> bool:
    return redis_enabled and email_queue is not None
