from fastapi import APIRouter
import logging
import subprocess
import os
import sys

# Import the functions we need from reset_db
from backend.reset_db import clear_module_tables, reset_entire_database

# Set up logger
logger = logging.getLogger(__name__)

router = APIRouter()

# Simple GET endpoints that should work without any special handling
@router.get("/reset-module-db")
def reset_module_database():
    """
    Reset the module tables only using GET request.
    This will clear all module data but preserve other data.
    """
    try:
        logger.info("Reset module database endpoint called via GET")
        result = clear_module_tables()
        return result
    except Exception as e:
        logger.error(f"Error resetting module database: {str(e)}")
        return {
            "success": False,
            "message": "Error during reset operation",
            "error": str(e)
        }

@router.get("/clear-all-db")
def clear_database():
    """
    Reset the entire database using GET request.
    This will delete ALL data from all tables and recreate them empty.
    WARNING: This is a destructive operation that cannot be undone.
    """
    try:
        logger.info("Clear entire database endpoint called via GET")
        result = reset_entire_database()
        return result
    except Exception as e:
        logger.error(f"Error clearing database: {str(e)}")
        return {
            "success": False,
            "message": "Error during database clear operation",
            "error": str(e)
        }

# COMMENTED OUT - Using routes in routes_reset_db.py instead
# @router.post("/reset-db")
# async def reset_database():
#     """Reset the database by running the reset_db.py script."""
#     try:
#         # Get the absolute path to the reset_db.py script
#         project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
#         reset_script_path = os.path.join(project_root, "reset_db.py")
#         
#         # Run the reset_db.py script
#         result = subprocess.run(
#             [sys.executable, reset_script_path],
#             capture_output=True,
#             text=True,
#             check=True
#         )
#         
#         return {
#             "success": True,
#             "message": "Database reset successfully",
#             "details": result.stdout
#         }
#     except subprocess.CalledProcessError as e:
#         return {
#             "success": False,
#             "error": "Error resetting database",
#             "details": e.stderr
#         }
#
# @router.delete("/clear-db")
# async def clear_database():
#     """Clear the database tables without reseeding."""
#     try:
#         # Get the absolute path to the reset_db.py script
#         project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
#         
#         # Create a temporary script to just drop tables with CASCADE
#         temp_script = """
# from sqlmodel import SQLModel
# from sqlalchemy import text
# from backend.db.session import engine
# import backend.db.models  # This imports all models
#
# print("Dropping all tables with CASCADE...")
# Use raw SQL to drop tables with CASCADE option
# with engine.begin() as conn:
#     conn.execute(text("DROP SCHEMA public CASCADE"))
#     conn.execute(text("CREATE SCHEMA public"))
#     conn.execute(text("GRANT ALL ON SCHEMA public TO postgres"))
#     conn.execute(text("GRANT ALL ON SCHEMA public TO public"))
# print("Database cleared successfully!")
#         """
        
#         # Write the temp script to a file
#         temp_script_path = os.path.join(project_root, "temp_clear_db.py")
#         with open(temp_script_path, "w") as f:
#             f.write(temp_script)
            
#         # Run the temporary script
#         result = subprocess.run(
#             [sys.executable, temp_script_path],
#             capture_output=True,
#             text=True,
#             check=True
#         )
        
#         # Delete the temporary script
#         os.remove(temp_script_path)
        
#         return {
#             "success": True,
#             "message": "Database cleared successfully",
#             "details": result.stdout
#         }
#     except subprocess.CalledProcessError as e:
#         return {
#             "success": False,
#             "error": "Error clearing database",
#             "details": e.stderr
#         }
#     except Exception as e:
#         return {
#             "success": False,
#             "error": f"Error: {str(e)}"
#         }
