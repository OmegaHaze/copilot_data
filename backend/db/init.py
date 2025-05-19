# db/init.py - Database initialization
# Handles: Creating database tables from SQLModel definitions

import logging
from sqlmodel import SQLModel
from backend.db.session import engine

# Set up logging
logger = logging.getLogger(__name__)

def init_db():
    """
    Initialize database by creating tables from SQLModel definitions.
    
    This should be called during application startup to ensure
    all required database tables exist.
    """
    try:
        logger.info("Creating database tables...")
        SQLModel.metadata.create_all(engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise