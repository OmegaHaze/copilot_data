"""Module Registry for WebSocket Connections

This file maintains a registry of active Socket.IO connections for modules.
It provides shared state without circular dependencies.
"""

# MODULE-FLOW-5.4: Module Registry - Socket Connection Tracking
# COMPONENT: Socket Services - Connection State Management
# PURPOSE: Manages WebSocket connection state and status tracking
# FLOW: Called by socket handlers (MODULE-FLOW-5.2) for state management
# MERMAID-FLOW: flowchart TD; MOD5.4[Module Registry] -->|Tracks| MOD5.4.1[Socket Connections];
#               MOD5.4 -->|Manages| MOD5.4.2[Status Cache];
#               MOD5.4 -->|Coordinates| MOD5.4.3[Watchdog Timers]

import logging
from typing import Dict, List, Any, Optional
import asyncio

logger = logging.getLogger(__name__)

# Socket tracking data structures
active_sockets: Dict[str, List[str]] = {}
offline_watchdogs: Dict[str, asyncio.Task] = {}
module_status_cache: Dict[str, str] = {}

# Function signatures that avoid circular imports

# This function should be implemented at call time to avoid circular imports
async def get_module_info(module_name: str) -> Optional[Any]:
    """
    Function signature for getting module info.
    This will be implemented where used to avoid circular dependencies.
    """
    pass

async def handle_disconnect_timeout(sio: Any, namespace: str, timeout: int = 10) -> None:
    """
    Wait for reconnection, then mark as offline if no clients reconnect.
    Uses late binding for module lookups to avoid circular dependencies.
    """
    try:
        await asyncio.sleep(timeout)
        
        # Check if there are still no active connections
        if namespace in active_sockets and not active_sockets[namespace]:
            # Still no clients after timeout
            logger.info(f"No active clients for {namespace} after timeout")
            
            if namespace.startswith('/modules/'):
                module_name = namespace.replace('/modules/', '')
                
                # Update cache without direct imports
                module_status_cache[module_name] = "OFFLINE"
                
                # Function-level import to avoid circular dependencies
                # This gets replaced with actual implementation at usage site
                from backend.sockets.module.module_tracker import get_module
                module = get_module(module_name)
                
                # Direct socket.io emission
                await sio.emit(
                    "statusUpdate", 
                    {
                        "name": module_name, 
                        "status": "OFFLINE",
                        "module_type": str(module.module_type) if module and hasattr(module, 'module_type') else "unknown"
                    },
                    namespace=namespace
                )
    except Exception as e:
        logger.error(f"Error in disconnect timeout task: {str(e)}")
    finally:
        # Clean up the watchdog task if it exists
        if namespace in offline_watchdogs and namespace in offline_watchdogs:
            del offline_watchdogs[namespace]

# Functions to manage the registry

def add_socket(namespace: str, sid: str) -> None:
    """
    Add a socket connection to the registry.
    
    Args:
        namespace: The socket namespace
        sid: The socket connection ID
    """
    active_sockets.setdefault(namespace, []).append(sid)
    logger.debug(f"Added socket {sid} to namespace {namespace}, active: {len(active_sockets.get(namespace, []))}")

def remove_socket(namespace: str, sid: str) -> bool:
    """
    Remove a socket connection from the registry.
    
    Args:
        namespace: The socket namespace
        sid: The socket connection ID
        
    Returns:
        True if this was the last connection for this namespace
    """
    if namespace in active_sockets and sid in active_sockets[namespace]:
        active_sockets[namespace].remove(sid)
        logger.debug(f"Removed socket {sid} from namespace {namespace}, remaining: {len(active_sockets.get(namespace, []))}")
        return len(active_sockets[namespace]) == 0
    return False

def add_watchdog(namespace: str, task: asyncio.Task) -> None:
    """
    Add a disconnect watchdog task for a namespace.
    
    Args:
        namespace: The socket namespace
        task: The asyncio task for the watchdog
    """
    offline_watchdogs[namespace] = task

def remove_watchdog(namespace: str) -> None:
    """
    Remove a disconnect watchdog task for a namespace.
    
    Args:
        namespace: The socket namespace
    """
    if namespace in offline_watchdogs:
        offline_watchdogs[namespace].cancel()
        del offline_watchdogs[namespace]

def update_module_status(module_name: str, status: str) -> None:
    """
    Update the cached status for a module.
    
    Args:
        module_name: The module name/key
        status: The new status
    """
    module_status_cache[module_name] = status

def get_module_status(module_name: str) -> Optional[str]:
    """
    Get the cached status for a module.
    
    Args:
        module_name: The module name/key
        
    Returns:
        The cached status or None if not found
    """
    return module_status_cache.get(module_name)

def get_active_namespaces() -> List[str]:
    """
    Get all active namespaces.
    
    Returns:
        List of active namespace strings
    """
    return list(active_sockets.keys())

def get_namespace_connections(namespace: str) -> List[str]:
    """
    Get all socket IDs for a namespace.
    
    Args:
        namespace: The socket namespace
        
    Returns:
        List of socket IDs
    """
    return active_sockets.get(namespace, [])

def get_socket_namespace(sid: str) -> Optional[str]:
    """
    Find the namespace for a socket ID.
    
    Args:
        sid: The socket ID to find
        
    Returns:
        The namespace or None if not found
    """
    for namespace, sids in active_sockets.items():
        if sid in sids:
            return namespace
    return None