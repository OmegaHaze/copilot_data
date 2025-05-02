# (3map) Authentication routes - Admin setup, login, and logout
# Handles: Admin creation, user login/logout, session cookies

from fastapi import APIRouter, HTTPException
from sqlmodel import select, Session
from backend.db.models import User
from backend.db.session import engine
from backend.services.auth.auth import hash_password, verify_password
from fastapi.responses import JSONResponse

router = APIRouter()

@router.post("/auth/set-admin")
def set_admin(data: dict):
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        raise HTTPException(status_code=400, detail="Missing username or password")

    with Session(engine) as session:
        existing = session.exec(select(User).where(User.role == "SU")).first()
        if existing:
            raise HTTPException(status_code=403, detail="Admin already exists")

        user = User(name=username, username=username, password=hash_password(password), role="SU")
        session.add(user)
        session.commit()
        session.refresh(user)

        response = JSONResponse(content={"message": "Admin created", "user_id": user.id})
        response.set_cookie("vaio_user", str(user.id), httponly=True, samesite="lax")
        return response


@router.post("/auth/login")
def login(data: dict):
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        raise HTTPException(status_code=400, detail="Missing credentials")

    with Session(engine) as session:
        user = session.exec(select(User).where(User.username == username)).first()
        if not user or not verify_password(password, user.password):
            raise HTTPException(status_code=401, detail="Invalid username or password")

        response = JSONResponse(content={"message": "Login successful", "user_id": user.id})
        response.set_cookie("vaio_user", str(user.id), httponly=True, samesite="lax")
        return response


@router.post("/auth/logout")
def logout():
    response = JSONResponse(content={"message": "Logged out"})
    response.delete_cookie("vaio_user")
    return response
