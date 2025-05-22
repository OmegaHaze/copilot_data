from fastapi import APIRouter, Depends
from sqlmodel import Session, text
from backend.db.session import get_session
from typing import Dict
import subprocess
import os
import sys

router = APIRouter()

@router.post("/reset-db")
async def reset_database(session: Session = Depends(get_session)):
    """
    Reset the database by running the reset_db.py script.
    This will delete ALL data and regenerate everything from scratch with seed data.
    """
    try:
        # Get the absolute path to the reset_db.py script
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
        reset_script_path = os.path.join(project_root, "reset_db.py")
        
        # Run the reset_db.py script
        result = subprocess.run(
            [sys.executable, reset_script_path],
            capture_output=True,
            text=True,
            check=True
        )
        
        return {
            "success": True,
            "message": "Database reset successfully",
            "details": result.stdout
        }
    except subprocess.CalledProcessError as e:
        return {
            "success": False,
            "error": "Error resetting database",
            "details": e.stderr
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

# FIXED: Changed from @router.delete to @router.post to match frontend expectation
@router.post("/clear-db")
async def clear_database():
    """Clear the database tables without reseeding - now accepts POST to match frontend"""
    try:
        # Drop all tables and recreate them
        from sqlmodel import SQLModel
        from backend.db.session import engine
        from backend.db import models  # ensure all models are imported
        
        # Drop all tables - completely wipe the database
        SQLModel.metadata.drop_all(engine)
        
        return {
            "success": True,
            "message": "Database cleared successfully"
        }
    except Exception as e:
        return {
            "success": False, 
            "error": str(e)
        }