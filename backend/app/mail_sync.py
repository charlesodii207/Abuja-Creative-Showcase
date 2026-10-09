"""
Zoho -> dashboard sync.

Polls each configured mailbox over IMAP, stores new messages as
ContactThread / ContactMessage rows, and never changes anything in Zoho
(read-only select, BODY.PEEK).

Safe with several uvicorn/gunicorn workers: each mailbox is processed under a
Postgres advisory lock, so only one process syncs it at a time.
"""

import asyncio
import imaplib
import logging
import re
from datetime import datetime, timedelta, timezone
from email import message_from_bytes, policy
from email.utils import getaddresses, parseaddr, parsedate_to_datetime
from html.parser import HTMLParser

from sqlalchemy import func, text

from app import models
from app.config import settings
from app.database import SessionLocal
from app.emailer import MAILBOXES, mailbox_address

log = logging.getLogger("acs.mail_sync")

LOCK_BASE = 727_000          # arbitrary app-wide number for pg advisory locks
MAX_PER_CYCLE = 40           # messages per mailbox per cycle (keeps each run short)
MAX_BODY_CHARS = 200_000
THREAD_MATCH_DAYS = 45

_SUBJECT_PREFIX = re.compile(r"^\s*((re|fwd?|aw)\s*:\s*)+", re.I)


# ---------------------------------------------------------------------------
# Parsing
# ---------------------------------------------------------------------------

class _TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts: list[str] = []
        self._skip = 0

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style"):
            self._skip += 1
        elif tag in ("br", "p", "div", "tr", "li"):
            self.parts.append("\n")

    def handle_endtag(self, tag):
        if tag in ("script", "style") and self._skip:
            self._skip -= 1

    def handle_data(self, data):
        if not self._skip:
            self.parts.append(data)


def _html_to_text(html: str) -> str:
    parser = _TextExtractor()
    try:
        parser.feed(html)
    except Exception:
        return ""
    return re.sub(r"\n{3,}", "\n\n", "".join(parser.parts)).strip()


def norm_subject(subject: str | None) -> str:
    return _SUBJECT_PREFIX.sub("", subject or "").strip().lower()


def _content(part) -> str | None:
    if part is None:
        return None
    try:
        return part.get_content()
    except Exception:
        return None


def _addrs(msg, *headers: str) -> list[str]:
    values: list[str] = []
    for h in headers:
        values.extend(str(v) for v in msg.get_all(h, []))
    return [a.lower() for _, a in getaddresses(values) if a]


def _parse(raw: bytes) -> dict:
    msg = message_from_bytes(raw, policy=policy.default)

    html = _content(msg.get_body(preferencelist=("html",)))
    plain = _content(msg.get_body(preferencelist=("plain",)))
    body = (plain or "").strip() or _html_to_text(html or "")

    attachments = [p.get_filename() for p in msg.iter_attachments() if p.get_filename()]
    if attachments:
        body += "\n\n[Attachments not imported — open in Zoho: " + ", ".join(attachments) + "]"

    from_name, from_addr = parseaddr(str(msg.get("From", "")))

    received_at = None
    if msg.get("Date"):
        try:
            received_at = parsedate_to_datetime(str(msg["Date"]))
            if received_at.tzinfo is None:
                received_at = received_at.replace(tzinfo=timezone.utc)
        except Exception:
            received_at = None

    return {
        "message_id": str(msg.get("Message-ID") or "").strip() or None,
        "in_reply_to": str(msg.get("In-Reply-To") or "").strip() or None,
        "references": str(msg.get("References") or "").strip() or None,
        "from_name": (from_name or "").strip(),
        "from_address": (from_addr or "").strip().lower(),
        "to": _addrs(msg, "To"),
        "cc": _addrs(msg, "Cc"),
        "recipients": _addrs(msg, "To", "Cc", "Delivered-To", "X-Original-To", "X-Forwarded-To"),
        "subject": (str(msg.get("Subject") or "").strip() or "(no subject)")[:300],
        "body": (body or "(empty message)")[:MAX_BODY_CHARS],
        "html": (html or None) and html[:MAX_BODY_CHARS * 2],
        "received_at": received_at,
    }


def _route(polled_key: str, recipients: list[str]) -> str:
    """Which mailbox a message belongs to. Normally the one we polled; if it was
    delivered through an alias of another ACS mailbox, use that one."""
    if mailbox_address(polled_key).lower() in recipients:
        return polled_key
    for key in MAILBOXES:
        if mailbox_address(key).lower() in recipients:
            return key
    return polled_key


# ---------------------------------------------------------------------------
# IMAP
# ---------------------------------------------------------------------------

def _untagged_int(M: imaplib.IMAP4_SSL, name: str) -> int | None:
    try:
        _, data = M.response(name)
        return int(data[0])
    except Exception:
        return None


def _fetch(key: str, last_uid: int, saved_validity: int | None):
    """Returns (uidvalidity, start_uid, items). start_uid is the UID we are
    effectively starting after (the baseline on a first run)."""
    first_run = saved_validity is None
    M = imaplib.IMAP4_SSL(settings.zoho_imap_host, settings.zoho_imap_port, timeout=30)
    try:
        M.login(mailbox_address(key), settings.zoho_password(key))
        M.select("INBOX", readonly=True)   # read-only: never marks mail as read in Zoho

        validity = _untagged_int(M, "UIDVALIDITY")
        uidnext = _untagged_int(M, "UIDNEXT")

        if saved_validity is not None and validity != saved_validity:
            # Zoho rebuilt the mailbox numbering; old UIDs are meaningless.
            first_run, last_uid = True, 0

        if first_run and settings.mail_sync_backfill_days <= 0:
            return validity, max((uidnext or 1) - 1, 0), []

        if first_run:
            since = (datetime.now(timezone.utc)
                     - timedelta(days=settings.mail_sync_backfill_days)).strftime("%d-%b-%Y")
            _, data = M.uid("SEARCH", None, "SINCE", since)
            last_uid = 0
        else:
            _, data = M.uid("SEARCH", None, f"UID {last_uid + 1}:*")

        uids = sorted(int(u) for u in (data[0] or b"").split())
        uids = [u for u in uids if u > last_uid][:MAX_PER_CYCLE]

        items = []
        for uid in uids:
            typ, md = M.uid("FETCH", str(uid), "(BODY.PEEK[])")
            if typ != "OK" or not md or not isinstance(md[0], tuple):
                continue
            item = _parse(md[0][1])
            item["uid"] = uid
            items.append(item)

        return validity, last_uid, items
    finally:
        try:
            M.logout()
        except Exception:
            pass


# ---------------------------------------------------------------------------
# Storing
# ---------------------------------------------------------------------------

def _is_automated(from_address: str) -> bool:
    """Our own system emails (contact-form notifications etc.) come from the
    noreply address. They're already in the dashboard, so don't import them."""
    noreply = parseaddr(settings.email_from)[1].lower()
    return bool(noreply) and from_address == noreply


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
    if not item["from_address"] or _is_automated(item["from_address"]):
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
        body=item["body"],
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
        **kwargs,
    ))
    db.flush()
    return True


# ---------------------------------------------------------------------------
# Loop
# ---------------------------------------------------------------------------

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


def _process_mailbox(key: str) -> int:
    """Sync one mailbox. Runs in a worker thread. Returns messages saved."""
    if not settings.zoho_password(key):
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

        validity, start_uid, items = _fetch(key, int(state.last_uid or 0), state.uidvalidity)

        saved = failed = 0
        for item in items:
            try:
                with db.begin_nested():
                    if _store(db, key, item):
                        saved += 1
            except Exception:
                failed += 1
                log.exception("Could not import uid %s from %s", item.get("uid"), key)

        state.uidvalidity = validity
        state.last_uid = max([start_uid] + [i["uid"] for i in items])
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