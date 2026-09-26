from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas, utils
from app.dependencies import require_role

router = APIRouter(prefix="/tickets", tags=["tickets"])

CHECKIN_ROLES = ("system_owner", "super_admin", "admin")

# Nigeria (WAT) is UTC+1 year-round — no daylight saving to account for.
WAT = timezone(timedelta(hours=1))


def _event_day_wat(moment: datetime) -> date:
    """The Nigeria-local calendar date a scan counts toward."""
    return moment.astimezone(WAT).date()


@router.post("/checkin", response_model=schemas.CheckinResponse)
def checkin_ticket(
    payload: schemas.CheckinRequest,
    db: Session = Depends(get_db),
    admin: models.Admin = Depends(require_role(*CHECKIN_ROLES)),
):
    ticket_number = payload.ticket_number.strip().upper()

    ticket = db.query(models.Ticket).filter(
        models.Ticket.ticket_number == ticket_number
    ).first()

    if not ticket:
        raise HTTPException(status_code=404, detail="No ticket found with that number.")

    registrant = ticket.registrant
    tag = utils.get_ticket_tag(registrant)

    # A ticket existing doesn't mean the registrant is still cleared for entry —
    # someone can be rejected (or otherwise fall out of good standing) after
    # their ticket was already issued. Only "confirmed" registrants get in.
    if registrant.status != models.RegistrantStatus.confirmed:
        raise HTTPException(
            status_code=403,
            detail=(
                f"{registrant.full_name}'s registration is '{registrant.status.value}', "
                "not confirmed — do not admit. Check with an organizer."
            ),
        )

    now = datetime.now(timezone.utc)
    today = _event_day_wat(now)

    # Has this ticket already had an accepted scan today (Nigeria date)?
    todays_accepted = (
        db.query(models.ScanLog)
        .filter(
            models.ScanLog.ticket_id == ticket.id,
            models.ScanLog.event_day == today,
            models.ScanLog.result == "accepted",
        )
        .order_by(models.ScanLog.scanned_at.asc())
        .first()
    )

    if todays_accepted:
        # Log the duplicate attempt too — the admin scan log should show
        # every tap at the door, not only the first one that got in.
        db.add(models.ScanLog(
            ticket_id=ticket.id,
            event_day=today,
            result="duplicate",
            scanned_at=now,
            first_entry_at=todays_accepted.scanned_at,
            checked_in_by_admin_id=admin.id,
            checked_in_by_name=admin.full_name,
        ))
        db.commit()

        entry_time_wat = todays_accepted.scanned_at.astimezone(WAT).strftime("%H:%M")

        return schemas.CheckinResponse(
            result="already_checked_in",
            full_name=registrant.full_name,
            category_tag=tag,
            checked_in_at=todays_accepted.scanned_at,
            message=f"Already arrived today at {entry_time_wat}.",
        )

    # First accepted scan of the day for this ticket.
    db.add(models.ScanLog(
        ticket_id=ticket.id,
        event_day=today,
        result="accepted",
        scanned_at=now,
        checked_in_by_admin_id=admin.id,
        checked_in_by_name=admin.full_name,
    ))

    # Kept for backward compatibility with the admin registrant detail
    # screen, which shows a single "first ever checked in" — only set
    # once, on the very first accepted scan across the whole event.
    if not ticket.checked_in:
        ticket.checked_in = True
        ticket.checked_in_at = now

    db.commit()

    return schemas.CheckinResponse(
        result="approved",
        full_name=registrant.full_name,
        category_tag=tag,
        checked_in_at=now,
        message="Approved — checked in for today.",
    )


# ---------------------------------------------------------------------------
# Admin: scan log for a given day
# ---------------------------------------------------------------------------

@router.get("/scan-log", response_model=schemas.ScanLogResponse)
def get_scan_log(
    event_day: date = Query(
        ...,
        description="Date in YYYY-MM-DD, Nigeria (WAT) calendar date.",
    ),
    db: Session = Depends(get_db),
    _admin: models.Admin = Depends(require_role(*CHECKIN_ROLES)),
):
    logs = (
        db.query(models.ScanLog)
        .filter(models.ScanLog.event_day == event_day)
        .order_by(models.ScanLog.scanned_at.asc())
        .all()
    )

    entries = []
    accepted_count = 0
    duplicate_count = 0

    for log in logs:
        ticket = log.ticket
        registrant = ticket.registrant if ticket else None

        if log.result == "accepted":
            accepted_count += 1
        else:
            duplicate_count += 1

        entries.append(schemas.ScanLogEntry(
            id=str(log.id),
            ticket_number=ticket.ticket_number if ticket else "—",
            full_name=registrant.full_name if registrant else "Unknown",
            category_tag=(
                utils.get_ticket_tag(registrant) if registrant else "—"
            ),
            result=log.result,
            scanned_at=log.scanned_at,
            checked_in_by=log.checked_in_by_name,
        ))

    return schemas.ScanLogResponse(
        event_day=event_day.isoformat(),
        total_scans=len(entries),
        accepted_count=accepted_count,
        duplicate_count=duplicate_count,
        entries=entries,
    )
