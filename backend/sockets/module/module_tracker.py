"""Central module registry service for unified module lookups.

This module provides a central registry for all module operations
and avoids circular dependencies between socket handlers and service management.
"""

import logging
from typing import Optional, List, Dict
from sqlmodel import select, Session
from backend.db.session import engine
from backend.db.models import Module, ModuleType

logger = logging.getLogger(__name__)

# Optional caching to reduce database queries
_module_cache: Dict[str, Module] = {}
_cache_enabled = True  # Toggle for testing/development

def get_module(module_name: str, use_cache: bool = True) -> Optional[Module]:
    """Get module info by its internal module path or ID name.
    
    Args:
        module_name: The name/key of the module to find
        use_cache: Whether to use the internal cache (defaults to True)
        
    Returns:
        Module instance if found, None otherwise
    """
    if use_cache and _cache_enabled and module_name in _module_cache:
        return _module_cache[module_name]
        
    try:
        with Session(engine) as session:
            stmt = select(Module).where(Module.module == module_name)
            module = session.exec(stmt).first()
            
            # Cache result if found
            if module and use_cache and _cache_enabled:
                _module_cache[module_name] = module
                
            return module
    except Exception as e:
        logger.error(f"Error retrieving module {module_name}: {str(e)}")
        return None

def get_all_modules() -> List[Module]:
    """Get all modules, regardless of type."""
    try:
        with Session(engine) as session:
            stmt = select(Module)
            return list(session.exec(stmt))
    except Exception as e:
        logger.error(f"Error retrieving all modules: {str(e)}")
        return []

def get_module_by_id(module_id: int) -> Optional[Module]:
    """Get a single module by ID."""
    try:
        with Session(engine) as session:
            stmt = select(Module).where(Module.id == module_id)
            return session.exec(stmt).first()
    except Exception as e:
        logger.error(f"Error retrieving module by ID {module_id}: {str(e)}")
        return None

def get_modules_by_type(module_type: ModuleType) -> List[Module]:
    """Filter modules by type (system, service, user)."""
    try:
        with Session(engine) as session:
            stmt = select(Module).where(Module.module_type == module_type)
            return list(session.exec(stmt))
    except Exception as e:
        logger.error(f"Error retrieving modules of type {module_type}: {str(e)}")
        return []

def clear_cache() -> None:
    """Clear the module cache. Useful for testing or after database changes."""
    global _module_cache
    _module_cache = {}
    
def disable_cache() -> None:
    """Disable the module cache. Useful for testing."""
    global _cache_enabled
    _cache_enabled = False

    
def enable_cache() -> None:
    """Enable the module cache."""
    global _cache_enabled
    _cache_enabled = True