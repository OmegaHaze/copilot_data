# (4map) Authentication service - Password hashing, verification, and user retrieval
# Handles: Password security, session-based user authentication

from passlib.hash import bcrypt  # type: ignore # Helps Pylance recognize the import
from fastapi import Request, HTTPException
from sqlmodel import Session, select
from backend.db.session import engine
from backend.db.models import User

# Define bcrypt type if needed
if False:  # This block is never executed but helps with type checking
    from passlib.handlers.bcrypt import bcrypt_sha256 as bcrypt

def hash_password(password: str) -> str:
    return bcrypt.hash(password)

def get_current_user(request: Request) -> User:
    user_id = request.cookies.get("vaio_user")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")

    with Session(engine) as session:
        user = session.exec(select(User).where(User.id == int(user_id))).first()
        if not user:
            raise HTTPException(status_code=401, detail="Invalid user")

        return user

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.verify(password, hashed)
