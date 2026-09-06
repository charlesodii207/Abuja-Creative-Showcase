from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas, utils
from app.emailer import send_email

router = APIRouter(prefix="/register/visitor", tags=["visitor"])


@router.post("", response_model=schemas.RegistrationResponse)
def register_visitor(payload: schemas.VisitorRegistrationRequest, db: Session = Depends(get_db)):
    reference_number = utils.generate_reference_number(db)

    registrant = models.Registrant(
        full_name=payload.full_name,
        email=payload.email,
        phone=payload.phone,
        category=models.RegistrantCategory.visitor,
        reference_number=reference_number,
        status=models.RegistrantStatus.confirmed,
    )
    db.add(registrant)
    db.flush()

    visitor_detail = models.VisitorDetail(
        registrant_id=registrant.id,
        ticket_type=payload.ticket_type,
        wants_masterclass=payload.wants_masterclass,
        is_paid=False,
    )
    db.add(visitor_detail)
    db.commit()

    send_email(
        to=payload.email,
        subject="Your Abuja Creative Showcase Reference Number",
        html=f"""
        <p>Hi {payload.full_name},</p>
        <p>Thanks for registering for the Abuja Creative Showcase!</p>
        <p>Your reference number is: <strong>{reference_number}</strong></p>
        <p>Keep this safe — you'll need it to check your status and proceed to payment.</p>
        """,
    )

    return schemas.RegistrationResponse(
        reference_number=reference_number,
        message="Information stored successfully! Check your email for your reference number.",
    )