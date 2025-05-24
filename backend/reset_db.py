"""
reset_db.py
Functions for resetting the database or specific module tables

Contains functions to:
1. Reset the entire database (drop and recreate all tables)
2. Reset only module-related tables (clear modules without affecting other data)
"""
from sqlmodel import SQLModel
from sqlalchemy import text
from typing import Dict, Any
import logging

from backend.db.session import engine

logger = logging.getLogger(__name__)

def reset_entire_database() -> Dict[str, Any]:
    """
    Reset the entire database - drops all tables and recreates them empty.
    WARNING: This will delete ALL data from the database.
    
    Returns:
        Dict with success status and details
    """
    try:
        logger.info("Dropping and recreating all database tables...")
        
        # Get all tables and drop them with CASCADE
        with engine.begin() as conn:
            conn.execute(text("DROP SCHEMA public CASCADE;"))
            conn.execute(text("CREATE SCHEMA public;"))
            conn.execute(text("GRANT ALL ON SCHEMA public TO postgres;"))
            conn.execute(text("GRANT ALL ON SCHEMA public TO public;"))
        
        # Recreate all tables defined in SQLModel
        logger.info("Creating tables from SQLModel metadata...")
        SQLModel.metadata.create_all(engine)
        
        return {
            "success": True,
            "message": "Database reset successfully. All tables dropped and recreated.",
            "details": {
                "tables_recreated": len(SQLModel.metadata.tables)
            }
        }
    except Exception as e:
        logger.error(f"Error resetting database: {str(e)}")
        return {
            "success": False,
            "error": f"Failed to reset database: {str(e)}"
        }

def clear_module_tables() -> Dict[str, Any]:
    """
    Clear only module-related tables, preserving other data.
    This removes all module entries but keeps other tables intact.
    Also clears the vaio_module_cache to ensure clean state.
    
    Returns:
        Dict with success status and details
    """
    try:
        logger.info("Clearing module tables and module cache...")
        
        # Track what was cleared for reporting
        details = {
            "modules_removed": 0,
            "cache_cleared": False,
            "tables_affected": []
        }
        
        # Use a simplified direct approach - DROP and recreate just the module table
        with engine.begin() as conn:
            # First count modules for reporting
            try:
                # Get count before deletion
                result = conn.execute(text("SELECT COUNT(*) FROM module")).fetchone()
                if result:
                    details["modules_removed"] = result[0]
                logger.info(f"Found {details['modules_removed']} modules to delete")
            except Exception as count_error:
                logger.warning(f"Could not count modules: {count_error}")
            
            # Delete using direct SQL - the most reliable approach
            conn.execute(text("DELETE FROM module"))
            logger.info("Successfully deleted all modules")
            details["tables_affected"].append("module")
            
            # Also clear the vaio_module_cache
            try:
                # Check if cache table exists first
                cache_exists = conn.execute(text(
                    "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'vaio_module_cache')"
                )).scalar()
                
                if cache_exists:
                    # Count cache entries before deletion
                    cache_count = conn.execute(text("SELECT COUNT(*) FROM vaio_module_cache")).scalar()
                    
                    # Delete cache entries
                    conn.execute(text("DELETE FROM vaio_module_cache"))
                    logger.info(f"Successfully cleared vaio_module_cache ({cache_count} entries)")
                    
                    # Update details
                    details["cache_cleared"] = True
                    details["cache_entries_removed"] = cache_count
                    details["tables_affected"].append("vaio_module_cache")
                else:
                    logger.info("vaio_module_cache table does not exist - nothing to clear")
            except Exception as cache_error:
                logger.warning(f"Could not clear vaio_module_cache: {cache_error}")
                details["cache_error"] = str(cache_error)
        
        return {
            "success": True,
            "message": f"Module tables cleared successfully. Removed {details['modules_removed']} modules and cleared module cache.",
            "details": details
        }
    except Exception as e:
        logger.error(f"Error clearing module tables: {str(e)}")
        return {
            "success": False,
            "error": f"Failed to clear module tables: {str(e)}"
        }

if __name__ == "__main__":
    # This allows the script to be run directly for maintenance
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "--modules-only":
        print("Clearing module tables only...")
        result = clear_module_tables()
    else:
        print("Resetting entire database...")
        result = reset_entire_database()
    
    if result["success"]:
        print(f"Success: {result['message']}")
        sys.exit(0)
    else:
        print(f"Error: {result['error']}")
        sys.exit(1)
