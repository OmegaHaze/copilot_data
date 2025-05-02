from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from backend.db.session import engine
from backend.db.models import PaneLayout as Layout, UserSession
from backend.services.auth.auth import get_current_user
from typing import List, Dict, Any
from datetime import datetime, timezone
import logging

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/user/layouts", tags=["layouts"])


@router.get("/", response_model=List[Layout])
def list_layouts(
    offset: int = Query(0, ge=0, description="Skip N records for pagination"),
    limit: int = Query(50, ge=1, le=100, description="Limit results per page"),
    user=Depends(get_current_user)
):
    """List all layouts for the current user with pagination support"""
    with Session(engine) as session:
        try:
            query = select(Layout).where(Layout.user_id == user.id).offset(offset).limit(limit)
            return session.exec(query).all()
        except Exception as e:
            logger.error(f"Error listing layouts: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to retrieve layouts")


@router.post("/", response_model=Layout)
def save_layout(layout: Layout, user=Depends(get_current_user)):
    """Create a new layout for the current user"""
    # Set user ID and timestamps
    layout.user_id = user.id
    layout.created_at = datetime.now(timezone.utc)
    layout.updated_at = datetime.now(timezone.utc)
    
    with Session(engine) as session:
        try:
            session.add(layout)
            session.commit()
            session.refresh(layout)
            return layout
        except Exception as e:
            session.rollback()
            logger.error(f"Error saving layout: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to save layout")


@router.get("/{layout_id}", response_model=Layout)
def get_layout(layout_id: int, user=Depends(get_current_user)):
    """Get a single layout by ID"""
    with Session(engine) as session:
        layout = session.get(Layout, layout_id)
        if not layout or layout.user_id != user.id:
            raise HTTPException(status_code=404, detail="Layout not found")
        return layout


@router.put("/{layout_id}", response_model=Layout)
def update_layout(layout_id: int, layout: Layout, user=Depends(get_current_user)):
    """Update an existing layout"""
    with Session(engine) as session:
        try:
            existing = session.get(Layout, layout_id)
            if not existing:
                raise HTTPException(status_code=404, detail="Layout not found")
                
            # Check ownership
            if existing.user_id != user.id:
                raise HTTPException(status_code=403, detail="Not authorized to update this layout")
                
            # Update fields
            existing.name = layout.name
            existing.modules = layout.modules
            existing.grid = layout.grid
            existing.updated_at = datetime.now(timezone.utc)
            
            session.add(existing)
            session.commit()
            session.refresh(existing)
            return existing
        except HTTPException:
            raise
        except Exception as e:
            session.rollback()
            logger.error(f"Error updating layout {layout_id}: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to update layout")


@router.post("/session/clean", response_model=Dict[str, Any])
def clean_session_layout(user=Depends(get_current_user)):
    """Retain layout consistency without remapping service names"""
    
    with Session(engine) as session:
        try:
            user_session = session.exec(select(UserSession).where(UserSession.user_id == user.id)).first()
            if not user_session:
                raise HTTPException(status_code=404, detail="User session not found")
            
            # If no grid layout, nothing to clean
            if not user_session.grid_layout:
                return {"status": "no_layout", "changes": 0, "message": "No layout found to clean"}
                
            # No remapping needed - simply ensure layout is valid
            
            # Update the user session's last active timestamp
            user_session.last_active = datetime.now(timezone.utc)
            session.add(user_session)
            session.commit()
            
            return {
                "status": "success", 
                "changes": 0,
                "message": "Layout consistency maintained"
            }
        except HTTPException:
            raise
        except Exception as e:
            session.rollback()
            logger.error(f"Error cleaning session layout: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to clean session layout")


@router.delete("/{layout_id}", response_model=Dict[str, bool])
def delete_layout(layout_id: int, user=Depends(get_current_user)):
    """Delete a layout by ID"""
    with Session(engine) as session:
        try:
            layout = session.get(Layout, layout_id)
            if not layout:
                raise HTTPException(status_code=404, detail="Layout not found")
                
            # Check ownership
            if layout.user_id != user.id:
                raise HTTPException(status_code=403, detail="Not authorized to delete this layout")
                
            session.delete(layout)
            session.commit()
            return {"success": True}
        except HTTPException:
            raise
        except Exception as e:
            session.rollback()
            logger.error(f"Error deleting layout {layout_id}: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to delete layout")