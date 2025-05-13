"""
Layout management routes for the VAIO Board backend.

This package contains routes for managing user layouts and session state:
- pane_layout: Routes for managing saved user layouts
- routes_session: Routes for managing user session state
"""

from backend.routes.layout.pane_layout import router as pane_layout_router
from backend.routes.layout.routes_session import router as session_router

__all__ = ['pane_layout_router', 'session_router']