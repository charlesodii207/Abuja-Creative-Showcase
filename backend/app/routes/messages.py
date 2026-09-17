from datetime import datetime, timezone
from html import escape
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from app import models, schemas
from app.audit import log_action
from app.database import get_db
from app.dependencies import require_role
from app.emailer import send_message_reply


router = APIRouter(
    prefix="/admin/messages",
    tags=["admin-messages"],
)


MESSAGE_ROLES = (
    "system_owner",
    "super_admin",
    "admin",
)


def _get_thread(
    db: Session,
    thread_id: str,
) -> models.ContactThread:
    """
    Safely retrieve a contact thread by UUID.
    """

    try:
        thread_uuid = UUID(thread_id)
    except ValueError:
        raise HTTPException(
            status_code=404,
            detail="Message thread not found.",
        )

    thread = (
        db.query(models.ContactThread)
        .options(
            selectinload(models.ContactThread.messages)
        )
        .filter(models.ContactThread.id == thread_uuid)
        .first()
    )

    if not thread:
        raise HTTPException(
            status_code=404,
            detail="Message thread not found.",
        )

    return thread


def _serialize_message(
    message: models.ContactMessage,
) -> schemas.ContactMessageSummary:
    """
    Convert a ContactMessage ORM object into its API schema,
    explicitly stringifying UUID fields the same way the
    thread-level routes already do for thread.id.
    """

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
    )


def _get_unread_count(
    db: Session,
    thread_id: UUID,
) -> int:
    """
    Calculate unread visitor messages for a thread.

    Unread state is stored only on individual messages.
    """

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


def _get_total_unread_count(
    db: Session,
) -> int:
    """
    Calculate the total number of unread visitor messages
    across the entire inbox.
    """

    count = (
        db.query(func.count(models.ContactMessage.id))
        .filter(
            models.ContactMessage.sender_type == "visitor",
            models.ContactMessage.is_read.is_(False),
        )
        .scalar()
    )

    return int(count or 0)


def _reply_subject(subject: str) -> str:
    """
    Prevent repeated 'Re:' prefixes.
    """

    if subject.strip().lower().startswith("re:"):
        return subject

    return f"Re: {subject}"


# ---------------------------------------------------------------------------
# Inbox
# ---------------------------------------------------------------------------

@router.get(
    "",
    response_model=list[schemas.ContactThreadSummary],
)
def list_message_threads(
    status: str | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_admin: models.Admin = Depends(
        require_role(*MESSAGE_ROLES)
    ),
):
    """
    Return contact-message threads for the admin inbox.

    Threads are ordered by most recent activity.
    """

    if status is not None and status not in ("open", "closed"):
        raise HTTPException(
            status_code=400,
            detail="Status must be 'open' or 'closed'.",
        )

    query = (
        db.query(models.ContactThread)
        .options(
            selectinload(models.ContactThread.messages)
        )
    )

    if status:
        query = query.filter(
            models.ContactThread.status == status
        )

    query = (
        query
        .order_by(models.ContactThread.updated_at.desc())
        .limit(limit)
    )

    threads = query.all()

    results = []

    for thread in threads:
        latest_message = (
            _serialize_message(thread.messages[-1])
            if thread.messages
            else None
        )

        unread_count = _get_unread_count(
            db,
            thread.id,
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
                unread_count=unread_count,
                created_at=thread.created_at,
                updated_at=thread.updated_at,
                latest_message=latest_message,
            )
        )

    return results


# ---------------------------------------------------------------------------
# Unread count
# ---------------------------------------------------------------------------

@router.get(
    "/unread-count",
    response_model=schemas.ContactUnreadCountResponse,
)
def get_unread_message_count(
    db: Session = Depends(get_db),
    current_admin: models.Admin = Depends(
        require_role(*MESSAGE_ROLES)
    ),
):
    """
    Return the total number of unread visitor messages.
    """

    unread_count = _get_total_unread_count(db)

    return schemas.ContactUnreadCountResponse(
        unread_count=unread_count
    )


# ---------------------------------------------------------------------------
# Thread detail
# ---------------------------------------------------------------------------

@router.get(
    "/{thread_id}",
    response_model=schemas.ContactThreadDetail,
)
def get_message_thread(
    thread_id: str,
    db: Session = Depends(get_db),
    current_admin: models.Admin = Depends(
        require_role(*MESSAGE_ROLES)
    ),
):
    """
    Return a complete conversation thread.
    """

    thread = _get_thread(db, thread_id)

    unread_count = _get_unread_count(
        db,
        thread.id,
    )

    return schemas.ContactThreadDetail(
        id=str(thread.id),
        sender_name=thread.sender_name,
        sender_email=thread.sender_email,
        sender_phone=thread.sender_phone,
        subject=thread.subject,
        status=thread.status,
        is_replied=thread.is_replied,
        unread_count=unread_count,
        created_at=thread.created_at,
        updated_at=thread.updated_at,
        messages=[_serialize_message(m) for m in thread.messages],
    )


# ---------------------------------------------------------------------------
# Mark thread as read
# ---------------------------------------------------------------------------

@router.patch(
    "/{thread_id}/read",
    response_model=schemas.AdminActionResponse,
)
def mark_message_thread_read(
    thread_id: str,
    db: Session = Depends(get_db),
    current_admin: models.Admin = Depends(
        require_role(*MESSAGE_ROLES)
    ),
):
    """
    Mark all unread visitor messages in a thread as read.
    """

    thread = _get_thread(db, thread_id)

    changed = False

    for message in thread.messages:
        if (
            message.sender_type == "visitor"
            and not message.is_read
        ):
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
            detail=(
                f"Marked message thread as read for "
                f"{thread.sender_email}."
            ),
        )

    return schemas.AdminActionResponse(
        id=str(thread.id),
        status="read",
        message="Message thread marked as read.",
    )


# ---------------------------------------------------------------------------
# Reply
# ---------------------------------------------------------------------------

@router.post(
    "/{thread_id}/reply",
    response_model=schemas.ContactReplyResponse,
)
def reply_to_message_thread(
    thread_id: str,
    payload: schemas.ContactReplyRequest,
    db: Session = Depends(get_db),
    current_admin: models.Admin = Depends(
        require_role(*MESSAGE_ROLES)
    ),
):
    """
    Send an email reply to the visitor and record the reply
    in the conversation thread.

    Replies are sent from:

    info@africacreativeshowcase.com
    """

    thread = _get_thread(db, thread_id)

    body = payload.body.strip()

    if not body:
        raise HTTPException(
            status_code=400,
            detail="Reply message cannot be empty.",
        )

    reply_subject = _reply_subject(
        thread.subject
    )

    safe_body = escape(body).replace(
        "\n",
        "<br>",
    )

    safe_name = escape(
        thread.sender_name
    )

    email_html = f"""
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <p>Hello {safe_name},</p>

        <p>{safe_body}</p>

        <p>
            Best regards,<br>
            Africa Creative Showcase
        </p>
    </div>
    """

    sent = send_message_reply(
        to=thread.sender_email,
        subject=reply_subject,
        html=email_html,
    )

    if not sent:
        raise HTTPException(
            status_code=500,
            detail="We couldn't send the reply. Please try again.",
        )

    message = models.ContactMessage(
        thread_id=thread.id,
        sender_type="admin",
        sender_name=current_admin.full_name,
        sender_email="info@africacreativeshowcase.com",
        subject=reply_subject,
        body=body,
        admin_id=current_admin.id,
        is_read=True,
    )

    db.add(message)

    # A reply means Africa Creative Showcase has responded.
    thread.is_replied = True

    # A reply also makes the conversation active.
    thread.status = "open"

    # Move the conversation to the top of the inbox.
    thread.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(message)

    log_action(
        db,
        current_admin,
        "reply_to_contact_message",
        target_type="contact_thread",
        target_reference=str(thread.id),
        detail=(
            f"Replied to {thread.sender_email}."
        ),
    )

    return schemas.ContactReplyResponse(
        message=_serialize_message(message)
    )


# ---------------------------------------------------------------------------
# Close conversation
# ---------------------------------------------------------------------------

@router.patch(
    "/{thread_id}/close",
    response_model=schemas.AdminActionResponse,
)
def close_message_thread(
    thread_id: str,
    db: Session = Depends(get_db),
    current_admin: models.Admin = Depends(
        require_role(*MESSAGE_ROLES)
    ),
):
    """
    Close a conversation thread.

    Closing a thread does not change whether Africa Creative Showcase
    has replied.
    """

    thread = _get_thread(db, thread_id)

    thread.status = "closed"
    thread.updated_at = datetime.now(timezone.utc)

    db.commit()

    log_action(
        db,
        current_admin,
        "close_contact_thread",
        target_type="contact_thread",
        target_reference=str(thread.id),
        detail=(
            f"Closed conversation with "
            f"{thread.sender_email}."
        ),
    )

    return schemas.AdminActionResponse(
        id=str(thread.id),
        status="closed",
        message="Conversation closed.",
    )


# ---------------------------------------------------------------------------
# Reopen conversation
# ---------------------------------------------------------------------------

@router.patch(
    "/{thread_id}/reopen",
    response_model=schemas.AdminActionResponse,
)
def reopen_message_thread(
    thread_id: str,
    db: Session = Depends(get_db),
    current_admin: models.Admin = Depends(
        require_role(*MESSAGE_ROLES)
    ),
):
    """
    Reopen a previously closed conversation.

    Reopening does not change whether Africa Creative Showcase
    has replied.
    """

    thread = _get_thread(db, thread_id)

    thread.status = "open"
    thread.updated_at = datetime.now(timezone.utc)

    db.commit()

    log_action(
        db,
        current_admin,
        "reopen_contact_thread",
        target_type="contact_thread",
        target_reference=str(thread.id),
        detail=(
            f"Reopened conversation with "
            f"{thread.sender_email}."
        ),
    )

    return schemas.AdminActionResponse(
        id=str(thread.id),
        status="open",
        message="Conversation reopened.",
    )