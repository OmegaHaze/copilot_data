"""
Socket utility functions for the VAIO Board backend.

This package provides helper utilities for socket.io operations.
"""

from .socket_helpers import emit_to_namespace
from .pty_handler import PTYState, NAMESPACE as PTY_NAMESPACE

__all__ = ['emit_to_namespace', 'PTYState', 'PTY_NAMESPACE']