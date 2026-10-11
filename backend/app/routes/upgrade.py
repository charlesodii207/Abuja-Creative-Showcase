from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app import models, schemas, utils
from app.emailer import send_payment_required_email
from app.kora import initialize_transaction, KoraError
from app.routes.payments import _confirm_payment

router = APIRouter(prefix="/upgrade", tags=["upgrade"])

# The stored ticket types are unchanged (general / vip / masterclass); only
# the names people see changed, including in the payment email.
TICKET_LABELS = {
    models.TicketType.general: "1-Day Pass",
    models.TicketType.vip: "2-Day Pass",
    models.TicketType.masterclass: "Masterclass Pass",
}


@router.post("", response_model=schemas.UpgradeResponse)
def upgrade_ticket(
    payload: schemas.UpgradeRequest,
    db: Session = Depends(get_db),
):
    registrant = db.query(models.Registrant).filter(
        models.Registrant.reference_number == payload.reference_number,
        models.Registrant.category == models.RegistrantCategory.attendee,
    ).first()

    if not registrant:
        raise HTTPException(
            status_code=404,
            detail="No matching Attendee registration found for that reference number.",
        )

    attendee_detail = registrant.attendee_detail
    if not attendee_detail:
        raise HTTPException(
            status_code=404,
            detail="No ticket details found for this registrant.",
        )

    if not attendee_detail.is_paid:
        raise HTTPException(
            status_code=400,
            detail="Your original ticket must be paid for before you can upgrade.",
        )

    # A previous upgrade attempt is still unresolved (pending_upgrade_ticket_type
    # only clears once one succeeds). Rather than blindly overwrite it and
    # risk orphaning a payment that actually went through on the old link,
    # check with Kora directly first — the same check the webhook and
    # /verify already trust.
    if (
        attendee_detail.pending_upgrade_reference
        and attendee_detail.pending_upgrade_ticket_type is not None
    ):
        old_result = _confirm_payment(db, attendee_detail.pending_upgrade_reference)

        if old_result.status == "confirmed":
            raise HTTPException(
                status_code=400,
                detail=(
                    "Your previous upgrade payment already went through — "
                    f"{old_result.message} No new payment is needed. "
                    "Refresh your status page to see it reflected."
                ),
            )

        # old_result.status == "failed" (abandoned/declined/never paid) —
        # safe to let a fresh attempt below replace it. db refresh picks
        # up any changes _confirm_payment made (it made none on failure).
        db.refresh(attendee_detail)

    try:
        diff_amount_kobo = utils.get_upgrade_amount_kobo(
            current_tier=attendee_detail.ticket_type,
            new_tier=payload.ticket_type,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    upgrade_reference = utils.generate_upgrade_reference(
        registrant.reference_number
    )

    callback_url = (
        f"{settings.frontend_url.rstrip('/')}/verify"
        f"?ref={registrant.reference_number}"
    )

    try:
        transaction = initialize_transaction(
            email=registrant.email,
            amount_kobo=diff_amount_kobo,
            reference=upgrade_reference,
            callback_url=callback_url,
        )
    except KoraError as e:
        raise HTTPException(
            status_code=502,
            detail=f"Could not start upgrade payment: {e}",
        )

    # Nothing about the ticket changes yet — only once payment is verified.
    attendee_detail.pending_upgrade_ticket_type = payload.ticket_type
    attendee_detail.pending_upgrade_reference = transaction["reference"]
    db.commit()

    diff_amount_naira = diff_amount_kobo // 100

    current_label = TICKET_LABELS[attendee_detail.ticket_type]
    new_label = TICKET_LABELS[payload.ticket_type]

    send_payment_required_email(
        to=registrant.email,
        full_name=registrant.full_name,
        reference_number=registrant.reference_number,
        description=f"Ticket upgrade from {current_label} to {new_label}",
        amount_naira=diff_amount_naira,
        payment_url=transaction["authorization_url"],
    )

    # The response field is still called paystack_authorization_url so the
    # frontend keeps working unchanged; it now holds Kora's checkout URL.
    return schemas.UpgradeResponse(
        reference_number=registrant.reference_number,
        ticket_type=attendee_detail.ticket_type.value,
        message=(
            f"Complete payment of ₦{diff_amount_naira:,} to finish "
            f"upgrading to the {new_label}."
        ),
        amount_kobo=diff_amount_kobo,
        paystack_authorization_url=transaction["authorization_url"],
    )