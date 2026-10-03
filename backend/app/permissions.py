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


def permissions_for(admin) -> list[str]:
    """Sections this admin can use. Seniors get everything; regular admins
    get the union of the sections of every department they belong to."""
    if admin.role.value in SENIOR_ROLES:
        return sorted(ALL_PERMISSIONS)

    granted: set[str] = set()
    for department in admin.departments or []:
        granted |= DEPARTMENT_SECTIONS.get(department, set())

    return sorted(granted)