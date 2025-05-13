from fastapi import APIRouter
import subprocess
import os
import sys

router = APIRouter()

@router.post("/reset-db")
async def reset_database():
    """Reset the database by running the reset_db.py script."""
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

@router.delete("/clear-db")
async def clear_database():
    """Clear the database tables without reseeding."""
    try:
        # Get the absolute path to the reset_db.py script
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
        
        # Create a temporary script to just drop tables
        temp_script = """
from sqlmodel import SQLModel
from backend.db.session import engine
import backend.db.models  # This imports all models

print("Dropping all tables...")
SQLModel.metadata.drop_all(engine)
print("Database cleared successfully!")
        """
        
        # Write the temp script to a file
        temp_script_path = os.path.join(project_root, "temp_clear_db.py")
        with open(temp_script_path, "w") as f:
            f.write(temp_script)
            
        # Run the temporary script
        result = subprocess.run(
            [sys.executable, temp_script_path],
            capture_output=True,
            text=True,
            check=True
        )
        
        # Delete the temporary script
        os.remove(temp_script_path)
        
        return {
            "success": True,
            "message": "Database cleared successfully",
            "details": result.stdout
        }
    except subprocess.CalledProcessError as e:
        return {
            "success": False,
            "error": "Error clearing database",
            "details": e.stderr
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Error: {str(e)}"
        }
