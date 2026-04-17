#!/usr/bin/env python3
"""
RQ Worker for processing email campaigns.
Run this script to start the worker that will process background email jobs.
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    import redis
    from rq import Worker, Queue, Connection
    from redis.exceptions import ConnectionError as RedisConnectionError

    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
    redis_conn = redis.from_url(redis_url)

    try:
        redis_conn.ping()
        email_queue = Queue("email_campaigns", connection=redis_conn)
    except RedisConnectionError:
        raise RuntimeError("Redis connection failed")

    if __name__ == '__main__':
        with Connection(redis_conn):
            worker = Worker([email_queue])
            print("🚀 Starting RQ worker for email campaigns...")
            print("📧 Worker will process email campaign jobs")
            print("⏹️  Press Ctrl+C to stop")
            worker.work()

except Exception as exc:
    print(f"⚠️  Redis/RQ worker could not start: {exc}")
    print("📧 For development without Redis, jobs will be queued in-memory")
    print("🚀 Starting development fallback mode")

    import time
    from datetime import datetime
    try:
        from app.job_queue import in_memory_jobs
        from app.email_sender import send_campaign_emails
    except Exception as inner_exc:
        print(f"⚠️  Could not import in-memory worker dependencies: {inner_exc}")
        in_memory_jobs = {}

    print("💡 To enable persistent jobs, install Redis and RQ:")
    print("   brew install redis")
    print("   pip install redis rq")
    print("   redis-server &")
    print("   python backend/worker.py")

    try:
        while True:
            pending_jobs = [
                (job_id, job)
                for job_id, job in in_memory_jobs.items()
                if job.get("status") == "queued"
            ]
            for job_id, job in pending_jobs:
                print(f"🔄 Processing in-memory job {job_id}")
                job["status"] = "started"
                job["started_at"] = datetime.utcnow().isoformat()
                try:
                    send_campaign_emails(job["campaign_id"], job["user_id"])
                    job["status"] = "finished"
                    job["result"] = "completed"
                except Exception as worker_exc:
                    job["status"] = "failed"
                    job["error"] = str(worker_exc)
                    print(f"❌ In-memory job {job_id} failed: {worker_exc}")
                finally:
                    job["ended_at"] = datetime.utcnow().isoformat()

            time.sleep(5)
    except KeyboardInterrupt:
        print("🛑 Worker stopped")