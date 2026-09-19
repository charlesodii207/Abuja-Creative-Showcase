import base64
from io import BytesIO

import qrcode
from sqlalchemy.orm import Session

from app import models, utils
from app.emailer import send_ticket_email


def _generate_qr_base64(data: str) -> str:
    img = qrcode.make(data)
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode("utf-8")


def issue_ticket_and_email(db: Session, registrant: models.Registrant) -> models.Ticket:
    """
    Creates a Ticket for a registrant whose payment has just been
    confirmed, and emails them the ticket number + QR code as an
    attachment. Safe to call more than once for the same registrant —
    if a ticket already exists, it's reused rather than duplicated or
    re-emailed.
    """
    if registrant.ticket is not None:
        return registrant.ticket

    ticket_number = utils.generate_ticket_number(db)

    ticket = models.Ticket(
        registrant_id=registrant.id,
        ticket_number=ticket_number,
        # The QR image encodes this same string, so if scanning fails,
        # door staff can type the exact same code in manually.
        qr_code=ticket_number,
    )

    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    qr_base64 = _generate_qr_base64(ticket_number)
    tag = utils.get_ticket_tag(registrant)

    try:
        send_ticket_email(
            to=registrant.email,
            full_name=registrant.full_name,
            ticket_number=ticket_number,
            category_tag=tag,
            qr_base64=qr_base64,
        )
    except Exception as e:
        # Don't let a failed email crash the payment/verify flow.
        print(f"Failed to send ticket email to {registrant.email}: {e}")

    return ticket