from datetime import datetime, timezone
from html import escape
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from app import models, schemas
from app.audit import log_action
from app.database import get_db
from app.dependencies import require_mailbox, require_permission, require_role
from app.emailer import (
    MAILBOXES,
    mailbox_address,
    mailbox_label,
    new_message_id,
    send_from_mailbox,
)
from app.permissions import mailboxes_for


router = APIRouter(
    prefix="/admin/messages",
    tags=["admin-messages"],
)


# Super admins and the system owner always pass. Regular admins need the
# "messages" section, which comes from the Messaging & Support department.
# On top of that, every thread belongs to a shared mailbox, and the admin
# needs a grant for THAT mailbox (read to view, send to reply/close/reopen).
MESSAGES_PERMISSION = "messages"

DEFAULT_MAILBOX = "info"   # website-form messages


def _get_thread(
    db: Session,
    thread_id: str,
    admin: models.Admin,
    need: str = "read",
) -> models.ContactThread:
    """Safely retrieve a contact thread by UUID and check mailbox access."""

    try:
        thread_uuid = UUID(thread_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Message thread not found.")

    thread = (
        db.query(models.ContactThread)
        .options(selectinload(models.ContactThread.messages))
        .filter(models.ContactThread.id == thread_uuid)
        .first()
    )

    if not thread:
        raise HTTPException(status_code=404, detail="Message thread not found.")

    require_mailbox(admin, thread.mailbox or DEFAULT_MAILBOX, need)

    return thread


def _serialize_message(message: models.ContactMessage) -> schemas.ContactMessageSummary:
    return schemas.ContactMessageSummary(
        id=str(message.id),
        sender_type=message.sender_type,
        sender_name=message.sender_name,
        sender_email=message.sender_email,
        subject=message.subject,
        body=message.body,
        admin_id=str(message.admin_id) if message.admin_id else None,
        is_read=message.is_read,
        created_at=message.created_at,
        direction=message.direction,
        mailbox=message.mailbox,
        to_addresses=message.to_addresses,
        cc_addresses=message.cc_addresses,
        has_html=bool(message.body_html),
    )


def _get_unread_count(db: Session, thread_id: UUID) -> int:
    count = (
        db.query(func.count(models.ContactMessage.id))
        .filter(
            models.ContactMessage.thread_id == thread_id,
            models.ContactMessage.sender_type == "visitor",
            models.ContactMessage.is_read.is_(False),
        )
        .scalar()
    )
    return int(count or 0)


def _reply_subject(subject: str) -> str:
    """Prevent repeated 'Re:' prefixes."""
    if subject.strip().lower().startswith("re:"):
        return subject
    return f"Re: {subject}"


def _wrap_body(greeting: str | None, body: str) -> str:
    """The inner HTML used for every dashboard email. _branded_html adds the
    ACS header and footer around it."""
    safe_body = escape(body).replace("\n", "<br>")
    hello = f"<p>Hello {escape(greeting)},</p>" if greeting else ""
    return f"""
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        {hello}

        <p>{safe_body}</p>

        <p>
            Best regards,<br>
            Afriqa Creative Showcase
        </p>
    </div>
    """


# ---------------------------------------------------------------------------
# Mailboxes
# ---------------------------------------------------------------------------

@router.get("/mailboxes", response_model=list[schemas.MailboxOption])
def my_mailboxes(
    current_admin: models.Admin = Depends(require_permission(MESSAGES_PERMISSION)),
):
    """Mailboxes this admin can see. Filter on can_send=true for the sender toggle."""
    readable = set(mailboxes_for(current_admin, "read"))
    sendable = set(mailboxes_for(current_admin, "send"))

    return [
        schemas.MailboxOption(
            key=k,
            label=mailbox_label(k),
            address=mailbox_address(k),
            can_send=k in sendable,
        )
        for k in MAILBOXES
        if k in readable
    ]


@router.get("/sync-status", response_model=list[schemas.MailSyncStatus])
def sync_status(
    db: Session = Depends(get_db),
    current_admin: models.Admin = Depends(require_role("system_owner")),
):
    """Owner only: when each mailbox last synced, and the last error (e.g. a wrong Zoho password)."""
    rows = {r.mailbox: r for r in db.query(models.MailSyncState).all()}
    out = []
    for key in MAILBOXES:
        r = rows.get(key)
        out.append(schemas.MailSyncStatus(
            mailbox=key,
            last_synced_at=r.last_synced_at if r else None,
            last_error=r.last_error if r else None,
        ))
    return out


# ---------------------------------------------------------------------------
# Inbox
# ---------------------------------------------------------------------------

@router.get("", response_model=list[schemas.ContactThreadSummary])
def list_message_threads(
    status: str | None = Query(default=None),
    mailbox: str | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_admin: models.Admin = Depends(require_permission(MESSAGES_PERMISSION)),
):
    """Threads for the mailboxes this admin has been assigned, newest activity first."""

    if status is not None and status not in ("open", "closed"):
        raise HTTPException(status_code=400, detail="Status must be 'open' or 'closed'.")

    readable = mailboxes_for(current_admin, "read")

    if mailbox is not None:
        require_mailbox(current_admin, mailbox, "read")
        readable = [mailbox]

    if not readable:
        return []

    query = (
        db.query(models.ContactThread)
        .options(selectinload(models.ContactThread.messages))
        .filter(models.ContactThread.mailbox.in_(readable))
    )

    if status:
        query = query.filter(models.ContactThread.status == status)

    threads = query.order_by(models.ContactThread.updated_at.desc()).limit(limit).all()

    results = []
    for thread in threads:
        latest_message = (
            _serialize_message(thread.messages[-1]) if thread.messages else None
        )
        results.append(
            schemas.ContactThreadSummary(
                id=str(thread.id),
                sender_name=thread.sender_name,
                sender_email=thread.sender_email,
                sender_phone=thread.sender_phone,
                subject=thread.subject,
                status=thread.status,
                is_replied=thread.is_replied,
                unread_count=_get_unread_count(db, thread.id),
                created_at=thread.created_at,
                updated_at=thread.updated_at,
                latest_message=latest_message,
                mailbox=thread.mailbox,
                channel=thread.channel,
            )
        )

    return results


# ---------------------------------------------------------------------------
# Unread count (only for mailboxes this admin can read)
# ---------------------------------------------------------------------------

@router.get("/unread-count", response_model=schemas.ContactUnreadCountResponse)
def get_unread_message_count(
    db: Session = Depends(get_db),
    current_admin: models.Admin = Depends(require_permission(MESSAGES_PERMISSION)),
):
    readable = mailboxes_for(current_admin, "read")
    if not readable:
        return schemas.ContactUnreadCountResponse(unread_count=0, by_mailbox={})

    rows = (
        db.query(models.ContactMessage.mailbox, func.count(models.ContactMessage.id))
        .filter(
            models.ContactMessage.sender_type == "visitor",
            models.ContactMessage.is_read.is_(False),
            models.ContactMessage.mailbox.in_(readable),
        )
        .group_by(models.ContactMessage.mailbox)
        .all()
    )
    by_mailbox = {m: int(c) for m, c in rows}

    return schemas.ContactUnreadCountResponse(
        unread_count=sum(by_mailbox.values()),
        by_mailbox=by_mailbox,
    )


# ---------------------------------------------------------------------------
# Raw HTML of an inbound email (untrusted!)
# ---------------------------------------------------------------------------

@router.get("/html/{message_id}")
def get_message_html(
    message_id: str,
    db: Session = Depends(get_db),
    current_admin: models.Admin = Depends(require_permission(MESSAGES_PERMISSION)),
):
    """Original HTML of an inbound email. The dashboard MUST show it only inside
    <iframe sandbox="" srcdoc=...>. Never inject it into the page directly."""
    try:
        msg_uuid = UUID(message_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Message not found.")

    message = db.get(models.ContactMessage, msg_uuid)
    if not message:
        raise HTTPException(status_code=404, detail="Message not found.")

    require_mailbox(current_admin, message.mailbox or DEFAULT_MAILBOX, "read")

    return {"html": message.body_html}


# ---------------------------------------------------------------------------
# Compose a brand-new email
# ---------------------------------------------------------------------------

@router.post("/compose", response_model=schemas.AdminActionResponse)
def compose_message(
    payload: schemas.SendMailRequest,
    db: Session = Depends(get_db),
    current_admin: models.Admin = Depends(require_permission(MESSAGES_PERMISSION)),
):
    """Send a new email from a mailbox this admin has send access to."""

    require_mailbox(current_admin, payload.mailbox, "send")

    to = list(dict.fromkeys(str(a).lower() for a in payload.to))
    cc = [a for a in dict.fromkeys(str(a).lower() for a in payload.cc) if a not in to]
    subject = payload.subject.strip()
    body = payload.body.strip()

    if not to:
        raise HTTPException(status_code=400, detail="Add at least one recipient.")
    if len(to) + len(cc) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 recipients per email.")
    if not subject:
        raise HTTPException(status_code=400, detail="Subject cannot be empty.")
    if not body:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")
    subject = subject[:200]

    message_id = new_message_id()

    sent = send_from_mailbox(
        payload.mailbox,
        to,
        subject,
        _wrap_body(None, body),
        cc=cc or None,
        message_id=message_id,
    )
    if not sent:
        raise HTTPException(status_code=500, detail="We couldn't send the email. Please try again.")

    from_address = mailbox_address(payload.mailbox)

    thread = models.ContactThread(
        sender_name=to[0],
        sender_email=to[0],
        subject=subject,
        status="open",
        is_replied=True,
        mailbox=payload.mailbox,
        channel="email",
    )
    db.add(thread)
    db.flush()

    db.add(models.ContactMessage(
        thread_id=thread.id,
        sender_type="admin",
        sender_name=current_admin.full_name,
        sender_email=from_address,
        subject=subject,
        body=body,
        admin_id=current_admin.id,
        is_read=True,
        mailbox=payload.mailbox,
        direction="outbound",
        message_id=message_id,
        to_addresses=", ".join(to),
        cc_addresses=", ".join(cc) or None,
    ))
    db.commit()

    log_action(
        db,
        current_admin,
        "send_email",
        target_type="contact_thread",
        target_reference=str(thread.id),
        detail=f"Sent from {from_address} to {', '.join(to)}: {subject}",
    )

    return schemas.AdminActionResponse(
        id=str(thread.id),
        status="sent",
        message="Email sent.",
    )


# ---------------------------------------------------------------------------
# Thread detail
# ---------------------------------------------------------------------------

@router.get("/{thread_id}", response_model=schemas.ContactThreadDetail)
def get_message_thread(
    thread_id: str,
    db: Session = Depends(get_db),
    current_admin: models.Admin = Depends(require_permission(MESSAGES_PERMISSION)),
):
    thread = _get_thread(db, thread_id, current_admin, "read")

    return schemas.ContactThreadDetail(
        id=str(thread.id),
        sender_name=thread.sender_name,
        sender_email=thread.sender_email,
        sender_phone=thread.sender_phone,
        subject=thread.subject,
        status=thread.status,
        is_replied=thread.is_replied,
        unread_count=_get_unread_count(db, thread.id),
        created_at=thread.created_at,
        updated_at=thread.updated_at,
        messages=[_serialize_message(m) for m in thread.messages],
        mailbox=thread.mailbox,
        channel=thread.channel,
    )


# ---------------------------------------------------------------------------
# Mark thread as read
# ---------------------------------------------------------------------------

@router.patch("/{thread_id}/read", response_model=schemas.AdminActionResponse)
def mark_message_thread_read(
    thread_id: str,
    db: Session = Depends(get_db),
    current_admin: models.Admin = Depends(require_permission(MESSAGES_PERMISSION)),
):
    thread = _get_thread(db, thread_id, current_admin, "read")

    changed = False
    for message in thread.messages:
        if message.sender_type == "visitor" and not message.is_read:
            message.is_read = True
            changed = True

    db.commit()

    if changed:
        log_action(
            db,
            current_admin,
            "mark_message_read",
            target_type="contact_thread",
            target_reference=str(thread.id),
            detail=f"Marked message thread as read for {thread.sender_email}.",
        )

    return schemas.AdminActionResponse(
        id=str(thread.id),
        status="read",
        message="Message thread marked as read.",
    )


# ---------------------------------------------------------------------------
# Reply
# ---------------------------------------------------------------------------

@router.post("/{thread_id}/reply", response_model=schemas.ContactReplyResponse)
def reply_to_message_thread(
    thread_id: str,
    payload: schemas.ContactReplyRequest,
    db: Session = Depends(get_db),
    current_admin: models.Admin = Depends(require_permission(MESSAGES_PERMISSION)),
):
    """
    Send an email reply to the sender and record it in the thread.

    The reply goes out from the mailbox the conversation belongs to
    (info@ for website-form messages), and the admin needs SEND access to it.
    """

    thread = _get_thread(db, thread_id, current_admin, "send")
    mailbox = thread.mailbox or DEFAULT_MAILBOX

    body = payload.body.strip()

    if not body:
        raise HTTPException(status_code=400, detail="Reply message cannot be empty.")

    reply_subject = _reply_subject(thread.subject)

    # Threading headers so the recipient's mail app keeps it in one conversation.
    ids = [m.message_id for m in thread.messages if m.message_id]
    inbound_ids = [m.message_id for m in thread.messages
                   if m.message_id and m.direction == "inbound"]
    in_reply_to = (inbound_ids or ids or [None])[-1]
    references = " ".join(ids[-10:]) or None
    message_id = new_message_id()

    sent = send_from_mailbox(
        mailbox,
        [thread.sender_email],
        reply_subject,
        _wrap_body(thread.sender_name, body),
        in_reply_to=in_reply_to,
        references=references,
        message_id=message_id,
    )

    if not sent:
        raise HTTPException(
            status_code=500,
            detail="We couldn't send the reply. Please try again.",
        )

    from_address = mailbox_address(mailbox)

    message = models.ContactMessage(
        thread_id=thread.id,
        sender_type="admin",
        sender_name=current_admin.full_name,
        sender_email=from_address,
        subject=reply_subject,
        body=body,
        admin_id=current_admin.id,
        is_read=True,
        mailbox=mailbox,
        direction="outbound",
        message_id=message_id,
        in_reply_to=in_reply_to,
        references_header=references,
        to_addresses=thread.sender_email,
    )

    db.add(message)

    thread.is_replied = True
    thread.status = "open"
    thread.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(message)

    log_action(
        db,
        current_admin,
        "reply_to_contact_message",
        target_type="contact_thread",
        target_reference=str(thread.id),
        detail=f"Replied to {thread.sender_email} from {from_address}.",
    )

    return schemas.ContactReplyResponse(message=_serialize_message(message))


# ---------------------------------------------------------------------------
# Close / reopen (needs send access: it changes the conversation's state)
# ---------------------------------------------------------------------------

@router.patch("/{thread_id}/close", response_model=schemas.AdminActionResponse)
def close_message_thread(
    thread_id: str,
    db: Session = Depends(get_db),
    current_admin: models.Admin = Depends(require_permission(MESSAGES_PERMISSION)),
):
    thread = _get_thread(db, thread_id, current_admin, "send")

    thread.status = "closed"
    thread.updated_at = datetime.now(timezone.utc)
    db.commit()

    log_action(
        db,
        current_admin,
        "close_contact_thread",
        target_type="contact_thread",
        target_reference=str(thread.id),
        detail=f"Closed conversation with {thread.sender_email}.",
    )

    return schemas.AdminActionResponse(
        id=str(thread.id),
        status="closed",
        message="Conversation closed.",
    )


@router.patch("/{thread_id}/reopen", response_model=schemas.AdminActionResponse)
def reopen_message_thread(
    thread_id: str,
    db: Session = Depends(get_db),
    current_admin: models.Admin = Depends(require_permission(MESSAGES_PERMISSION)),
):
    thread = _get_thread(db, thread_id, current_admin, "send")

    thread.status = "open"
    thread.updated_at = datetime.now(timezone.utc)
    db.commit()

    log_action(
        db,
        current_admin,
        "reopen_contact_thread",
        target_type="contact_thread",
        target_reference=str(thread.id),
        detail=f"Reopened conversation with {thread.sender_email}.",
    )

    return schemas.AdminActionResponse(
        id=str(thread.id),
        status="open",
        message="Conversation reopened.",
    )