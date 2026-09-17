from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas, utils
from app.emailer import send_email

router = APIRouter(prefix="/register/investor", tags=["investor"])


@router.post("", response_model=schemas.RegistrationResponse)
def register_investor(
    payload: schemas.InvestorRegistrationRequest,
    db: Session = Depends(get_db),
):
    reference_number = utils.generate_reference_number(db)

    registrant = models.Registrant(
        full_name=payload.full_name,
        email=payload.email,
        phone=payload.phone,
        category=models.RegistrantCategory.investor,
        reference_number=reference_number,
        status=models.RegistrantStatus.pending,
    )
    db.add(registrant)
    db.flush()

    investor_detail = models.InvestorDetail(
        registrant_id=registrant.id,
        organization_name=payload.organization_name,
        investment_interest=payload.investment_interest,
        budget_range=payload.budget_range,
        portfolio_url=payload.portfolio_url,
    )
    db.add(investor_detail)
    db.commit()

    send_email(
        to=[payload.email],
        subject="Your Africa Creative Showcase Investor Application",
        html=f"""
        <p>Hi {payload.full_name},</p>
        <p>Thank you for applying to be an Investor at the Africa Creative Showcase.</p>
        <p>Your reference number is: <strong>{reference_number}</strong></p>
        <p>We've received your application and are grateful for your interest.
        A member of our team will reach out to you soon to finalize the details.</p>
        """,
    )

    return schemas.RegistrationResponse(
        reference_number=reference_number,
        message="Application received — our team will be in touch to finalize details.",
    )