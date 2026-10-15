from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app import models, schemas
from app.audit import log_action
from app.config import settings
from app.database import get_db
from app.dependencies import require_permission
from app.emailer import (
    send_manual_payment_claim_alert,
    send_manual_payment_rejected_email,
)
from app.tickets import issue_ticket_and_email, resend_ticket_email


# Manual (bank transfer) payments.
#
# Public side  (/payments/manual):  the person sees our bank details and taps
#   "I've paid". That saves a pending claim and emails the ACS team.
# Admin side   (/admin/manual-payments):  an admin checks the bank account,
#   then confirms (person is marked paid and gets their ticket), rejects (the
#   person is told we couldn't find the payment) or, later, revokes a payment
#   that was confirmed by mistake.

router = APIRouter(prefix="/payments/manual", tags=["manual-payments"])
admin_router = APIRouter(prefix="/admin/manual-payments", tags=["admin-manual-payments"])

# Super admins and the system owner always pass. Regular admins need the
# "manual_payments" section, from the Payments Confirmation department or
# granted to them individually.
MANUAL_PAYMENTS_PERMISSION = "manual_payments"

VALID_STATUSES = {"pending", "confirmed", "rejected", "revoked"}

PAID_CATEGORIES = {
    models.RegistrantCategory.attendee,
    models.RegistrantCategory.exhibitor,
    models.RegistrantCategory.pitcher,
}

NOTE_MAX_LENGTH = 500


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _paid_detail(registrant: models.Registrant):
    """The attendee / exhibitor / pitcher record that holds is_paid."""
    if registrant.category == models.RegistrantCategory.attendee:
        return registrant.attendee_detail

    if registrant.category == models.RegistrantCategory.exhibitor:
        return registrant.exhibitor_detail

    if registrant.category == models.RegistrantCategory.pitcher:
        return registrant.pitcher_detail

    return None


def _get_registrant(db: Session, reference: str) -> models.Registrant:
    registrant = db.query(models.Registrant).filter(
        models.Registrant.reference_number == reference
    ).first()

    if not registrant:
        raise HTTPException(
            status_code=404,
            detail="Registration not found for that reference number.",
        )

    return registrant


def _check_can_pay(registrant: models.Registrant):
    """
    The same rules as starting a Kora payment (/payments/resume): the
    registration must need payment, not be paid or rejected already, and have
    a valid amount. Returns the detail record.
    """
    detail = _paid_detail(registrant)

    if detail is None:
        raise HTTPException(
            status_code=400,
            detail=f"{registrant.category.value} registrations don't require payment.",
        )

    if detail.is_paid:
        raise HTTPException(
            status_code=400,
            detail="This registration is already paid for.",
        )

    if detail.amount_kobo is None or detail.amount_kobo <= 0:
        raise HTTPException(
            status_code=400,
            detail="No valid payment amount is available for this registration.",
        )

    if registrant.status == models.RegistrantStatus.rejected:
        raise HTTPException(
            status_code=400,
            detail="This registration is not eligible for payment.",
        )

    if registrant.status == models.RegistrantStatus.confirmed:
        raise HTTPException(
            status_code=400,
            detail="This registration is already confirmed.",
        )

    return detail


def _bank_details() -> tuple[str, str, str]:
    bank_name = (settings.bank_name or "").strip()
    account_name = (settings.bank_account_name or "").strip()
    account_number = (settings.bank_account_number or "").strip()

    if not (bank_name and account_name and account_number):
        # Not configured yet. A clear message beats showing a blank account.
        raise HTTPException(
            status_code=503,
            detail="Bank transfer isn't available right now. Please try again later.",
        )

    return bank_name, account_name, account_number


def _pending_claim(db: Session, registrant_id) -> models.ManualPayment | None:
    return db.query(models.ManualPayment).filter(
        models.ManualPayment.registrant_id == registrant_id,
        models.ManualPayment.status == "pending",
    ).first()


def _clean_note(note: str | None) -> str | None:
    cleaned = (note or "").strip()
    return cleaned[:NOTE_MAX_LENGTH] or None


# ---------------------------------------------------------------------------
# Public: bank details
# ---------------------------------------------------------------------------

@router.get("/instructions", response_model=schemas.ManualPaymentInstructions)
def manual_payment_instructions(
    ref: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
):
    """
    Bank details and amount for someone paying by transfer. The reference
    number is the key: only a person who has it (it is emailed to them) can
    see these details alongside their amount.
    """
    registrant = _get_registrant(db, ref.strip())
    detail = _check_can_pay(registrant)
    bank_name, account_name, account_number = _bank_details()

    return schemas.ManualPaymentInstructions(
        reference_number=registrant.reference_number,
        full_name=registrant.full_name,
        category=registrant.category.value,
        amount_kobo=detail.amount_kobo,
        bank_name=bank_name,
        account_name=account_name,
        account_number=account_number,
        pending_claim=_pending_claim(db, registrant.id) is not None,
    )


# ---------------------------------------------------------------------------
# Public: "I've paid"
# ---------------------------------------------------------------------------

_ALREADY_RECEIVED = (
    "We've already received your payment notice and are checking our account."
)


@router.post("/claim", response_model=schemas.ManualPaymentClaimResponse)
def claim_manual_payment(
    payload: schemas.ManualPaymentClaimRequest,
    db: Session = Depends(get_db),
):
    registrant = _get_registrant(db, payload.reference_number.strip())
    detail = _check_can_pay(registrant)

    # Tapping the button twice must not create two claims or two emails.
    if _pending_claim(db, registrant.id):
        return schemas.ManualPaymentClaimResponse(
            reference_number=registrant.reference_number,
            status="pending",
            message=_ALREADY_RECEIVED,
        )

    claim = models.ManualPayment(
        registrant_id=registrant.id,
        amount_kobo=detail.amount_kobo,
        status="pending",
    )
    db.add(claim)

    try:
        db.commit()
    except IntegrityError:
        # Two taps landed at the same moment; the other one won.
        db.rollback()
        return schemas.ManualPaymentClaimResponse(
            reference_number=registrant.reference_number,
            status="pending",
            message=_ALREADY_RECEIVED,
        )

    # Tell the team. A failed email must not undo the claim: it is still
    # saved and shows up in the dashboard.
    try:
        send_manual_payment_claim_alert(
            full_name=registrant.full_name,
            category=registrant.category.value.title(),
            reference_number=registrant.reference_number,
            amount_naira=detail.amount_kobo // 100,
        )
    except Exception as e:
        print(f"Failed to send manual payment alert for {registrant.reference_number}: {e}")

    return schemas.ManualPaymentClaimResponse(
        reference_number=registrant.reference_number,
        status="pending",
        message="Payment notice received. We'll confirm your payment shortly.",
    )


# ---------------------------------------------------------------------------
# Admin: list
# ---------------------------------------------------------------------------

def _serialize(claim: models.ManualPayment) -> schemas.ManualPaymentSummary:
    registrant = claim.registrant

    return schemas.ManualPaymentSummary(
        id=str(claim.id),
        reference_number=registrant.reference_number,
        full_name=registrant.full_name,
        email=registrant.email,
        phone=registrant.phone,
        category=registrant.category.value,
        amount_kobo=claim.amount_kobo,
        status=claim.status,
        created_at=claim.created_at,
        reviewed_at=claim.reviewed_at,
        reviewed_by=claim.reviewed_by_name,
        note=claim.note,
    )


@admin_router.get("", response_model=list[schemas.ManualPaymentSummary])
def list_manual_payments(
    status: str | None = Query(default=None),
    limit: int = Query(default=200, ge=1, le=500),
    db: Session = Depends(get_db),
    _admin: models.Admin = Depends(require_permission(MANUAL_PAYMENTS_PERMISSION)),
):
    if status is not None and status not in VALID_STATUSES:
        raise HTTPException(
            status_code=400,
            detail="Status must be pending, confirmed, rejected or revoked.",
        )

    query = db.query(models.ManualPayment).options(
        selectinload(models.ManualPayment.registrant)
    )

    if status:
        query = query.filter(models.ManualPayment.status == status)

    # The pending queue is worked oldest first, so nobody waits longer than
    # they have to. Everything else shows the newest first.
    if status == "pending":
        query = query.order_by(models.ManualPayment.created_at.asc())
    else:
        query = query.order_by(models.ManualPayment.created_at.desc())

    return [_serialize(claim) for claim in query.limit(limit).all()]


@admin_router.get("/pending-count", response_model=schemas.ManualPaymentPendingCount)
def pending_manual_payment_count(
    db: Session = Depends(get_db),
    _admin: models.Admin = Depends(require_permission(MANUAL_PAYMENTS_PERMISSION)),
):
    count = (
        db.query(func.count(models.ManualPayment.id))
        .filter(models.ManualPayment.status == "pending")
        .scalar()
    )

    return schemas.ManualPaymentPendingCount(pending=int(count or 0))


# ---------------------------------------------------------------------------
# Admin: confirm / reject / revoke
# ---------------------------------------------------------------------------

def _get_claim(db: Session, claim_id: str) -> models.ManualPayment:
    try:
        claim_uuid = UUID(claim_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Payment claim not found.")

    # Lock the row so two admins (or a double click) can't handle it twice.
    claim = db.get(models.ManualPayment, claim_uuid, with_for_update=True)

    if not claim:
        raise HTTPException(status_code=404, detail="Payment claim not found.")

    return claim


def _mark_reviewed(claim: models.ManualPayment, admin: models.Admin, status: str) -> None:
    claim.status = status
    claim.reviewed_at = datetime.now(timezone.utc)
    claim.reviewed_by_admin_id = admin.id
    claim.reviewed_by_name = admin.full_name


@admin_router.post("/{claim_id}/confirm", response_model=schemas.AdminActionResponse)
def confirm_manual_payment(
    claim_id: str,
    db: Session = Depends(get_db),
    admin: models.Admin = Depends(require_permission(MANUAL_PAYMENTS_PERMISSION)),
):
    """
    The admin has seen the money in the bank account. Mark the person paid
    and send their ticket, exactly like a confirmed Kora payment.
    """
    claim = _get_claim(db, claim_id)

    if claim.status != "pending":
        raise HTTPException(
            status_code=400,
            detail=f"This payment was already handled (it is {claim.status}).",
        )

    registrant = claim.registrant

    if registrant.category not in PAID_CATEGORIES:
        raise HTTPException(
            status_code=400,
            detail=f"{registrant.category.value} registrations don't require payment.",
        )

    if registrant.status == models.RegistrantStatus.rejected:
        raise HTTPException(
            status_code=400,
            detail=(
                "This registration was rejected, so it can't be confirmed. "
                "Review the registration first."
            ),
        )

    detail = _paid_detail(registrant)

    if detail is None:
        raise HTTPException(status_code=404, detail="Registrant detail record not found.")

    if detail.is_paid:
        raise HTTPException(
            status_code=400,
            detail=(
                "This registration is already marked as paid (for example "
                "through Kora). If this is a duplicate payment, reject this "
                "claim and arrange a refund."
            ),
        )

    detail.is_paid = True
    # The Kora reference column is unique, so a manual payment records which
    # claim paid for it instead.
    detail.paystack_reference = f"MANUAL-{claim.id}"
    detail.pending_payment_reference = None
    if not detail.amount_kobo:
        detail.amount_kobo = claim.amount_kobo

    registrant.status = models.RegistrantStatus.confirmed
    _mark_reviewed(claim, admin, "confirmed")

    db.commit()

    # issue_ticket_and_email reuses an existing ticket without emailing it
    # again. That happens when someone was revoked and is now confirmed
    # again, so send them their ticket once more in that case.
    # The payment is already saved, so an email problem must not show the
    # admin an error. They can use Resend email on the Registrants page.
    try:
        if registrant.ticket is not None:
            resend_ticket_email(registrant)
        else:
            issue_ticket_and_email(db, registrant)
    except Exception as e:
        print(f"Ticket email failed after manual confirm for {registrant.reference_number}: {e}")

    log_action(
        db,
        admin,
        "confirm_manual_payment",
        target_type="registrant",
        target_reference=registrant.reference_number,
        detail=f"Bank transfer of NGN {claim.amount_kobo // 100:,} confirmed",
    )

    return schemas.AdminActionResponse(
        id=str(claim.id),
        status="confirmed",
        message=(
            f"Payment confirmed. {registrant.full_name} has been sent their "
            "ticket. If they say it didn't arrive, use Resend email on the "
            "Registrants page."
        ),
    )


@admin_router.post("/{claim_id}/reject", response_model=schemas.AdminActionResponse)
def reject_manual_payment(
    claim_id: str,
    payload: schemas.ManualPaymentNoteRequest | None = None,
    db: Session = Depends(get_db),
    admin: models.Admin = Depends(require_permission(MANUAL_PAYMENTS_PERMISSION)),
):
    """No matching payment was found. The person is emailed and can try again."""
    claim = _get_claim(db, claim_id)

    if claim.status != "pending":
        raise HTTPException(
            status_code=400,
            detail=f"This payment was already handled (it is {claim.status}).",
        )

    registrant = claim.registrant
    note = _clean_note(payload.note if payload else None)

    claim.note = note
    _mark_reviewed(claim, admin, "rejected")

    db.commit()

    try:
        send_manual_payment_rejected_email(
            to=registrant.email,
            full_name=registrant.full_name,
            reference_number=registrant.reference_number,
            note=note,
        )
    except Exception as e:
        print(f"Rejection email failed for {registrant.reference_number}: {e}")

    log_action(
        db,
        admin,
        "reject_manual_payment",
        target_type="registrant",
        target_reference=registrant.reference_number,
        detail=note or "No matching bank transfer found",
    )

    return schemas.AdminActionResponse(
        id=str(claim.id),
        status="rejected",
        message=f"Claim rejected. {registrant.full_name} has been emailed.",
    )


@admin_router.post("/{claim_id}/revoke", response_model=schemas.AdminActionResponse)
def revoke_manual_payment(
    claim_id: str,
    payload: schemas.ManualPaymentNoteRequest | None = None,
    db: Session = Depends(get_db),
    admin: models.Admin = Depends(require_permission(MANUAL_PAYMENTS_PERMISSION)),
):
    """
    Undo a confirmation that was made by mistake. The person goes back to
    unpaid, and the door scanner refuses them (check-in only admits approved
    or confirmed registrants). The ticket record is kept so scan history is
    not lost. Refunds and contacting the person are done by the team.
    """
    claim = _get_claim(db, claim_id)

    if claim.status != "confirmed":
        raise HTTPException(
            status_code=400,
            detail="Only a confirmed payment can be revoked.",
        )

    registrant = claim.registrant
    detail = _paid_detail(registrant)

    if detail is None:
        raise HTTPException(status_code=404, detail="Registrant detail record not found.")

    note = _clean_note(payload.note if payload else None)

    detail.is_paid = False
    detail.paystack_reference = None
    registrant.status = models.RegistrantStatus.awaiting_payment

    claim.note = note
    _mark_reviewed(claim, admin, "revoked")

    db.commit()

    log_action(
        db,
        admin,
        "revoke_manual_payment",
        target_type="registrant",
        target_reference=registrant.reference_number,
        detail=f"Confirmation revoked. Refund due. {note}" if note else "Confirmation revoked. Refund due.",
    )

    return schemas.AdminActionResponse(
        id=str(claim.id),
        status="revoked",
        message=(
            f"Payment revoked. {registrant.full_name}'s ticket no longer works "
            "at the door. Remember to refund them and let them know."
        ),
    )