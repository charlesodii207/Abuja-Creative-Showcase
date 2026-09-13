import httpx

from app.config import settings

PAYSTACK_BASE_URL = "https://api.paystack.co"


class PaystackError(Exception):
    """Raised when Paystack returns an error or an unexpected response shape."""
    pass


def initialize_transaction(email: str, amount_kobo: int, reference: str, callback_url: str | None = None) -> dict:
    """
    Starts a Paystack transaction. Returns a dict with authorization_url,
    access_code, and reference — the frontend redirects the user to
    authorization_url to complete payment on Paystack's hosted page.

    amount_kobo must be in kobo (i.e. Naira amount * 100), since that's
    the smallest currency unit Paystack expects.

    callback_url, if given, is where Paystack redirects the user's browser
    after payment (success or failure), with ?reference=... appended. Point
    this at a frontend page that calls /payments/verify on load, so the
    registration is confirmed automatically rather than only when someone
    manually checks their status later.
    """
    headers = {
        "Authorization": f"Bearer {settings.paystack_secret_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "email": email,
        "amount": amount_kobo,
        "reference": reference,
    }
    if callback_url:
        payload["callback_url"] = callback_url

    response = httpx.post(
        f"{PAYSTACK_BASE_URL}/transaction/initialize",
        json=payload,
        headers=headers,
        timeout=15.0,
    )
    data = response.json()

    if not response.is_success or not data.get("status"):
        raise PaystackError(data.get("message", "Failed to initialize Paystack transaction"))

    return data["data"]  # contains authorization_url, access_code, reference


def verify_transaction(reference: str) -> dict:
    """
    Confirms whether a transaction actually succeeded. ALWAYS call this
    server-side before marking anything as paid — never trust a frontend
    redirect or query param alone as proof of payment.

    Returns the raw Paystack transaction data dict on success, including
    'status' ('success', 'failed', 'abandoned', etc.) and 'amount'.
    """
    headers = {
        "Authorization": f"Bearer {settings.paystack_secret_key}",
    }

    response = httpx.get(
        f"{PAYSTACK_BASE_URL}/transaction/verify/{reference}",
        headers=headers,
        timeout=15.0,
    )
    data = response.json()

    if not response.is_success or not data.get("status"):
        raise PaystackError(data.get("message", "Failed to verify Paystack transaction"))

    return data["data"]