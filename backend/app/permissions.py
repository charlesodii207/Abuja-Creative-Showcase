# app/permissions.py
#
# Departments are presets of sections for regular admins. Super admins and
# the system owner always have every section and don't use departments.
# Keep this in sync with frontend/lib/admin/permissions.ts.

DEPARTMENT_SECTIONS: dict[str, set[str]] = {
    "messaging_support": {"messages", "live_chat", "event_scan", "event_log"},
    "insights_reporting": {"analytics", "event_scan", "event_log"},
    "digital_marketing": {"traffic", "event_log"},
    "hospitality_logistics": {"hotels", "event_log"},
    "gate_checkin": {"event_scan", "event_log"},
}

ALL_DEPARTMENTS = set(DEPARTMENT_SECTIONS)
ALL_PERMISSIONS: set[str] = set().union(*DEPARTMENT_SECTIONS.values())

SENIOR_ROLES = ("system_owner", "super_admin")

# Shared mailboxes. Keys must match MAILBOXES in app/emailer.py.
ALL_MAILBOXES = {"admin", "info", "director", "convener", "bookings", "marketing"}


def permissions_for(admin) -> list[str]:
    """Sections this admin can use. Seniors get everything; regular admins
    get the sections of every department they belong to, plus any
    individual sections granted to them on top."""
    if admin.role.value in SENIOR_ROLES:
        return sorted(ALL_PERMISSIONS)

    granted: set[str] = set()
    for department in admin.departments or []:
        granted |= DEPARTMENT_SECTIONS.get(department, set())

    granted |= {p for p in (admin.extra_permissions or []) if p in ALL_PERMISSIONS}

    return sorted(granted)


def mailboxes_for(admin, need: str = "read") -> list[str]:
    """Mailboxes this admin may read or send from.

    Only the system owner gets every mailbox automatically. Everyone else,
    super admins included, needs the 'messages' section AND an explicit
    grant from the owner. Sending implies reading."""
    if admin.role.value == "system_owner":
        return sorted(ALL_MAILBOXES)

    if "messages" not in permissions_for(admin):
        return []

    sendable = set(admin.mailboxes_send or [])
    readable = set(admin.mailboxes_read or []) | sendable
    chosen = sendable if need == "send" else readable
    return sorted(chosen & ALL_MAILBOXES)