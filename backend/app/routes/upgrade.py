from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.emailer import send_email

router = APIRouter(prefix="/upgrade", tags=["upgrade"])


@router.post("", response_model=schemas.UpgradeResponse)
def upgrade_ticket(payload: schemas.UpgradeRequest, db: Session = Depends(get_db)):
    registrant = db.query(models.Registrant).filter(
        models.Registrant.reference_number == payload.reference_number,
        models.Registrant.category == models.RegistrantCategory.attendee,
    ).first()

    if not registrant:
        raise HTTPException(
            status_code=404,
            detail="No matching Attendee registration found for that reference number.",
        )

    attendee_detail = registrant.attendee_detail
    if not attendee_detail:
        raise HTTPException(status_code=404, detail="No ticket details found for this registrant.")

    old_ticket_type = attendee_detail.ticket_type.value
    attendee_detail.ticket_type = payload.ticket_type

    # Moving off the free General Pass tier requires payment.
    if payload.ticket_type != models.TicketType.general_pass:
        attendee_detail.is_paid = False

    db.commit()

    send_email(
        to=registrant.email,
        subject="Your Abuja Creative Showcase Ticket Update",
        html=f"""
        <p>Hi {registrant.full_name},</p>
        <p>Your ticket (reference <strong>{registrant.reference_number}</strong>) has been updated
        from <strong>{old_ticket_type}</strong> to <strong>{payload.ticket_type.value}</strong>.</p>
        <p>{'Payment is required to complete this upgrade — we will notify you once payment is open.' if payload.ticket_type != models.TicketType.general_pass else ''}</p>
        """,
    )

    return schemas.UpgradeResponse(
        reference_number=registrant.reference_number,
        ticket_type=attendee_detail.ticket_type.value,
        message="Ticket updated successfully.",
    )