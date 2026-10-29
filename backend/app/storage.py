"""
Supabase Storage helper for message attachments.

Talks to Supabase's Storage REST API directly with `requests`, so there is no
heavy SDK to install. The bucket is PRIVATE: files are never public. The
dashboard gets a short-lived signed link, one click at a time, and only after
the backend has checked that the admin can read that mailbox.

Environment variables (set in .env locally AND in Render):
    SUPABASE_URL                e.g. https://vnqfmzjetqqbpknaaaaz.supabase.co
    SUPABASE_SERVICE_KEY        the secret key (sb_secret_...) or legacy service_role key
    SUPABASE_ATTACHMENT_BUCKET  acs-attachments
"""

import logging
import os
from urllib.parse import quote

import requests

logger = logging.getLogger(__name__)

REQUEST_TIMEOUT = 30  # seconds


class StorageError(Exception):
    """Raised when the storage service can't be reached or refuses a request."""


def _config() -> tuple[str, str, str]:
    url = (os.getenv("SUPABASE_URL") or "").strip().rstrip("/")
    key = (os.getenv("SUPABASE_SERVICE_KEY") or "").strip()
    bucket = (os.getenv("SUPABASE_ATTACHMENT_BUCKET") or "").strip()

    if not url or not key or not bucket:
        raise StorageError(
            "Attachment storage isn't configured. Set SUPABASE_URL, "
            "SUPABASE_SERVICE_KEY and SUPABASE_ATTACHMENT_BUCKET."
        )

    return url, key, bucket


def _headers(key: str) -> dict[str, str]:
    headers = {"apikey": key}
    # Legacy service_role keys are JWTs and go in Authorization too. The newer
    # sb_secret_ keys are not JWTs and must only be sent as the apikey header.
    if key.startswith("eyJ"):
        headers["Authorization"] = f"Bearer {key}"
    return headers


def _object_path(key: str) -> str:
    return quote(key, safe="/")


def upload_file(key: str, data: bytes, content_type: str) -> None:
    """Save one file in the bucket under `key`. Never overwrites an existing file."""
    url, secret, bucket = _config()

    try:
        response = requests.post(
            f"{url}/storage/v1/object/{bucket}/{_object_path(key)}",
            headers={
                **_headers(secret),
                "Content-Type": content_type,
                "x-upsert": "false",
            },
            data=data,
            timeout=REQUEST_TIMEOUT,
        )
    except requests.RequestException as exc:
        logger.error("Attachment upload failed (network): %s", exc)
        raise StorageError("Couldn't reach the storage service.") from exc

    if response.status_code not in (200, 201):
        logger.error(
            "Attachment upload failed (%s): %s", response.status_code, response.text[:300]
        )
        raise StorageError("The storage service refused the upload.")


def create_signed_url(
    key: str,
    expires_in: int = 60,
    download_name: str | None = None,
) -> str:
    """
    A temporary link to one file. It stops working after `expires_in` seconds.
    Pass `download_name` to make the browser download the file instead of
    opening it in a tab.
    """
    url, secret, bucket = _config()

    try:
        response = requests.post(
            f"{url}/storage/v1/object/sign/{bucket}/{_object_path(key)}",
            headers={**_headers(secret), "Content-Type": "application/json"},
            json={"expiresIn": expires_in},
            timeout=REQUEST_TIMEOUT,
        )
    except requests.RequestException as exc:
        logger.error("Signed link failed (network): %s", exc)
        raise StorageError("Couldn't reach the storage service.") from exc

    if response.status_code != 200:
        logger.error(
            "Signed link failed (%s): %s", response.status_code, response.text[:300]
        )
        raise StorageError("Couldn't open that file.")

    signed = (response.json() or {}).get("signedURL") or ""
    if not signed:
        raise StorageError("Couldn't open that file.")

    if signed.startswith("http"):
        full = signed
    elif signed.startswith("/storage/v1"):
        full = f"{url}{signed}"
    else:
        full = f"{url}/storage/v1{signed}"

    if download_name:
        joiner = "&" if "?" in full else "?"
        full = f"{full}{joiner}download={quote(download_name)}"

    return full


def delete_files(keys: list[str]) -> None:
    """
    Best-effort cleanup (used when an email fails after its files were saved).
    Never raises: a leftover file is harmless, a crash during cleanup is not.
    """
    if not keys:
        return

    try:
        url, secret, bucket = _config()
        response = requests.delete(
            f"{url}/storage/v1/object/{bucket}",
            headers={**_headers(secret), "Content-Type": "application/json"},
            json={"prefixes": keys},
            timeout=REQUEST_TIMEOUT,
        )
        if response.status_code not in (200, 204):
            logger.warning(
                "Attachment cleanup returned %s: %s",
                response.status_code,
                response.text[:300],
            )
    except (StorageError, requests.RequestException) as exc:
        logger.warning("Attachment cleanup failed: %s", exc)