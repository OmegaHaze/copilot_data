# filepath: /home/vaio/vaio-board/backend/sockets/module/module_handler.py
"""Isolated module handler system for WebSocket connections.

This module provides WebSocket event handlers for module management and service control,
using function-level imports to avoid circular dependencies and leveraging the shared
state maintained in module_registry.py.
"""

import logging
import asyncio
from typing import Optional, Any

# Import registry functions for state management
from backend.sockets.module.module_registry import (
    add_socket, 
    remove_socket, 
    add_watchdog, 
    remove_watchdog,
    update_module_status, 
    get_socket_namespace,
    get_namespace_connections
)

logger = logging.getLogger(__name__)

# Define a function to get module info that isolates the module registry dependency
def _get_module_info(module_name: str) -> Optional[Any]:
    """Get module information from the central tracker.
    
    This function isolates the dependency on module_tracker to avoid import-time issues.
    """
    try:
        # Import inside function to avoid circular imports
        from backend.sockets.module.module_tracker import get_module
        return get_module(module_name)
    except Exception as e:
        logger.error(f"Error retrieving module {module_name}: {str(e)}")
        return None

# Define isolated functions for service management
def _get_module_status(module_name: str) -> str:
    """Get module status while avoiding import-time circular dependencies."""
    try:
        # Import inside function to avoid circular imports
        from backend.services.service_manager import _get_status
        return _get_status(module_name)
    except Exception as e:
        logger.error(f"Error getting status for module {module_name}: {str(e)}")
        return "ERROR"

def _start_service(module_name: str, sio) -> str:
    """Start a service while avoiding import-time circular dependencies."""
    try:
        # Import inside function to avoid circular imports
        from backend.services.service_manager import start_service
        return start_service(module_name, sio)
    except Exception as e:
        logger.error(f"Error starting service {module_name}: {str(e)}")
        return "ERROR"

def _stop_service(module_name: str) -> str:
    """Stop a service while avoiding import-time circular dependencies."""
    try:
        # Import inside function to avoid circular imports
        from backend.services.service_manager import stop_service
        return stop_service(module_name)
    except Exception as e:
        logger.error(f"Error stopping service {module_name}: {str(e)}")
        return "ERROR"

async def disconnect_timeout(sio, namespace: str, timeout: int = 10):
    """Wait for reconnection, then mark as offline if no clients reconnect."""
    try:
        await asyncio.sleep(timeout)
        
        # Check with registry if there are still no connections
        if len(get_namespace_connections(namespace)) == 0:
            # Still no clients after timeout
            logger.info(f"No active clients for {namespace} after timeout")
            
            if namespace.startswith('/modules/'):
                module_name = namespace.replace('/modules/', '')
                
                # Get module for type information
                module = _get_module_info(module_name)
                
                # Update status in registry
                update_module_status(module_name, "OFFLINE")
                
                # Direct socket.io emission
                await sio.emit("statusUpdate", {
                    "name": module_name, 
                    "status": "OFFLINE",
                    # Include module_type in the response for client-side type checking
                    "module_type": str(module.module_type) if module and hasattr(module, 'module_type') else "unknown"
                }, namespace=namespace)
    except Exception as e:
        logger.error(f"Error in disconnect timeout task: {str(e)}")
    finally:
        # Remove the watchdog from registry
        remove_watchdog(namespace)

def register_module_handlers(sio):
    """Register all Socket.IO event handlers for module management."""
    
    @sio.event
    async def connect(sid, environ):
        """Handle WebSocket connection for module namespaces."""
        try:
            namespace = environ.get("asgi.scope", {}).get("path")
            if not namespace:
                logger.warning("Connection without namespace - disconnecting")
                await sio.disconnect(sid)
                return

            # Register socket in the registry
            add_socket(namespace, sid)
            logger.debug(f"Socket {sid} connected to namespace {namespace}")

            # Cancel any pending offline watchdogs
            remove_watchdog(namespace)

            # Only handle /modules/ namespaces
            if namespace.startswith("/modules/"):
                module_name = namespace.replace("/modules/", "")
            else:
                logger.warning(f"Connection to non-module namespace: {namespace}")
                return

            # Get the module using our isolated lookup function
            module = _get_module_info(module_name)

            if not module or not getattr(module, "supportsStatus", False):
                update_module_status(module_name, "NOT_INSTALLED")
                await sio.emit("statusUpdate", {
                    "name": module_name, 
                    "status": "NOT_INSTALLED",
                    "module_type": "unknown"
                }, to=sid, namespace=namespace)
                return

            # Get current status using our isolated function
            status = _get_module_status(module_name)
            
            # Update status in registry
            update_module_status(module_name, status)
            
            # Send status to client
            await sio.emit("statusUpdate", {
                "name": module_name, 
                "status": status,
                # Include module_type in the response for client-side type checking
                "module_type": str(module.module_type) if hasattr(module, 'module_type') else "unknown"
            }, to=sid, namespace=namespace)
            
        except Exception as e:
            logger.error(f"Error in module socket connect handler: {str(e)}")
            await sio.disconnect(sid)

    @sio.event  
    async def disconnect(sid):
        """Handle WebSocket disconnection for module namespaces."""
        try:
            namespace = get_socket_namespace(sid)
            if namespace:
                # Remove from registry and check if it was the last one
                if remove_socket(namespace, sid):
                    logger.debug(f"Last socket disconnected from namespace {namespace}")
                    
                    # Start timeout task to mark module offline if no reconnections
                    task = asyncio.create_task(disconnect_timeout(sio, namespace))
                    add_watchdog(namespace, task)
                else:
                    logger.debug(f"Socket {sid} disconnected but other connections remain for {namespace}")
        except Exception as e:
            logger.error(f"Error in disconnect handler: {str(e)}")

    @sio.on("startService")
    async def handle_start_service(sid, data):
        """Handle service start requests."""
        try:
            module_name = data.get('name')
            if not module_name:
                await sio.emit("error", {"message": "No module name provided"}, to=sid)
                return
            
            # Get namespace from registry
            namespace = get_socket_namespace(sid)
                    
            if not namespace:
                await sio.emit("error", {"message": "Cannot determine namespace"}, to=sid)
                return
                
            # Use our isolated function to start the service
            status = _start_service(module_name, sio)
            
            # Get module for type information
            module = _get_module_info(module_name)
            
            # Update status in registry
            update_module_status(module_name, status)
            
            # Emit status update to all clients in the namespace
            await sio.emit("statusUpdate", {
                "name": module_name, 
                "status": status,
                # Include module_type in the response for client-side type checking
                "module_type": str(module.module_type) if module and hasattr(module, 'module_type') else "unknown"
            }, namespace=namespace)
                
        except Exception as e:
            logger.error(f"Error in start_service handler: {str(e)}")
            await sio.emit("error", {"message": str(e)}, to=sid)

    @sio.on("stopService")
    async def handle_stop_service(sid, data):
        """Handle service stop requests."""
        try:
            module_name = data.get('name')
            if not module_name:
                await sio.emit("error", {"message": "No module name provided"}, to=sid)
                return
            
            # Get namespace from registry
            namespace = get_socket_namespace(sid)
                    
            if not namespace:
                await sio.emit("error", {"message": "Cannot determine namespace"}, to=sid)
                return
                
            # Use our isolated function to stop the service
            status = _stop_service(module_name)
            
            # Get module for type information
            module = _get_module_info(module_name)
            
            # Update status in registry
            update_module_status(module_name, status)
            
            # Emit status update to all clients in the namespace
            await sio.emit("statusUpdate", {
                "name": module_name, 
                "status": status,
                # Include module_type in the response for client-side type checking
                "module_type": str(module.module_type) if module and hasattr(module, 'module_type') else "unknown"
            }, namespace=namespace)
                
        except Exception as e:
            logger.error(f"Error in stop_service handler: {str(e)}")
            await sio.emit("error", {"message": str(e)}, to=sid)

    # Also handle the original event names from module_emitter for backward compatibility
    @sio.event
    async def module_message(sid, data):
        """Handle module messages (for backward compatibility)."""
        try:
            await sio.emit("echo", {"received": data}, to=sid)
        except Exception as e:
            logger.error(f"Error in module_message: {e}")
            await sio.emit("error", {"message": str(e)}, to=sid)

    @sio.event
    async def supervisor_status(sid, data):
        """Handle supervisor status requests (for backward compatibility)."""
        try:
            module_name = data.get('module')
            if not module_name:
                await sio.emit('error', {'message': 'Missing module name'}, to=sid)
                return

            # Get the module with type information
            module = _get_module_info(module_name)
            status = _get_module_status(module_name)
            
            # Update status in registry
            update_module_status(module_name, status)
            
            await sio.emit('statusUpdate', {
                'name': module_name,
                'status': status,
                'module_type': str(module.module_type) if module else "unknown"
            }, to=sid)
        except Exception as e:
            logger.error(f"Error in supervisor_status: {e}")
            await sio.emit("error", {"message": str(e)}, to=sid)

    @sio.event
    async def start_service_handler(sid, data):
        """Start service handler (for backward compatibility)."""
        try:
            module_name = data.get('module')
            if not module_name:
                await sio.emit('error', {'message': 'Missing module name'}, to=sid)
                return

            # Get module type before starting service
            module = _get_module_info(module_name)
            status = _start_service(module_name, sio)
            
            # Update status in registry
            update_module_status(module_name, status)
            
            await sio.emit('statusUpdate', {
                'name': module_name,
                'status': status,
                'module_type': str(module.module_type) if module else "unknown"
            }, to=sid)
        except Exception as e:
            logger.error(f"Error in start_service_handler: {e}")
            await sio.emit("error", {"message": str(e)}, to=sid)

    @sio.event
    async def stop_service_handler(sid, data):
        """Stop service handler (for backward compatibility)."""
        try:
            module_name = data.get('module')
            if not module_name:
                await sio.emit('error', {'message': 'Missing module name'}, to=sid)
                return

            # Get module type before stopping service
            module = _get_module_info(module_name)
            status = _stop_service(module_name)
            
            # Update status in registry
            update_module_status(module_name, status)
            
            await sio.emit('statusUpdate', {
                'name': module_name,
                'status': status,
                'module_type': str(module.module_type) if module else "unknown"
            }, to=sid)
        except Exception as e:
            logger.error(f"Error in stop_service_handler: {e}")
            await sio.emit("error", {"message": str(e)}, to=sid)

    # Return the handler to be chainable
    return sio