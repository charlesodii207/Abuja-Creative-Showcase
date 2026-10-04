# app/routes/bookings.py
#
# Accommodation bookings:
#   POST  /hotel-bookings                public  - the booking form on the website
#   GET   /admin/bookings                admin   - list
#   GET   /admin/bookings/{reference}    admin   - detail
#   PATCH /admin/bookings/{reference}/contacted
#   POST  /admin/bookings/{reference}/confirm              (needs the hotel details)
#   PATCH /admin/bookings/{reference}/cancel
#   POST  /admin/bookings/{reference}/resend-confirmation
#
# Admin routes need the "hotels" section (Hospitality & Logistics department).

import secrets
import time
from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app import models
from app.audit import log_action
from app.database import get_db
from app.dependencies import require_permission
from app.emailer import (
    BORDER,
    CREAM,
    MUTED,
    NAVY_LIGHT,
    _reference_card,
    _safe,
    send_email,
)

router = APIRouter(tags=["bookings"])

BOOKINGS_PERMISSION = "hotels"
TEAM_INBOX = "info@africacreativeshowcase.com"

# Same limits as the booking form
MAX_NIGHTS = 30
MAX_ADULTS = 20
MAX_CHILDREN = 10
MAX_ROOMS = 10

# Per-IP limit on the public form so nobody can flood the info@ inbox.
RATE_LIMIT = 5
RATE_WINDOW_SECONDS = 600
_recent_submissions: dict[str, list[float]] = {}

_REF_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # no 0/O/1/I to avoid mix-ups


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class BookingRequest(BaseModel):
    """Exactly what the website booking form sends."""
    full_name: str
    email: EmailStr
    phone: str
    check_in: date
    check_out: date
    nights: int
    adults: int
    children: int = 0
    guests: int | None = None
    rooms: int
    extra_bed_requested: bool = False
    budget_range: str
    preferred_area: str | None = None
    notes: str | None = None
    terms_accepted: bool = False
    privacy_accepted: bool = False
    hotel_sharing_consent: bool = False
    legal_version: str | int | None = None


class BookingResponse(BaseModel):
    # The form reads this key to show "Ref: ..." on the thank-you screen.
    reference: str
    message: str


class BookingSummary(BaseModel):
    id: str
    reference_number: str
    full_name: str
    email: str
    phone: str | None
    status: str
    check_in: date | None
    check_out: date | None
    nights: int | None
    rooms: int | None
    budget_range: str | None
    created_at: datetime | None


class BookingDetail(BookingSummary):
    adults: int | None
    children: int | None
    guests: int | None
    extra_bed_requested: bool
    preferred_area: str | None
    message: str | None
    terms_accepted: bool
    privacy_accepted: bool
    hotel_sharing_consent: bool
    legal_version: str | None
    hotel_name: str | None
    confirmed_check_in: date | None
    confirmed_check_out: date | None
    amount_paid_kobo: int | None
    operator_name: str | None
    confirmation_notes: str | None
    confirmed_at: datetime | None
    cancelled_by_name: str | None
    cancelled_at: datetime | None


class ConfirmBookingRequest(BaseModel):
    hotel_name: str
    check_in: date
    check_out: date
    amount_paid_kobo: int
    notes: str | None = None


class BookingActionResponse(BaseModel):
    id: str
    status: str
    message: str


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _clip(value: str | None, limit: int) -> str | None:
    if value is None:
        return None
    value = value.strip()
    return value[:limit] or None


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()[:45]
    return (request.client.host if request.client else "unknown")[:45]


def _check_rate_limit(ip: str) -> None:
    now = time.monotonic()
    hits = [t for t in _recent_submissions.get(ip, []) if now - t < RATE_WINDOW_SECONDS]

    if len(hits) >= RATE_LIMIT:
        raise HTTPException(
            status_code=429,
            detail="Too many requests. Please wait a few minutes and try again.",
        )

    hits.append(now)
    _recent_submissions[ip] = hits

    if len(_recent_submissions) > 5000:  # keep memory bounded
        for key in [k for k, v in _recent_submissions.items() if not v or now - v[-1] >= RATE_WINDOW_SECONDS]:
            _recent_submissions.pop(key, None)


def _new_reference(db: Session) -> str:
    for _ in range(10):
        ref = "BKG-" + "".join(secrets.choice(_REF_ALPHABET) for _ in range(6))
        taken = db.query(models.Booking.id).filter(
            models.Booking.reference_number == ref
        ).first()
        if not taken:
            return ref
    raise HTTPException(status_code=500, detail="Couldn't create a booking reference. Please try again.")


def _get_booking_or_404(db: Session, reference_number: str) -> models.Booking:
    booking = db.query(models.Booking).filter(
        models.Booking.reference_number == reference_number
    ).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
    return booking


def _summary(b: models.Booking) -> BookingSummary:
    return BookingSummary(
        id=str(b.id),
        reference_number=b.reference_number,
        full_name=b.full_name,
        email=b.email,
        phone=b.phone,
        status=b.status,
        check_in=b.check_in,
        check_out=b.check_out,
        nights=b.nights,
        rooms=b.rooms,
        budget_range=b.budget_range,
        created_at=b.created_at,
    )


def _detail(b: models.Booking) -> BookingDetail:
    return BookingDetail(
        **_summary(b).model_dump(),
        adults=b.adults,
        children=b.children,
        guests=b.guests,
        extra_bed_requested=bool(b.extra_bed_requested),
        preferred_area=b.preferred_area,
        message=b.message,
        terms_accepted=bool(b.terms_accepted),
        privacy_accepted=bool(b.privacy_accepted),
        hotel_sharing_consent=bool(b.hotel_sharing_consent),
        legal_version=b.legal_version,
        hotel_name=b.hotel_name,
        confirmed_check_in=b.confirmed_check_in,
        confirmed_check_out=b.confirmed_check_out,
        amount_paid_kobo=b.amount_paid_kobo,
        operator_name=b.operator_name,
        confirmation_notes=b.confirmation_notes,
        confirmed_at=b.confirmed_at,
        cancelled_by_name=b.cancelled_by_name,
        cancelled_at=b.cancelled_at,
    )


def _fmt_date(d: date | None) -> str | None:
    return d.strftime("%d %b %Y") if d else None


def _naira(kobo: int | None) -> str | None:
    return f"₦{kobo / 100:,.2f}" if kobo is not None else None


# ---------------------------------------------------------------------------
# Emails (same branded template as the registration emails)
# ---------------------------------------------------------------------------

def _details_table(rows: list[tuple[str, str | None]]) -> str:
    """Label/value rows in the dark card style used by the other emails."""
    cells = ""
    for label, value in rows:
        if not value:
            continue
        value_html = _safe(value).replace("\n", "<br>")
        cells += (
            "<tr>"
            f'<td style="padding:6px 18px 6px 0;font-family:Arial,Helvetica,sans-serif;'
            f'font-size:13px;line-height:1.5;color:{MUTED};vertical-align:top;">{_safe(label)}</td>'
            f'<td style="padding:6px 0;font-family:Arial,Helvetica,sans-serif;'
            f'font-size:14px;line-height:1.5;font-weight:600;color:{CREAM};">{value_html}</td>'
            "</tr>"
        )

    return (
        '<table width="100%" cellpadding="0" cellspacing="0" border="0" '
        f'style="margin:18px 0;background-color:{NAVY_LIGHT};border:1px solid {BORDER};" '
        f'bgcolor="{NAVY_LIGHT}"><tr><td style="padding:12px 18px;">'
        f'<table cellpadding="0" cellspacing="0" border="0">{cells}</table>'
        "</td></tr></table>"
    )


def _request_rows(b: models.Booking, for_team: bool) -> list[tuple[str, str | None]]:
    rows: list[tuple[str, str | None]] = []
    if for_team:
        rows.append(("Reference", b.reference_number))
    rows.append(("Name", b.full_name))
    if for_team:
        rows.append(("Email", b.email))
    rows += [
        ("Phone", b.phone),
        ("Check-in", _fmt_date(b.check_in)),
        ("Check-out", _fmt_date(b.check_out)),
        ("Nights", str(b.nights) if b.nights else None),
        ("Adults", str(b.adults) if b.adults else None),
        ("Children", str(b.children) if b.children else None),
        ("Rooms", str(b.rooms) if b.rooms else None),
        ("Extra bed", "A third adult may share a room" if b.extra_bed_requested else None),
        ("Budget per night", b.budget_range),
        ("Preferred area", b.preferred_area),
        ("Special requests", b.message),
    ]
    return rows


def _confirmation_rows(b: models.Booking, for_team: bool) -> list[tuple[str, str | None]]:
    rows: list[tuple[str, str | None]] = []
    if for_team:
        rows += [("Reference", b.reference_number), ("Guest", b.full_name)]
    rows += [
        ("Hotel", b.hotel_name),
        ("Check-in", _fmt_date(b.confirmed_check_in)),
        ("Check-out", _fmt_date(b.confirmed_check_out)),
        ("Amount paid", _naira(b.amount_paid_kobo)),
    ]
    if for_team:
        # The operator and internal notes go to the team only.
        rows += [
            ("Email", b.email),
            ("Phone", b.phone),
            ("Handled by", b.operator_name),
            ("Notes", b.confirmation_notes),
        ]
    return rows


def _steps(items: list[str]) -> str:
    """A short numbered list that renders in any email client."""
    rows = "".join(f'<li style="margin-bottom:8px;">{item}</li>' for item in items)
    return f'<ol style="margin:12px 0 18px;padding-left:22px;">{rows}</ol>'


def _contact_phrase(b: models.Booking) -> str:
    """How the hotel will reach the guest, using what they gave us."""
    if b.phone:
        return f"{_safe(b.phone)} or {_safe(b.email)}"
    return _safe(b.email)


def _send_received_emails(b: models.Booking) -> tuple[bool, bool]:
    team_ok = send_email(
        to=[TEAM_INBOX],
        subject=f"New booking request {b.reference_number} — {b.full_name}",
        html=(
            "<p>A new accommodation booking request has come in.</p>"
            f"{_details_table(_request_rows(b, for_team=True))}"
        ),
    )

    guest_ok = send_email(
        to=[b.email],
        subject="We received your booking request",
        html=f"""
        <p>Hi {_safe(b.full_name)},</p>

        <p>
            Thank you for your accommodation request for the Afriqa Creative
            Showcase. We've received it and our team is already on it.
        </p>

        {_reference_card(b.reference_number)}

        <p>Here is what you sent us:</p>

        {_details_table(_request_rows(b, for_team=False))}

        <p><strong>What happens next</strong></p>

        {_steps([
            "Our team reviews your request and arranges options with our partner hotels.",
            "We email you as soon as your accommodation is confirmed.",
            "The partner hotel then contacts you to confirm your reservation.",
        ])}

        <p>
            If anything needs correcting, contact us at
            {_safe(TEAM_INBOX)} and quote your reference number.
        </p>
        """,
    )

    return team_ok, guest_ok


def _send_confirmation_emails(b: models.Booking) -> tuple[bool, bool]:
    team_ok = send_email(
        to=[TEAM_INBOX],
        subject=f"Booking confirmed {b.reference_number} — {b.hotel_name}",
        html=(
            "<p>A booking has been confirmed.</p>"
            f"{_details_table(_confirmation_rows(b, for_team=True))}"
        ),
    )

    guest_ok = send_email(
        to=[b.email],
        subject=f"Your accommodation is arranged — {b.reference_number}",
        html=f"""
        <p>Hi {_safe(b.full_name)},</p>

        <p>
            Good news — your accommodation request for the Afriqa Creative
            Showcase has been confirmed with <strong>{_safe(b.hotel_name)}</strong>.
            The hotel will be in touch shortly to finalise your reservation.
        </p>

        {_reference_card(b.reference_number)}

        {_details_table(_confirmation_rows(b, for_team=False))}

        <p><strong>What happens next</strong></p>

        {_steps([
            f"The hotel will contact you shortly on {_contact_phrase(b)} to confirm your reservation. Please keep your phone nearby and check your inbox and spam folder.",
            "Have your reference number and a valid ID ready when they get in touch.",
            "Follow the hotel's instructions for check-in and anything else they need from you.",
        ])}

        <p>
            If you haven't heard from the hotel within two days, or anything
            above needs correcting, contact us at {_safe(TEAM_INBOX)} and
            quote your reference number.
        </p>

        <p>We look forward to welcoming you to the showcase in Abuja.</p>
        """,
    )

    return team_ok, guest_ok


# ---------------------------------------------------------------------------
# Public: submit the booking form
# ---------------------------------------------------------------------------

@router.post("/hotel-bookings", response_model=BookingResponse, status_code=201)
def submit_booking(
    payload: BookingRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    _check_rate_limit(_client_ip(request))

    # The consent boxes are required on the form; the server enforces them too.
    if not (payload.terms_accepted and payload.privacy_accepted):
        raise HTTPException(
            status_code=400,
            detail="Please accept the Terms and Conditions and the Privacy Policy.",
        )
    if not payload.hotel_sharing_consent:
        raise HTTPException(
            status_code=400,
            detail="We need your permission to share your details with partner hotels.",
        )

    full_name = _clip(payload.full_name, 120)
    if not full_name or len(full_name) < 2:
        raise HTTPException(status_code=400, detail="Please enter your full name.")

    phone = _clip(payload.phone, 40)
    if not phone or sum(c.isdigit() for c in phone) < 7:
        raise HTTPException(status_code=400, detail="Please enter a valid phone number.")

    budget_range = _clip(payload.budget_range, 100)
    if not budget_range:
        raise HTTPException(status_code=400, detail="Please choose a budget range.")

    if payload.check_out <= payload.check_in:
        raise HTTPException(status_code=400, detail="Check-out must be after check-in.")

    if not (
        1 <= payload.nights <= MAX_NIGHTS
        and 1 <= payload.adults <= MAX_ADULTS
        and 0 <= payload.children <= MAX_CHILDREN
        and 1 <= payload.rooms <= MAX_ROOMS
    ):
        raise HTTPException(status_code=400, detail="Please check the number of nights, guests and rooms.")

    booking = models.Booking(
        reference_number=_new_reference(db),
        full_name=full_name,
        email=str(payload.email),
        phone=phone,
        check_in=payload.check_in,
        check_out=payload.check_out,
        nights=payload.nights,
        adults=payload.adults,
        children=payload.children,
        guests=payload.guests or (payload.adults + payload.children),
        rooms=payload.rooms,
        extra_bed_requested=payload.extra_bed_requested,
        budget_range=budget_range,
        preferred_area=_clip(payload.preferred_area, 100),
        message=_clip(payload.notes, 2000),
        # Record exactly what the guest agreed to, and which version of the
        # legal pages they agreed to it under.
        terms_accepted=True,
        privacy_accepted=True,
        hotel_sharing_consent=True,
        legal_version=_clip(str(payload.legal_version), 40) if payload.legal_version is not None else None,
        status="new",
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)

    # The booking is saved first; email trouble can't lose it.
    _send_received_emails(booking)

    return BookingResponse(
        reference=booking.reference_number,
        message="Thank you. We've received your booking request and will contact you shortly.",
    )


# ---------------------------------------------------------------------------
# Admin
# ---------------------------------------------------------------------------

@router.get("/admin/bookings", response_model=list[BookingSummary])
def list_bookings(
    status: str | None = Query(default=None),
    sort: str = Query(default="recent", pattern="^(alpha|recent)$"),
    db: Session = Depends(get_db),
    _admin: models.Admin = Depends(require_permission(BOOKINGS_PERMISSION)),
):
    query = db.query(models.Booking)

    if status:
        query = query.filter(models.Booking.status == status)

    if sort == "alpha":
        query = query.order_by(models.Booking.full_name.asc())
    else:
        query = query.order_by(models.Booking.created_at.desc())

    return [_summary(b) for b in query.all()]


@router.get("/admin/bookings/{reference_number}", response_model=BookingDetail)
def get_booking(
    reference_number: str,
    db: Session = Depends(get_db),
    _admin: models.Admin = Depends(require_permission(BOOKINGS_PERMISSION)),
):
    return _detail(_get_booking_or_404(db, reference_number))


@router.patch(
    "/admin/bookings/{reference_number}/contacted",
    response_model=BookingActionResponse,
)
def mark_booking_contacted(
    reference_number: str,
    db: Session = Depends(get_db),
    admin: models.Admin = Depends(require_permission(BOOKINGS_PERMISSION)),
):
    booking = _get_booking_or_404(db, reference_number)

    if booking.status != "new":
        raise HTTPException(status_code=400, detail="Only new bookings can be marked as contacted.")

    booking.status = "contacted"
    db.commit()

    log_action(
        db, admin, "booking_contacted",
        target_type="booking",
        target_reference=booking.reference_number,
        detail=f"Guest: {booking.full_name}",
    )

    return BookingActionResponse(
        id=str(booking.id), status=booking.status, message="Marked as contacted."
    )


@router.post(
    "/admin/bookings/{reference_number}/confirm",
    response_model=BookingActionResponse,
)
def confirm_booking(
    reference_number: str,
    payload: ConfirmBookingRequest,
    db: Session = Depends(get_db),
    admin: models.Admin = Depends(require_permission(BOOKINGS_PERMISSION)),
):
    booking = _get_booking_or_404(db, reference_number)

    if booking.status == "confirmed":
        raise HTTPException(status_code=400, detail="This booking is already confirmed.")
    if booking.status == "cancelled":
        raise HTTPException(status_code=400, detail="This booking was cancelled and can't be confirmed.")

    hotel_name = _clip(payload.hotel_name, 200)
    if not hotel_name:
        raise HTTPException(status_code=400, detail="Hotel name is required.")
    if payload.check_out <= payload.check_in:
        raise HTTPException(status_code=400, detail="Check-out must be after check-in.")
    if payload.amount_paid_kobo <= 0:
        raise HTTPException(status_code=400, detail="Amount paid must be more than zero.")

    booking.hotel_name = hotel_name
    booking.confirmed_check_in = payload.check_in
    booking.confirmed_check_out = payload.check_out
    booking.amount_paid_kobo = payload.amount_paid_kobo
    booking.confirmation_notes = _clip(payload.notes, 2000)
    # The operator is whoever is signed in, never something typed in.
    booking.operator_admin_id = admin.id
    booking.operator_name = admin.full_name
    booking.confirmed_at = datetime.now(timezone.utc)
    booking.status = "confirmed"
    db.commit()

    team_ok, guest_ok = _send_confirmation_emails(booking)

    log_action(
        db, admin, "booking_confirmed",
        target_type="booking",
        target_reference=booking.reference_number,
        detail=(
            f"{hotel_name}, {_fmt_date(payload.check_in)} to {_fmt_date(payload.check_out)}, "
            f"{_naira(payload.amount_paid_kobo)}"
        ),
    )

    if team_ok and guest_ok:
        message = "Booking confirmed. Emails sent to the team and the guest."
    else:
        message = (
            "Booking confirmed, but one or more emails could not be sent. "
            "Use 'Resend confirmation' to try again."
        )

    return BookingActionResponse(id=str(booking.id), status=booking.status, message=message)


@router.post(
    "/admin/bookings/{reference_number}/resend-confirmation",
    response_model=BookingActionResponse,
)
def resend_booking_confirmation(
    reference_number: str,
    db: Session = Depends(get_db),
    admin: models.Admin = Depends(require_permission(BOOKINGS_PERMISSION)),
):
    booking = _get_booking_or_404(db, reference_number)

    if booking.status != "confirmed":
        raise HTTPException(status_code=400, detail="Only confirmed bookings have a confirmation to resend.")

    team_ok, guest_ok = _send_confirmation_emails(booking)

    if not (team_ok and guest_ok):
        raise HTTPException(status_code=502, detail="Could not send the confirmation emails. Check the server logs.")

    log_action(
        db, admin, "booking_resend_confirmation",
        target_type="booking",
        target_reference=booking.reference_number,
    )

    return BookingActionResponse(
        id=str(booking.id), status=booking.status, message="Confirmation emails resent."
    )


@router.patch(
    "/admin/bookings/{reference_number}/cancel",
    response_model=BookingActionResponse,
)
def cancel_booking(
    reference_number: str,
    db: Session = Depends(get_db),
    admin: models.Admin = Depends(require_permission(BOOKINGS_PERMISSION)),
):
    booking = _get_booking_or_404(db, reference_number)

    if booking.status == "cancelled":
        raise HTTPException(status_code=400, detail="This booking is already cancelled.")

    was_confirmed = booking.status == "confirmed"

    booking.status = "cancelled"
    booking.cancelled_by_name = admin.full_name
    booking.cancelled_at = datetime.now(timezone.utc)
    db.commit()

    log_action(
        db, admin, "booking_cancelled",
        target_type="booking",
        target_reference=booking.reference_number,
        detail="Was confirmed: check whether a refund is due" if was_confirmed else None,
    )

    return BookingActionResponse(
        id=str(booking.id),
        status=booking.status,
        message=(
            "Booking cancelled. It had been confirmed, so check whether a refund is due."
            if was_confirmed
            else "Booking cancelled."
        ),
    )