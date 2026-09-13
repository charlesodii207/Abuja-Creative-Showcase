from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app import models, schemas, utils
from app.emailer import send_email
from app.paystack import initialize_transaction, PaystackError

router = APIRouter(prefix="/register/exhibitor", tags=["exhibitor"])


@router.post("", response_model=schemas.RegistrationResponse)
def register_exhibitor(payload: schemas.ExhibitorRegistrationRequest, db: Session = Depends(get_db)):
    reference_number = utils.generate_reference_number(db)
    amount_kobo = utils.get_exhibitor_amount_kobo(
        payload.exhibit_type, payload.booth_size, payload.auction_quantity
    )

    registrant = models.Registrant(
        full_name=payload.full_name,
        email=payload.email,
        phone=payload.phone,
        category=models.RegistrantCategory.exhibitor,
        reference_number=reference_number,
        status=models.RegistrantStatus.awaiting_payment,
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
        exhibit_type=payload.exhibit_type,
        booth_size=payload.booth_size,
        auction_item_description=payload.auction_item_description,
        auction_quantity=payload.auction_quantity,
        amount_kobo=amount_kobo,
    )
    db.add(exhibitor_detail)

    callback_url = f"{settings.frontend_url}/register/payment-callback"

    try:
        transaction = initialize_transaction(
            email=payload.email,
            amount_kobo=amount_kobo,
            reference=reference_number,
            callback_url=callback_url,
        )
    except PaystackError as e:
        db.rollback()
        raise HTTPException(status_code=502, detail=f"Could not start payment: {e}")

    exhibitor_detail.paystack_reference = transaction["reference"]
    db.commit()

    amount_naira = amount_kobo // 100
    send_email(
        to=payload.email,
        subject="Complete Your Abuja Creative Showcase Exhibitor Registration",
        html=f"""
        <p>Hi {payload.full_name},</p>
        <p>Thanks for registering to exhibit at the Abuja Creative Showcase!</p>
        <p>Your reference number is: <strong>{reference_number}</strong></p>
        <p>To confirm your spot, complete payment of ₦{amount_naira:,} using the link below:</p>
        <p><a href="{transaction['authorization_url']}">Complete Payment</a></p>
        <p>Your registration is confirmed as soon as payment is received.</p>
        """,
    )

    return schemas.RegistrationResponse(
        reference_number=reference_number,
        message="Registration successful — complete payment to confirm your spot.",
        amount_kobo=amount_kobo,
        paystack_authorization_url=transaction["authorization_url"],
    )