from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas, utils
from app.emailer import send_email

router = APIRouter(prefix="/register/investor", tags=["investor"])


@router.post("", response_model=schemas.RegistrationResponse)
def register_investor(payload: schemas.InvestorRegistrationRequest, db: Session = Depends(get_db)):
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
        to=payload.email,
        subject="Your Abuja Creative Showcase Investor Application",
        html=f"""
        <p>Hi {payload.full_name},</p>
        <p>Thanks for applying as an Investor at the Abuja Creative Showcase!</p>
        <p>Your reference number is: <strong>{reference_number}</strong></p>
        <p>Your application is pending review. We'll email you once a decision is made.
        Applying does not guarantee access.</p>
        """,
    )

    return schemas.RegistrationResponse(
        reference_number=reference_number,
        message="Application submitted — pending review.",
    )