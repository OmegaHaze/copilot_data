# MODULE-FLOW-5.1: Socket Router - WebSocket Server Initialization
# COMPONENT: Socket Services - Socket.IO Event Registration
# PURPOSE: Initializes and registers all Socket.IO event handlers
# FLOW: Called by main.py (MODULE-FLOW-A2), registers module handlers (MODULE-FLOW-5.2)
# MERMAID-FLOW: flowchart TD; MOD5.1[Socket Router] -->|Registers| MOD5.2[Module Handlers];
#               MOD5.1 -->|Initializes| MOD5.1.1[Service Status Stream];
#               MOD5.1 -->|Sets Up| MOD5.1.2[System Monitoring]

import asyncio
import logging
import os
from socketio import AsyncServer

from backend.sockets.logs.log_streamer import register_log_streams
from backend.sockets.status.service_status import stream_service_status
from backend.sockets.utils.pty_handler import register_pty_handlers

# Updated per-service metric streams (modular)
from backend.sockets.env.graph_cpu_stream import register_cpu_stream
# Import statements for other socket streams
from backend.sockets.env.graph_gpu_stream import register_gpu_stream
from backend.sockets.env.graph_memory_stream import register_memory_stream
from backend.sockets.env.graph_disk_stream import register_disk_stream
from backend.sockets.env.graph_network_stream import register_network_stream


logger = logging.getLogger(__name__)

SUPERVISOR_SOCK = "/home/vaio/vaio-board/workspace/supervisor/supervisor.sock"

async def wait_for_supervisor(timeout=30):
    """Wait for supervisor socket to become available."""
    start_time = asyncio.get_event_loop().time()
    while True:
        if os.path.exists(SUPERVISOR_SOCK):
            logger.info("Supervisor socket is available")
            return True
        if asyncio.get_event_loop().time() - start_time > timeout:
            logger.warning(f"Supervisor socket not available after {timeout}s")
            return False
        await asyncio.sleep(1)

def register_sio_handlers(sio: AsyncServer):
    """Register all Socket.IO event handlers with proper error handling and dependency checks."""
    
    async def setup_handlers():
        # Wait for supervisor to be available
        supervisor_ready = await wait_for_supervisor()
        if not supervisor_ready:
            logger.warning("Proceeding without supervisor - some features may be limited")

        # Store tasks for cleanup
        background_tasks = set()
        
        try:
            # Register log streams first to ensure we capture all logs
            register_log_streams(sio)
            
            # Core service status stream - wrap in try/except to handle supervisor unavailability
            try:
                # Start service status stream
                task = asyncio.create_task(stream_service_status(sio))
                background_tasks.add(task)
                task.add_done_callback(background_tasks.discard)
                logger.info("Service status stream registered")
            except Exception as e:
                logger.error(f"Failed to start service status stream: {str(e)}")
            
            # Register mandatory handlers first
            try:
                register_log_streams(sio)
                logger.info("Log streams registered")
            except Exception as e:
                logger.error(f"Failed to register log streams: {str(e)}")
                # Continue since other features can work without logs
            
            # Register monitoring streams - each can fail independently
            # All using the standardized /graph-{type} namespace pattern and metrics_update event
            stream_handlers = [
                # Active metric stream handlers
                (register_cpu_stream, "CPU monitoring (/graph-cpu)"),
                (register_gpu_stream, "GPU monitoring (/graph-gpu)"),
                (register_memory_stream, "Memory monitoring (/graph-memory)"),
                (register_network_stream, "Network monitoring (/graph-network)"),
                (register_disk_stream, "Disk monitoring (/graph-disk)")
            ]
            
            for handler, name in stream_handlers:
                try:
                    handler(sio)
                    logger.info(f"{name} registered")
                except Exception as e:
                    logger.error(f"Failed to register {name}: {str(e)}")
            
            # Register utility handlers
            try:
                register_pty_handlers(sio)
                logger.info("PTY handlers registered")
            except Exception as e:
                logger.error(f"Failed to register PTY handlers: {str(e)}")
            
            # Register module handlers last to avoid circular dependencies
            try:
                _register_module_handlers_delayed(sio)
                logger.info("Module handlers registered via delayed import")
            except Exception as e:
                logger.error(f"Failed to register module handlers: {str(e)}")
            
            return background_tasks
                
        except Exception as e:
            logger.error(f"Error registering Socket.IO handlers: {str(e)}")
            # Clean up any registered tasks
            for task in background_tasks:
                task.cancel()
            raise

    # Start the setup process
    loop = asyncio.get_event_loop()
    return loop.create_task(setup_handlers())

# MODULE-FLOW-5.1.3: Module Handler Registration
# COMPONENT: Socket Services - Delayed Module Handler Registration
# PURPOSE: Registers module handlers with delayed imports to avoid circular dependencies
# FLOW: Called by setup_handlers after other handlers are registered
# MERMAID-FLOW: flowchart TD; MOD5.1.3[Register Module Handlers] -->|Imports| MOD5.2[Module Handler];
#               MOD5.1.3 -->|Registers With| MOD5.1.3.1[Socket.IO Server]
def _register_module_handlers_delayed(sio):
    """Delayed import and registration to avoid circular dependencies."""
    try:
        from backend.sockets.module.module_handler import register_module_handlers
        register_module_handlers(sio)
        logger.info("Module handlers registered successfully")
    except Exception as e:
        logger.error(f"Error registering module handlers: {str(e)}")