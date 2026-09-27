import hashlib
import hmac
import json

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app import models, schemas, utils
from app.paystack import initialize_transaction, verify_transaction, PaystackError
from app.tickets import issue_ticket_and_email, send_upgraded_ticket_email

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


def _get_completed_payment_detail_by_reference(
    db: Session,
    reference: str,
):
    """
    Only return a completed payment when the registration is actually paid.

    A Paystack reference may already be stored before verification is
    completed, so paystack_reference alone must never be treated as proof
    that payment succeeded.
    """

    attendee_detail = db.query(models.AttendeeDetail).filter(
        models.AttendeeDetail.paystack_reference == reference,
        models.AttendeeDetail.is_paid.is_(True),
    ).first()

    if attendee_detail:
        return attendee_detail

    exhibitor_detail = db.query(models.ExhibitorDetail).filter(
        models.ExhibitorDetail.paystack_reference == reference,
        models.ExhibitorDetail.is_paid.is_(True),
    ).first()

    if exhibitor_detail:
        return exhibitor_detail

    pitcher_detail = db.query(models.PitcherDetail).filter(
        models.PitcherDetail.paystack_reference == reference,
        models.PitcherDetail.is_paid.is_(True),
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

    status = registrant.status

    if status == models.RegistrantStatus.confirmed:
        return (
            "confirmed",
            "Your registration is confirmed. Your ticket has been sent to your email.",
            None,
        )

    if status == models.RegistrantStatus.rejected:
        return (
            "rejected",
            "Your application was not approved for this edition.",
            None,
        )

    detail = _get_paid_detail(registrant)

    if detail is not None:
        if bool(detail.is_paid):
            return (
                "confirmed",
                "Your registration is confirmed. Your ticket has been sent to your email.",
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

    # Ticket details are intentionally NOT returned here. The ticket
    # number and QR are only ever sent to the registrant by email.
    return schemas.RegistrationVerifyResponse(
        reference_number=registrant.reference_number,
        full_name=registrant.full_name,
        category=registrant.category.value,
        status=registrant.status.value,
        action=action,
        message=message,
        amount_kobo=amount_kobo,
    )


@router.post(
    "/resume",
    response_model=schemas.ResumePaymentResponse,
)
def resume_payment(
    payload: schemas.ResumePaymentRequest,
    db: Session = Depends(get_db),
):
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
    return _confirm_payment(db, payload.reference_number.strip())


def _confirm_payment(db: Session, reference: str) -> schemas.PaystackVerifyResponse:
    """
    The actual payment-confirmation logic, factored out so both the
    /payments/verify route (called when the browser redirects back) and
    the Paystack webhook (called server-to-server, independent of the
    browser) go through the exact same three cases below. Keeping one
    implementation means the two paths can never quietly drift apart.
    """
    # ---------------------------------------------------------------
    # Case 1: ticket upgrade
    # ---------------------------------------------------------------

    upgrade_detail = db.query(models.AttendeeDetail).filter(
        models.AttendeeDetail.pending_upgrade_reference == reference
    ).first()

    if upgrade_detail:
        registrant = upgrade_detail.registrant

        # The reference is kept (not nulled) once an upgrade is applied,
        # specifically so a page refresh lands here instead of falling
        # through to a 404. pending_upgrade_ticket_type is cleared on
        # success, so its absence is what tells us "already handled".
        if upgrade_detail.pending_upgrade_ticket_type is None:
            return schemas.PaystackVerifyResponse(
                reference_number=registrant.reference_number,
                status="confirmed",
                message=f"Upgrade confirmed — ticket is now {upgrade_detail.ticket_type.value}.",
            )

        success_txn, txn = _verify_with_paystack(reference)

        if not success_txn:
            return schemas.PaystackVerifyResponse(
                reference_number=registrant.reference_number,
                status="failed",
                message="Upgrade payment was not successful.",
            )

        try:
            expected_diff = utils.get_upgrade_amount_kobo(
                current_tier=upgrade_detail.ticket_type,
                new_tier=upgrade_detail.pending_upgrade_ticket_type,
            )
        except ValueError:
            expected_diff = None

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
        # pending_upgrade_reference is deliberately left as-is (not set
        # to None) — see the early-return guard above.

        db.commit()

        # registrant.attendee_detail.ticket_type is now new_tier, so this
        # reads the new type live and sends a PDF showing it — same
        # ticket number and QR as before, per the "no new ticket ID on
        # upgrade" decision.
        send_upgraded_ticket_email(registrant)

        return schemas.PaystackVerifyResponse(
            reference_number=registrant.reference_number,
            status="confirmed",
            message=f"Upgrade confirmed — ticket is now {new_tier.value}.",
        )

    # ---------------------------------------------------------------
    # Case 2: resumed payment
    # ---------------------------------------------------------------

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
        resume_detail.paystack_reference = reference
        resume_detail.pending_payment_reference = None

        registrant.status = models.RegistrantStatus.confirmed

        db.commit()

        issue_ticket_and_email(db, registrant)

        return schemas.PaystackVerifyResponse(
            reference_number=registrant.reference_number,
            status="confirmed",
            message="Payment confirmed — registration complete.",
        )

    # ---------------------------------------------------------------
    # Case 2B: already-completed payment
    # ---------------------------------------------------------------

    completed_detail = _get_completed_payment_detail_by_reference(
        db=db,
        reference=reference,
    )

    if completed_detail:
        registrant = completed_detail.registrant

        return schemas.PaystackVerifyResponse(
            reference_number=registrant.reference_number,
            status="confirmed",
            message="Payment already confirmed.",
        )

    # ---------------------------------------------------------------
    # Case 3: normal registration payment
    # ---------------------------------------------------------------

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
    detail.paystack_reference = reference
    registrant.status = models.RegistrantStatus.confirmed

    db.commit()

    issue_ticket_and_email(db, registrant)

    return schemas.PaystackVerifyResponse(
        reference_number=registrant.reference_number,
        status="confirmed",
        message="Payment confirmed — registration complete.",
    )


# ---------------------------------------------------------------------------
# Paystack webhook
# ---------------------------------------------------------------------------
#
# Paystack calls this directly, server-to-server, the moment a payment
# succeeds — independent of whether the customer's browser ever makes it
# back to /verify. Without this, someone who pays and then closes their
# browser (or loses signal) before the redirect completes would have
# paid Paystack with no ticket ever issued on our side.
#
# This route is intentionally NOT behind admin auth — Paystack can't log
# in as an admin. It's protected instead by verifying Paystack's HMAC
# signature on the raw request body, using the same secret key already
# used to talk to Paystack's API. Only someone who has that secret key
# (i.e. actually Paystack, or us) can produce a valid signature.
#
# Paystack retries a webhook delivery if it doesn't get back a 2xx
# response, so every branch below returns 200 once the signature check
# passes — including "reference not found" or "amount mismatch" cases —
# because retrying won't fix either of those; they need a human to look,
# not another delivery attempt.

@router.post("/webhook")
async def paystack_webhook(
    request: Request,
    db: Session = Depends(get_db),
):
    raw_body = await request.body()
    signature = request.headers.get("x-paystack-signature", "")

    if not settings.paystack_secret_key:
        # Misconfiguration on our end, not Paystack's fault — a 500 here
        # is correct so it shows up loudly in logs rather than being
        # silently swallowed as "ignored".
        raise HTTPException(status_code=500, detail="Paystack secret key not configured.")

    expected_signature = hmac.new(
        settings.paystack_secret_key.encode("utf-8"),
        raw_body,
        hashlib.sha512,
    ).hexdigest()

    if not hmac.compare_digest(expected_signature, signature):
        # Deliberately vague — never confirm/deny *why* a signature is
        # wrong, that just helps an attacker iterate.
        raise HTTPException(status_code=401, detail="Invalid signature.")

    try:
        payload = json.loads(raw_body)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON body.")

    event = payload.get("event")

    if event != "charge.success":
        # Paystack sends many event types (transfer, subscription, etc.)
        # — anything that isn't a successful charge is simply acknowledged
        # and ignored, since this project doesn't use those features.
        return {"status": "ignored", "event": event}

    reference = (payload.get("data") or {}).get("reference")

    if not reference:
        return {"status": "ignored", "reason": "no reference in payload"}

    try:
        _confirm_payment(db, reference)
    except HTTPException as e:
        # Logged, not raised — a reference we don't recognise, or an
        # amount mismatch, is something for a human to check in the
        # logs, not something Paystack should keep retrying forever.
        print(f"Webhook: could not confirm reference {reference}: {e.detail}")

    return {"status": "ok"}