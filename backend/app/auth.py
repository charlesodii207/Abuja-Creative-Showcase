import bcrypt
import jwt
from datetime import datetime, timedelta, timezone

from app.config import settings

ALGORITHM = "HS256"
TOKEN_EXPIRE_HOURS = 12


def hash_password(plain_password: str) -> str:
    return bcrypt.hashpw(plain_password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain_password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(plain_password.encode(), password_hash.encode())


def create_access_token(admin_id: str, role: str, must_change_password: bool) -> str:
    payload = {
        "sub": admin_id,
        "role": role,
        "must_change_password": must_change_password,
        "exp": datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRE_HOURS),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    return jwt.decode(token, settings.jwt_secret, algorithms=[ALGORITHM])