from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas, utils
from app.paystack import verify_transaction, PaystackError

router = APIRouter(prefix="/payments", tags=["payments"])


def _get_paid_detail(registrant: models.Registrant):
    """Returns the category-specific detail row for a registrant that
    actually goes through payment (Attendee, Exhibitor, Pitcher). Returns
    None for categories that don't (Press, Investor)."""
    if registrant.category == models.RegistrantCategory.attendee:
        return registrant.attendee_detail
    if registrant.category == models.RegistrantCategory.exhibitor:
        return registrant.exhibitor_detail
    if registrant.category == models.RegistrantCategory.pitcher:
        return registrant.pitcher_detail
    return None


def _verify_with_paystack(reference: str):
    try:
        transaction = verify_transaction(reference)
    except PaystackError as e:
        raise HTTPException(status_code=502, detail=f"Could not verify payment: {e}")

    if transaction.get("status") != "success":
        return None, transaction
    return transaction, transaction


@router.post("/verify", response_model=schemas.PaystackVerifyResponse)
def verify_payment(payload: schemas.PaystackVerifyRequest, db: Session = Depends(get_db)):
    reference = payload.reference_number

    # --- Case 1: this reference belongs to an in-progress ticket upgrade ---
    upgrade_detail = db.query(models.AttendeeDetail).filter(
        models.AttendeeDetail.pending_upgrade_reference == reference
    ).first()

    if upgrade_detail:
        registrant = upgrade_detail.registrant

        success_txn, txn = _verify_with_paystack(reference)
        if not success_txn:
            return schemas.PaystackVerifyResponse(
                reference_number=reference,
                status="failed",
                message="Upgrade payment was not successful.",
            )

        # Recompute the expected diff to double check, in case pricing
        # changed between initiating and verifying the upgrade.
        expected_diff = None
        try:
            expected_diff = utils.get_upgrade_amount_kobo(
                current_tier=upgrade_detail.ticket_type,
                new_tier=upgrade_detail.pending_upgrade_ticket_type,
            )
        except ValueError:
            pass

        paid_amount = txn.get("amount")
        if expected_diff is not None and paid_amount != expected_diff:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Amount mismatch: expected {expected_diff} kobo, "
                    f"Paystack reports {paid_amount} kobo. Upgrade not confirmed."
                ),
            )

        # Finalize the upgrade now that payment is confirmed
        new_tier = upgrade_detail.pending_upgrade_ticket_type
        upgrade_detail.ticket_type = new_tier
        upgrade_detail.amount_kobo = (upgrade_detail.amount_kobo or 0) + paid_amount
        upgrade_detail.pending_upgrade_ticket_type = None
        upgrade_detail.pending_upgrade_reference = None
        db.commit()

        return schemas.PaystackVerifyResponse(
            reference_number=registrant.reference_number,
            status="confirmed",
            message=f"Upgrade confirmed — ticket is now {new_tier.value}.",
        )

    # --- Case 2: normal registration payment (original ticket / booth / pitch fee) ---
    registrant = db.query(models.Registrant).filter(
        models.Registrant.reference_number == reference
    ).first()
    if not registrant:
        raise HTTPException(status_code=404, detail="Registration not found")

    if registrant.status == models.RegistrantStatus.confirmed:
        return schemas.PaystackVerifyResponse(
            reference_number=registrant.reference_number,
            status="confirmed",
            message="Payment already confirmed.",
        )

    detail = _get_paid_detail(registrant)
    if detail is None:
        raise HTTPException(
            status_code=400,
            detail=f"{registrant.category.value} registrations don't require payment.",
        )

    success_txn, txn = _verify_with_paystack(reference)
    if not success_txn:
        return schemas.PaystackVerifyResponse(
            reference_number=registrant.reference_number,
            status="failed",
            message="Payment was not successful.",
        )

    paid_amount = txn.get("amount")
    if detail.amount_kobo is not None and paid_amount != detail.amount_kobo:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Amount mismatch: expected {detail.amount_kobo} kobo, "
                f"Paystack reports {paid_amount} kobo. Payment not confirmed."
            ),
        )

    detail.is_paid = True
    registrant.status = models.RegistrantStatus.confirmed
    db.commit()

    return schemas.PaystackVerifyResponse(
        reference_number=registrant.reference_number,
        status="confirmed",
        message="Payment confirmed — registration complete.",
    )