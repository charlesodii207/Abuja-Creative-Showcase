import csv
import io

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app import models, schemas
from app.emailer import send_email
from app.dependencies import require_role

router = APIRouter(prefix="/admin", tags=["admin"])

VIEW_ROLES = ("system_owner", "super_admin", "admin")
ACTION_ROLES = ("system_owner", "super_admin", "admin")

PAID_CATEGORIES = {
    models.RegistrantCategory.attendee,
    models.RegistrantCategory.exhibitor,
    models.RegistrantCategory.pitcher,
}

DETAIL_RELATION_BY_CATEGORY = {
    models.RegistrantCategory.attendee: "attendee_detail",
    models.RegistrantCategory.exhibitor: "exhibitor_detail",
    models.RegistrantCategory.press: "press_detail",
    models.RegistrantCategory.pitcher: "pitcher_detail",
    models.RegistrantCategory.investor: "investor_detail",
}


def _get_registrant_or_404(db: Session, reference_number: str) -> models.Registrant:
    registrant = db.query(models.Registrant).filter(
        models.Registrant.reference_number == reference_number
    ).first()
    if not registrant:
        raise HTTPException(status_code=404, detail="Registrant not found.")
    return registrant


def _serialize_detail(registrant: models.Registrant) -> dict:
    """Pull the category-specific detail row into a plain dict, since each
    category has different columns and there's no shared base schema for them."""
    relation_name = DETAIL_RELATION_BY_CATEGORY.get(registrant.category)
    detail_obj = getattr(registrant, relation_name, None) if relation_name else None
    if not detail_obj:
        return {}

    result = {}
    for column in detail_obj.__table__.columns:
        value = getattr(detail_obj, column.name)
        if hasattr(value, "value"):  # enum columns -> plain string
            value = value.value
        if column.name in ("id", "registrant_id"):
            value = str(value) if value is not None else value
        result[column.name] = value
    return result


# ---------------------------------------------------------------------------
# Existing: list registrants
# ---------------------------------------------------------------------------

@router.get("/registrants", response_model=list[schemas.RegistrantSummary])
def list_registrants(
    category: str | None = Query(default=None),
    status: str | None = Query(default=None),
    db: Session = Depends(get_db),
    _admin: models.Admin = Depends(require_role(*VIEW_ROLES)),
):
    query = db.query(models.Registrant)

    if category:
        query = query.filter(models.Registrant.category == category)
    if status:
        query = query.filter(models.Registrant.status == status)

    registrants = query.order_by(models.Registrant.created_at.desc()).all()

    return [
        schemas.RegistrantSummary(
            id=str(r.id),
            full_name=r.full_name,
            email=r.email,
            phone=r.phone,
            category=r.category.value,
            reference_number=r.reference_number,
            status=r.status.value,
        )
        for r in registrants
    ]


# ---------------------------------------------------------------------------
# NEW: single registrant detail view
# ---------------------------------------------------------------------------

@router.get("/registrants/{reference_number}", response_model=schemas.RegistrantDetail)
def get_registrant_detail(
    reference_number: str,
    db: Session = Depends(get_db),
    _admin: models.Admin = Depends(require_role(*VIEW_ROLES)),
):
    registrant = _get_registrant_or_404(db, reference_number)

    ticket = registrant.ticket
    ticket_data = None
    if ticket:
        ticket_data = schemas.TicketInfo(
            ticket_number=ticket.ticket_number,
            checked_in=ticket.checked_in,
            checked_in_at=ticket.checked_in_at,
        )

    return schemas.RegistrantDetail(
        id=str(registrant.id),
        full_name=registrant.full_name,
        email=registrant.email,
        phone=registrant.phone,
        category=registrant.category.value,
        reference_number=registrant.reference_number,
        status=registrant.status.value,
        created_at=registrant.created_at,
        details=_serialize_detail(registrant),
        ticket=ticket_data,
    )


# ---------------------------------------------------------------------------
# NEW: edit registrant core fields
# ---------------------------------------------------------------------------

@router.patch("/registrants/{reference_number}", response_model=schemas.AdminActionResponse)
def edit_registrant(
    reference_number: str,
    payload: schemas.EditRegistrantRequest,
    db: Session = Depends(get_db),
    _admin: models.Admin = Depends(require_role(*ACTION_ROLES)),
):
    registrant = _get_registrant_or_404(db, reference_number)

    if payload.full_name is not None:
        registrant.full_name = payload.full_name
    if payload.email is not None:
        registrant.email = payload.email
    if payload.phone is not None:
        registrant.phone = payload.phone

    db.commit()

    return schemas.AdminActionResponse(
        id=str(registrant.id),
        status=registrant.status.value,
        message="Registrant details updated.",
    )


# ---------------------------------------------------------------------------
# NEW: manual mark-as-paid override
# ---------------------------------------------------------------------------

@router.patch("/registrants/{reference_number}/mark-paid", response_model=schemas.AdminActionResponse)
def mark_registrant_paid(
    reference_number: str,
    db: Session = Depends(get_db),
    _admin: models.Admin = Depends(require_role(*ACTION_ROLES)),
):
    registrant = _get_registrant_or_404(db, reference_number)

    if registrant.category not in PAID_CATEGORIES:
        raise HTTPException(
            status_code=400,
            detail=f"{registrant.category.value} registrants don't require payment.",
        )

    relation_name = DETAIL_RELATION_BY_CATEGORY[registrant.category]
    detail_obj = getattr(registrant, relation_name)
    if not detail_obj:
        raise HTTPException(status_code=404, detail="Registrant detail record not found.")

    detail_obj.is_paid = True
    registrant.status = models.RegistrantStatus.confirmed
    db.commit()

    return schemas.AdminActionResponse(
        id=str(registrant.id),
        status=registrant.status.value,
        message="Registrant marked as paid (manual override).",
    )


# ---------------------------------------------------------------------------
# NEW: manual resend email
# ---------------------------------------------------------------------------

def _approved_email_html(r: models.Registrant) -> str:
    is_exhibitor = r.category == models.RegistrantCategory.exhibitor
    next_steps = (
        "You'll need to complete payment of the exhibitor fee to secure your spot — "
        "look out for a follow-up email with payment details."
        if is_exhibitor
        else "No further action is needed on your end — we look forward to having you!"
    )
    return f"""
        <p>Hi {r.full_name},</p>
        <p>Good news — your application (reference <strong>{r.reference_number}</strong>) has been approved!</p>
        <p>{next_steps}</p>
    """


def _rejected_email_html(r: models.Registrant) -> str:
    return f"""
        <p>Hi {r.full_name},</p>
        <p>Thank you for applying to the Abuja Creative Showcase (reference <strong>{r.reference_number}</strong>).</p>
        <p>After careful review, we're unable to offer you a spot this time. We truly appreciate your interest
        and encourage you to apply again in future editions.</p>
    """


def _pending_email_html(r: models.Registrant) -> str:
    return f"""
        <p>Hi {r.full_name},</p>
        <p>Thank you for submitting your application to the Abuja Creative Showcase.</p>
        <p>Your application has been successfully received and is currently under review.</p>
        <p>Application ID: <strong>{r.reference_number}</strong></p>
        <p>We'll contact you by email once there is an update.</p>
    """


def _confirmed_email_html(r: models.Registrant) -> str:
    return f"""
        <p>Hi {r.full_name},</p>
        <p>Your payment has been confirmed for reference <strong>{r.reference_number}</strong>.</p>
        <p>We look forward to seeing you at the showcase!</p>
    """


def _awaiting_payment_email_html(r: models.Registrant) -> str:
    return f"""
        <p>Hi {r.full_name},</p>
        <p>Your registration (reference <strong>{r.reference_number}</strong>) is almost complete —
        payment is still needed to secure your spot.</p>
    """


EMAIL_TEMPLATES_BY_STATUS = {
    models.RegistrantStatus.approved: {
        "subject": "Your Abuja Creative Showcase Application — Approved!",
        "build_html": _approved_email_html,
    },
    models.RegistrantStatus.rejected: {
        "subject": "Your Abuja Creative Showcase Application",
        "build_html": _rejected_email_html,
    },
    models.RegistrantStatus.pending: {
        "subject": "Your Abuja Creative Showcase Application Has Been Received",
        "build_html": _pending_email_html,
    },
    models.RegistrantStatus.confirmed: {
        "subject": "Payment Confirmed — Abuja Creative Showcase",
        "build_html": _confirmed_email_html,
    },
    models.RegistrantStatus.awaiting_payment: {
        "subject": "Complete Your Registration — Abuja Creative Showcase",
        "build_html": _awaiting_payment_email_html,
    },
}


@router.post("/registrants/{reference_number}/resend-email", response_model=schemas.AdminActionResponse)
def resend_email(
    reference_number: str,
    db: Session = Depends(get_db),
    _admin: models.Admin = Depends(require_role(*ACTION_ROLES)),
):
    registrant = _get_registrant_or_404(db, reference_number)

    template = EMAIL_TEMPLATES_BY_STATUS.get(registrant.status)
    if not template:
        raise HTTPException(
            status_code=400,
            detail=f"No email template configured for status '{registrant.status.value}'.",
        )

    send_email(
        to=registrant.email,
        subject=template["subject"],
        html=template["build_html"](registrant),
    )

    return schemas.AdminActionResponse(
        id=str(registrant.id),
        status=registrant.status.value,
        message=f"Email resent for status '{registrant.status.value}'.",
    )


# ---------------------------------------------------------------------------
# Existing: approve / reject
# ---------------------------------------------------------------------------

@router.patch("/registrants/{reference_number}/approve", response_model=schemas.AdminActionResponse)
def approve_registrant(
    reference_number: str,
    db: Session = Depends(get_db),
    _admin: models.Admin = Depends(require_role(*ACTION_ROLES)),
):
    registrant = _get_registrant_or_404(db, reference_number)

    registrant.status = models.RegistrantStatus.approved
    db.commit()

    send_email(
        to=registrant.email,
        subject="Your Abuja Creative Showcase Application — Approved!",
        html=_approved_email_html(registrant),
    )

    return schemas.AdminActionResponse(
        id=str(registrant.id),
        status=registrant.status.value,
        message="Registrant approved.",
    )


@router.patch("/registrants/{reference_number}/reject", response_model=schemas.AdminActionResponse)
def reject_registrant(
    reference_number: str,
    db: Session = Depends(get_db),
    _admin: models.Admin = Depends(require_role(*ACTION_ROLES)),
):
    registrant = _get_registrant_or_404(db, reference_number)

    registrant.status = models.RegistrantStatus.rejected
    db.commit()

    send_email(
        to=registrant.email,
        subject="Your Abuja Creative Showcase Application",
        html=_rejected_email_html(registrant),
    )

    return schemas.AdminActionResponse(
        id=str(registrant.id),
        status=registrant.status.value,
        message="Registrant rejected.",
    )


# ---------------------------------------------------------------------------
# Existing: stats
# ---------------------------------------------------------------------------

@router.get("/stats", response_model=schemas.StatsResponse)
def get_stats(
    db: Session = Depends(get_db),
    _admin: models.Admin = Depends(require_role(*VIEW_ROLES)),
):
    total = db.query(models.Registrant).count()

    category_counts = dict(
        db.query(models.Registrant.category, func.count(models.Registrant.id))
        .group_by(models.Registrant.category)
        .all()
    )
    by_category = {k.value: v for k, v in category_counts.items()}

    status_counts = dict(
        db.query(models.Registrant.status, func.count(models.Registrant.id))
        .group_by(models.Registrant.status)
        .all()
    )
    by_status = {k.value: v for k, v in status_counts.items()}

    attendees_paid = db.query(models.AttendeeDetail).filter(models.AttendeeDetail.is_paid == True).count()
    attendees_unpaid = db.query(models.AttendeeDetail).filter(models.AttendeeDetail.is_paid == False).count()
    exhibitors_paid = db.query(models.ExhibitorDetail).filter(models.ExhibitorDetail.is_paid == True).count()
    exhibitors_unpaid = db.query(models.ExhibitorDetail).filter(models.ExhibitorDetail.is_paid == False).count()

    return schemas.StatsResponse(
        total_registrants=total,
        by_category=by_category,
        by_status=by_status,
        attendees_paid=attendees_paid,
        attendees_unpaid=attendees_unpaid,
        exhibitors_paid=exhibitors_paid,
        exhibitors_unpaid=exhibitors_unpaid,
    )


# ---------------------------------------------------------------------------
# Existing: CSV export
# ---------------------------------------------------------------------------

@router.get("/export")
def export_registrants(
    db: Session = Depends(get_db),
    _admin: models.Admin = Depends(require_role(*ACTION_ROLES)),
):
    registrants = db.query(models.Registrant).order_by(models.Registrant.created_at.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Reference Number", "Full Name", "Email", "Phone", "Category", "Status", "Created At"])

    for r in registrants:
        writer.writerow([
            r.reference_number,
            r.full_name,
            r.email,
            r.phone,
            r.category.value,
            r.status.value,
            r.created_at.isoformat() if r.created_at else "",
        ])

    output.seek(0)
    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=acs_registrants.csv"},
    )