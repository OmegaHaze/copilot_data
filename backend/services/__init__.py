"""
Services package for the VAIO Board backend.

This package contains service implementations for:
- auth: Authentication and authorization services
- env: Environment and system information services
- installer: Module installation services
- logs: Logging services
- status: System status monitoring services
- user: User management services
"""

from backend.services.service_manager import start_service, stop_service
from backend.services.service_registry import get_all_modules, get_modules_by_type

__all__ = [
    'start_service',
    'stop_service',
    'get_all_modules',
    'get_modules_by_type'
]