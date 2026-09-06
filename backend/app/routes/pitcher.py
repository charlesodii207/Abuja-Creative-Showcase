from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas, utils
from app.emailer import send_email

router = APIRouter(prefix="/register/pitcher", tags=["pitcher"])


@router.post("", response_model=schemas.RegistrationResponse)
def register_pitcher(payload: schemas.PitcherRegistrationRequest, db: Session = Depends(get_db)):
    reference_number = utils.generate_reference_number(db)

    registrant = models.Registrant(
        full_name=payload.full_name,
        email=payload.email,
        phone=payload.phone,
        category=models.RegistrantCategory.pitcher,
        reference_number=reference_number,
        status=models.RegistrantStatus.pending,
    )
    db.add(registrant)
    db.flush()

    pitcher_detail = models.PitcherDetail(
        registrant_id=registrant.id,
        project_name=payload.project_name,
        category=payload.category,
        pitch_summary=payload.pitch_summary,
        work_sample_url=payload.work_sample_url,
    )
    db.add(pitcher_detail)
    db.commit()

    send_email(
        to=payload.email,
        subject="Your Abuja Creative Showcase Pitch Application",
        html=f"""
        <p>Hi {payload.full_name},</p>
        <p>Thanks for applying to pitch at the Abuja Creative Showcase!</p>
        <p>Your reference number is: <strong>{reference_number}</strong></p>
        <p>Your application is pending review. We'll email you once a decision is made.
        Applying does not guarantee a pitching slot.</p>
        """,
    )

    return schemas.RegistrationResponse(
        reference_number=reference_number,
        message="Application submitted — pending review.",
    )