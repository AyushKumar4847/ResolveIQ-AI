from fastapi import Depends, APIRouter, Response, Cookie, HTTPException
import uuid
from app.db.session import get_db
from app.core.config import settings
from app.schemas.user import RegisterUser, RegisterResponse, LoginRequest, UpdateUser, UserResponse, UpdateUserRole
from sqlalchemy.orm import Session
from app.repositories.user import (
    create_user,
    login_user,
    save_refresh_token,
    get_refresh_token,
    delete_refresh_token,
    update_user,
    delete_user,
    get_all_users,
    update_user_role,
)
from app.services.auth2 import create_token, create_refresh_token, decode_token
from app.models.user import User, RefreshToken
from datetime import datetime, timezone

router = APIRouter(
    prefix="/auth"
)

@router.post('/register', response_model=RegisterResponse)
def register(user: RegisterUser, db: Session = Depends(get_db)):
    registered_user = create_user(db, user)
    return RegisterResponse.model_validate(registered_user)


@router.post('/login')
def login(
    userinfo: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    user = login_user(db, userinfo)
    user_id = str(user.id)
    access_token = create_token({"sub": user_id})
    refresh_token, expires = create_refresh_token(user_id)
    save_refresh_token(db, refresh_token, user.id, expires)

    is_production = settings.APP_ENV == "production"
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=is_production,
        samesite="lax",
        path="/",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=is_production,
        samesite="lax",
        path="/auth",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
    )

    return {
        "message": "Logged in",
        "user": {
            "id": str(user.id),
            "username": user.username,
            "email": user.email,
            "role": user.role
        }
    }


@router.post('/refresh')
def refresh(
    response: Response,
    refresh_token: str | None = Cookie(default=None),
    db: Session = Depends(get_db),
):
    if not refresh_token:
        raise HTTPException(status_code=401, detail="No refresh token")

    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    token_record = get_refresh_token(db, refresh_token)
    if not token_record:
        raise HTTPException(status_code=401, detail="Refresh token not found")

    if token_record.expires_at < datetime.now(timezone.utc):
        delete_refresh_token(db, refresh_token)
        raise HTTPException(status_code=401, detail="Refresh token expired")

    user_id = payload.get("sub")

    # Token Rotation
    delete_refresh_token(db, refresh_token)
    new_access_token = create_token({"sub": user_id})
    new_refresh_token, new_expires = create_refresh_token(user_id)
    save_refresh_token(db, new_refresh_token, token_record.user_id, new_expires)

    is_production = settings.APP_ENV == "production"
    response.set_cookie(
        key="access_token",
        value=new_access_token,
        httponly=True,
        secure=is_production,
        samesite="lax",
        path="/",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        httponly=True,
        secure=is_production,
        samesite="lax",
        path="/auth",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
    )

    return {"message": "Token refreshed"}


def get_current_user(access_token: str | None = Cookie(default=None), db: Session = Depends(get_db)) -> User:
    if not access_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_token(access_token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


@router.get('/me', response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post('/logout')
def logout(response: Response, access_token: str | None = Cookie(default=None), db: Session = Depends(get_db), refresh_token: str | None = Cookie(default=None)):
    if not access_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    if refresh_token:
        db.query(RefreshToken).filter(RefreshToken.token == refresh_token).delete()
        db.commit()
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/auth")
    return {"message": "Logged out"}


@router.patch('/update', response_model=RegisterResponse)
def update_user_details(body: UpdateUser, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    updated_user = update_user(db, current_user, body)
    return RegisterResponse.model_validate(updated_user)


@router.delete('/delete', status_code=204)
def delete_user_account(response: Response, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    delete_user(db, current_user)
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/auth")
    return None


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if (current_user.role or "").strip().lower() != "admin":
        raise HTTPException(status_code=403, detail="Admin privileges required to perform this action")
    return current_user


@router.get('/users', response_model=list[UserResponse])
def list_all_users(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    """Only admins can view all users in the system."""
    return get_all_users(db)


@router.patch('/users/{user_id}/role', response_model=UserResponse)
def change_user_role(
    user_id: uuid.UUID,
    body: UpdateUserRole,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Only admins can assign or change roles of any user."""
    return update_user_role(db, user_id, body.role)