from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.auth import hash_password, verify_password, create_access_token
from app.dependencies import get_current_admin_allow_password_change, require_role
from app.audit import log_action

router = APIRouter(prefix="/admin/auth", tags=["admin-auth"])


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
    current_admin: models.Admin = Depends(require_role("system_owner", "super_admin")),
):
    if current_admin.role == models.AdminRole.super_admin and payload.role != "admin":
        raise HTTPException(status_code=403, detail="Super Admins can only create Admin accounts.")

    if payload.role not in ("super_admin", "admin"):
        raise HTTPException(status_code=400, detail="Role must be 'super_admin' or 'admin'.")

    existing = db.query(models.Admin).filter(models.Admin.username == payload.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="That username is already taken.")

    new_admin = models.Admin(
        full_name=payload.full_name,
        username=payload.username,
        password_hash=hash_password(payload.temp_password),
        role=models.AdminRole(payload.role),
        must_change_password=True,
        created_by=current_admin.id,
    )
    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)

    log_action(
        db, current_admin, "create_admin",
        target_type="admin",
        target_reference=new_admin.username,
        detail=f"Created as {new_admin.role.value}",
    )

    return schemas.AdminSummary(
        id=str(new_admin.id),
        full_name=new_admin.full_name,
        username=new_admin.username,
        role=new_admin.role.value,
        is_active=new_admin.is_active,
        must_change_password=new_admin.must_change_password,
        last_login_at=None,
    )


@router.get("/admins", response_model=list[schemas.AdminSummary])
def list_admins(
    db: Session = Depends(get_db),
    current_admin: models.Admin = Depends(require_role("system_owner", "super_admin")),
):
    admins = db.query(models.Admin).order_by(models.Admin.created_at.desc()).all()

    return [
        schemas.AdminSummary(
            id=str(a.id),
            full_name=a.full_name,
            username=a.username,
            role=a.role.value,
            is_active=a.is_active,
            must_change_password=a.must_change_password,
            last_login_at=a.last_login_at.isoformat() if a.last_login_at else None,
        )
        for a in admins
    ]


@router.patch("/admins/{admin_id}/deactivate", response_model=schemas.AdminActionResponse)
def deactivate_admin(
    admin_id: str,
    db: Session = Depends(get_db),
    current_admin: models.Admin = Depends(require_role("system_owner", "super_admin")),
):
    target = db.query(models.Admin).filter(models.Admin.id == admin_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Admin not found.")

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