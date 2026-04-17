from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..auth import get_current_user
from ..models import Sequence, SequenceStep
from ..schemas import Sequence as SequenceSchema, SequenceCreate, SequenceStep as SequenceStepSchema, SequenceStepCreate

router = APIRouter()

@router.post("/", response_model=SequenceSchema)
async def create_sequence(
    sequence: SequenceCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create a new email sequence."""
    db_sequence = Sequence(
        name=sequence.name,
        description=sequence.description,
        user_id=current_user.id
    )
    db.add(db_sequence)
    db.commit()
    db.refresh(db_sequence)
    return db_sequence

@router.get("/", response_model=List[SequenceSchema])
async def get_sequences(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get all sequences for current user."""
    sequences = db.query(Sequence).filter(Sequence.user_id == current_user.id).all()
    return sequences

@router.get("/{sequence_id}", response_model=SequenceSchema)
async def get_sequence(
    sequence_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get a specific sequence."""
    sequence = db.query(Sequence).filter(
        Sequence.id == sequence_id,
        Sequence.user_id == current_user.id
    ).first()
    if not sequence:
        raise HTTPException(status_code=404, detail="Sequence not found")
    return sequence

@router.post("/{sequence_id}/steps", response_model=SequenceStepSchema)
async def create_sequence_step(
    sequence_id: int,
    step: SequenceStepCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Add a step to a sequence."""
    # Verify sequence ownership
    sequence = db.query(Sequence).filter(
        Sequence.id == sequence_id,
        Sequence.user_id == current_user.id
    ).first()
    if not sequence:
        raise HTTPException(status_code=404, detail="Sequence not found")

    db_step = SequenceStep(
        sequence_id=sequence_id,
        step_number=step.step_number,
        subject=step.subject,
        body=step.body,
        delay_hours=step.delay_hours,
        sender_name=step.sender_name,
        priority=step.priority,
        send_window_start=step.send_window_start,
        send_window_end=step.send_window_end,
        weekdays_only=step.weekdays_only
    )
    db.add(db_step)
    db.commit()
    db.refresh(db_step)
    return db_step

@router.get("/{sequence_id}/steps", response_model=List[SequenceStepSchema])
async def get_sequence_steps(
    sequence_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get all steps for a sequence."""
    sequence = db.query(Sequence).filter(
        Sequence.id == sequence_id,
        Sequence.user_id == current_user.id
    ).first()
    if not sequence:
        raise HTTPException(status_code=404, detail="Sequence not found")
    
    steps = db.query(SequenceStep).filter(SequenceStep.sequence_id == sequence_id).order_by(SequenceStep.step_number).all()
    return steps

@router.delete("/{sequence_id}")
async def delete_sequence(
    sequence_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete a sequence."""
    sequence = db.query(Sequence).filter(
        Sequence.id == sequence_id,
        Sequence.user_id == current_user.id
    ).first()
    if not sequence:
        raise HTTPException(status_code=404, detail="Sequence not found")
    
    db.delete(sequence)
    db.commit()
    return {"message": "Sequence deleted"}