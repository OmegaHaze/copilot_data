# backend/services/logs/unified_log_manager.py
import asyncio
import logging
from pathlib import Path
from datetime import datetime

from backend.services.logs.log_watcher import LOG_DIR, stream_log_lines

logger = logging.getLogger(__name__)

# Constants
LOG_LEVELS = {
    "error": ["error", "exception", "critical", "fatal"],
    "warning": ["warning", "warn"],
    "info": ["info"],
    "debug": ["debug"],
}

EXCLUDED_LOGS = {
    "socket-diagnostics.log", 
    "postgres.actual.err.log"
}

class UnifiedLogManager:
    """
    Centralized log manager that handles all log streaming and processing.
    Provides a single point for log event emission with consistent formatting.
    """
    
    def __init__(self, sio):
        """Initialize the log manager with a Socket.IO instance."""
        self.sio = sio
        self.active_tasks = set()
        self.tracked_files = set()
        self.log_paths = {}
        self.discover_logs()
    
    def discover_logs(self):
        """Discover available log files in the logs directory."""
        if not LOG_DIR.exists():
            logger.warning(f"Log directory {LOG_DIR} does not exist")
            return
            
        for file_path in LOG_DIR.glob("*.log"):
            if file_path.name not in EXCLUDED_LOGS:
                self.log_paths[file_path.stem] = file_path
                logger.info(f"Discovered log file: {file_path}")
    
    def detect_log_level(self, line: str) -> str:
        """Detect the log level based on keywords in the log line."""
        line_lower = line.lower()
        for level, keywords in LOG_LEVELS.items():
            if any(keyword in line_lower for keyword in keywords):
                return level
        return "info"  # Default level
    
    async def emit_log_event(self, service: str, line: str, filename: str):
        """
        Emit a unified log event with consistent structure.
        This ensures all logs have the same format and metadata.
        """
        # Skip empty lines
        if not line or line.strip() == "":
            return
            
        # Detect log level
        level = self.detect_log_level(line)
        
        # Create timestamp if not present in the line
        timestamp = datetime.now().isoformat()
        
        # Preprocess line - remove trailing newlines, etc.
        line = line.rstrip()
        
        # Map service names to the ones expected by the frontend
        # This ensures logs are categorized correctly in ServerTerminal.jsx
        service_mapping = {
            "dashboard-server": "vite",
            "vaio-backend": "python",
        }
        
        # Use mapped service name if available
        display_service = service_mapping.get(service.replace(".log", ""), service)
        
        # Create the unified log structure
        log_data = {
            "service": display_service,
            "filename": filename,
            "level": level,
            "timestamp": timestamp,
            "message": line,
        }
        
        # Standard unified event - use this for any component that wants to display logs
        await self.sio.emit("unified_log", log_data)
        
        # For backward compatibility, also emit the traditional events
        # This ensures existing code continues to work during the transition
        await self.sio.emit(f"{display_service}LogStream", line)
        await self.sio.emit("logStream", {"filename": filename, "line": line})
        
        # For traditional /logs namespace
        await self.sio.emit(f"{display_service}LogStream", line, namespace="/logs")
        await self.sio.emit("logStream", {"filename": filename, "line": line}, namespace="/logs")
        
        # Special handling for error logs
        if level == "error":
            await self.sio.emit(f"{display_service}ErrorStream", line)
            await self.sio.emit("error_log", {"source": display_service, "message": line})
    
    async def stream_log_file(self, service_name: str, file_path: Path):
        """
        Stream a log file and emit events with unified format.
        """
        filename = file_path.name
        
        # Map common log files to their correct service names for frontend display
        service_display_map = {
            "vaio-backend.log": "python",
            "dashboard-server.log": "vite",
        }
        
        # Use the mapped service name if available
        display_service = service_display_map.get(filename, service_name)
        
        try:
            logger.info(f"Starting unified log stream for {display_service} from {file_path}")
            
            async for line in stream_log_lines(str(file_path)):
                await self.emit_log_event(display_service, line, filename)
                
        except asyncio.CancelledError:
            logger.info(f"Log stream for {service_name} cancelled")
            raise
        except Exception as e:
            logger.error(f"Error streaming log {service_name}: {str(e)}")
            # Try to emit error event if possible
            try:
                await self.sio.emit("error_log", {
                    "source": "LOG_MANAGER", 
                    "message": f"Error streaming {service_name} log: {str(e)}"
                })
            except Exception as e:
                pass
    
    async def start_all_streams(self):
        """Start streaming all discovered log files."""
        for service_name, file_path in self.log_paths.items():
            if service_name not in self.tracked_files:
                self.tracked_files.add(service_name)
                task = asyncio.create_task(self.stream_log_file(service_name, file_path))
                self.active_tasks.add(task)
                task.add_done_callback(self.active_tasks.remove)
                logger.info(f"Started log stream for {service_name}")
    
    def cleanup(self):
        """Cancel all active streaming tasks."""
        for task in self.active_tasks:
            task.cancel()
        self.active_tasks.clear()
        self.tracked_files.clear()
        logger.info("Cleaned up all log streaming tasks")

# Function to create and start the unified log manager
async def create_unified_log_manager(sio):
    """
    Create and initialize the unified log manager.
    Returns the manager instance for further management.
    """
    manager = UnifiedLogManager(sio)
    
    # Explicitly register the important log files we know about
    vite_log_path = LOG_DIR / "dashboard-server.log"
    backend_log_path = LOG_DIR / "vaio-backend.log"
    
    # Add them to the tracked paths if they exist
    if vite_log_path.exists():
        manager.log_paths["vite"] = vite_log_path
    if backend_log_path.exists():
        manager.log_paths["backend"] = backend_log_path
    
    # Start all streams including the explicitly registered ones
    await manager.start_all_streams()
    return manager
