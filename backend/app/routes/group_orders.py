"""
Group (bulk) ticket orders.

One buyer pays once on Kora. When the payment is confirmed, one real ticket
(Registrant + AttendeeDetail + Ticket) is created per seat, so the gate
scanner, scan log and 1-Day Pass rule work for every ticket unchanged.

Put this file at: backend/app/routes/group_orders.py
Needs `pypdf` in requirements.txt.
"""

import base64
import io
import random
import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, EmailStr
from pypdf import PdfReader, PdfWriter
from sqlalchemy.orm import Session

from app import models, utils, ticket_pdf
from app.config import settings
from app.database import get_db
from app.emailer import send_email, send_ticket_email, _button, _reference_card, _safe
from app.kora import initialize_transaction, verify_transaction, KoraError

router = APIRouter(prefix="/group-orders", tags=["group-orders"])

MIN_QUANTITY = 2
MAX_QUANTITY = 100
MAX_SENDS_PER_TICKET = 5
# Raw PDF bytes allowed per email (base64 adds about a third on top).
EMAIL_ATTACHMENT_LIMIT_BYTES = 20 * 1024 * 1024

TYPE_LABELS = {
    models.TicketType.general: "1-Day Pass",
    models.TicketType.vip: "2-Day Pass",
    models.TicketType.masterclass: "Masterclass Pass",
}


# ---------------------------------------------------------------------------
# Request / response shapes
# ---------------------------------------------------------------------------

class GroupOrderCreate(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    ticket_type: models.TicketType
    quantity: int


class GroupOrderCreated(BaseModel):
    reference_number: str
    quantity: int
    unit_amount_kobo: int
    amount_kobo: int
    payment_url: str


class GroupVerifyRequest(BaseModel):
    reference_number: str


class SendTicketRequest(BaseModel):
    full_name: str
    email: EmailStr


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _manage_url(order: models.GroupOrder) -> str:
    return f"{settings.frontend_url.rstrip('/')}/group/manage?token={order.access_token}"


def _generate_group_reference(db: Session) -> str:
    while True:
        candidate = "GRP-" + "".join(random.choices(utils.SAFE_CHARACTERS, k=8))
        exists = db.query(models.GroupOrder).filter(
            models.GroupOrder.reference_number == candidate
        ).first()
        if not exists:
            return candidate


def _ticket_pdf_bytes(registrant: models.Registrant) -> bytes:
    label, holder = ticket_pdf.ticket_labels_for(registrant)
    return ticket_pdf.generate_ticket_pdf(
        ticket_number=registrant.ticket.ticket_number,
        full_name=registrant.full_name,
        reference_number=registrant.reference_number,
        ticket_label=label,
        holder_label=holder,
    )


def _merge_pdfs(pdfs: list[bytes]) -> bytes:
    writer = PdfWriter()
    for data in pdfs:
        for page in PdfReader(io.BytesIO(data)).pages:
            writer.add_page(page)
    out = io.BytesIO()
    writer.write(out)
    return out.getvalue()


def _paid_order_by_token(db: Session, token: str) -> models.GroupOrder:
    order = db.query(models.GroupOrder).filter(
        models.GroupOrder.access_token == token
    ).first()
    if not order or order.status != "paid":
        raise HTTPException(status_code=404, detail="Ticket order not found.")
    return order


def _group_ticket(order: models.GroupOrder, seq: int) -> models.GroupTicket:
    for gt in order.tickets:
        if gt.seq == seq:
            return gt
    raise HTTPException(status_code=404, detail="Ticket not found.")


def _pdf_response(data: bytes, filename: str) -> Response:
    return Response(
        content=data,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ---------------------------------------------------------------------------
# Emailing all tickets to the buyer
# ---------------------------------------------------------------------------

def send_all_tickets_email(order: models.GroupOrder) -> bool:
    """
    Emails the buyer one PDF with every ticket (one page each). If the PDF
    would be too big for one email, the tickets are split across several
    emails so sending never fails on size. Never raises.
    """
    try:
        registrants = [gt.registrant for gt in order.tickets]
        pdfs = [_ticket_pdf_bytes(r) for r in registrants]
        if not pdfs:
            return False

        per_email = max(1, EMAIL_ATTACHMENT_LIMIT_BYTES // max(len(pdfs[0]), 1))
        batches = [pdfs[i:i + per_email] for i in range(0, len(pdfs), per_email)]

        label = TYPE_LABELS[models.TicketType(order.ticket_type)]
        one_day_note = ""
        if order.ticket_type == models.TicketType.general.value:
            one_day_note = (
                "<p><strong>About 1-Day Passes:</strong> each pass admits one "
                "person once, on the day they choose to attend.</p>"
            )

        all_sent = True
        for idx, batch in enumerate(batches, start=1):
            multi = len(batches) > 1
            part_note = f" (part {idx} of {len(batches)})" if multi else ""
            filename = (
                f"ACS-2026-Group-Tickets-{order.reference_number}"
                f"{f'-part{idx}' if multi else ''}.pdf"
            )
            html = f"""
            <p>Hello {_safe(order.buyer_name)},</p>
            <p>
                Thank you. Your payment for <strong>{order.quantity} &times;
                {_safe(label)}</strong> is confirmed.
            </p>
            {_reference_card(order.reference_number)}
            <p>
                Your tickets are attached as one PDF{_safe(part_note)}.
                <strong>Each page is one ticket</strong> with its own ticket
                number and QR code.
            </p>
            {one_day_note}
            <p>
                You can also send each ticket straight to the person it is
                for, or download single tickets, from your ticket page:
            </p>
            {_button("Manage your tickets", _manage_url(order))}
            <p>
                Keep this email and the link private. Anyone with the link
                can send or download your tickets.
            </p>
            """
            sent = send_email(
                to=[order.email],
                subject=f"Your {order.quantity} ACS 2026 Tickets{part_note}",
                html=html,
                attachments=[{
                    "filename": filename,
                    "content": base64.b64encode(_merge_pdfs(batch)).decode("utf-8"),
                }],
            )
            all_sent = all_sent and sent
        return all_sent

    except Exception as e:
        print(f"Failed to send group tickets email for {order.reference_number}: {e}")
        return False


# ---------------------------------------------------------------------------
# Payment confirmation (used by the browser /verify call AND the webhook)
# ---------------------------------------------------------------------------

def confirm_group_order(db: Session, reference: str) -> bool:
    """
    Confirms a group payment with Kora and, if it really succeeded, creates
    all the tickets. Safe to call repeatedly or at the same moment from the
    browser and the webhook: the order row is locked, so tickets are only
    ever created once.

    Returns True if the order is paid, False if payment hasn't succeeded.
    Raises HTTPException for unknown reference, amount mismatch or Kora
    being unreachable.
    """
    order = (
        db.query(models.GroupOrder)
        .filter(models.GroupOrder.reference_number == reference)
        .with_for_update()
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Group order not found.")

    if order.status == "paid":
        db.rollback()  # release the lock
        return True

    try:
        txn = verify_transaction(reference)
    except KoraError as e:
        db.rollback()
        raise HTTPException(status_code=502, detail=f"Could not verify payment: {e}")

    if txn.get("status") != "success":
        db.rollback()
        return False

    if txn.get("amount") != order.amount_kobo:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=(
                f"Amount mismatch: expected {order.amount_kobo} kobo, "
                f"Kora reports {txn.get('amount')} kobo. Order not confirmed."
            ),
        )

    ticket_type = models.TicketType(order.ticket_type)

    for seq in range(1, order.quantity + 1):
        registrant = models.Registrant(
            full_name=f"Group ticket {seq} of {order.quantity}",
            email=order.email,
            phone=order.phone,
            category=models.RegistrantCategory.attendee,
            reference_number=utils.generate_reference_number(db),
            status=models.RegistrantStatus.confirmed,
        )
        db.add(registrant)
        db.flush()

        db.add(models.AttendeeDetail(
            registrant_id=registrant.id,
            ticket_type=ticket_type,
            is_paid=True,
            amount_kobo=order.unit_amount_kobo,
        ))

        number = utils.generate_ticket_number(db)
        db.add(models.Ticket(
            registrant_id=registrant.id,
            ticket_number=number,
            qr_code=number,
        ))

        db.add(models.GroupTicket(
            group_order_id=order.id,
            registrant_id=registrant.id,
            seq=seq,
        ))
        db.flush()

    order.status = "paid"
    order.paid_at = datetime.now(timezone.utc)
    db.commit()  # all tickets and the paid status are saved together

    db.refresh(order)
    send_all_tickets_email(order)  # a failed email never undoes the order
    return True


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get("/options")
def group_options():
    """Ticket types, prices and limits for the Buy Multiple Tickets page."""
    return {
        "min_quantity": MIN_QUANTITY,
        "max_quantity": MAX_QUANTITY,
        "types": [
            {
                "value": t.value,
                "label": TYPE_LABELS[t],
                "price_kobo": utils.get_attendee_amount_kobo(t),
            }
            for t in (models.TicketType.general, models.TicketType.vip, models.TicketType.masterclass)
        ],
    }


@router.post("", response_model=GroupOrderCreated)
def create_group_order(payload: GroupOrderCreate, db: Session = Depends(get_db)):
    name = payload.full_name.strip()
    phone = payload.phone.strip()
    if not name or not phone:
        raise HTTPException(status_code=400, detail="Name and phone are required.")

    if not (MIN_QUANTITY <= payload.quantity <= MAX_QUANTITY):
        raise HTTPException(
            status_code=400,
            detail=f"Quantity must be between {MIN_QUANTITY} and {MAX_QUANTITY}.",
        )

    unit = utils.get_attendee_amount_kobo(payload.ticket_type)
    total = unit * payload.quantity
    reference = _generate_group_reference(db)

    order = models.GroupOrder(
        reference_number=reference,
        access_token=secrets.token_urlsafe(32),
        buyer_name=name,
        email=str(payload.email),
        phone=phone,
        ticket_type=payload.ticket_type.value,
        quantity=payload.quantity,
        unit_amount_kobo=unit,
        amount_kobo=total,
        status="pending",
    )
    db.add(order)
    db.flush()

    callback_url = f"{settings.frontend_url.rstrip('/')}/group?ref={reference}"

    try:
        transaction = initialize_transaction(
            email=str(payload.email),
            amount_kobo=total,
            reference=reference,
            callback_url=callback_url,
        )
    except KoraError as e:
        db.rollback()
        raise HTTPException(status_code=502, detail=f"Could not start payment: {e}")

    db.commit()

    return GroupOrderCreated(
        reference_number=reference,
        quantity=payload.quantity,
        unit_amount_kobo=unit,
        amount_kobo=total,
        payment_url=transaction["authorization_url"],
    )


@router.post("/verify")
def verify_group_order(payload: GroupVerifyRequest, db: Session = Depends(get_db)):
    """Called by the /group page when Kora sends the buyer back."""
    reference = payload.reference_number.strip()
    paid = confirm_group_order(db, reference)

    if not paid:
        return {
            "status": "failed",
            "message": "Payment was not successful.",
            "manage_token": None,
        }

    order = db.query(models.GroupOrder).filter(
        models.GroupOrder.reference_number == reference
    ).first()

    return {
        "status": "confirmed",
        "message": "Payment confirmed. Your tickets have been emailed to you.",
        "quantity": order.quantity,
        "manage_token": order.access_token,
    }


@router.get("/manage/{token}")
def manage_group_order(token: str, db: Session = Depends(get_db)):
    order = _paid_order_by_token(db, token)
    ticket_type = models.TicketType(order.ticket_type)

    return {
        "reference_number": order.reference_number,
        "buyer_name": order.buyer_name,
        "ticket_label": TYPE_LABELS[ticket_type],
        "quantity": order.quantity,
        "max_sends_per_ticket": MAX_SENDS_PER_TICKET,
        "tickets": [
            {
                "seq": gt.seq,
                "assigned_name": gt.assigned_name,
                "assigned_email": gt.assigned_email,
                "send_count": gt.send_count,
                "sends_left": max(0, MAX_SENDS_PER_TICKET - gt.send_count),
            }
            for gt in order.tickets
        ],
    }


@router.get("/manage/{token}/pdf")
def download_all_tickets(token: str, db: Session = Depends(get_db)):
    order = _paid_order_by_token(db, token)
    pdfs = [_ticket_pdf_bytes(gt.registrant) for gt in order.tickets]
    return _pdf_response(
        _merge_pdfs(pdfs),
        f"ACS-2026-Group-Tickets-{order.reference_number}.pdf",
    )


@router.get("/manage/{token}/tickets/{seq}/pdf")
def download_one_ticket(token: str, seq: int, db: Session = Depends(get_db)):
    order = _paid_order_by_token(db, token)
    registrant = _group_ticket(order, seq).registrant
    return _pdf_response(
        _ticket_pdf_bytes(registrant),
        ticket_pdf.ticket_pdf_filename(registrant.reference_number),
    )


@router.post("/manage/{token}/tickets/{seq}/send")
def send_one_ticket(
    token: str,
    seq: int,
    payload: SendTicketRequest,
    db: Session = Depends(get_db),
):
    """Names a ticket and emails it straight to the person it's for."""
    order = _paid_order_by_token(db, token)
    gt = _group_ticket(order, seq)

    if gt.send_count >= MAX_SENDS_PER_TICKET:
        raise HTTPException(
            status_code=400,
            detail="This ticket has reached its sending limit. Contact the organisers for help.",
        )

    name = " ".join(payload.full_name.split())[:80]
    if not name:
        raise HTTPException(status_code=400, detail="Please enter the person's name.")

    registrant = gt.registrant
    registrant.full_name = name  # the name now prints on the ticket and shows at the gate
    gt.assigned_name = name
    gt.assigned_email = str(payload.email)

    pdf = _ticket_pdf_bytes(registrant)

    sent = send_ticket_email(
        to=str(payload.email),
        full_name=name,
        pdf_base64=base64.b64encode(pdf).decode("utf-8"),
        pdf_filename=ticket_pdf.ticket_pdf_filename(registrant.reference_number),
        one_day_pass=(order.ticket_type == models.TicketType.general.value),
    )

    if not sent:
        db.rollback()
        raise HTTPException(
            status_code=502,
            detail="Could not send the email. Please check the address and try again.",
        )

    gt.send_count += 1
    gt.last_sent_at = datetime.now(timezone.utc)
    db.commit()

    return {"message": f"Ticket sent to {payload.email}."}


@router.post("/manage/{token}/email-all")
def email_all_again(token: str, db: Session = Depends(get_db)):
    """Re-sends the full ticket PDF to the buyer."""
    order = _paid_order_by_token(db, token)
    if not send_all_tickets_email(order):
        raise HTTPException(status_code=502, detail="Could not send the email. Please try again.")
    return {"message": f"All tickets were sent to {order.email}."}