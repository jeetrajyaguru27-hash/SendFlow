from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Lead
from ..email_sender import verify_unsubscribe_token

router = APIRouter()

@router.get("/unsubscribe/{token}", response_class=HTMLResponse)
async def unsubscribe(token: str, db: Session = Depends(get_db)):
    """Handle unsubscribe link clicks for leads."""
    lead_id = verify_unsubscribe_token(token)
    if not lead_id:
        raise HTTPException(status_code=400, detail="Invalid unsubscribe token")

    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    lead.opted_out = True
    lead.status = "opted_out"
    lead.opted_out_at = datetime.utcnow()
    db.commit()

    return HTMLResponse(
        content="<html><body><h1>Unsubscribed</h1><p>You have been unsubscribed successfully. No further emails will be sent to this address.</p></body></html>",
        status_code=200
    )
