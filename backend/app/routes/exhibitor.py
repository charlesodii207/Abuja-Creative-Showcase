from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas, utils
from app.emailer import send_email

router = APIRouter(prefix="/register/exhibitor", tags=["exhibitor"])


@router.post("", response_model=schemas.RegistrationResponse)
def register_exhibitor(payload: schemas.ExhibitorRegistrationRequest, db: Session = Depends(get_db)):
    reference_number = utils.generate_reference_number(db)

    registrant = models.Registrant(
        full_name=payload.full_name,
        email=payload.email,
        phone=payload.phone,
        category=models.RegistrantCategory.exhibitor,
        reference_number=reference_number,
        status=models.RegistrantStatus.pending,
    )
    db.add(registrant)
    db.flush()

    exhibitor_detail = models.ExhibitorDetail(
        registrant_id=registrant.id,
        company_name=payload.company_name,
        category=payload.category,
        what_bringing=payload.what_bringing,
        portfolio_url=payload.portfolio_url,
        goal=payload.goal,
    )
    db.add(exhibitor_detail)
    db.commit()

    send_email(
        to=payload.email,
        subject="Your Abuja Creative Showcase Application",
        html=f"""
        <p>Hi {payload.full_name},</p>
        <p>Thanks for applying to exhibit at the Abuja Creative Showcase!</p>
        <p>Your reference number is: <strong>{reference_number}</strong></p>
        <p>Your application is pending review. We'll email you once a decision is made.
        Applying does not guarantee a spot.</p>
        """,
    )

    return schemas.RegistrationResponse(
        reference_number=reference_number,
        message="Application submitted — pending review.",
    )