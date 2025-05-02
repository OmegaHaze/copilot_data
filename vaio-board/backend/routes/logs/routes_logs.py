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
            Path("/home/vaio/vaio-board/workspace/supervisor"),  # Supervisor directory
            Path("/var/log"),  # System logs
            LOG_DIR.parent / "supervisor",  # Another possible location
            Path("/home/vaio/vaio-board/workspace"),  # Workspace root
            Path("/home/vaio/vaio-board/workspace/logs"),  # Known location for logs
            Path("/home/vaio/vaio-board/workspace/logs/supervisor"),  # Nested logs dir
            Path("/var/log/supervisor"),  # Common Linux location
            Path("/etc/supervisor")  # Config location that might have logs
        ]
        
        # Check if the file exists in the log directory
        log_file_path = LOG_DIR / filename
        print(f"Checking main log directory: {log_file_path}")
        
        if not log_file_path.exists():
            # Known location for supervisord.log based on system inspection
            if filename == "supervisord.log":
                workspace_logs = Path("/home/vaio/vaio-board/workspace/logs")
                if (workspace_logs / filename).exists():
                    log_file_path = workspace_logs / filename
                    print(f"Found supervisord.log in workspace/logs: {log_file_path}")
                    
            
            # Special case for supervisord.log
            if filename == "supervisord.log":
                # Also try with .out extension or no extension
                alternate_names = ["supervisord.out", "supervisor.log", "supervisor.out", "supervisord"]
                
                # Check standard log directory first
                for alt_name in alternate_names:
                    alt_path = LOG_DIR / alt_name
                    if alt_path.exists():
                        log_file_path = alt_path
                        print(f"Found alternate log file: {log_file_path}")
                        break
                        
                # If we still don't have the file, check in /var/log/supervisor/
                if not log_file_path.exists():
                    var_log_supervisor = Path("/var/log/supervisor")
                    if var_log_supervisor.exists() and var_log_supervisor.is_dir():
                        for log_file in var_log_supervisor.glob("*.log"):
                            if "supervisor" in log_file.name.lower():
                                log_file_path = log_file
                                print(f"Found supervisor log in /var/log/supervisor: {log_file_path}")
                                break
            
            # Check all fallback directories if still not found
            if not log_file_path.exists():
                for fallback_dir in fallback_dirs:
                    fallback_path = fallback_dir / filename
                    print(f"Checking fallback location: {fallback_path}")
                    if fallback_path.exists():
                        log_file_path = fallback_path
                        print(f"Found log file at: {log_file_path}")
                        break
            
            if not log_file_path.exists():
                # For supervisord.log, provide fallback content if file not found
                if filename == "supervisord.log":
                    print("Supervisor log file not found. Returning fallback content.")
                    
                    # Try to check if supervisor is actually running
                    try:
                        import subprocess
                        result = subprocess.run(["pgrep", "-f", "supervisord"], 
                                               capture_output=True, text=True)
                        supervisor_running = result.returncode == 0
                        supervisor_status = "Supervisor appears to be running." if supervisor_running else "Supervisor does not appear to be running."
                    except Exception:
                        supervisor_status = "Unable to determine if supervisor is running."
                    
                    checked_locations = "\n".join([f"- {str(d / filename)}" for d in [LOG_DIR] + fallback_dirs])
                    return (
                        f"Log file not available. {supervisor_status}\n\n"
                        f"Please check that supervisor is running and logs are being written correctly.\n\n"
                        f"Possible locations checked:\n{checked_locations}\n\n"
                        f"To fix this issue:\n"
                        f"1. Make sure supervisord is running: sudo systemctl status supervisor\n"
                        f"2. Check supervisor configuration in /etc/supervisor/supervisord.conf\n"
                        f"3. Verify that the logfile path is correct and accessible"
                    )
                else:
                    raise HTTPException(status_code=404, detail=f"Log file '{filename}' not found")
        else:
            print(f"Found log file at main location: {log_file_path}")
        
        # Read the file contents (limit to last 1000 lines to prevent huge responses)
        try:
            with open(log_file_path, "r", encoding="utf-8", errors="ignore") as file:
                lines = file.readlines()
                
                # For better UX, if the log is empty, return a helpful message
                if not lines:
                    if filename == "supervisord.log":
                        return "The supervisord log file exists but appears to be empty. This might indicate that supervisor was just started or the log was cleared."
                    else:
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
