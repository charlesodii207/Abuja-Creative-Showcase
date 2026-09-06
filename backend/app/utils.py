import random
import string

from sqlalchemy.orm import Session

from app import models


def generate_reference_number(db: Session, length: int = 8) -> str:
    """Generate a unique random alphanumeric reference number."""
    characters = string.ascii_uppercase + string.digits
    while True:
        candidate = "ACS-" + "".join(random.choices(characters, k=length))
        exists = db.query(models.Registrant).filter(
            models.Registrant.reference_number == candidate
        ).first()
        if not exists:
            return candidate