"""
Kora (Korapay) payments, Checkout Redirect flow.

A drop-in replacement for paystack.py: the same function names, the same
arguments and the same return keys, so the routes that call it only need
their import changed:

    from app.paystack import initialize_transaction, verify_transaction, PaystackError
        becomes
    from app.kora import initialize_transaction, verify_transaction, PaystackError

(PaystackError is kept as an alias of KoraError so no `except` has to change.)

Amounts: the rest of the app works in kobo. Kora wants naira, so the
conversion lives here only. verify_transaction() converts back and returns
the amount in kobo under "amount", like Paystack did.

Test or live mode is chosen by the key (sk_test_... / sk_live_...), not by a
different URL. Add `kora_secret_key: str = ""` to Settings in config.py and
set KORA_SECRET_KEY in .env and on your host.
"""

from __future__ import annotations

import hashlib
import hmac
import json
from urllib.parse import quote

import httpx

from app.config import settings

KORA_BASE_URL = "https://api.korapay.com/merchant/api/v1"
TIMEOUT_SECONDS = 15.0


class KoraError(Exception):
    """Raised when Kora returns an error or an unexpected response shape."""
    pass


# Same name the routes already import and catch.
PaystackError = KoraError


def _headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {settings.kora_secret_key}",
        "Content-Type": "application/json",
    }


def _naira(amount_kobo: int) -> int | float:
    """Kobo -> naira. Whole-naira amounts go out as integers (₦10,000 -> 10000)."""
    if amount_kobo % 100 == 0:
        return amount_kobo // 100
    return amount_kobo / 100


def _json(response: httpx.Response) -> dict:
    try:
        body = response.json()
    except ValueError:
        raise KoraError(f"Kora returned an unreadable response (HTTP {response.status_code}).")
    return body if isinstance(body, dict) else {}


def initialize_transaction(
    email: str,
    amount_kobo: int,
    reference: str,
    callback_url: str | None = None,
) -> dict:
    """
    Starts a Kora checkout. Returns a dict with authorization_url,
    access_code and reference, the same keys Paystack returned, so the caller
    redirects the customer to authorization_url (Kora's hosted checkout page).

    callback_url, if given, is where Kora sends the customer's browser
    afterwards (success, failure or closing checkout), with the payment
    reference appended as a query parameter.
    """
    payload: dict = {
        "amount": _naira(amount_kobo),
        "currency": "NGN",
        "reference": reference,
        "customer": {"email": email},
    }
    if callback_url:
        payload["redirect_url"] = callback_url

    # Where Kora calls us the moment a payment completes, so a customer who
    # pays and then closes the browser still gets confirmed. Optional.
    if settings.kora_webhook_url:
        payload["notification_url"] = settings.kora_webhook_url

    try:
        response = httpx.post(
            f"{KORA_BASE_URL}/charges/initialize",
            json=payload,
            headers=_headers(),
            timeout=TIMEOUT_SECONDS,
        )
    except httpx.HTTPError as exc:
        raise KoraError(f"Could not reach Kora: {exc}")

    data = _json(response)

    if not response.is_success or not data.get("status"):
        raise KoraError(data.get("message", "Failed to initialize Kora transaction"))

    tx = data.get("data") or {}
    checkout_url = tx.get("checkout_url")
    if not checkout_url:
        raise KoraError("Kora did not return a checkout URL.")

    ref = tx.get("reference", reference)
    return {
        "authorization_url": checkout_url,
        "access_code": ref,  # Kora has no access code; kept so the shape matches
        "reference": ref,
    }


def verify_transaction(reference: str) -> dict:
    """
    Confirms whether a payment actually succeeded. ALWAYS call this
    server-side before marking anything as paid.

    Returns a dict shaped like Paystack's:
        "status"    "success", "processing", "pending", "failed" or "expired"
        "amount"    the amount in KOBO (None if Kora didn't report one)
        "reference" the payment reference
        "currency"  e.g. "NGN"
        "raw"       Kora's full `data` object, for debugging

    Raises KoraError if Kora can't be reached or doesn't know the reference
    (for example a customer who closed checkout before paying).
    """
    try:
        response = httpx.get(
            f"{KORA_BASE_URL}/charges/{quote(reference, safe='')}",
            headers=_headers(),
            timeout=TIMEOUT_SECONDS,
        )
    except httpx.HTTPError as exc:
        raise KoraError(f"Could not reach Kora: {exc}")

    data = _json(response)

    # A customer who closed checkout before paying may have no charge on
    # Kora's side at all. That's "not paid", not a system failure.
    message = str(data.get("message", "")).lower()
    if response.status_code == 404 or "not found" in message:
        return {
            "status": "not_found",
            "amount": None,
            "reference": reference,
            "currency": None,
            "raw": {},
        }

    if not response.is_success or not data.get("status"):
        raise KoraError(data.get("message", "Failed to verify Kora transaction"))

    tx = data.get("data") or {}

    # Prefer the amount actually paid, so an underpayment can't pass as full.
    amount_kobo = None
    amount = tx.get("amount_paid", tx.get("amount"))
    if amount is not None:
        try:
            amount_kobo = int(round(float(amount) * 100))
        except (TypeError, ValueError):
            amount_kobo = None

    return {
        "status": str(tx.get("status", "")).lower(),
        "amount": amount_kobo,
        "reference": tx.get("reference", reference),
        "currency": tx.get("currency"),
        "raw": tx,
    }


# ---------------------------------------------------------------------------
# Webhooks (optional)
# ---------------------------------------------------------------------------
# Kora calls your notification_url with {"event": "charge.success", "data": {...}}
# and an x-korapay-signature header. Treat the webhook as a nudge only: take
# the reference from it, then call verify_transaction() and act on THAT. A
# forged webhook then can't do anything beyond making you check a real reference.


def reference_from_webhook(payload: dict) -> str | None:
    """The payment reference from a charge.success webhook, else None."""
    if payload.get("event") != "charge.success":
        return None
    return (payload.get("data") or {}).get("reference")


def webhook_signature_valid(raw_body: bytes, signature: str | None) -> bool:
    """
    Best-effort check of x-korapay-signature: an HMAC-SHA256 of the `data`
    object only, signed with your secret key. Number formatting in the
    re-serialised JSON can differ from what Kora signed, so a mismatch is a
    reason to log, not the only line of defence; always verify_transaction().
    """
    if not signature:
        return False
    try:
        data = json.loads(raw_body).get("data")
    except (ValueError, AttributeError):
        return False

    message = json.dumps(data, separators=(",", ":"), ensure_ascii=False)
    expected = hmac.new(
        settings.kora_secret_key.encode("utf-8"),
        message.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    return hmac.compare_digest(expected, signature)