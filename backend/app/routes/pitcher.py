from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app import models, schemas, utils
from app.emailer import send_payment_required_email
from app.paystack import initialize_transaction, PaystackError

router = APIRouter(prefix="/register/pitcher", tags=["pitcher"])


@router.post("", response_model=schemas.RegistrationResponse)
def register_pitcher(
    payload: schemas.PitcherRegistrationRequest,
    db: Session = Depends(get_db),
):
    reference_number = utils.generate_reference_number(db)
    amount_kobo = utils.get_pitcher_amount_kobo()

    registrant = models.Registrant(
        full_name=payload.full_name,
        email=payload.email,
        phone=payload.phone,
        category=models.RegistrantCategory.pitcher,
        reference_number=reference_number,
        status=models.RegistrantStatus.awaiting_payment,
    )
    db.add(registrant)
    db.flush()

    pitcher_detail = models.PitcherDetail(
        registrant_id=registrant.id,
        project_name=payload.project_name,
        category=payload.category,
        pitch_summary=payload.pitch_summary,
        work_sample_url=payload.work_sample_url,
        amount_kobo=amount_kobo,
    )
    db.add(pitcher_detail)

    callback_url = (
        f"{settings.frontend_url.rstrip('/')}/verify"
        f"?ref={reference_number}"
    )

    try:
        transaction = initialize_transaction(
            email=payload.email,
            amount_kobo=amount_kobo,
            reference=reference_number,
            callback_url=callback_url,
        )
    except PaystackError as e:
        db.rollback()
        raise HTTPException(
            status_code=502,
            detail=f"Could not start payment: {e}",
        )

    pitcher_detail.paystack_reference = transaction["reference"]
    db.commit()

    amount_naira = amount_kobo // 100

    send_payment_required_email(
        to=payload.email,
        full_name=payload.full_name,
        reference_number=reference_number,
        description="Pitching registration / Deal Room spot",
        amount_naira=amount_naira,
        payment_url=transaction["authorization_url"],
    )

    return schemas.RegistrationResponse(
        reference_number=reference_number,
        message="Registration successful — complete payment to confirm your spot.",
        amount_kobo=amount_kobo,
        paystack_authorization_url=transaction["authorization_url"],
    )