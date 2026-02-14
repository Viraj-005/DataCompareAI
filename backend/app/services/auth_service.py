from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate, PasswordUpdate
from app.core.security import get_password_hash, verify_password, create_access_token


def create_user(db: Session, user_data: UserCreate) -> User:
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise ValueError("Email already registered")
    user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        hashed_password=get_password_hash(user_data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str):
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user


def generate_token(user: User) -> dict:
    access_token = create_access_token(data={"sub": str(user.id)})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user,
    }


def update_user_profile(db: Session, user: User, data: UserUpdate) -> User:
    if data.full_name:
        user.full_name = data.full_name
    if data.email:
        # Check if email is taken by another user
        existing = db.query(User).filter(User.email == data.email, User.id != user.id).first()
        if existing:
            raise ValueError("Email already in use")
        user.email = data.email
    
    db.commit()
    db.refresh(user)
    return user


def change_user_password(db: Session, user: User, data: PasswordUpdate):
    if not verify_password(data.current_password, user.hashed_password):
        raise ValueError("Incorrect current password")
    
    user.hashed_password = get_password_hash(data.new_password)
    db.commit()

