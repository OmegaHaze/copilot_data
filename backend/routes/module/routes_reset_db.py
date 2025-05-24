from fastapi import APIRouter, status, Request, Body
from typing import Dict, Any, Optional
import logging

# Import the functions we need from reset_db
from backend.reset_db import clear_module_tables, reset_entire_database

# Set up logger
logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/reset-db", status_code=status.HTTP_200_OK)
async def reset_database(request: Request, data: Optional[Dict] = Body(None)):
    """
    Reset the module tables only.
    This will clear all module data but preserve other data.
    """
    try:
        # Get user from cookie for logging, but don't enforce auth
        user_id = request.cookies.get("vaio_user")
        if user_id:
            logger.info(f"User {user_id} is resetting the module database")
        else:
            logger.info("Anonymous user is resetting the module database")
            
        # Call our dedicated function from reset_db.py
        return clear_module_tables()
    except Exception as e:
        logger.error(f"Error resetting module database: {str(e)}")
        # Return error with 200 status to avoid 422
        return {
            "success": False,
            "message": "Error during reset operation",
            "error": str(e)
        }

@router.post("/clear-db", status_code=status.HTTP_200_OK)
async def clear_database(request: Request, data: Optional[Dict] = Body(None)):
    """
    Reset the entire database.
    This will delete ALL data from all tables and recreate them empty.
    WARNING: This is a destructive operation that cannot be undone.
    """
    try:
        # Get user from cookie for logging, but don't enforce auth
        user_id = request.cookies.get("vaio_user")
        if user_id:
            logger.info(f"User {user_id} is clearing the entire database")
        else:
            logger.info("Anonymous user is clearing the entire database")
        
        # Call our dedicated function from reset_db.py
        return reset_entire_database()
    except Exception as e:
        logger.error(f"Error clearing database: {str(e)}")
        return {
            "success": False,
            "message": "Error during database clear operation",
            "error": str(e)
        }