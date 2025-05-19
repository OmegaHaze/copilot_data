"""WebSocket module handlers for dynamic module management.

This package provides isolated implementations of module handlers
that avoid circular dependencies in the import system.
"""

# Import the isolated implementation to avoid circular dependencies
from .module_handler import register_module_handlers

__all__ = ['register_module_handlers']
