from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/lookup", tags=["lookup"])


@router.post("", response_model=schemas.LookupResponse)
def lookup_registrant(payload: schemas.LookupRequest, db: Session = Depends(get_db)):
    registrant = db.query(models.Registrant).filter(
        models.Registrant.reference_number == payload.reference_number,
    ).first()

    if not registrant:
        raise HTTPException(
            status_code=404,
            detail="No matching registration found. Check your reference number.",
        )

    return schemas.LookupResponse(
        full_name=registrant.full_name,
        category=registrant.category.value,
        status=registrant.status.value,
        reference_number=registrant.reference_number,
    )