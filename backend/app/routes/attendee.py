from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app import models, schemas, utils
from app.emailer import send_payment_required_email
from app.kora import initialize_transaction, KoraError

router = APIRouter(prefix="/register/attendee", tags=["attendee"])

# The stored ticket types are unchanged (general / vip / masterclass); only
# the names people see changed, including in the payment email.
TICKET_LABELS = {
    models.TicketType.general: "1-Day Pass",
    models.TicketType.vip: "2-Day Pass",
    models.TicketType.masterclass: "Masterclass Pass",
}


@router.post("", response_model=schemas.RegistrationResponse)
def register_attendee(
    payload: schemas.AttendeeRegistrationRequest,
    db: Session = Depends(get_db),
):
    reference_number = utils.generate_reference_number(db)
    amount_kobo = utils.get_attendee_amount_kobo(payload.ticket_type)

    registrant = models.Registrant(
        full_name=payload.full_name,
        email=payload.email,
        phone=payload.phone,
        category=models.RegistrantCategory.attendee,
        reference_number=reference_number,
        status=models.RegistrantStatus.awaiting_payment,
    )
    db.add(registrant)
    db.flush()

    attendee_detail = models.AttendeeDetail(
        registrant_id=registrant.id,
        ticket_type=payload.ticket_type,
        amount_kobo=amount_kobo,
    )
    db.add(attendee_detail)

    callback_url = (
        f"{settings.frontend_url.rstrip('/')}/verify"
        f"?ref={reference_number}"
    )

    try:
        transaction = initialize_transaction(
            email=payload.email,
            amount_kobo=amount_kobo,
            reference=reference_number,
            callback_url=callback_url,
        )
    except KoraError as e:
        db.rollback()
        raise HTTPException(
            status_code=502,
            detail=f"Could not start payment: {e}",
        )

    # The column is still called paystack_reference; it now holds the Kora reference.
    attendee_detail.paystack_reference = transaction["reference"]
    db.commit()

    amount_naira = amount_kobo // 100

    send_payment_required_email(
        to=payload.email,
        full_name=payload.full_name,
        reference_number=reference_number,
        description=f"{TICKET_LABELS[payload.ticket_type]} ticket",
        amount_naira=amount_naira,
        payment_url=transaction["authorization_url"],
    )

    # The response field is still called paystack_authorization_url so the
    # frontend keeps working unchanged; it now holds Kora's checkout URL.
    return schemas.RegistrationResponse(
        reference_number=reference_number,
        message="Registration successful — complete payment to confirm your ticket.",
        amount_kobo=amount_kobo,
        paystack_authorization_url=transaction["authorization_url"],
    )