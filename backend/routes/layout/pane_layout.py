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
    """Create a new layout entry for the current user"""
    # Set user ID and timestamps
    layout.user_id = user.id
    layout.created_at = datetime.now(timezone.utc)
    layout.updated_at = datetime.now(timezone.utc)
    
    # Ensure the grid has the expected structure with breakpoints
    if not layout.grid:
        layout.grid = {"lg": [], "md": [], "sm": [], "xs": [], "xxs": []}
    elif not all(bp in layout.grid for bp in ['lg', 'md', 'sm', 'xs', 'xxs']):
        # Add any missing breakpoints
        for bp in ['lg', 'md', 'sm', 'xs', 'xxs']:
            if bp not in layout.grid:
                layout.grid[bp] = []
    
    with Session(engine) as session:
        try:
            session.add(layout)
            session.commit()
            session.refresh(layout)
            return layout
        except Exception as e:
            session.rollback()
            logger.error(f"Error saving layout: {str(e)}")
            # This exception will be reached when a database error occurs
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
            
            # Ensure the grid has the expected structure with breakpoints
            if not layout.grid:
                layout.grid = {"lg": [], "md": [], "sm": [], "xs": [], "xxs": []}
            elif not all(bp in layout.grid for bp in ['lg', 'md', 'sm', 'xs', 'xxs']):
                # Add any missing breakpoints
                for bp in ['lg', 'md', 'sm', 'xs', 'xxs']:
                    if bp not in layout.grid:
                        layout.grid[bp] = []
                
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
    """Ensure session layout has proper structure with breakpoints"""
    
    with Session(engine) as session:
        try:
            user_session = session.exec(select(UserSession).where(UserSession.user_id == user.id)).first()
            if not user_session:
                raise HTTPException(status_code=404, detail="User session not found")
            
            changes = 0
            
            # If no grid layout, initialize it
            if not user_session.grid_layout:
                user_session.grid_layout = {"lg": [], "md": [], "sm": [], "xs": [], "xxs": []}
                changes += 1
            
            # Ensure proper structure with all breakpoints
            for bp in ['lg', 'md', 'sm', 'xs', 'xxs']:
                if bp not in user_session.grid_layout:
                    user_session.grid_layout[bp] = []
                    changes += 1
                elif not isinstance(user_session.grid_layout[bp], list):
                    # Fix invalid breakpoint data
                    user_session.grid_layout[bp] = []
                    changes += 1
            
            # Clean any data that's not in the proper format
            keys_to_remove = [k for k in user_session.grid_layout.keys() 
                             if k not in ['lg', 'md', 'sm', 'xs', 'xxs']]
            
            if keys_to_remove:
                for k in keys_to_remove:
                    del user_session.grid_layout[k]
                changes += len(keys_to_remove)
            
            # Update the user session's last active timestamp
            user_session.last_active = datetime.now(timezone.utc)
            session.add(user_session)
            session.commit()
            
            return {
                "status": "success", 
                "changes": changes,
                "message": f"Layout cleaned with {changes} changes" if changes > 0 else "Layout already consistent"
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


@router.post("/{layout_id}/apply", response_model=Dict[str, Any])
def apply_layout_to_session(layout_id: int, user=Depends(get_current_user)):
    """Apply a saved layout to the user's current session"""
    with Session(engine) as session:
        try:
            # Get the layout
            layout = session.get(Layout, layout_id)
            if not layout or layout.user_id != user.id:
                raise HTTPException(status_code=404, detail="Layout not found")
                
            # Get or create user session
            user_session = session.exec(select(UserSession).where(UserSession.user_id == user.id)).first()
            if not user_session:
                user_session = UserSession(
                    user_id=user.id,
                    grid_layout={"lg": [], "md": [], "sm": [], "xs": [], "xxs": []},
                    active_modules=[],
                    preferences={},
                    pane_states={}
                )
            
            # Only accept module IDs with the proper MODULETYPE-STATICID-INSTANCEID format
            active_modules = []
            for module_id in (layout.modules or []):
                if not module_id or not isinstance(module_id, str):
                    logger.warning(f"Skipping invalid module ID: {module_id}")
                    continue
                    
                parts = module_id.split("-")
                if len(parts) == 3:
                    # Validate module type is already uppercase
                    module_type = parts[0]
                    if module_type != module_type.upper():
                        logger.warning(f"Skipping module ID with lowercase type: {module_id}. Module type must be uppercase.")
                        continue
                        
                    # Validate module type is one of the allowed types
                    if module_type not in ["SYSTEM", "SERVICE", "USER"]:
                        logger.warning(f"Skipping module ID with invalid type: {module_id}. Expected SYSTEM, SERVICE, or USER.")
                        continue
                        
                    static_id = parts[1]
                    instance_id = parts[2]
                    
                    # Add module with proper format (already validated as uppercase)
                    active_modules.append(f"{module_type}-{static_id}-{instance_id}")
                else:
                    # Invalid format - log error
                    logger.warning(f"Skipping invalid module ID format in layout: {module_id}. Expected MODULETYPE-STATICID-INSTANCEID")
            
            # Update session with layout
            user_session.grid_layout = layout.grid
            user_session.active_modules = active_modules
            user_session.last_active = datetime.now(timezone.utc)
            
            session.add(user_session)
            session.commit()
            
            return {
                "status": "success",
                "message": f"Applied layout '{layout.name}' to current session"
            }
        except HTTPException:
            raise
        except Exception as e:
            session.rollback()
            logger.error(f"Error applying layout {layout_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to apply layout: {str(e)}")


@router.post("/from-session", response_model=Layout)
def save_from_session(layout_name: str = Query(..., description="Name for the new layout"), user=Depends(get_current_user)):
    """Create a new layout from the user's current session state
    
    This endpoint takes the current user session's grid_layout and active_modules
    and creates a new saved layout with them.
    """
    user_id = user.id
    
    try:
        with Session(engine) as session:
            # Get current user session
            user_session = session.exec(select(UserSession).where(UserSession.user_id == user.id)).first()
            if not user_session:
                raise HTTPException(status_code=404, detail="No active session found")
            
            # Only accept module IDs with the proper MODULETYPE-STATICID-INSTANCEID format
            active_modules = []
            for module_id in (user_session.active_modules or []):
                if not module_id or not isinstance(module_id, str):
                    logger.warning(f"Skipping invalid module ID: {module_id}")
                    continue
                    
                parts = module_id.split("-")
                if len(parts) == 3:
                    # Enforce uppercase for module type
                    module_type = parts[0].upper()
                    static_id = parts[1]
                    instance_id = parts[2]
                    
                    # Add module with enforced format
                    active_modules.append(f"{module_type}-{static_id}-{instance_id}")
                else:
                    # Invalid format - log and skip
                    logger.warning(f"Skipping invalid module ID format: {module_id}. Expected MODULETYPE-STATICID-INSTANCEID")
            
            # Create new layout
            new_layout = Layout(
                user_id=user_id,
                name=layout_name,
                modules=active_modules,
                grid=user_session.grid_layout,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            
            session.add(new_layout)
            session.commit()
            session.refresh(new_layout)
            
            return new_layout
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error saving layout from session: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to save layout from session: {str(e)}")