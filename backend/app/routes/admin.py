import csv
import io

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app import models, schemas
from app.emailer import send_email

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/registrants", response_model=list[schemas.RegistrantSummary])
def list_registrants(
    category: str | None = Query(default=None),
    status: str | None = Query(default=None),
    db: Session = Depends(get_db),
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


@router.patch("/registrants/{reference_number}/approve", response_model=schemas.AdminActionResponse)
def approve_registrant(reference_number: str, db: Session = Depends(get_db)):
    registrant = db.query(models.Registrant).filter(
        models.Registrant.reference_number == reference_number
    ).first()
    if not registrant:
        raise HTTPException(status_code=404, detail="Registrant not found.")

    registrant.status = models.RegistrantStatus.approved
    db.commit()

    is_exhibitor = registrant.category == models.RegistrantCategory.exhibitor
    next_steps = (
        "You'll need to complete payment of the exhibitor fee to secure your spot — "
        "look out for a follow-up email with payment details."
        if is_exhibitor
        else "No further action is needed on your end — we look forward to having you!"
    )

    send_email(
        to=registrant.email,
        subject="Your Abuja Creative Showcase Application — Approved!",
        html=f"""
        <p>Hi {registrant.full_name},</p>
        <p>Good news — your application (reference <strong>{registrant.reference_number}</strong>) has been approved!</p>
        <p>{next_steps}</p>
        """,
    )

    return schemas.AdminActionResponse(
        id=str(registrant.id),
        status=registrant.status.value,
        message="Registrant approved.",
    )


@router.patch("/registrants/{reference_number}/reject", response_model=schemas.AdminActionResponse)
def reject_registrant(reference_number: str, db: Session = Depends(get_db)):
    registrant = db.query(models.Registrant).filter(
        models.Registrant.reference_number == reference_number
    ).first()
    if not registrant:
        raise HTTPException(status_code=404, detail="Registrant not found.")

    registrant.status = models.RegistrantStatus.rejected
    db.commit()

    send_email(
        to=registrant.email,
        subject="Your Abuja Creative Showcase Application",
        html=f"""
        <p>Hi {registrant.full_name},</p>
        <p>Thank you for applying to the Abuja Creative Showcase (reference <strong>{registrant.reference_number}</strong>).</p>
        <p>After careful review, we're unable to offer you a spot this time. We truly appreciate your interest
        and encourage you to apply again in future editions.</p>
        """,
    )

    return schemas.AdminActionResponse(
        id=str(registrant.id),
        status=registrant.status.value,
        message="Registrant rejected.",
    )


@router.get("/stats", response_model=schemas.StatsResponse)
def get_stats(db: Session = Depends(get_db)):
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


@router.get("/export")
def export_registrants(db: Session = Depends(get_db)):
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