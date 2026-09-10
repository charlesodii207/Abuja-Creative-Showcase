from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas, utils
from app.emailer import send_email

router = APIRouter(prefix="/register/attendee", tags=["attendee"])


@router.post("", response_model=schemas.RegistrationResponse)
def register_attendee(payload: schemas.AttendeeRegistrationRequest, db: Session = Depends(get_db)):
    reference_number = utils.generate_reference_number(db)

    registrant = models.Registrant(
        full_name=payload.full_name,
        email=payload.email,
        phone=payload.phone,
        category=models.RegistrantCategory.attendee,
        reference_number=reference_number,
        status=models.RegistrantStatus.confirmed,
    )
    db.add(registrant)
    db.flush()

    is_free = payload.ticket_type == models.TicketType.general_pass

    attendee_detail = models.AttendeeDetail(
        registrant_id=registrant.id,
        ticket_type=payload.ticket_type,
        wants_masterclass=payload.wants_masterclass,
        is_paid=False,
    )
    db.add(attendee_detail)
    db.commit()

    if is_free:
        html_body = f"""
        <p>Hi {payload.full_name},</p>
        <p>Thanks for registering for the Abuja Creative Showcase!</p>
        <p>Your reference number is: <strong>{reference_number}</strong></p>
        <p>Keep this safe — you'll need it to confirm your General Pass, and if you ever want to
        upgrade your ticket later.</p>
        """
    else:
        html_body = f"""
        <p>Hi {payload.full_name},</p>
        <p>Thanks for registering for the Abuja Creative Showcase!</p>
        <p>Your reference number is: <strong>{reference_number}</strong></p>
        <p>Keep this safe — you'll need it to check your status and proceed to payment.</p>
        """

    send_email(
        to=payload.email,
        subject="Your Abuja Creative Showcase Reference Number",
        html=html_body,
    )

    return schemas.RegistrationResponse(
        reference_number=reference_number,
        message="Information stored successfully! Check your email for your reference number.",
    )