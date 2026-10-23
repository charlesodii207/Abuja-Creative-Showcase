from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app import models, schemas, utils
from app.emailer import send_payment_required_email
from app.kora import initialize_transaction, KoraError
from app.tickets import issue_ticket_and_email

router = APIRouter(prefix="/register/attendee", tags=["attendee"])

# Ticket names live in one place (utils.TICKET_LABELS).
TICKET_LABELS = utils.TICKET_LABELS


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

    # Free ticket (General): there is nothing to pay, so skip Kora and the
    # "payment required" email. The person is confirmed straight away, marked
    # as paid (so the door scanner and the upgrade page treat it like any
    # other ticket), and their ticket is emailed immediately.
    if amount_kobo == 0:
        registrant.status = models.RegistrantStatus.confirmed
        attendee_detail.is_paid = True
        db.commit()
        db.refresh(registrant)

        issue_ticket_and_email(db, registrant)

        return schemas.RegistrationResponse(
            reference_number=reference_number,
            message="You're registered. Your free ticket has been sent to your email.",
            amount_kobo=0,
            paystack_authorization_url=None,
        )

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
        description=f"{TICKET_LABELS[payload.ticket_type]}",
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