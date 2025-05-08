from fastapi import APIRouter, HTTPException
from pathlib import Path

# Create router
router = APIRouter()

@router.get("/error-log")
async def get_error_log():
    """
    Get the content of the backend error log file.
    """
    try:
        # Determine the location of the error log file
        log_file_path = Path("/home/vaio/vaio-board/workspace/logs/vaio-backend-error.log")
        
        # If that path doesn't exist, try a relative path
        if not log_file_path.exists():
            base_dir = Path(__file__).parent.parent.parent.parent
            log_file_path = base_dir / "workspace" / "logs" / "vaio-backend-error.log"
        
        if log_file_path.exists():
            with open(log_file_path, "r") as file:
                # Read last 200 lines to avoid overwhelming the client
                lines = file.readlines()[-200:]
                return "".join(lines)
        else:
            return "Error log file not found"
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading error log: {str(e)}")
