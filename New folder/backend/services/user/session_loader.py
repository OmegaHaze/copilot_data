# backend/services/user/session_loader.py
"""User session management utilities for loading, saving, and creating user sessions."""

from typing import Dict, Any, cast
from sqlmodel import Session as DBSession, select
from backend.db.session import engine
from backend.db.models import UserSession

def load_active_session(user_id: int) -> Dict[str, Any]:
    """Load the active session for a user."""
    with DBSession(engine) as session:
        result: UserSession | None = session.exec(
            select(UserSession).where(UserSession.user_id == user_id)
        ).first()

        if result is not None:
            return {
                "grid_layout": result.grid_layout,
                "active_modules": result.active_modules,
                "preferences": result.preferences,
                "last_active": result.last_active,
                "created_at": result.created_at
                
            }
        return {}

def save_session_state(user_id: int, new_config: Dict[str, Any]) -> bool:
    """Save updated session state for a user."""
    with DBSession(engine) as session:
        result: UserSession | None = session.exec(
            select(UserSession).where(UserSession.user_id == user_id)
        ).first()

        if result is None:
            try:
                new_session_id = start_new_session(user_id)
                result = session.exec(
                    select(UserSession).where(UserSession.id == new_session_id)
                ).first()
                if result is None:
                    raise ValueError(f"Failed to retrieve newly created session with ID {new_session_id}")
            except Exception as e:
                print(f"Failed to create new session: {e}")
                return False

        if "grid_layout" in new_config:
            result.grid_layout = new_config["grid_layout"]
        if "active_modules" in new_config:
            result.active_modules = new_config["active_modules"]
        if "preferences" in new_config:
            result.preferences = new_config["preferences"]
        if "name" in new_config:
            result.name = new_config["name"]

        session.add(result)
        session.commit()
        return True

def start_new_session(user_id: int, name: str = "New Session") -> int:
    """Create a new user session and return its ID."""
    with DBSession(engine) as session:
        existing: UserSession | None = session.exec(
            select(UserSession).where(UserSession.user_id == user_id)
        ).first()

        if existing is not None and existing.id is not None:
            return cast(int, existing.id)
        elif existing is not None:
            raise ValueError("Retrieved session has no ID")

        new_sesh = UserSession(
            user_id=user_id,
            grid_layout=dict(),
            active_modules=list(),
            preferences=dict(),           
        )
        session.add(new_sesh)
        session.commit()
        session.refresh(new_sesh)

        if new_sesh.id is None:
            raise ValueError("Failed to create session - no ID returned")

        return cast(int, new_sesh.id)
