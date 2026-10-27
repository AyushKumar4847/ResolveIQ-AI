from app.models.user import User, RefreshToken
from fastapi import HTTPException
from app.services.auth import hash_password, verify_password


def create_user(db, userinfo):

    user = db.query(User).filter(User.email == userinfo.email).first()

    if user:
        raise HTTPException(status_code=409, detail="User already exists")

    hashed_password = hash_password(userinfo.password)

    save_user = User(
        username=userinfo.username,
        email=userinfo.email,
        password=hashed_password
    )
    db.add(save_user)
    db.commit()

    return save_user


def login_user(db, userinfo):
    user = db.query(User).filter(User.email == userinfo.email).first()

    if not user or not verify_password(userinfo.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return user


def save_refresh_token(db, token, user_id, expires):
    save_token = RefreshToken(
        user_id=user_id,
        token=token,
        expires_at=expires
    )
    db.add(save_token)
    db.commit()
    return True


def get_refresh_token(db, token: str):
    return db.query(RefreshToken).filter(RefreshToken.token == token).first()


def delete_refresh_token(db, token: str):
    db.query(RefreshToken).filter(RefreshToken.token == token).delete()
    db.commit()


def update_user(db, user, userinfo):
    if userinfo.username:
        user.username = userinfo.username
    if userinfo.email:
        existing = db.query(User).filter(User.email == userinfo.email, User.id != user.id).first()
        if existing:
            raise HTTPException(status_code=409, detail="Email already in use")
        user.email = userinfo.email
    if userinfo.new_password:
        if not userinfo.current_password or not verify_password(userinfo.current_password, user.password):
            raise HTTPException(status_code=401, detail="Current password is incorrect")
        user.password = hash_password(userinfo.new_password)
    db.commit()
    db.refresh(user)
    return user


def delete_user(db, user):
    db.query(RefreshToken).filter(RefreshToken.user_id == user.id).delete()
    db.delete(user)
    db.commit()
    return True


def get_all_users(db):
    return db.query(User).order_by(User.created_at.desc()).all()


def update_user_role(db, user_id, new_role: str):
    valid_roles = ["user", "agent", "admin"]
    if new_role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of {valid_roles}")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.role = new_role
    db.commit()
    db.refresh(user)
    return user
