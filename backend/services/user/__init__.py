"""User management services for authentication, sessions, and preferences."""

# Export key functions from session_loader for easier imports
from .session_loader import (
    load_active_session,
    save_session_state,
    start_new_session
)

__all__ = [
    'load_active_session',
    'save_session_state',
    'start_new_session'
]
