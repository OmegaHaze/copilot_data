from fastapi import APIRouter, HTTPException, Query
from backend.services.logs.log_watcher import read_log_tail, LOG_DIR
import os
from pathlib import Path
from fastapi.responses import PlainTextResponse

router = APIRouter()

@router.get("/home/vaio/vaio-board/workspace/logs")
def list_logs():
    files = os.listdir(LOG_DIR)
    return {
        "logs": [f for f in files if f.endswith(".log") and not f.endswith(".err.log")]
    }

@router.get("/{log_name}")
async def get_log(log_name: str, lines: int = 50):
    logs = await read_log_tail(log_name, lines)
    if not logs:
        raise HTTPException(status_code=404, detail="Log not found or empty.")
    return {
        "log_name": log_name,
        "tail": logs
    }

@router.get("/file", response_class=PlainTextResponse)
async def get_log_file(filename: str = Query(..., description="The name of the log file to retrieve")):
    """
    Get the complete content of a log file.
    
    This endpoint serves the entire log file as plain text. It's used by the frontend
    components to display logs like supervisord.log.
    """
    try:
        print(f"Looking for log file: {filename}")
        
        # Define all possible log file locations upfront
        fallback_dirs = [
            Path("/home/vaio/vaio-board/workspace/logs"),  # Primary logs directory
            Path("/home/vaio/vaio-board/workspace/supervisor"),  # Supervisor directory
            Path("/var/log"),  # System logs
            Path("/var/log/supervisor"),  # Common Linux location
            Path("/etc/supervisor"),  # Config location that might have logs
            LOG_DIR.parent / "supervisor",  # Another possible location
            Path("/home/vaio/vaio-board/workspace"),  # Workspace root
            Path("/home/vaio/vaio-board/workspace/logs/supervisor")  # Nested logs dir
        ]
        
        # Special case handling for supervisord.log
        if filename == "supervisord.log":
            # Check all locations systematically
            for dir_path in fallback_dirs:
                log_path = dir_path / filename
                print(f"Checking for supervisord.log at: {log_path}")
                if log_path.exists():
                    print(f"Found supervisord.log at: {log_path}")
                    try:
                        with open(log_path, "r", encoding="utf-8", errors="ignore") as file:
                            lines = file.readlines()
                            if not lines:
                                return "The supervisord log file exists but appears to be empty. This might indicate that supervisor was just started or the log was cleared."
                            return "".join(lines[-1000:])
                    except Exception as read_error:
                        print(f"Error reading found log file: {read_error}")
                        # Continue to next location if there's an error
            
            # Also try alternate filenames for supervisor log
            alternate_names = ["supervisord.out", "supervisor.log", "supervisor.out", "supervisord"]
            for alt_name in alternate_names:
                for dir_path in fallback_dirs:
                    alt_path = dir_path / alt_name
                    if alt_path.exists():
                        print(f"Found alternate supervisor log: {alt_path}")
                        try:
                            with open(alt_path, "r", encoding="utf-8", errors="ignore") as file:
                                return file.read()
                        except Exception as alt_error:
                            print(f"Error reading alternate log file: {alt_error}")
                            # Continue to next file
            
            # If we get here, we couldn't find any supervisor log file
            # Try to check if supervisor is actually running
            try:
                import subprocess
                result = subprocess.run(["pgrep", "-f", "supervisord"], 
                                       capture_output=True, text=True)
                supervisor_running = result.returncode == 0
                supervisor_status = "Supervisor appears to be running." if supervisor_running else "Supervisor does not appear to be running."
            except Exception:
                supervisor_status = "Unable to determine if supervisor is running."
            
            checked_locations = "\n".join([f"- {str(d / filename)}" for d in fallback_dirs])
            return (
                f"Log file not available. {supervisor_status}\n\n"
                f"Please check that supervisor is running and logs are being written correctly.\n\n"
                f"Possible locations checked:\n{checked_locations}\n\n"
                f"To fix this issue:\n"
                f"1. Make sure supervisord is running: sudo systemctl status supervisor\n"
                f"2. Check supervisor configuration in /etc/supervisor/supervisord.conf\n"
                f"3. Verify that the logfile path is correct and accessible\n"
                f"4. Create an empty log file in one of the expected locations"
            )
        
        # Regular case for non-supervisor logs - check main location first
        log_file_path = LOG_DIR / filename
        if log_file_path.exists():
            print(f"Found log file at main location: {log_file_path}")
        else:
            # Check fallback directories
            for fallback_dir in fallback_dirs:
                fallback_path = fallback_dir / filename
                if fallback_path.exists():
                    log_file_path = fallback_path
                    print(f"Found log file at: {log_file_path}")
                    break
            
            if not log_file_path.exists():
                raise HTTPException(status_code=404, detail=f"Log file '{filename}' not found")
        
        # Read the file contents
        try:
            with open(log_file_path, "r", encoding="utf-8", errors="ignore") as file:
                lines = file.readlines()
                
                # For better UX, if the log is empty, return a helpful message
                if not lines:
                    return f"The log file {filename} exists but is empty."
                        
                return "".join(lines[-1000:])
        except PermissionError:
            raise HTTPException(status_code=403, 
                detail=f"Permission denied: Unable to read {filename}. The log file exists but the application doesn't have read permissions.")
        except UnicodeDecodeError:
            # Try binary mode and decode with a more lenient approach
            with open(log_file_path, "rb") as file:
                content = file.read()
                try:
                    return content.decode("utf-8", errors="replace")[-100000:]  # Limit to last ~100KB
                except Exception as e:
                    return f"Error decoding log file {filename}: {str(e)}. The file exists but contains binary data."
            
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Error reading log file: {str(e)}")