from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..gmail_service import get_inbox_threads, send_reply_message
from ..models import EmailLog, Lead
from ..schemas import InboxReplyRequest

router = APIRouter()


@router.get("/")
async def get_inbox(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    """Return the inbox threads for the authenticated user."""
    messages = get_inbox_threads(current_user, db=db, max_results=50)
    return {"messages": messages}


@router.post("/reply")
async def reply_to_thread(
    payload: InboxReplyRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Reply to an inbox thread."""
    try:
        sent_message = send_reply_message(
            current_user,
            thread_id=payload.thread_id,
            to_email=payload.to_email,
            subject=payload.subject,
            body=payload.body,
        )

        matching_log = db.query(EmailLog).filter(EmailLog.thread_id == payload.thread_id).order_by(EmailLog.timestamp.desc()).first()
        if matching_log and matching_log.lead:
            matching_log.lead.last_contacted_at = datetime.now(timezone.utc)
            matching_log.lead.needs_follow_up = False
            db.commit()

        return {
            "message": "Reply sent successfully",
            "message_id": sent_message.get("id"),
            "thread_id": sent_message.get("threadId") or payload.thread_id,
        }
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Failed to send reply: {exc}")


@router.post("/{lead_id}/mark-follow-up")
async def mark_needs_follow_up(
    lead_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    lead = db.query(Lead).join(Lead.campaign).filter(
        Lead.id == lead_id,
        Lead.campaign.has(user_id=current_user.id),
    ).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    lead.needs_follow_up = True
    db.commit()
    return {"message": "Lead marked as needs follow-up"}


@router.post("/{lead_id}/mark-converted")
async def mark_converted(
    lead_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    lead = db.query(Lead).join(Lead.campaign).filter(
        Lead.id == lead_id,
        Lead.campaign.has(user_id=current_user.id),
    ).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    lead.lifecycle_stage = "converted"
    lead.converted_at = datetime.now(timezone.utc)
    lead.needs_follow_up = False
    db.commit()
    return {"message": "Lead marked as converted"}
