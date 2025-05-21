"""Central module registry service for unified module lookups.

This module provides a central registry for all module operations
and avoids circular dependencies between socket handlers and service management.
"""

# MODULE-FLOW-5.3: Module Tracker - Centralized Module Info Provider
# COMPONENT: Socket Services - Module Information Cache
# PURPOSE: Provides fast, cached module info across system components
# FLOW: Called by service manager (MODULE-FLOW-4.1) and socket handlers (MODULE-FLOW-5.2)
# MERMAID-FLOW: flowchart TD; MOD5.3[Module Tracker] -->|Queries| MOD1.3[Module Model];
#               MOD5.3 -->|Provides Info To| MOD4.1[Service Manager];
#               MOD5.3 -->|Provides Info To| MOD5.2[Socket Handlers]

import logging
from typing import Optional, List, Dict
from sqlmodel import select, Session
from backend.db.session import engine
from backend.db.models import Module, ModuleType
import threading

# Ensure logger is defined
logger = logging.getLogger(__name__)

# Optional caching to reduce database queries
_module_cache: Dict[str, Module] = {}
_cache_enabled = True  # Toggle for testing/development

# Use a thread-safe lock for cache operations
_cache_lock = threading.RLock()

# MODULE-FLOW-5.3.1: Module Lookup Function
# COMPONENT: Socket Services - Module Lookup
# PURPOSE: Retrieves module information with caching
# FLOW: Primary entry point for module information across the system
# MERMAID-FLOW: flowchart TD; MOD5.3.1[Get Module] -->|Checks| MOD5.3.1.1[Module Cache];
#               MOD5.3.1 -->|Falls Back To| MOD5.3.1.2[Database Query];
#               MOD5.3.1 -->|Returns| MOD1.3[Module Data]

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
    with _cache_lock:
        _module_cache = {}
    
def disable_cache() -> None:
    """Disable the module cache. Useful for testing."""
    global _cache_enabled
    with _cache_lock:
        _cache_enabled = False

    
def enable_cache() -> None:
    """Enable the module cache."""
    global _cache_enabled
    with _cache_lock:
        _cache_enabled = True

def get_module_by_name(module_name: str) -> Optional[Module]:
    """Get a module by name directly, avoiding circular imports.
    
    This is a simple wrapper around get_module to provide consistent API 
    and help resolve circular import issues.
    
    Args:
        module_name: The name/key of the module to find
        
    Returns:
        Module instance if found, None otherwise
    """
    return get_module(module_name)