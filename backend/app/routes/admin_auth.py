from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.auth import hash_password, verify_password, create_access_token
from app.dependencies import get_current_admin, get_current_admin_allow_password_change, require_role
from app.audit import log_action
from app.permissions import ALL_DEPARTMENTS, ALL_PERMISSIONS, permissions_for

router = APIRouter(prefix="/admin/auth", tags=["admin-auth"])


def _summary(a: models.Admin) -> schemas.AdminSummary:
    return schemas.AdminSummary(
        id=str(a.id),
        full_name=a.full_name,
        username=a.username,
        role=a.role.value,
        is_active=a.is_active,
        must_change_password=a.must_change_password,
        last_login_at=a.last_login_at.isoformat() if a.last_login_at else None,
        departments=list(a.departments or []),
        extra_permissions=list(a.extra_permissions or []),
    )


def _get_admin_or_404(db: Session, admin_id: str) -> models.Admin:
    target = db.query(models.Admin).filter(models.Admin.id == admin_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Admin not found.")
    return target


def _clean_departments(raw: list[str]) -> list[str]:
    unknown = [d for d in raw if d not in ALL_DEPARTMENTS]
    if unknown:
        raise HTTPException(status_code=400, detail=f"Unknown department: {unknown[0]}.")
    # de-duplicate, keep the order they were ticked in
    return list(dict.fromkeys(raw))


def _clean_permissions(raw: list[str]) -> list[str]:
    unknown = [p for p in raw if p not in ALL_PERMISSIONS]
    if unknown:
        raise HTTPException(status_code=400, detail=f"Unknown section: {unknown[0]}.")
    return list(dict.fromkeys(raw))


@router.post("/login", response_model=schemas.LoginResponse)
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)):
    admin = db.query(models.Admin).filter(models.Admin.username == payload.username).first()

    if not admin or not verify_password(payload.password, admin.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password.")

    if not admin.is_active:
        raise HTTPException(status_code=403, detail="This account has been deactivated.")

    admin.last_login_at = datetime.now(timezone.utc)
    db.commit()

    log_action(db, admin, "login", target_type="admin", target_reference=admin.username)

    token = create_access_token(
        admin_id=str(admin.id),
        role=admin.role.value,
        must_change_password=admin.must_change_password,
    )

    return schemas.LoginResponse(
        token=token,
        must_change_password=admin.must_change_password,
        full_name=admin.full_name,
        role=admin.role.value,
        permissions=permissions_for(admin),
    )


@router.get("/me", response_model=schemas.MeResponse)
def me(admin: models.Admin = Depends(get_current_admin)):
    """Current role and sections, straight from the database."""
    return schemas.MeResponse(
        full_name=admin.full_name,
        role=admin.role.value,
        permissions=permissions_for(admin),
    )


@router.post("/change-password", response_model=schemas.AdminActionResponse)
def change_password(
    payload: schemas.ChangePasswordRequest,
    db: Session = Depends(get_db),
    admin: models.Admin = Depends(get_current_admin_allow_password_change),
):
    if not verify_password(payload.current_password, admin.password_hash):
        raise HTTPException(status_code=401, detail="Current password is incorrect.")

    if len(payload.new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters.")

    admin.password_hash = hash_password(payload.new_password)
    admin.must_change_password = False
    db.commit()

    log_action(
        db, admin, "change_password",
        target_type="admin",
        target_reference=admin.username,
    )

    return schemas.AdminActionResponse(
        id=str(admin.id),
        status="password_changed",
        message="Password updated successfully.",
    )


@router.post("/create-admin", response_model=schemas.AdminSummary)
def create_admin(
    payload: schemas.CreateAdminRequest,
    db: Session = Depends(get_db),
    # Super Admins can create both Admins and Super Admins.
    current_admin: models.Admin = Depends(require_role("system_owner", "super_admin")),
):
    if payload.role not in ("super_admin", "admin"):
        raise HTTPException(status_code=400, detail="Role must be 'super_admin' or 'admin'.")

    existing = db.query(models.Admin).filter(models.Admin.username == payload.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="That username is already taken.")

    # Departments only apply to regular admins; super admins see everything.
    departments = _clean_departments(payload.departments) if payload.role == "admin" else []
    extra_permissions = _clean_permissions(payload.extra_permissions) if payload.role == "admin" else []

    new_admin = models.Admin(
        full_name=payload.full_name,
        username=payload.username,
        password_hash=hash_password(payload.temp_password),
        role=models.AdminRole(payload.role),
        must_change_password=True,
        created_by=current_admin.id,
        departments=departments,
        extra_permissions=extra_permissions,
    )
    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)

    log_action(
        db, current_admin, "create_admin",
        target_type="admin",
        target_reference=new_admin.username,
        detail=(
            f"Created as {new_admin.role.value}"
            + (f" in: {', '.join(departments)}" if departments else "")
            + (f" + sections: {', '.join(extra_permissions)}" if extra_permissions else "")
        ),
    )

    return _summary(new_admin)


@router.get("/admins", response_model=list[schemas.AdminSummary])
def list_admins(
    sort: str = Query(default="alpha", pattern="^(alpha|recent)$"),
    db: Session = Depends(get_db),
    # Any logged-in admin can view this list — the filtering below is
    # what actually restricts what a plain "admin" gets to see. This is
    # deliberately different from create/deactivate/delete, which stay
    # locked to system_owner/super_admin only.
    current_admin: models.Admin = Depends(require_role("system_owner", "super_admin", "admin")),
):
    query = db.query(models.Admin)

    # A plain "admin" only sees their fellow admins — never super_admin
    # or system_owner accounts. Owners and super admins see everyone.
    if current_admin.role == models.AdminRole.admin:
        query = query.filter(models.Admin.role == models.AdminRole.admin)

    if sort == "recent":
        query = query.order_by(models.Admin.created_at.desc())
    else:
        query = query.order_by(models.Admin.full_name.asc())

    return [_summary(a) for a in query.all()]


@router.patch("/admins/{admin_id}/departments", response_model=schemas.AdminActionResponse)
def update_admin_departments(
    admin_id: str,
    payload: schemas.UpdateAdminDepartmentsRequest,
    db: Session = Depends(get_db),
    current_admin: models.Admin = Depends(require_role("system_owner", "super_admin")),
):
    target = _get_admin_or_404(db, admin_id)

    if target.role != models.AdminRole.admin:
        raise HTTPException(
            status_code=400,
            detail="Departments only apply to Admin accounts. Super Admins already have full access.",
        )

    new_departments = _clean_departments(payload.departments)
    old_departments = list(target.departments or [])

    old_extras = list(target.extra_permissions or [])
    new_extras = (
        _clean_permissions(payload.extra_permissions)
        if payload.extra_permissions is not None
        else old_extras
    )

    target.departments = new_departments
    target.extra_permissions = new_extras
    db.commit()

    log_action(
        db, current_admin, "update_departments",
        target_type="admin",
        target_reference=target.username,
        detail=(
            f"Departments: {', '.join(old_departments) or 'none'}"
            f" → {', '.join(new_departments) or 'none'}"
            f" | Extra sections: {', '.join(old_extras) or 'none'}"
            f" → {', '.join(new_extras) or 'none'}"
        ),
    )

    return schemas.AdminActionResponse(
        id=str(target.id),
        status="access_updated",
        message=f"Access updated for {target.full_name}. It shows on their screen within about 30 seconds.",
    )


@router.patch("/admins/{admin_id}/role", response_model=schemas.AdminActionResponse)
def change_admin_role(
    admin_id: str,
    payload: schemas.ChangeAdminRoleRequest,
    db: Session = Depends(get_db),
    current_admin: models.Admin = Depends(require_role("system_owner", "super_admin")),
):
    if payload.role not in ("super_admin", "admin"):
        raise HTTPException(status_code=400, detail="Role must be 'super_admin' or 'admin'.")

    target = _get_admin_or_404(db, admin_id)

    if target.id == current_admin.id:
        raise HTTPException(status_code=400, detail="You can't change your own role.")

    if target.role == models.AdminRole.system_owner:
        raise HTTPException(status_code=403, detail="The System Owner's role can't be changed.")

    new_role = models.AdminRole(payload.role)

    if target.role == new_role:
        raise HTTPException(
            status_code=400,
            detail=f"{target.full_name} is already a {new_role.value.replace('_', ' ')}.",
        )

    is_downgrade = new_role == models.AdminRole.admin

    # Super Admins can upgrade, but only the System Owner can downgrade.
    if is_downgrade and current_admin.role != models.AdminRole.system_owner:
        raise HTTPException(
            status_code=403,
            detail="Only the System Owner can downgrade a Super Admin.",
        )

    old_role = target.role.value
    target.role = new_role
    db.commit()

    log_action(
        db, current_admin, "downgrade_admin" if is_downgrade else "upgrade_admin",
        target_type="admin",
        target_reference=target.username,
        detail=f"{old_role} → {new_role.value}",
    )

    return schemas.AdminActionResponse(
        id=str(target.id),
        status="role_changed",
        message=(
            f"{target.full_name} is now a {new_role.value.replace('_', ' ')}. "
            "They'll see the change next time they sign in."
        ),
    )


@router.patch("/admins/{admin_id}/deactivate", response_model=schemas.AdminActionResponse)
def deactivate_admin(
    admin_id: str,
    db: Session = Depends(get_db),
    current_admin: models.Admin = Depends(require_role("system_owner", "super_admin")),
):
    target = _get_admin_or_404(db, admin_id)

    if target.id == current_admin.id:
        raise HTTPException(status_code=400, detail="You can't deactivate your own account.")

    if target.role == models.AdminRole.system_owner:
        raise HTTPException(status_code=403, detail="The System Owner account can't be deactivated.")

    if current_admin.role == models.AdminRole.super_admin and target.role != models.AdminRole.admin:
        raise HTTPException(status_code=403, detail="Super Admins can only deactivate Admin accounts.")

    target.is_active = False
    db.commit()

    log_action(
        db, current_admin, "deactivate_admin",
        target_type="admin",
        target_reference=target.username,
    )

    return schemas.AdminActionResponse(
        id=str(target.id),
        status="deactivated",
        message=f"{target.full_name} has been deactivated.",
    )


@router.delete("/admins/{admin_id}", response_model=schemas.AdminActionResponse)
def delete_admin(
    admin_id: str,
    db: Session = Depends(get_db),
    # System Owner can delete anyone but themselves; Super Admins can
    # delete regular Admins only (checked below).
    current_admin: models.Admin = Depends(require_role("system_owner", "super_admin")),
):
    target = _get_admin_or_404(db, admin_id)

    if target.id == current_admin.id:
        raise HTTPException(status_code=400, detail="You can't delete your own account.")

    if target.role == models.AdminRole.system_owner:
        raise HTTPException(status_code=403, detail="The System Owner account can't be deleted.")

    if current_admin.role == models.AdminRole.super_admin and target.role != models.AdminRole.admin:
        raise HTTPException(status_code=403, detail="Super Admins can only delete Admin accounts.")

    deleted_name = target.full_name
    deleted_username = target.username
    deleted_role = target.role.value

    log_action(
        db, current_admin, "delete_admin",
        target_type="admin",
        target_reference=deleted_username,
        detail=f"Deleted {deleted_name} ({deleted_role})",
    )

    db.delete(target)
    db.commit()

    return schemas.AdminActionResponse(
        id=admin_id,
        status="deleted",
        message=f"{deleted_name} has been deleted. Their username is now available for reuse.",
    )