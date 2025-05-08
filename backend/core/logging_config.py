"""
Logging configuration for the vAio backend.
This module configures logging for the application.
"""
import sys
import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path

# Define the log directory
LOG_DIR = Path("/home/vaio/vaio-board/workspace/logs")

# Create log directory if it doesn't exist
LOG_DIR.mkdir(parents=True, exist_ok=True)

# Custom stream handler that redirects to logs
class LoggerWriter:
    """Redirects print statements to the logging system"""
    def __init__(self, logger, level):
        self.logger = logger
        self.level = level
        self.buffer = ''

    def write(self, msg):
        if msg and msg.strip():
            self.buffer += msg
            if self.buffer.endswith('\n'):
                self.logger.log(self.level, self.buffer.strip())
                self.buffer = ''
    
    def flush(self):
        if self.buffer:
            self.logger.log(self.level, self.buffer.strip())
            self.buffer = ''

# Configure root logger
def configure_logging():
    """
    Configure the logging system to:
    1. Send application logs to vaio-backend.log
    2. Send error logs to vaio-backend-error.log
    3. Send output to console for development
    """
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    
    # Clear any existing handlers to avoid duplicate logs
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    # Format for our logs
    formatter = logging.Formatter(
        '%(asctime)s - %(levelname)s - %(name)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # File handler for main log (with rotation)
    main_log_file = LOG_DIR / "vaio-backend.log"
    file_handler = RotatingFileHandler(
        main_log_file,
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5,
        encoding='utf-8'
    )
    file_handler.setLevel(logging.INFO)
    file_handler.setFormatter(formatter)
    root_logger.addHandler(file_handler)
    
    # File handler for error log (with rotation)
    error_log_file = LOG_DIR / "vaio-backend-error.log"
    error_handler = RotatingFileHandler(
        error_log_file,
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5,
        encoding='utf-8'
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(formatter)
    root_logger.addHandler(error_handler)
    
    # Console handler for development
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)
    
    # Set levels for noisy loggers
    logging.getLogger("socketio").setLevel(logging.WARNING)
    
    # Log that we initialized
    logger = logging.getLogger(__name__)
    logger.info(f"Logging system initialized. Main log: {main_log_file}, Error log: {error_log_file}")

def redirect_stdout_stderr():
    """
    Redirect stdout and stderr to the logging system so that print statements
    and uncaught exceptions are logged to the log files.
    """
    stdout_logger = logging.getLogger('stdout')
    stderr_logger = logging.getLogger('stderr')
    
    sys.stdout = LoggerWriter(stdout_logger, logging.INFO)
    sys.stderr = LoggerWriter(stderr_logger, logging.ERROR)
    
    logging.getLogger(__name__).info("stdout/stderr have been redirected to the logging system")
