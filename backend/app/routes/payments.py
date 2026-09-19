from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app import models, schemas, utils
from app.paystack import initialize_transaction, verify_transaction, PaystackError
from app.tickets import issue_ticket_and_email

router = APIRouter(prefix="/payments", tags=["payments"])


def _get_paid_detail(registrant: models.Registrant):
    if registrant.category == models.RegistrantCategory.attendee:
        return registrant.attendee_detail

    if registrant.category == models.RegistrantCategory.exhibitor:
        return registrant.exhibitor_detail

    if registrant.category == models.RegistrantCategory.pitcher:
        return registrant.pitcher_detail

    return None


def _get_resume_detail_by_reference(
    db: Session,
    reference: str,
):
    """
    Find the paid registration detail associated with a resumed
    payment reference.

    Resumed payments are supported for attendee, exhibitor, and
    pitcher registrations.
    """

    attendee_detail = db.query(models.AttendeeDetail).filter(
        models.AttendeeDetail.pending_payment_reference == reference
    ).first()

    if attendee_detail:
        return attendee_detail

    exhibitor_detail = db.query(models.ExhibitorDetail).filter(
        models.ExhibitorDetail.pending_payment_reference == reference
    ).first()

    if exhibitor_detail:
        return exhibitor_detail

    pitcher_detail = db.query(models.PitcherDetail).filter(
        models.PitcherDetail.pending_payment_reference == reference
    ).first()

    if pitcher_detail:
        return pitcher_detail

    return None


def _verify_with_paystack(reference: str):
    try:
        transaction = verify_transaction(reference)
    except PaystackError as e:
        raise HTTPException(
            status_code=502,
            detail=f"Could not verify payment: {e}",
        )

    if transaction.get("status") != "success":
        return None, transaction

    return transaction, transaction


def _get_registration_action(
    registrant: models.Registrant,
) -> tuple[str, str, int | None]:
    """
    Determine what the frontend should show on the smart /verify page.

    Returns:
        action, message, amount_kobo
    """

    status = registrant.status

    # ---------------------------------------------------------------
    # Confirmed
    # ---------------------------------------------------------------

    if status == models.RegistrantStatus.confirmed:
        return (
            "confirmed",
            "Your registration is confirmed. Your ticket has been issued.",
            None,
        )

    # ---------------------------------------------------------------
    # Rejected
    # ---------------------------------------------------------------

    if status == models.RegistrantStatus.rejected:
        return (
            "rejected",
            "Your application was not approved for this edition.",
            None,
        )

    # ---------------------------------------------------------------
    # Payment-required categories
    # ---------------------------------------------------------------

    detail = _get_paid_detail(registrant)

    if detail is not None:
        is_paid = bool(detail.is_paid)

        if is_paid:
            return (
                "confirmed",
                "Your payment has been recorded and your registration is confirmed.",
                None,
            )

        amount_kobo = detail.amount_kobo

        if status == models.RegistrantStatus.approved:
            return (
                "payment_required",
                "Your application has been approved. Payment is required to complete your registration.",
                amount_kobo,
            )

        if status == models.RegistrantStatus.awaiting_payment:
            return (
                "payment_required",
                "Payment is still required to complete your registration.",
                amount_kobo,
            )

        return (
            "payment_required",
            "Your registration is awaiting payment.",
            amount_kobo,
        )

    # ---------------------------------------------------------------
    # Applications that don't require payment
    # ---------------------------------------------------------------

    if status == models.RegistrantStatus.approved:
        return (
            "approved",
            "Your application has been approved.",
            None,
        )

    if status == models.RegistrantStatus.pending:
        return (
            "under_review",
            "Your application is currently under review.",
            None,
        )

    if status == models.RegistrantStatus.awaiting_payment:
        return (
            "payment_required",
            "Payment is still required to complete your registration.",
            None,
        )

    return (
        "under_review",
        "Your registration is being processed. Please check again later.",
        None,
    )


@router.get(
    "/status",
    response_model=schemas.RegistrationVerifyResponse,
)
def registration_status(
    ref: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
):
    """
    Smart registration status endpoint used by:

        /verify?ref=ACS-XXXXXXX

    The frontend sends the registration reference number here and the
    backend determines the correct next step.

    This endpoint does not verify a Paystack transaction. Payment
    verification remains handled by POST /payments/verify.
    """

    reference = ref.strip()

    registrant = db.query(models.Registrant).filter(
        models.Registrant.reference_number == reference
    ).first()

    if not registrant:
        raise HTTPException(
            status_code=404,
            detail="Registration not found for that reference number.",
        )

    action, message, amount_kobo = _get_registration_action(registrant)

    ticket_number = None

    if registrant.ticket is not None:
        ticket_number = registrant.ticket.ticket_number

    return schemas.RegistrationVerifyResponse(
        reference_number=registrant.reference_number,
        full_name=registrant.full_name,
        category=registrant.category.value,
        status=registrant.status.value,
        action=action,
        message=message,
        amount_kobo=amount_kobo,
        ticket_number=ticket_number,
    )


@router.post(
    "/resume",
    response_model=schemas.ResumePaymentResponse,
)
def resume_payment(
    payload: schemas.ResumePaymentRequest,
    db: Session = Depends(get_db),
):
    """
    Start a fresh Paystack payment attempt for an unpaid registration.

    Supported paid categories:
        - attendee
        - exhibitor
        - pitcher

    The registration reference remains the user's permanent reference.
    A separate pending payment reference is generated for each Paystack
    payment attempt so Paystack never receives a reused transaction
    reference.
    """

    reference = payload.reference_number.strip()

    registrant = db.query(models.Registrant).filter(
        models.Registrant.reference_number == reference
    ).first()

    if not registrant:
        raise HTTPException(
            status_code=404,
            detail="Registration not found for that reference number.",
        )

    detail = _get_paid_detail(registrant)

    if detail is None:
        raise HTTPException(
            status_code=400,
            detail=(
                f"{registrant.category.value} registrations "
                f"don't require payment."
            ),
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

    resume_reference = utils.generate_resume_reference(
        registrant.reference_number
    )

    # Keep the permanent ACS registration reference in the callback URL
    # so the frontend can reconnect the Paystack transaction to the
    # correct registration after payment.
    callback_url = (
        f"{settings.frontend_url.rstrip('/')}/verify"
        f"?ref={reference}"
    )

    try:
        transaction = initialize_transaction(
            email=registrant.email,
            amount_kobo=detail.amount_kobo,
            reference=resume_reference,
            callback_url=callback_url,
        )
    except PaystackError as e:
        raise HTTPException(
            status_code=502,
            detail=f"Could not start payment: {e}",
        )

    detail.pending_payment_reference = transaction["reference"]

    registrant.status = models.RegistrantStatus.awaiting_payment

    db.commit()

    return schemas.ResumePaymentResponse(
        reference_number=registrant.reference_number,
        amount_kobo=detail.amount_kobo,
        paystack_authorization_url=transaction["authorization_url"],
        message="Complete payment to finish your registration.",
    )


@router.post(
    "/verify",
    response_model=schemas.PaystackVerifyResponse,
)
def verify_payment(
    payload: schemas.PaystackVerifyRequest,
    db: Session = Depends(get_db),
):
    reference = payload.reference_number

    # ------------------------------------------------------------------
    # Case 1: this reference belongs to an in-progress ticket upgrade
    # ------------------------------------------------------------------

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
                    f"Paystack reports {paid_amount} kobo. "
                    f"Upgrade not confirmed."
                ),
            )

        new_tier = upgrade_detail.pending_upgrade_ticket_type

        upgrade_detail.ticket_type = new_tier
        upgrade_detail.amount_kobo = (
            (upgrade_detail.amount_kobo or 0) + paid_amount
        )
        upgrade_detail.pending_upgrade_ticket_type = None
        upgrade_detail.pending_upgrade_reference = None

        db.commit()

        return schemas.PaystackVerifyResponse(
            reference_number=registrant.reference_number,
            status="confirmed",
            message=f"Upgrade confirmed — ticket is now {new_tier.value}.",
        )

    # ------------------------------------------------------------------
    # Case 2: this reference belongs to a resumed original payment
    # ------------------------------------------------------------------

    resume_detail = _get_resume_detail_by_reference(
        db=db,
        reference=reference,
    )

    if resume_detail:
        registrant = resume_detail.registrant

        if resume_detail.is_paid:
            return schemas.PaystackVerifyResponse(
                reference_number=registrant.reference_number,
                status="confirmed",
                message="Payment already confirmed.",
            )

        success_txn, txn = _verify_with_paystack(reference)

        if not success_txn:
            return schemas.PaystackVerifyResponse(
                reference_number=registrant.reference_number,
                status="failed",
                message="Payment was not successful.",
            )

        paid_amount = txn.get("amount")

        if (
            resume_detail.amount_kobo is not None
            and paid_amount != resume_detail.amount_kobo
        ):
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Amount mismatch: expected "
                    f"{resume_detail.amount_kobo} kobo, "
                    f"Paystack reports {paid_amount} kobo. "
                    f"Payment not confirmed."
                ),
            )

        resume_detail.is_paid = True
        resume_detail.pending_payment_reference = None

        registrant.status = models.RegistrantStatus.confirmed

        db.commit()

        issue_ticket_and_email(db, registrant)

        return schemas.PaystackVerifyResponse(
            reference_number=registrant.reference_number,
            status="confirmed",
            message="Payment confirmed — registration complete.",
        )

    # ------------------------------------------------------------------
    # Case 3: normal registration payment
    # ------------------------------------------------------------------

    registrant = db.query(models.Registrant).filter(
        models.Registrant.reference_number == reference
    ).first()

    if not registrant:
        raise HTTPException(
            status_code=404,
            detail="Registration not found",
        )

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
            detail=(
                f"{registrant.category.value} registrations "
                f"don't require payment."
            ),
        )

    if detail.is_paid:
        return schemas.PaystackVerifyResponse(
            reference_number=registrant.reference_number,
            status="confirmed",
            message="Payment already confirmed.",
        )

    success_txn, txn = _verify_with_paystack(reference)

    if not success_txn:
        return schemas.PaystackVerifyResponse(
            reference_number=registrant.reference_number,
            status="failed",
            message="Payment was not successful.",
        )

    paid_amount = txn.get("amount")

    if (
        detail.amount_kobo is not None
        and paid_amount != detail.amount_kobo
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                f"Amount mismatch: expected {detail.amount_kobo} kobo, "
                f"Paystack reports {paid_amount} kobo. "
                f"Payment not confirmed."
            ),
        )

    detail.is_paid = True
    registrant.status = models.RegistrantStatus.confirmed

    db.commit()

    issue_ticket_and_email(db, registrant)

    return schemas.PaystackVerifyResponse(
        reference_number=registrant.reference_number,
        status="confirmed",
        message="Payment confirmed — registration complete.",
    )