from fastapi import APIRouter, HTTPException, Query
from backend.services.logs.log_watcher import read_log_tail, LOG_DIR
import os
from fastapi.responses import PlainTextResponse

router = APIRouter()

@router.get("/list")  # List logs endpoint
def list_logs():
    files = os.listdir(LOG_DIR)
    return {
        "logs": [f for f in files if f.endswith(".log") and not f.endswith(".err.log")]
    }

@router.get("/file", response_class=PlainTextResponse)
async def get_log_file(filename: str = Query(..., description="The name of the log file to retrieve")):
    """
    Get the complete content of a log file.
    
    This endpoint serves the entire log file as plain text.
    """
    try:
        print(f"Looking for log file: {filename}")
        
        # Check main location first
        log_file_path = LOG_DIR / filename
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
                detail=f"Permission denied: Unable to read {filename}.")
        except UnicodeDecodeError:
            # Try binary mode and decode with a more lenient approach
            with open(log_file_path, "rb") as file:
                content = file.read()
                try:
                    return content.decode("utf-8", errors="replace")[-100000:]
                except Exception as e:
                    return f"Error decoding log file {filename}: {str(e)}"
            
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Error reading log file: {str(e)}")

@router.get("/{log_name}")
async def get_log(log_name: str, lines: int = 50):
    logs = await read_log_tail(log_name, lines)
    if not logs:
        raise HTTPException(status_code=404, detail="Log not found or empty.")
    return {
        "log_name": log_name,
        "tail": logs
    }
