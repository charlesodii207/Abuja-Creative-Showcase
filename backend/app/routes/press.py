from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas, utils
from app.emailer import send_email

router = APIRouter(prefix="/register/press", tags=["press"])


@router.post("", response_model=schemas.RegistrationResponse)
def register_press(payload: schemas.PressRegistrationRequest, db: Session = Depends(get_db)):
    reference_number = utils.generate_reference_number(db)

    registrant = models.Registrant(
        full_name=payload.full_name,
        email=payload.email,
        phone=payload.phone,
        category=models.RegistrantCategory.press,
        reference_number=reference_number,
        status=models.RegistrantStatus.pending,
    )
    db.add(registrant)
    db.flush()

    press_detail = models.PressDetail(
        registrant_id=registrant.id,
        outlet_name=payload.outlet_name,
        proof_type=payload.proof_type,
        proof_url=payload.proof_url,
    )
    db.add(press_detail)
    db.commit()

    send_email(
        to=payload.email,
        subject="Your Abuja Creative Showcase Press Accreditation",
        html=f"""
        <p>Hi {payload.full_name},</p>
        <p>Thanks for applying for press accreditation at the Abuja Creative Showcase!</p>
        <p>Your reference number is: <strong>{reference_number}</strong></p>
        <p>Your application is pending review. We'll email you once a decision is made.
        Applying does not guarantee accreditation.</p>
        """,
    )

    return schemas.RegistrationResponse(
        reference_number=reference_number,
        message="Application submitted — pending review.",
    )