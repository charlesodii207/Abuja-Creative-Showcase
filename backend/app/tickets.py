import base64

from sqlalchemy.orm import Session

from app import models, utils, ticket_pdf
from app.emailer import send_ticket_email, send_ticket_upgraded_email


def issue_ticket_and_email(db: Session, registrant: models.Registrant) -> models.Ticket:
    """
    Creates a Ticket for a registrant whose payment has just been
    confirmed, and emails them the PDF ticket as an attachment. Safe to
    call more than once for the same registrant — if a ticket already
    exists, it's reused rather than duplicated or re-emailed.
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

    _send_ticket_pdf_email(registrant, ticket_number)

    return ticket


def resend_ticket_email(registrant: models.Registrant) -> bool:
    """
    Re-sends the PDF ticket for a registrant who already has one, e.g.
    from the admin "resend email" action. Returns False (without
    raising) if the registrant has no ticket to resend.
    """
    if registrant.ticket is None:
        return False

    return _send_ticket_pdf_email(registrant, registrant.ticket.ticket_number)


def send_upgraded_ticket_email(registrant: models.Registrant) -> bool:
    """
    Called right after an upgrade payment is confirmed. Builds a fresh
    PDF showing the registrant's new (current) ticket type and emails
    it with upgrade-specific wording. The ticket number and QR stay the
    same as before — only the type printed on the PDF changes, because
    it's read live from the registrant's current ticket_type.
    """
    if registrant.ticket is None:
        # An upgrade should never happen before the original ticket
        # exists (the /upgrade route already requires is_paid), but
        # this guards against calling it out of order regardless.
        print(f"No ticket to upgrade for {registrant.reference_number}")
        return False

    ticket_label, holder_label = ticket_pdf.ticket_labels_for(registrant)
    ticket_number = registrant.ticket.ticket_number

    try:
        pdf_bytes = ticket_pdf.generate_ticket_pdf(
            ticket_number=ticket_number,
            full_name=registrant.full_name,
            reference_number=registrant.reference_number,
            ticket_label=ticket_label,
            holder_label=holder_label,
        )
    except Exception as e:
        print(f"Failed to build upgraded ticket PDF for {registrant.reference_number}: {e}")
        return False

    filename = ticket_pdf.ticket_pdf_filename(registrant.reference_number)
    pdf_base64 = base64.b64encode(pdf_bytes).decode("utf-8")

    sent = send_ticket_upgraded_email(
        to=registrant.email,
        full_name=registrant.full_name,
        new_tier_label=ticket_label.title(),
        pdf_base64=pdf_base64,
        pdf_filename=filename,
    )

    if not sent:
        print(f"Failed to send upgrade ticket email to {registrant.email}")

    return sent


def _send_ticket_pdf_email(registrant: models.Registrant, ticket_number: str) -> bool:
    """
    Builds the PDF for the registrant's current ticket type and emails
    it. Reads the ticket type live, so an upgraded Attendee's PDF always
    shows their current tier, even if this is a resend of an old ticket.
    """
    ticket_label, holder_label = ticket_pdf.ticket_labels_for(registrant)

    try:
        pdf_bytes = ticket_pdf.generate_ticket_pdf(
            ticket_number=ticket_number,
            full_name=registrant.full_name,
            reference_number=registrant.reference_number,
            ticket_label=ticket_label,
            holder_label=holder_label,
        )
    except Exception as e:
        # Don't let a PDF-rendering problem crash the payment/verify flow.
        print(f"Failed to build ticket PDF for {registrant.reference_number}: {e}")
        return False

    filename = ticket_pdf.ticket_pdf_filename(registrant.reference_number)
    pdf_base64 = base64.b64encode(pdf_bytes).decode("utf-8")

    sent = send_ticket_email(
        to=registrant.email,
        full_name=registrant.full_name,
        pdf_base64=pdf_base64,
        pdf_filename=filename,
    )

    if not sent:
        # Logged here (rather than raised) for the same reason as above:
        # a failed email must never break payment confirmation. The
        # admin "resend email" action is the recovery path.
        print(f"Failed to send ticket email to {registrant.email}")

    return sent