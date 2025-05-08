from fastapi import APIRouter, Body, Depends, HTTPException
from sqlmodel import select, Session
from backend.db.session import engine
from backend.db.models import UserSession
from backend.services.auth.auth import get_current_user
from datetime import datetime, timezone
from typing import Any, Dict, List
import logging

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/user", tags=["user-session"])

# === Utilities ===

def dict_to_array(layout_dict):
    """Convert a dictionary of layout items to an array for frontend consumption"""
    if not isinstance(layout_dict, dict):
        return layout_dict
    return list(layout_dict.values())

def array_to_dict(layout_array):
    """Convert an array of layout items to a dictionary for database storage"""
    if not isinstance(layout_array, list):
        return layout_array
    
    return {
        item["i"]: {
            **item,
            "moduleType": item.get("moduleType") or (
                item["i"].split("-")[0] if "-" in item.get("i", "") else item.get("i", "")
            )
        }
        for item in layout_array 
        if isinstance(item, dict) and "i" in item
    }

def format_layout_response(session: UserSession):
    """Format the session data for the frontend, converting dict layouts to arrays"""
    if not session:
        return {"message": "Session not found"}
        
    # Convert layout dictionaries to arrays for frontend consumption
    grid_layout_array = dict_to_array(session.grid_layout or {})
    
    breakpoint_arrays = {}
    for bp, items in (session.grid_layout_breakpoints or {}).items():
        breakpoint_arrays[bp] = dict_to_array(items)
    
    return {
        "id": session.id,
        "user_id": session.user_id,
        "grid_layout": grid_layout_array,
        "grid_layout_breakpoints": breakpoint_arrays,
        "active_modules": session.active_modules or [],
        "preferences": session.preferences or {},
        "pane_states": session.pane_states or {},
        "last_active": session.last_active,
        "created_at": session.created_at
    }

def get_or_create_session(db: Session, user_id: int) -> UserSession:
    """Get existing session or create a new one with proper defaults"""
    session = db.exec(select(UserSession).where(UserSession.user_id == user_id)).first()
    
    if not session:
        # Create new session with proper defaults
        session = UserSession(
            user_id=user_id,
            grid_layout={},
            grid_layout_breakpoints={
                "lg": {}, "md": {}, "sm": {}, "xs": {}, "xxs": {}
            },
            active_modules=[],
            preferences={},
            pane_states={}
        )
        db.add(session)
        db.commit()
        db.refresh(session)
    
    # Ensure all fields have proper defaults if null
    if session.grid_layout is None:
        session.grid_layout = {}
    if session.grid_layout_breakpoints is None:
        session.grid_layout_breakpoints = {
            "lg": {}, "md": {}, "sm": {}, "xs": {}, "xxs": {}
        }
    if session.active_modules is None:
        session.active_modules = []
    if session.preferences is None:
        session.preferences = {}
    if session.pane_states is None:
        session.pane_states = {}
        
    return session

# === Session Endpoints ===

@router.get("/session", response_model=Dict[str, Any])
async def get_session(user=Depends(get_current_user)):
    """Get or create a user session with proper defaults"""
    user_id = user.id
    
    try:
        with Session(engine) as db:
            session = get_or_create_session(db, user_id)
            
            # Update last_active timestamp
            session.last_active = datetime.now(timezone.utc)
            db.commit()
            db.refresh(session)
            
            return format_layout_response(session)
    except Exception as e:
        logger.error(f"Error getting session: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve session: {str(e)}")

@router.put("/session/grid", response_model=Dict[str, Any])
async def update_grid_layouts(layouts: Any = Body(...), user=Depends(get_current_user)):
    """Update the grid layouts for a user session
    
    Handles both full layouts and breakpoint-specific layouts
    Converts frontend arrays to backend dictionaries for storage
    """
    user_id = user.id
    
    try:
        with Session(engine) as db:
            session = get_or_create_session(db, user_id)
            
            # Determine if this is a breakpoint layout
            is_breakpoint_layout = (
                isinstance(layouts, dict) and 
                any(bp in layouts for bp in ['lg', 'md', 'sm', 'xs', 'xxs'])
            )
            
            if is_breakpoint_layout:
                # Process each breakpoint separately
                processed_breakpoints = {}
                for bp, items in layouts.items():
                    if bp in ['lg', 'md', 'sm', 'xs', 'xxs']:
                        processed_breakpoints[bp] = array_to_dict(items)
                    else:
                        processed_breakpoints[bp] = items
                
                # Save breakpoint layouts
                session.grid_layout_breakpoints = processed_breakpoints
                
                # Use lg as the main grid layout
                session.grid_layout = processed_breakpoints.get('lg', {})
            else:
                # Process standard layout
                processed_layout = array_to_dict(layouts)
                
                # Save main layout
                session.grid_layout = processed_layout
                
                # Update all breakpoints with the same layout
                session.grid_layout_breakpoints = {
                    bp: processed_layout for bp in ['lg', 'md', 'sm', 'xs', 'xxs']
                }
            
            # Update last_active timestamp
            session.last_active = datetime.now(timezone.utc)
            db.commit()
            db.refresh(session)
            
            return format_layout_response(session)
    except Exception as e:
        logger.error(f"Error updating grid layouts: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update grid layouts: {str(e)}")

@router.put("/session/modules", response_model=Dict[str, Any])
async def update_active_modules(modules: List[str] = Body(...), user=Depends(get_current_user)):
    """Update the list of active modules for a user session"""
    user_id = user.id
    
    try:
        with Session(engine) as db:
            session = get_or_create_session(db, user_id)
            
            # Update active modules
            session.active_modules = modules
            
            # Update last_active timestamp
            session.last_active = datetime.now(timezone.utc)
            db.commit()
            db.refresh(session)
            
            return {
                "id": session.id,
                "user_id": session.user_id,
                "active_modules": session.active_modules,
                "message": "Active modules updated successfully"
            }
    except Exception as e:
        logger.error(f"Error updating active modules: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update active modules: {str(e)}")

@router.delete("/session/grid", response_model=Dict[str, str])
async def delete_grid_layouts(user=Depends(get_current_user)):
    """Reset the grid layouts to empty state"""
    user_id = user.id
    
    try:
        with Session(engine) as db:
            session = get_or_create_session(db, user_id)
            
            # Reset layouts to empty
            session.grid_layout = {}
            session.grid_layout_breakpoints = {
                "lg": {}, "md": {}, "sm": {}, "xs": {}, "xxs": {}
            }
            
            # Update last_active timestamp
            session.last_active = datetime.now(timezone.utc)
            db.commit()
            db.refresh(session)
            
            return {"message": "Grid layouts reset successfully"}
    except Exception as e:
        logger.error(f"Error deleting grid layouts: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to reset grid layouts: {str(e)}")

@router.delete("/session/modules/{module_id}", response_model=Dict[str, Any])
async def remove_module(module_id: str, user=Depends(get_current_user)):
    """Remove a specific module from active modules and grid layouts"""
    user_id = user.id
    
    try:
        with Session(engine) as db:
            session = get_or_create_session(db, user_id)
            
            # Remove from active modules list
            if session.active_modules and module_id in session.active_modules:
                session.active_modules.remove(module_id)
            
            # Remove from all breakpoint layouts
            for bp in ["lg", "md", "sm", "xs", "xxs"]:
                if bp in session.grid_layout_breakpoints:
                    bp_layout = session.grid_layout_breakpoints[bp]
                    if isinstance(bp_layout, dict):
                        # Remove by key (which should match the module_id) or by i property
                        session.grid_layout_breakpoints[bp] = {
                            k: v for k, v in bp_layout.items()
                            if k != module_id and not (
                                isinstance(v, dict) and v.get("i") == module_id
                            )
                        }
            
            # Remove from main grid layout
            if isinstance(session.grid_layout, dict):
                session.grid_layout = {
                    k: v for k, v in session.grid_layout.items()
                    if k != module_id and not (
                        isinstance(v, dict) and v.get("i") == module_id
                    )
                }
            
            # Update last_active timestamp
            session.last_active = datetime.now(timezone.utc)
            db.commit()
            db.refresh(session)
            
            return format_layout_response(session)
    except Exception as e:
        logger.error(f"Error removing module {module_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to remove module: {str(e)}")

@router.put("/session/pane/{pane_id}", response_model=Dict[str, Any])
async def update_pane_state(
    pane_id: str,
    state: Dict[str, Any] = Body(...),
    user=Depends(get_current_user)
):
    """Update the state for a specific pane"""
    user_id = user.id
    
    try:
        with Session(engine) as db:
            session = get_or_create_session(db, user_id)
            
            # Initialize pane_states if not present
            if session.pane_states is None:
                session.pane_states = {}
            
            # Update pane state, preserving existing state
            current_state = session.pane_states.get(pane_id, {})
            if current_state is None:
                current_state = {}
                
            session.pane_states[pane_id] = {
                **current_state,
                **state,
                "lastUpdated": datetime.now(timezone.utc).isoformat()
            }
            
            # Update last_active timestamp
            session.last_active = datetime.now(timezone.utc)
            db.commit()
            db.refresh(session)
            
            return {
                "pane_id": pane_id,
                "state": session.pane_states[pane_id],
                "message": "Pane state updated successfully"
            }
    except Exception as e:
        logger.error(f"Error updating pane state for {pane_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update pane state: {str(e)}")

@router.get("/session/pane/{pane_id}", response_model=Dict[str, Any])
async def get_pane_state(pane_id: str, user=Depends(get_current_user)):
    """Get the current state for a specific pane"""
    user_id = user.id
    
    try:
        with Session(engine) as db:
            session = get_or_create_session(db, user_id)
            
            # Get pane state or return empty dict if not found
            pane_state = (session.pane_states or {}).get(pane_id, {})
            if pane_state is None:
                pane_state = {}
            
            return {
                "pane_id": pane_id,
                "state": pane_state
            }
    except Exception as e:
        logger.error(f"Error retrieving pane state for {pane_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve pane state: {str(e)}")

@router.get("/session/preferences", response_model=Dict[str, Any])
async def get_preferences(user=Depends(get_current_user)):
    """Get user preferences"""
    user_id = user.id
    
    try:
        with Session(engine) as db:
            session = get_or_create_session(db, user_id)
            
            return {
                "preferences": session.preferences or {}
            }
    except Exception as e:
        logger.error(f"Error retrieving preferences: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve preferences: {str(e)}")

@router.put("/session/preferences", response_model=Dict[str, Any])
async def update_preferences(
    preferences: Dict[str, Any] = Body(...),
    user=Depends(get_current_user)
):
    """Update user preferences"""
    user_id = user.id
    
    try:
        with Session(engine) as db:
            session = get_or_create_session(db, user_id)
            
            # Update preferences, merging with existing
            current_prefs = session.preferences or {}
            session.preferences = {**current_prefs, **preferences}
            
            # Update last_active timestamp
            session.last_active = datetime.now(timezone.utc)
            db.commit()
            db.refresh(session)
            
            return {
                "preferences": session.preferences,
                "message": "Preferences updated successfully"
            }
    except Exception as e:
        logger.error(f"Error updating preferences: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update preferences: {str(e)}")