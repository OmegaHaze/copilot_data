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

# [SES-001] User Session Router - Handles all session-related API endpoints
router = APIRouter(prefix="/api/user", tags=["user-session"])

# === Utilities ===

# [SES-002] Layout Validation - Ensures layout arrays have valid items
def validate_layout_array(layout_array):
    """Validate that a layout array contains valid items"""
    if not isinstance(layout_array, list):
        return []
    
    valid_items = []
    for item in layout_array:
        if not isinstance(item, dict) or "i" not in item:
            logger.warning("Skipping invalid layout item (missing 'i' property)")
            continue
            
        item_id = item["i"]
        if not item_id or not isinstance(item_id, str):
            logger.warning("Skipping item with invalid ID")
            continue
            
        # [SES-003] Three-Part ID Validation - Ensures module IDs follow proper format
        # Format: MODULETYPE-STATICID-INSTANCEID
        parts = item_id.split("-")
        if len(parts) != 3:
            logger.warning(f"Skipping item with invalid ID format: {item_id}. Expected MODULETYPE-STATICID-INSTANCEID")
            continue
        
        # Ensure module type is uppercase
        module_type = parts[0]
        if module_type != module_type.upper():
            # Auto-correct module type to uppercase
            item["i"] = f"{module_type.upper()}-{'-'.join(parts[1:])}"
            
        # Validate module type
        if module_type.upper() not in ["SYSTEM", "SERVICE", "USER"]:
            logger.warning(f"Skipping item with invalid module type: {module_type} in {item_id}")
            continue

        # Add validated item
        valid_items.append(item)
            
    return valid_items

def format_layout_response(session: UserSession):
    """Format the session data for the frontend - no conversion needed since we use arrays everywhere"""
    if not session:
        return {"message": "Session not found"}
    
    # Ensure we have a proper grid_layout structure with arrays
    grid_layout = session.grid_layout or {"lg": [], "md": [], "sm": [], "xs": [], "xxs": []}
    
    # Validate each breakpoint
    formatted_grid_layout = {}
    for bp in ['lg', 'md', 'sm', 'xs', 'xxs']:
        if bp not in grid_layout or not isinstance(grid_layout[bp], list):
            formatted_grid_layout[bp] = []
        else:
            # Validate items in each breakpoint
            formatted_grid_layout[bp] = validate_layout_array(grid_layout[bp])
    
    return {
        "id": session.id,
        "user_id": session.user_id,
        "grid_layout": formatted_grid_layout,
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
        # Create new session with proper defaults using arrays
        session = UserSession(
            user_id=user_id,
            grid_layout={
                "lg": [], "md": [], "sm": [], "xs": [], "xxs": []
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
        session.grid_layout = {
            "lg": [], "md": [], "sm": [], "xs": [], "xxs": []
        }
    elif not all(bp in session.grid_layout for bp in ['lg', 'md', 'sm', 'xs', 'xxs']):
        # Ensure all breakpoints exist in grid_layout as arrays
        for bp in ['lg', 'md', 'sm', 'xs', 'xxs']:
            if bp not in session.grid_layout:
                session.grid_layout[bp] = []
            elif not isinstance(session.grid_layout[bp], list):
                session.grid_layout[bp] = []
    
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

# [SES-004] Grid Layout Update Endpoint - Core API for saving layouts
@router.put("/session/grid", response_model=Dict[str, Any])
async def update_grid_layouts(
    payload: Dict[str, Any] = Body(...),
    user=Depends(get_current_user)
):
    """Update the grid layouts and active modules for a user session
    
    Expected format: { 
        "grid_layout": { "lg": [...], "md": [...], ... },
        "active_modules": ["SYSTEM-SupervisorPane-abc123", ...] 
    }
    No conversion needed - we directly use arrays for storage 
    """
    user_id = user.id
    
    try:
        with Session(engine) as db:
            session = get_or_create_session(db, user_id)
            
            # [SES-005] Extract Layout Data - From frontend payload
            layouts = payload.get("grid_layout", {})
            active_modules = payload.get("active_modules", [])
            
            # [SES-006] Active Module Standardization - Ensures proper casing
            if isinstance(active_modules, list):
                session.active_modules = [
                    m if "-" not in m else 
                    f"{m.split('-')[0].upper()}-{'-'.join(m.split('-')[1:])}" 
                    for m in active_modules
                ]
            
            # Initialize grid_layout if not present
            if not session.grid_layout:
                session.grid_layout = {"lg": [], "md": [], "sm": [], "xs": [], "xxs": []}
            
            # [SES-007] Process Each Breakpoint - Validates each array separately
            for bp in ['lg', 'md', 'sm', 'xs', 'xxs']:
                if bp in layouts:
                    # Store and validate array directly
                    if isinstance(layouts[bp], list):
                        session.grid_layout[bp] = validate_layout_array(layouts[bp])
                    else:
                        logger.warning(f"Invalid format for breakpoint {bp}: expected array but got {type(layouts[bp])}")
                        session.grid_layout[bp] = []
            
            # Update last_active timestamp
            session.last_active = datetime.now(timezone.utc)
            db.commit()
            db.refresh(session)
            
            return format_layout_response(session)
    except Exception as e:
        logger.error(f"Error updating grid layouts: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update grid layouts: {str(e)}")

# [SES-004a] Grid Layout Retrieve Endpoint - For getting saved layouts
@router.get("/session/grid", response_model=Dict[str, Any])
async def get_grid_layouts(user=Depends(get_current_user)):
    """Retrieve the grid layouts and active modules for a user session"""
    user_id = user.id
    
    try:
        with Session(engine) as db:
            session = get_or_create_session(db, user_id)
            
            # Return the session data
            return {
                "grid_layout": session.grid_layout or {},
                "active_modules": session.active_modules or [],
                "last_active": session.last_active
            }
    except Exception as e:
        logger.error(f"Error retrieving grid layouts: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve grid layouts: {str(e)}")

# [SES-008] Module List Update Endpoint - For updating active modules only
@router.put("/session/modules", response_model=Dict[str, Any])
async def update_active_modules(modules: List[str] = Body(...), user=Depends(get_current_user)):
    """Update the list of active modules for a user session"""
    user_id = user.id
    
    try:
        with Session(engine) as db:
            session = get_or_create_session(db, user_id)
            
            # Update active modules with proper uppercase module types
            session.active_modules = [
                m if "-" not in m else 
                f"{m.split('-')[0].upper()}-{'-'.join(m.split('-')[1:])}" 
                for m in modules
            ]
            
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
            
            # Reset layouts to empty arrays for all breakpoints
            session.grid_layout = {
                "lg": [], "md": [], "sm": [], "xs": [], "xxs": []
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
                if bp in session.grid_layout:
                    if isinstance(session.grid_layout[bp], list):
                        # Filter out the module from array by its 'i' property
                        session.grid_layout[bp] = [
                            item for item in session.grid_layout[bp] 
                            if not (isinstance(item, dict) and item.get('i') == module_id)
                        ]
            
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
