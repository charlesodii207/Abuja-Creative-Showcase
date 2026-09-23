from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app import models, schemas
from app.paystack import initialize_transaction, PaystackError
from app import utils

router = APIRouter(prefix="/register/attendee", tags=["attendee-status"])


@router.post("/status", response_model=schemas.AttendeeStatusResponse)
def attendee_status(payload: schemas.AttendeeStatusRequest, db: Session = Depends(get_db)):
    """
    Read-only status check — safe to call as often as needed, never
    creates a new payment attempt. Used by the "Check Status, Pay, or
    Upgrade" page to decide what to show: pay, confirmed, or rejected.

    is_paid alone isn't enough here — a registrant can have is_paid=True
    and still be status=rejected (e.g. rejected after the fact, pending
    a refund), so the actual registrant status is always checked first.
    """
    registrant = db.query(models.Registrant).filter(
        models.Registrant.reference_number == payload.reference_number,
        models.Registrant.category == models.RegistrantCategory.attendee,
    ).first()

    if not registrant or not registrant.attendee_detail:
        raise HTTPException(
            status_code=404,
            detail="No matching Attendee registration found for that reference number.",
        )

    detail = registrant.attendee_detail

    if registrant.status == models.RegistrantStatus.rejected:
        message = (
            "Your registration was not approved for this edition. "
            "If you had already paid, a refund will be processed."
            if detail.is_paid
            else "Your registration was not approved for this edition."
        )
    elif detail.is_paid:
        message = "Payment confirmed. Your ticket has been sent to your email."
    else:
        message = "Payment still pending."

    return schemas.AttendeeStatusResponse(
        reference_number=registrant.reference_number,
        full_name=registrant.full_name,
        ticket_type=detail.ticket_type.value,
        is_paid=detail.is_paid,
        status=registrant.status.value,
        message=message,
    )


@router.post("/resume-payment", response_model=schemas.ResumePaymentResponse)
def resume_payment(payload: schemas.ResumePaymentRequest, db: Session = Depends(get_db)):
    """
    Starts a fresh Paystack payment attempt for someone who registered
    but never completed (or lost) their original payment link. Only
    valid while the ticket is still unpaid and the registrant hasn't
    been rejected.
    """
    registrant = db.query(models.Registrant).filter(
        models.Registrant.reference_number == payload.reference_number,
        models.Registrant.category == models.RegistrantCategory.attendee,
    ).first()

    if not registrant or not registrant.attendee_detail:
        raise HTTPException(
            status_code=404,
            detail="No matching Attendee registration found for that reference number.",
        )

    if registrant.status == models.RegistrantStatus.rejected:
        raise HTTPException(
            status_code=400,
            detail="This registration was not approved and is not eligible for payment.",
        )

    detail = registrant.attendee_detail

    if detail.is_paid:
        raise HTTPException(
            status_code=400,
            detail="This ticket is already paid for.",
        )

    resume_reference = utils.generate_resume_reference(
        registrant.reference_number
    )

    callback_url = (
        f"{settings.frontend_url.rstrip('/')}/verify"
        f"?ref={registrant.reference_number}"
    )

    try:
        transaction = initialize_transaction(
            email=registrant.email,
            amount_kobo=detail.amount_kobo,
            reference=resume_reference,
            callback_url=callback_url,
        )
    except PaystackError as e:
        raise HTTPException(
            status_code=502,
            detail=f"Could not start payment: {e}",
        )

    detail.pending_payment_reference = transaction["reference"]
    db.commit()

    return schemas.ResumePaymentResponse(
        reference_number=registrant.reference_number,
        amount_kobo=detail.amount_kobo,
        paystack_authorization_url=transaction["authorization_url"],
        message="Complete payment to secure your slot.",
    )