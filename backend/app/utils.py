import random
import string

from sqlalchemy.orm import Session

from app import models
from app.models import ExhibitType, BoothSize, TicketType


def generate_reference_number(db: Session, length: int = 8) -> str:
    """Generate a unique random alphanumeric reference number."""
    characters = string.ascii_uppercase + string.digits
    while True:
        candidate = "ACS-" + "".join(random.choices(characters, k=length))
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
    characters = string.ascii_uppercase + string.digits
    suffix = "".join(random.choices(characters, k=4))
    return f"{base_reference}-UPG-{suffix}"


# --- Pricing ---
# All amounts are stored in kobo (Naira * 100), since that's the smallest
# unit Paystack's API expects. Keeping pricing centralized here means no
# route ever hardcodes a price itself.

BOOTH_PRICES_KOBO = {
    BoothSize.small: 250_000 * 100,   # ₦250,000
    BoothSize.big: 500_000 * 100,     # ₦500,000
}

AUCTION_PRICE_KOBO = 10_000 * 100     # ₦10,000 — placeholder, not yet finalized

PITCHER_FEE_KOBO = 100_000 * 100      # ₦100,000

TICKET_PRICES_KOBO = {
    TicketType.general: 5_000 * 100,       # ₦5,000
    TicketType.vip: 10_000 * 100,          # ₦10,000 — includes everything General includes
    TicketType.masterclass: 25_000 * 100,  # ₦25,000 — includes everything VIP includes
}


def get_exhibitor_amount_kobo(exhibit_type: ExhibitType, booth_size: BoothSize | None) -> int:
    """
    Returns the amount (in kobo) an exhibitor owes, based on whether
    they're buying a booth (priced by size) or auctioning an item
    (flat placeholder price).
    """
    if exhibit_type == ExhibitType.booth:
        if booth_size is None:
            raise ValueError("booth_size is required when exhibit_type is 'booth'")
        return BOOTH_PRICES_KOBO[booth_size]

    if exhibit_type == ExhibitType.auction:
        return AUCTION_PRICE_KOBO

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