from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas, utils

router = APIRouter(prefix="/tickets", tags=["tickets"])


@router.post("/checkin", response_model=schemas.CheckinResponse)
def checkin_ticket(payload: schemas.CheckinRequest, db: Session = Depends(get_db)):
    ticket_number = payload.ticket_number.strip().upper()

    ticket = db.query(models.Ticket).filter(
        models.Ticket.ticket_number == ticket_number
    ).first()

    if not ticket:
        raise HTTPException(status_code=404, detail="No ticket found with that number.")

    registrant = ticket.registrant
    tag = utils.get_ticket_tag(registrant)

    if ticket.checked_in:
        return schemas.CheckinResponse(
            result="already_checked_in",
            full_name=registrant.full_name,
            category_tag=tag,
            checked_in_at=ticket.checked_in_at,
            message=f"Already checked in at {ticket.checked_in_at.strftime('%H:%M')}.",
        )

    ticket.checked_in = True
    ticket.checked_in_at = datetime.now(timezone.utc)
    db.commit()

    return schemas.CheckinResponse(
        result="approved",
        full_name=registrant.full_name,
        category_tag=tag,
        checked_in_at=ticket.checked_in_at,
        message="Approved — first check-in.",
    )