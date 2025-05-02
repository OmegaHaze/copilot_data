# (7map) User management router - User operations and information
# Handles: User data retrieval, profile information, and authentication checks

from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from backend.db.session import engine
from backend.db.models import User
from backend.services.auth.auth import get_current_user

router = APIRouter()

@router.get("/{user_id}/pane/{pane_id}")
def get_user_pane(user_id: str, pane_id: str):
    return {"user": user_id, "pane": pane_id, "status": "NOT_IMPLEMENTED"}

@router.get("/me")
def get_me(user = Depends(get_current_user)):
    return {
        "id": user.id,
        "username": user.username,
        "name": user.name,
        "role": user.role,
        "is_admin": user.role.upper() == "SU"
    }

@router.get("/exists")
def user_exists():
    with Session(engine) as session:
        result = session.exec(select(User)).first()
        return {"exists": bool(result)}
