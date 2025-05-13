"""
Routes package for the VAIO Board backend.

This package contains all the API routes organized by functionality:
- auth: Authentication routes
- env: Environment and system information routes
- layout: Layout and user session management routes
- logs: Log management routes
- module: Module management routes
- service: Service management routes
- user: User management routes
"""

from backend.routes.routes import router as main_router

__all__ = ['main_router']