"""
Core functionality for the VAIO Board backend.

This package contains fundamental components such as:
- Configuration management
- Logging setup
"""

from backend.core.config import config
from backend.core.logging_config import configure_logging, redirect_stdout_stderr

__all__ = ['config', 'configure_logging', 'redirect_stdout_stderr']