import random
import string

from sqlalchemy.orm import Session

from app import models
from app.models import ExhibitType, BoothSize, TicketType


# Characters used in generated codes. 0, 1, O and I are left out on purpose
# because people mix them up when reading or typing a code by hand
# (0 vs O, 1 vs I). That leaves 24 letters + 8 digits = 32 characters.
SAFE_CHARACTERS = "".join(
    c for c in (string.ascii_uppercase + string.digits) if c not in "01OI"
)


def generate_reference_number(db: Session, length: int = 8) -> str:
    """Generate a unique random reference number, e.g. ACS-92KT7XMD."""
    while True:
        candidate = "ACS-" + "".join(random.choices(SAFE_CHARACTERS, k=length))
        exists = db.query(models.Registrant).filter(
            models.Registrant.reference_number == candidate
        ).first()
        if not exists:
            return candidate


def generate_upgrade_reference(base_reference: str) -> str:
    """
    Generates a unique reference for an upgrade payment attempt. Paystack
    rejects reused references, so a fixed "{base}-UPG" suffix breaks the
    moment someone calls /upgrade more than once for the same ticket
    (e.g. they retry after not finishing payment the first time).
    """
    suffix = "".join(random.choices(SAFE_CHARACTERS, k=4))
    return f"{base_reference}-UPG-{suffix}"


def generate_resume_reference(base_reference: str) -> str:
    """
    Generates a unique reference for resuming an original (unpaid)
    registration payment — used when someone lost their first payment
    link and wants to try again via /register/attendee/finish. Paystack
    rejects reused references, so this mirrors generate_upgrade_reference.
    """
    suffix = "".join(random.choices(SAFE_CHARACTERS, k=4))
    return f"{base_reference}-PAY-{suffix}"


def generate_ticket_number(db: Session, length: int = 10) -> str:
    """
    Generates a unique ticket number for check-in. Deliberately plain —
    no "ACS" prefix, no dashes — so door staff can type it in by hand as
    a fallback if QR scanning fails, without fumbling over punctuation.
    Uses the same look-alike-free characters as reference numbers.
    """
    while True:
        candidate = "".join(random.choices(SAFE_CHARACTERS, k=length))
        exists = db.query(models.Ticket).filter(
            models.Ticket.ticket_number == candidate
        ).first()
        if not exists:
            return candidate


def get_ticket_tag(registrant: "models.Registrant") -> str:
    """
    Returns a short human-readable label so door staff know which
    physical tag/wristband to hand out for this ticket.

    The stored enum values are unchanged (general / vip / masterclass,
    small / big) — only the labels shown to people were renamed:
      general     -> 1-Day Pass   (₦10,000)
      vip         -> 2-Day Pass   (₦15,000)
      masterclass -> Masterclass  (₦50,000, both days)
      small       -> Normal booth (₦200,000)
      big         -> Double booth (₦300,000)
    """
    if registrant.category == models.RegistrantCategory.attendee:
        tier_display = {
            models.TicketType.general: "1-Day Pass",
            models.TicketType.vip: "2-Day Pass",
            models.TicketType.masterclass: "Masterclass",
        }
        return f"Attendee - {tier_display[registrant.attendee_detail.ticket_type]}"

    if registrant.category == models.RegistrantCategory.exhibitor:
        detail = registrant.exhibitor_detail
        if detail.exhibit_type == models.ExhibitType.booth:
            size_display = {models.BoothSize.small: "Normal", models.BoothSize.big: "Double"}
            return f"Exhibitor - Booth ({size_display[detail.booth_size]})"
        if detail.exhibit_type == models.ExhibitType.fashion_runway:
            return "Exhibitor - Fashion Runway"
        # Auction is no longer offered, but old test registrations may still have it.
        return "Exhibitor - Auction"

    if registrant.category == models.RegistrantCategory.pitcher:
        return "Pitching Participant"

    return registrant.category.value.title()


# --- Pricing ---
# All amounts are stored in kobo (Naira * 100), since that's the smallest
# unit Paystack's API expects. Keeping pricing centralized here means no
# route ever hardcodes a price itself.

BOOTH_PRICES_KOBO = {
    BoothSize.small: 200_000 * 100,   # ₦200,000 — Normal booth
    BoothSize.big: 300_000 * 100,     # ₦300,000 — Double booth (includes space to display art)
}

FASHION_RUNWAY_PRICE_KOBO = 300_000 * 100   # ₦300,000

# Retired: "Auction Your Work" is no longer offered. Kept only so any other
# module that still imports it doesn't break; get_exhibitor_amount_kobo
# below now refuses auction registrations.
AUCTION_PRICE_KOBO = 10_000 * 100

PITCHER_FEE_KOBO = 100_000 * 100      # ₦100,000

TICKET_PRICES_KOBO = {
    TicketType.general: 10_000 * 100,       # ₦10,000 — 1-Day Pass (admitted once, see tickets.py)
    TicketType.vip: 15_000 * 100,           # ₦15,000 — 2-Day Pass, both days
    TicketType.masterclass: 50_000 * 100,   # ₦50,000 — both days, includes the main masterclasses on day 2
}


def get_exhibitor_amount_kobo(
    exhibit_type: ExhibitType, booth_size: BoothSize | None, auction_quantity: int | None = None
) -> int:
    """
    Returns the amount (in kobo) an exhibitor owes: a booth (priced by
    size) or the fashion runway (flat price). The auction option has been
    removed, so auction registrations are refused.
    """
    if exhibit_type == ExhibitType.booth:
        if booth_size is None:
            raise ValueError("booth_size is required when exhibit_type is 'booth'")
        return BOOTH_PRICES_KOBO[booth_size]

    if exhibit_type == ExhibitType.fashion_runway:
        return FASHION_RUNWAY_PRICE_KOBO

    if exhibit_type == ExhibitType.auction:
        raise ValueError("The auction option is no longer available.")

    raise ValueError(f"Unknown exhibit_type: {exhibit_type}")


def get_pitcher_amount_kobo() -> int:
    """Pitching Participant fee — currently a flat rate."""
    return PITCHER_FEE_KOBO


def get_attendee_amount_kobo(ticket_type: TicketType) -> int:
    """Returns the amount (in kobo) for the selected ticket tier."""
    return TICKET_PRICES_KOBO[ticket_type]


def get_upgrade_amount_kobo(current_tier: TicketType, new_tier: TicketType) -> int:
    """
    Returns the amount (in kobo) owed to upgrade from one tier to a
    higher one — just the price difference, not the full new-tier price.
    Raises if the "upgrade" isn't actually to a higher tier.
    """
    tier_order = [TicketType.general, TicketType.vip, TicketType.masterclass]
    if tier_order.index(new_tier) <= tier_order.index(current_tier):
        raise ValueError(f"{new_tier} is not an upgrade from {current_tier}")
    return TICKET_PRICES_KOBO[new_tier] - TICKET_PRICES_KOBO[current_tier]