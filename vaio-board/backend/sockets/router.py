# (10map) WebSocket management - Socket.IO event handler registration and streaming
# Handles: Supervisor socket, service status, backend logs, metrics, PTY handlers

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
from backend.sockets.env.graph_nvidia_stream import register_nvidia_stream
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
                (register_nvidia_stream, "NVIDIA monitoring (/graph-nvidia)"),
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
            
            # We've removed the direct module handler registration to avoid circular dependencies
            # The module handler will be loaded separately by the application when needed
            
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