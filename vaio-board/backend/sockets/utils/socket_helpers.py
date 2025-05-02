# Utility module to break circular dependencies
import logging

logger = logging.getLogger(__name__)

# =====================================================================
# DIRECT IMPLEMENTATION: No Circular Dependencies
# =====================================================================
# This module now directly implements Socket.IO emission functionality
# without relying on other modules, avoiding all circular dependencies.
#
# Previous issues:
# 1. Circular imports: module_emitter -> service_manager -> socket_helpers
# 2. Attribute errors: accessing non-existent sio.active_sockets
# 3. Silent application crashes during initialization
#
# Current solution:
# - Direct implementation with no imports from our codebase
# - Using Socket.IO's built-in emit functionality 
# - No tracking of sockets (handled by Socket.IO itself)
# =====================================================================

def emit_to_namespace(sio, namespace: str, event: str, data: dict):
    """Emit data to a specific namespace using Socket.IO's built-in functionality.
    
    Args:
        sio: The Socket.IO server instance
        namespace: The namespace to emit to
        event: The event name
        data: The data to emit
    """
    try:
        # Use built-in Socket.IO emit - reliable core approach
        sio.emit(event, data, namespace=namespace)
        # Optionally log for debugging
        logger.debug(f"Emitted {event} to namespace {namespace}")
    except Exception as e:
        logger.error(f"Error emitting to namespace {namespace}: {str(e)}")
