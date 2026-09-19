from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas, utils
from app.emailer import send_application_received_email

router = APIRouter(prefix="/register/press", tags=["press"])


@router.post("", response_model=schemas.RegistrationResponse)
def register_press(
    payload: schemas.PressRegistrationRequest,
    db: Session = Depends(get_db),
):
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

    send_application_received_email(
        to=payload.email,
        full_name=payload.full_name,
        reference_number=reference_number,
        application_type="Press",
    )

    return schemas.RegistrationResponse(
        reference_number=reference_number,
        message="Application received — our team will be in touch to finalize details.",
    )