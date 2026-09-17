from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app import models, schemas, utils
from app.emailer import send_email
from app.paystack import initialize_transaction, PaystackError

router = APIRouter(prefix="/upgrade", tags=["upgrade"])


@router.post("", response_model=schemas.UpgradeResponse)
def upgrade_ticket(
    payload: schemas.UpgradeRequest,
    db: Session = Depends(get_db),
):
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
        raise HTTPException(
            status_code=404,
            detail="No ticket details found for this registrant.",
        )

    if not attendee_detail.is_paid:
        raise HTTPException(
            status_code=400,
            detail="Your original ticket must be paid for before you can upgrade.",
        )

    try:
        diff_amount_kobo = utils.get_upgrade_amount_kobo(
            current_tier=attendee_detail.ticket_type,
            new_tier=payload.ticket_type,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    upgrade_reference = utils.generate_upgrade_reference(
        registrant.reference_number
    )
    callback_url = f"{settings.frontend_url}/register/payment-callback"

    try:
        transaction = initialize_transaction(
            email=registrant.email,
            amount_kobo=diff_amount_kobo,
            reference=upgrade_reference,
            callback_url=callback_url,
        )
    except PaystackError as e:
        raise HTTPException(
            status_code=502,
            detail=f"Could not start upgrade payment: {e}",
        )

    # Nothing about the ticket changes yet — only once payment is verified.
    attendee_detail.pending_upgrade_ticket_type = payload.ticket_type
    attendee_detail.pending_upgrade_reference = transaction["reference"]
    db.commit()

    diff_amount_naira = diff_amount_kobo // 100

    send_email(
        to=[registrant.email],
        subject="Complete Your Afriqa Creative Showcase Ticket Upgrade",
        html=f"""
        <p>Hi {registrant.full_name},</p>
        <p>You're upgrading your ticket (reference <strong>{registrant.reference_number}</strong>)
        from <strong>{attendee_detail.ticket_type.value}</strong> to
        <strong>{payload.ticket_type.value}</strong>.</p>
        <p>Complete payment of ₦{diff_amount_naira:,} to finish the upgrade:</p>
        <p><a href="{transaction['authorization_url']}">Complete Payment</a></p>
        <p>Your ticket will update automatically once payment is received.</p>
        """,
    )

    return schemas.UpgradeResponse(
        reference_number=registrant.reference_number,
        ticket_type=attendee_detail.ticket_type.value,  # unchanged until payment confirms
        message=(
            f"Complete payment of ₦{diff_amount_naira:,} to finish "
            f"upgrading to {payload.ticket_type.value}."
        ),
        amount_kobo=diff_amount_kobo,
        paystack_authorization_url=transaction["authorization_url"],
    )
