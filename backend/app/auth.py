from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .config import settings
from .db import get_db
from .models import User, Role


ALGORITHM = "HS256"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")
# Updated CryptContext to handle bcrypt compatibility issues
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12,
    bcrypt__ident="2b"  # Explicitly set bcrypt identifier
)


class TokenData(BaseModel):
    sub: str
    exp: int


def verify_password(plain_password: str, password_hash: str) -> bool:
    """Verify password with error handling for hash compatibility issues"""
    try:
        return pwd_context.verify(plain_password, password_hash)
    except Exception as e:
        # Log the error for debugging
        print(f"Password verification error: {e}")
        # For compatibility, try to rehash the password if it's a hash format issue
        try:
            # If the hash is malformed, we'll return False
            return False
        except:
            return False


def get_password_hash(password: str) -> str:
    """Generate password hash with proper bcrypt configuration"""
    return pwd_context.hash(password)


def authenticate_user(db: Session, username: str, password: str) -> Optional[User]:
    user = db.query(User).filter(User.username == username).first()
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


def create_access_token(subject: str, expires_delta: timedelta | None = None) -> str:
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=settings.access_token_expire_minutes))
    to_encode = {"sub": subject, "exp": int(expire.timestamp())}
    return jwt.encode(to_encode, settings.secret_key, algorithm=ALGORITHM)


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except Exception:
        raise credentials_exception
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    return user


def require_role(required: str):
    def dep(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> User:
        role = db.query(Role).filter(Role.id == user.role_id).first()
        # Compare role names case-insensitively to avoid mismatches like 'admin' vs 'Admin'
        if not role or (role.name or "").lower() != (required or "").lower():
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
        return user
    return dep


def require_any_role(required_roles: list[str]):
    """Allow access if the current user's role matches any of the required roles.

    Example: Depends(require_any_role(["Admin", "Store"]))
    """
    def dep(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> User:
        role = db.query(Role).filter(Role.id == user.role_id).first()
        # Case-insensitive comparison for role membership
        required_lower = {(r or "").lower() for r in required_roles}
        current_role = (role.name or "").lower() if role else ""
        if not role or current_role not in required_lower:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
        return user
    return dep

