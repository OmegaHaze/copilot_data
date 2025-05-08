# (12map) Log streaming service - Real-time log file monitoring
# Handles: Log file discovery, tailing, parsing, and WebSocket broadcasting

# backend/sockets/logs/log_streamer.py
import os
import asyncio
import logging
from pathlib import Path
import aiofiles
from backend.sockets.status.service_status import stream_service_status
from backend.services.logs.unified_log_manager import create_unified_log_manager

logger = logging.getLogger(__name__)

# Set primary log directory to match the supervisor configuration
LOG_DIR = Path("/home/vaio/vaio-board/workspace/logs")

# Fallback paths to check if the primary path doesn't exist
FALLBACK_LOG_DIRS = [
    Path("/home/vaio/vaio-board/workspace/supervisor"),  # Supervisor configuration directory
]

LOG_KEYWORDS = [
    "error", "fail", "fatal", "warn", "critical", "exception",
    "could not", "unable to", "panic"
]

EXCLUDED_LOGS = {
    "socket-diagnostics.log"
}

# Global reference to unified log manager
log_manager = None

# Store tasks by sid for proper cleanup
connected_tasks = {}

async def initialize_log_manager(sio):
    """Initialize the unified log manager."""
    global log_manager
    log_manager = await create_unified_log_manager(sio)
    logger.info("Unified log manager initialized")

def register_log_streams(sio):
    """Register log stream handlers with proper error handling and cleanup."""
    # Start unified log manager
    global log_manager
    asyncio.create_task(initialize_log_manager(sio))
    
    # Keep service status stream for backward compatibility
    asyncio.create_task(stream_service_status(sio))

    @sio.event
    async def connect(sid, environ):
        """Set up log streaming when a client connects."""
        logger.info(f"Client connected for log streaming: {sid}")
        # Already handled by unified log manager
        
    @sio.event
    async def disconnect(sid):
        """Clean up when a client disconnects."""
        logger.info(f"Client disconnected from log streaming: {sid}")
        # Clean up any tasks specific to this client
        if sid in connected_tasks:
            for task in connected_tasks[sid]:
                task.cancel()
            del connected_tasks[sid]
    
    @sio.on("connect", namespace="/logs")
    async def connect_log_client(sid, environ):
        try:
            query_string = environ.get("QUERY_STRING", "")
            log_name = next((item.split("=")[1] for item in query_string.split("&") if item.startswith("file=")), None)

            if not log_name:
                logger.warning(f"Client {sid} connected without specifying log file")
                await sio.disconnect(sid, namespace="/logs")
                return

            # Try primary log directory first
            filepath = LOG_DIR / log_name

            if not filepath.exists():
                # Check fallback directories
                for fallback_dir in FALLBACK_LOG_DIRS:
                    fallback_path = fallback_dir / log_name
                    if fallback_path.exists():
                        filepath = fallback_path
                        break

            if not filepath.exists():
                logger.warning(f"Log file {log_name} not found for client {sid}")
                await sio.disconnect(sid, namespace="/logs")
                return

            async def stream_logs():
                try:
                    async with aiofiles.open(filepath, mode="r") as log_file:
                        # Move to the end of the file
                        await log_file.seek(0, os.SEEK_END)

                        while True:
                            try:
                                line = await log_file.readline()
                                if line:
                                    await sio.emit("logStream", {"filename": log_name, "line": line}, namespace="/logs")
                                    
                                    # For supervisor logs, emit with the specific event name
                                    if log_name == "supervisord.log":
                                        await sio.emit("supervisorLogStream", line, namespace="/logs")
                                else:
                                    await asyncio.sleep(0.1)
                            except asyncio.CancelledError:
                                logger.info(f"Log stream cancelled for {log_name} (client {sid})")
                                raise
                            except Exception as e:
                                logger.error(f"Error streaming log {log_name} for client {sid}: {str(e)}")
                                await asyncio.sleep(1)  # Brief pause before retry
                                
                except asyncio.CancelledError:
                    raise
                except Exception as e:
                    logger.error(f"Fatal error in log stream for {log_name} (client {sid}): {str(e)}")
                finally:
                    # Clean up tasks dict on exit
                    if sid in connected_tasks:
                        del connected_tasks[sid]
                        
            # Create and store the streaming task
            task = asyncio.create_task(stream_logs())
            connected_tasks[sid] = task
            
            logger.info(f"Started log stream for {log_name} (client {sid})")
            
        except Exception as e:
            logger.error(f"Error setting up log stream for client {sid}: {str(e)}")
            await sio.disconnect(sid, namespace="/logs")

    @sio.on("disconnect", namespace="/logs")
    async def disconnect_log_client(sid):
        """Clean up log streaming task when client disconnects."""
        try:
            # Cancel the log streaming task if it exists
            task = connected_tasks.pop(sid, None)
            if task:
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass
                logger.info(f"Cleaned up log stream for client {sid}")
        except Exception as e:
            logger.error(f"Error cleaning up log stream for client {sid}: {str(e)}")
