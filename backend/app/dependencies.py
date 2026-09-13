from fastapi import Depends, HTTPException, Header
from sqlalchemy.orm import Session
import jwt

from app.database import get_db
from app import models
from app.auth import decode_access_token


def _get_admin_from_token(authorization: str, db: Session) -> tuple[models.Admin, dict]:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated.")

    token = authorization.split(" ", 1)[1]
    try:
        payload = decode_access_token(token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired, please log in again.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token.")

    admin = db.query(models.Admin).filter(models.Admin.id == payload["sub"]).first()
    if not admin or not admin.is_active:
        raise HTTPException(status_code=401, detail="Account not found or deactivated.")

    return admin, payload


def get_current_admin(
    authorization: str = Header(default=None),
    db: Session = Depends(get_db),
) -> models.Admin:
    """Standard dependency for all normal admin routes.
    Blocks access if the admin still has a forced password change pending."""
    admin, _ = _get_admin_from_token(authorization, db)

    if admin.must_change_password:
        raise HTTPException(status_code=403, detail="Password change required before continuing.")

    return admin


def get_current_admin_allow_password_change(
    authorization: str = Header(default=None),
    db: Session = Depends(get_db),
) -> models.Admin:
    """Same as get_current_admin, but allowed even if must_change_password is True.
    Use ONLY on the change-password endpoint (and /me, if you add one)."""
    admin, _ = _get_admin_from_token(authorization, db)
    return admin


def require_role(*allowed_roles: str):
    """Usage: Depends(require_role("system_owner", "super_admin"))"""
    def checker(admin: models.Admin = Depends(get_current_admin)) -> models.Admin:
        if admin.role.value not in allowed_roles:
            raise HTTPException(status_code=403, detail="You don't have permission to do this.")
        return admin
    return checker