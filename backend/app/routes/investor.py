from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas, utils
from app.emailer import send_application_received_email

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

    send_application_received_email(
        to=payload.email,
        full_name=payload.full_name,
        reference_number=reference_number,
        application_type="Investor",
    )

    return schemas.RegistrationResponse(
        reference_number=reference_number,
        message="Application received — our team will be in touch to finalize details.",
    )