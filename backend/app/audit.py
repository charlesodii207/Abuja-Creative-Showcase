from sqlalchemy.orm import Session

from app import models


def log_action(
    db: Session,
    admin: "models.Admin | None",
    action: str,
    target_type: str | None = None,
    target_reference: str | None = None,
    detail: str | None = None,
) -> None:
    """
    Writes one audit log entry. Pass admin=None for system-triggered events
    (e.g. an automatic email fired by a payment webhook) — it'll be recorded
    with admin_name="System".

    Call this AFTER db.commit() on the action itself, so a failed log write
    never rolls back the actual action. This function commits its own entry
    separately.
    """
    entry = models.AdminLog(
        admin_id=admin.id if admin else None,
        admin_name=admin.full_name if admin else "System",
        action=action,
        target_type=target_type,
        target_reference=target_reference,
        detail=detail,
    )
    db.add(entry)
    db.commit()