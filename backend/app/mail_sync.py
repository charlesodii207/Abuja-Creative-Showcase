"""
Zoho -> dashboard sync, using the Zoho Mail API (no IMAP needed).

Every cycle, for each configured mailbox: list the newest inbox messages,
fetch the new ones (body + headers), store them as ContactThread /
ContactMessage rows. It only READS from Zoho; nothing is changed or marked
as read there.

Safe with several uvicorn/gunicorn workers: each mailbox is processed under a
Postgres advisory lock, so only one process syncs it at a time.
"""

import asyncio
import logging
import os
import re
import time
from datetime import datetime, timedelta, timezone
from email import message_from_string
from email.utils import getaddresses, parseaddr
from html import unescape
from html.parser import HTMLParser
from uuid import uuid4

import requests
from sqlalchemy import func, text

from app import models, storage
from app.config import settings
from app.database import SessionLocal
from app.emailer import MAILBOXES, mailbox_address

log = logging.getLogger("acs.mail_sync")

LOCK_BASE = 727_000          # arbitrary app-wide number for pg advisory locks
LIST_LIMIT = 50              # newest messages looked at per cycle
MAX_PER_CYCLE = 40           # messages imported per mailbox per cycle
BACKFILL_PAGE = 100
BACKFILL_MAX_PAGES = 5
MAX_BODY_CHARS = 200_000
THREAD_MATCH_DAYS = 45

# Incoming attachments. Senders are strangers, so the rules are stricter about
# what can be OPENED in a browser, and looser about what is kept.
MAX_INBOUND_FILES = 10                       # per email
MAX_INBOUND_FILE_BYTES = 10 * 1024 * 1024    # per file
MAX_INBOUND_TOTAL_BYTES = 25 * 1024 * 1024   # per email

# Only these are stored with their real type (so they open in the browser).
# Everything else is stored as a generic download, so a file like .html or
# .svg can never be run or rendered from the storage address.
OPENABLE_TYPES = {
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".txt": "text/plain",
}

_SUBJECT_PREFIX = re.compile(r"^\s*((re|fwd?|aw)\s*:\s*)+", re.I)


# ---------------------------------------------------------------------------
# Text helpers
# ---------------------------------------------------------------------------

class _TextExtractor(HTMLParser):
    """HTML -> readable text. Skips <head>/<style>/<script> and quoted replies
    (<blockquote>), and squeezes the whitespace that table-based emails create."""

    def __init__(self):
        super().__init__()
        self.parts: list[str] = []
        self._skip = 0
        self._quote = 0

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style", "head", "title"):
            self._skip += 1
        elif tag == "blockquote":
            self._quote += 1
        elif tag in ("br", "p", "div", "tr", "li"):
            self.parts.append("\n")

    def handle_endtag(self, tag):
        if tag in ("script", "style", "head", "title") and self._skip:
            self._skip -= 1
        elif tag == "blockquote" and self._quote:
            self._quote -= 1

    def handle_data(self, data):
        if self._skip or self._quote:
            return
        text_ = re.sub(r"\s+", " ", data)
        if text_.strip():
            self.parts.append(text_)
        elif self.parts and not self.parts[-1].endswith(("\n", " ")):
            self.parts.append(" ")


def _html_to_text(html: str) -> str:
    parser = _TextExtractor()
    try:
        parser.feed(html)
    except Exception:
        return ""
    out = "".join(parser.parts)
    out = re.sub(r"[ \t]*\n[ \t]*", "\n", out)
    out = re.sub(r"\n{3,}", "\n\n", out).strip()
    # Drop a dangling "On <date>, <name> wrote:" line left behind by the quote.
    out = re.sub(r"(?m)^On [^\n]{5,200}(?:\n[^\n]{0,80})?wrote:\s*$", "", out).strip()
    return out


def norm_subject(subject: str | None) -> str:
    return _SUBJECT_PREFIX.sub("", subject or "").strip().lower()


def _addresses(raw: str | None) -> list[str]:
    """Zoho returns address fields HTML-escaped, e.g. '&lt;a@b.com&gt;'."""
    return [a.lower() for _, a in getaddresses([unescape(raw or "")]) if a]


# ---------------------------------------------------------------------------
# Zoho Mail API
# ---------------------------------------------------------------------------

_token_cache: dict[str, tuple[str, float]] = {}


def _access_token(key: str, force: bool = False) -> str:
    cached = _token_cache.get(key)
    if cached and not force and cached[1] > time.time() + 60:
        return cached[0]

    resp = requests.post(
        f"{settings.zoho_accounts_host}/oauth/v2/token",
        data={
            "grant_type": "refresh_token",
            "client_id": settings.zoho_client_id,
            "client_secret": settings.zoho_client_secret,
            "refresh_token": settings.zoho_refresh_token(key),
        },
        timeout=30,
    )
    resp.raise_for_status()
    body = resp.json()
    if "access_token" not in body:
        raise RuntimeError(f"Zoho token refresh failed: {body.get('error', 'unknown error')}")

    token = body["access_token"]
    _token_cache[key] = (token, time.time() + int(body.get("expires_in", 3600)))
    return token


def _api_get(key: str, path: str, params: dict | None = None):
    url = f"{settings.zoho_mail_host}/api/accounts/{settings.zoho_account_id(key)}{path}"

    for attempt in (1, 2):
        resp = requests.get(
            url,
            headers={"Authorization": f"Zoho-oauthtoken {_access_token(key, force=attempt == 2)}"},
            params=params,
            timeout=30,
        )
        if resp.status_code == 401 and attempt == 1:
            continue   # token expired: refresh once and retry
        resp.raise_for_status()
        return resp.json().get("data")


def _list_messages(key: str, start: int, limit: int) -> list[dict]:
    data = _api_get(key, "/messages/view", {
        "start": start,
        "limit": limit,
        "sortBy": "date",
        "sortorder": "false",    # newest first
    })
    return data if isinstance(data, list) else []


def _ms_to_dt(value) -> datetime | None:
    try:
        return datetime.fromtimestamp(int(value) / 1000, tz=timezone.utc)
    except Exception:
        return None


def _load_message(key: str, summary: dict) -> dict:
    """Turn one Zoho list entry into the dict _store() expects."""
    message_id = str(summary["messageId"])
    folder_id = str(summary.get("folderId") or "")

    html = None
    try:
        data = _api_get(key, f"/folders/{folder_id}/messages/{message_id}/content")
        if isinstance(data, dict):
            html = data.get("content")
    except Exception:
        log.warning("Could not load body of message %s in %s", message_id, key)

    # Real email headers (Message-ID / In-Reply-To / References) for threading.
    # If this fails the message is still imported, matched by sender + subject.
    hdr_message_id = hdr_in_reply_to = hdr_references = None
    try:
        data = _api_get(key, f"/folders/{folder_id}/messages/{message_id}/header")
        raw = data.get("headerContent") if isinstance(data, dict) else None
        if raw:
            headers = message_from_string(raw)
            hdr_message_id = (headers.get("Message-ID") or "").strip() or None
            hdr_in_reply_to = (headers.get("In-Reply-To") or "").strip() or None
            hdr_references = (headers.get("References") or "").strip() or None
    except Exception:
        log.warning("Could not load headers of message %s in %s", message_id, key)

    from_name, from_addr = parseaddr(unescape(str(summary.get("fromAddress") or "")))
    sender_name = unescape(str(summary.get("sender") or "")).strip()
    to = _addresses(summary.get("toAddress"))
    cc = _addresses(summary.get("ccAddress"))

    plain = _html_to_text(html or "") or unescape(str(summary.get("summary") or "")).strip()
    # Attachments are fetched later, in _store(), and only for messages that
    # are actually going to be imported (not ignored senders or duplicates).
    has_attachments = str(summary.get("hasAttachment")) in ("1", "true", "True")

    return {
        "uid": int(message_id),
        "folder_id": folder_id,
        "has_attachments": has_attachments,
        "message_id": hdr_message_id,
        "in_reply_to": hdr_in_reply_to,
        "references": hdr_references,
        "from_name": (sender_name or from_name or "").strip(),
        "from_address": (from_addr or "").strip().lower(),
        "to": to,
        "cc": cc,
        "recipients": to + cc,
        "subject": (unescape(str(summary.get("subject") or "")).strip() or "(no subject)")[:300],
        "body": (plain or "(empty message)")[:MAX_BODY_CHARS],
        "html": (html or None) and html[:MAX_BODY_CHARS * 2],
        "received_at": _ms_to_dt(summary.get("receivedTime")),
    }


# ---------------------------------------------------------------------------
# Attachments
# ---------------------------------------------------------------------------

def _safe_filename(name: str) -> str:
    """Drop any path, keep letters/digits/spaces/dots/dashes, cap the length."""
    base = os.path.basename((name or "").replace("\\", "/")).strip()
    base = re.sub(r"[^\w.\- ()]", "_", base)
    stem, ext = os.path.splitext(base)
    stem = stem[:100].strip(" .") or "attachment"
    return f"{stem}{ext[:10]}"


def _storage_extension(filename: str) -> str:
    """The extension used in the bucket key. Only the openable types keep
    theirs; everything else becomes .bin so nothing like .html or .svg can
    ever be served as a web page from the storage address."""
    ext = os.path.splitext(filename)[1].lower()
    return ext if ext in OPENABLE_TYPES else ".bin"


def _download_attachment(key: str, folder_id: str, message_id: str, attachment_id: str) -> bytes:
    """Downloads one attachment, giving up as soon as it grows past the size cap."""
    url = (
        f"{settings.zoho_mail_host}/api/accounts/{settings.zoho_account_id(key)}"
        f"/folders/{folder_id}/messages/{message_id}/attachments/{attachment_id}"
    )

    for attempt in (1, 2):
        resp = requests.get(
            url,
            headers={
                "Authorization": f"Zoho-oauthtoken {_access_token(key, force=attempt == 2)}",
                "Accept": "application/octet-stream",
            },
            timeout=60,
            stream=True,
        )
        try:
            if resp.status_code == 401 and attempt == 1:
                continue   # token expired: refresh once and retry
            resp.raise_for_status()

            data = bytearray()
            for chunk in resp.iter_content(65536):
                data.extend(chunk)
                if len(data) > MAX_INBOUND_FILE_BYTES:
                    raise ValueError("file is too large")
            return bytes(data)
        finally:
            resp.close()

    raise RuntimeError("Zoho refused the attachment download")


def _import_attachments(polled_key: str, mailbox: str, item: dict) -> tuple[list[dict] | None, str]:
    """
    Saves an incoming email's attachments in the private bucket.

    Returns (metadata, note):
      - metadata: what is stored on the message row (same shape as outgoing
        attachments), or None when there are none.
      - note: text to add to the message body when something could not be
        saved, so nobody thinks a file is missing from the dashboard by chance.

    Never raises: the email is imported either way. Inline images (signature
    logos and similar) are not listed by Zoho here, so they are skipped.
    """
    if not item.get("has_attachments"):
        return None, ""

    fallback = "\n\n[This email has attachments that could not be imported. Open it in Zoho to see them.]"

    try:
        info = _api_get(
            polled_key,
            f"/folders/{item['folder_id']}/messages/{item['uid']}/attachmentinfo",
        )
        listed = (info or {}).get("attachments") if isinstance(info, dict) else None
    except Exception:
        log.warning("Could not list attachments of message %s in %s", item["uid"], polled_key)
        return None, fallback

    if not listed:
        return None, ""

    saved: list[dict] = []
    skipped: list[str] = []
    total = 0

    for att in listed:
        name = _safe_filename(unescape(str(att.get("attachmentName") or "attachment")))
        att_id = str(att.get("attachmentId") or "")

        try:
            declared = int(att.get("attachmentSize") or 0)
        except (TypeError, ValueError):
            declared = 0

        if (
            not att_id
            or len(saved) >= MAX_INBOUND_FILES
            or declared > MAX_INBOUND_FILE_BYTES
            or total + declared > MAX_INBOUND_TOTAL_BYTES
        ):
            skipped.append(name)
            continue

        try:
            data = _download_attachment(polled_key, item["folder_id"], str(item["uid"]), att_id)
            if not data or total + len(data) > MAX_INBOUND_TOTAL_BYTES:
                skipped.append(name)
                continue

            ext = os.path.splitext(name)[1].lower()
            content_type = OPENABLE_TYPES.get(ext, "application/octet-stream")
            storage_key = f"{mailbox}/{uuid4().hex}{_storage_extension(name)}"

            storage.upload_file(storage_key, data, content_type)
        except Exception:
            log.warning("Could not save attachment %r of message %s", name, item["uid"], exc_info=True)
            skipped.append(name)
            continue

        total += len(data)
        saved.append({
            "id": uuid4().hex,
            "filename": name,
            "size": len(data),
            "content_type": content_type,
            "key": storage_key,
        })

    note = ""
    if skipped:
        note = (
            f"\n\n[{len(skipped)} attachment(s) could not be saved here "
            f"(too large, too many, or a download problem): {', '.join(skipped)}. "
            "Open the email in Zoho to get them.]"
        )

    return saved or None, note


# ---------------------------------------------------------------------------
# Routing / storing
# ---------------------------------------------------------------------------

def _route(polled_key: str, recipients: list[str]) -> str:
    """Which mailbox a message belongs to. Normally the one we polled; if it was
    sent to an alias that is another ACS mailbox, use that one."""
    if mailbox_address(polled_key).lower() in recipients:
        return polled_key
    for key in MAILBOXES:
        if mailbox_address(key).lower() in recipients:
            return key
    return polled_key


def _is_automated(from_address: str) -> bool:
    """Our own system emails (contact-form notifications etc.) come from the
    noreply address. They're already in the dashboard, so don't import them."""
    noreply = parseaddr(settings.email_from)[1].lower()
    return bool(noreply) and from_address == noreply


def _is_ignored(from_address: str) -> bool:
    """Senders listed in MAIL_SYNC_IGNORE_SENDERS (Zoho's own notifications etc.)."""
    for rule in settings.mail_sync_ignore_senders.split(","):
        rule = rule.strip().lower()
        if not rule:
            continue
        if "@" in rule:
            if from_address == rule:
                return True
        elif from_address.endswith("@" + rule) or from_address.endswith("." + rule):
            return True
    return False


def _find_thread(db, mailbox: str, item: dict):
    refs: set[str] = set()
    for header in (item["in_reply_to"], item["references"]):
        refs.update(re.findall(r"<[^>]+>", header or ""))

    if refs:
        row = (
            db.query(models.ContactMessage.thread_id)
            .filter(
                models.ContactMessage.mailbox == mailbox,
                models.ContactMessage.message_id.in_(refs),
            )
            .first()
        )
        if row:
            return db.get(models.ContactThread, row[0])

    cutoff = datetime.now(timezone.utc) - timedelta(days=THREAD_MATCH_DAYS)
    candidates = (
        db.query(models.ContactThread)
        .filter(
            models.ContactThread.mailbox == mailbox,
            func.lower(models.ContactThread.sender_email) == item["from_address"],
            models.ContactThread.updated_at >= cutoff,
        )
        .order_by(models.ContactThread.updated_at.desc())
        .limit(20)
        .all()
    )
    wanted = norm_subject(item["subject"])
    for t in candidates:
        if norm_subject(t.subject) == wanted:
            return t
    return None


def _store(db, polled_key: str, item: dict) -> bool:
    if (
        not item["from_address"]
        or _is_automated(item["from_address"])
        or _is_ignored(item["from_address"])
    ):
        return False

    mailbox = _route(polled_key, item["recipients"])
    message_id = item["message_id"] or f"<noid-{polled_key}-{item['uid']}@acs-sync>"

    already = (
        db.query(models.ContactMessage.id)
        .filter(models.ContactMessage.mailbox == mailbox,
                models.ContactMessage.message_id == message_id)
        .first()
    )
    if already:
        return False

    # Only now (not ignored, not a duplicate) are the files downloaded and saved.
    attachment_meta, attachment_note = _import_attachments(polled_key, mailbox, item)

    thread = _find_thread(db, mailbox, item)
    now = datetime.now(timezone.utc)

    if thread is None:
        thread = models.ContactThread(
            sender_name=item["from_name"] or item["from_address"],
            sender_email=item["from_address"],
            subject=item["subject"],
            status="open",
            is_replied=False,
            mailbox=mailbox,
            channel="email",
        )
        db.add(thread)
        db.flush()
    else:
        thread.status = "open"   # a new inbound message reopens a closed conversation

    thread.updated_at = now

    kwargs = {}
    if item["received_at"]:
        kwargs["created_at"] = item["received_at"]

    db.add(models.ContactMessage(
        thread_id=thread.id,
        sender_type="visitor",
        sender_name=item["from_name"] or item["from_address"],
        sender_email=item["from_address"],
        subject=item["subject"],
        body=item["body"] + attachment_note,
        is_read=False,
        mailbox=mailbox,
        direction="inbound",
        message_id=message_id,
        in_reply_to=item["in_reply_to"],
        references_header=item["references"],
        to_addresses=", ".join(item["to"]) or None,
        cc_addresses=", ".join(item["cc"]) or None,
        body_html=item["html"],
        imap_uid=item["uid"],
        attachments=attachment_meta,
        **kwargs,
    ))
    db.flush()
    return True


# ---------------------------------------------------------------------------
# Loop
# ---------------------------------------------------------------------------

def _configured(key: str) -> bool:
    return bool(
        settings.zoho_client_id
        and settings.zoho_client_secret
        and settings.zoho_refresh_token(key)
        and settings.zoho_account_id(key)
    )


def _record_error(key: str, error: str) -> None:
    db = SessionLocal()
    try:
        state = db.get(models.MailSyncState, key)
        if state is None:
            state = models.MailSyncState(mailbox=key, last_uid=0)
            db.add(state)
        state.last_error = error[:500]
        db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()


def _gather(key: str, last_id: int, first_run: bool) -> tuple[int, list[dict]]:
    """Returns (new baseline id, summaries to import, oldest first)."""
    if first_run:
        newest = _list_messages(key, 1, LIST_LIMIT)
        baseline = max([int(m["messageId"]) for m in newest] + [0])

        if settings.mail_sync_backfill_days <= 0:
            return baseline, []

        cutoff = datetime.now(timezone.utc) - timedelta(days=settings.mail_sync_backfill_days)
        picked: list[dict] = []
        for page in range(BACKFILL_MAX_PAGES):
            batch = _list_messages(key, 1 + page * BACKFILL_PAGE, BACKFILL_PAGE)
            if not batch:
                break
            for m in batch:
                received = _ms_to_dt(m.get("receivedTime"))
                if received and received >= cutoff:
                    picked.append(m)
            oldest = _ms_to_dt(batch[-1].get("receivedTime"))
            if len(batch) < BACKFILL_PAGE or (oldest and oldest < cutoff):
                break
        picked.sort(key=lambda m: int(m["messageId"]))
        return baseline, picked

    newest = _list_messages(key, 1, LIST_LIMIT)
    fresh = [m for m in newest if int(m["messageId"]) > last_id]
    fresh.sort(key=lambda m: int(m["messageId"]))
    return last_id, fresh[:MAX_PER_CYCLE]


def _process_mailbox(key: str) -> int:
    """Sync one mailbox. Runs in a worker thread. Returns messages saved."""
    if not _configured(key):
        return 0

    db = SessionLocal()
    try:
        lock_id = LOCK_BASE + list(MAILBOXES).index(key)
        got = db.execute(text("SELECT pg_try_advisory_xact_lock(:i)"), {"i": lock_id}).scalar()
        if not got:
            return 0   # another worker is already syncing this mailbox

        state = db.get(models.MailSyncState, key)
        if state is None:
            state = models.MailSyncState(mailbox=key, last_uid=0)
            db.add(state)

        first_run = state.last_synced_at is None
        baseline, summaries = _gather(key, int(state.last_uid or 0), first_run)

        saved = failed = 0
        highest = baseline
        for summary in summaries:
            highest = max(highest, int(summary["messageId"]))
            try:
                item = _load_message(key, summary)
                with db.begin_nested():
                    if _store(db, key, item):
                        saved += 1
            except Exception:
                failed += 1
                log.exception("Could not import message %s from %s", summary.get("messageId"), key)

        state.last_uid = highest
        state.last_synced_at = datetime.now(timezone.utc)
        state.last_error = f"{failed} message(s) could not be imported" if failed else None
        db.commit()
        return saved

    except Exception as e:
        db.rollback()
        log.exception("Mail sync failed for %s", key)
        _record_error(key, f"{type(e).__name__}: {e}")
        return 0
    finally:
        db.close()


async def sync_loop() -> None:
    interval = max(30, settings.mail_sync_interval_seconds)
    await asyncio.sleep(10)   # let the app finish starting
    log.info("Mail sync started (every %ss)", interval)
    while True:
        for key in MAILBOXES:
            try:
                saved = await asyncio.to_thread(_process_mailbox, key)
                if saved:
                    log.info("Imported %s new message(s) into %s", saved, key)
            except asyncio.CancelledError:
                raise
            except Exception:
                log.exception("Unexpected sync error for %s", key)
        await asyncio.sleep(interval)