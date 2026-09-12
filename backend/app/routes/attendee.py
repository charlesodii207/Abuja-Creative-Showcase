from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas, utils
from app.emailer import send_email
from app.paystack import initialize_transaction, PaystackError

router = APIRouter(prefix="/register/attendee", tags=["attendee"])


@router.post("", response_model=schemas.RegistrationResponse)
def register_attendee(payload: schemas.AttendeeRegistrationRequest, db: Session = Depends(get_db)):
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

    try:
        transaction = initialize_transaction(
            email=payload.email,
            amount_kobo=amount_kobo,
            reference=reference_number,
        )
    except PaystackError as e:
        db.rollback()
        raise HTTPException(status_code=502, detail=f"Could not start payment: {e}")

    attendee_detail.paystack_reference = transaction["reference"]
    db.commit()

    amount_naira = amount_kobo // 100
    send_email(
        to=payload.email,
        subject="Complete Your Abuja Creative Showcase Registration",
        html=f"""
        <p>Hi {payload.full_name},</p>
        <p>Thanks for registering for the Abuja Creative Showcase!</p>
        <p>Your reference number is: <strong>{reference_number}</strong></p>
        <p>To confirm your {payload.ticket_type.value.title()} ticket, complete payment of
        ₦{amount_naira:,} using the link below:</p>
        <p><a href="{transaction['authorization_url']}">Complete Payment</a></p>
        <p>Your ticket is confirmed as soon as payment is received.</p>
        """,
    )

    return schemas.RegistrationResponse(
        reference_number=reference_number,
        message="Registration successful — complete payment to confirm your ticket.",
        amount_kobo=amount_kobo,
        paystack_authorization_url=transaction["authorization_url"],
    )