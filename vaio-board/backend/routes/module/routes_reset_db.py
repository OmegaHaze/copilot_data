from fastapi import APIRouter, Depends
from sqlmodel import Session, text
from backend.db.session import get_session
from typing import Dict

router = APIRouter()

@router.post("/reset-db", response_model=Dict[str, bool])
async def reset_database(session: Session = Depends(get_session)):
    """
    Completely reset the database by dropping all tables and recreating them.
    This will delete ALL data and force the system to regenerate everything from scratch.
    """
    try:
        # Drop all tables and recreate them
        from sqlmodel import SQLModel
        from backend.db.session import engine
        from backend.db import models  # ensure all models are imported
        
        # Drop all tables - completely wipe the database
        SQLModel.metadata.drop_all(engine)
        
        # Recreate all tables - this creates a fresh schema
        SQLModel.metadata.create_all(engine)
        
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}
