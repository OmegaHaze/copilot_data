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

# ===== UTILITY FUNCTIONS =====

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

# ===== SESSION MANAGEMENT ENDPOINTS =====

@router.get("/session", response_model=Dict[str, Any])
async def get_session(user=Depends(get_current_user)):
    """Get or create a user session with proper defaults"""
    user_id = user.id
    
    try:
        with Session(engine) as db:
            session = get_or_create_session(db, user_id)
            session.last_active = datetime.now(timezone.utc)
            db.add(session)
            db.commit()
            return format_layout_response(session)
    except Exception as e:
        logger.error(f"Error getting session: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve session: {str(e)}")

# ===== GRID LAYOUT ENDPOINTS =====

# [SES-004a] Grid Layout Retrieve Endpoint - For getting saved layouts
@router.get("/session/grid", response_model=Dict[str, Any])
async def get_grid_layouts(user=Depends(get_current_user)):
    """Retrieve the grid layouts and active modules for a user session"""
    user_id = user.id
    
    try:
        with Session(engine) as db:
            session = get_or_create_session(db, user_id)
            return {
                "grid_layout": session.grid_layout,
                "active_modules": session.active_modules
            }
    except Exception as e:
        logger.error(f"Error retrieving grid layouts: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve grid layouts: {str(e)}")

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
            
            if "lg" in payload:  # Directly provided layout object
                grid_layout = payload
                # Validate each breakpoint's array of items
                for bp in ['lg', 'md', 'sm', 'xs', 'xxs']:
                    if bp in grid_layout:
                        grid_layout[bp] = validate_layout_array(grid_layout[bp])
            
                session.grid_layout = grid_layout
                session.last_active = datetime.now(timezone.utc)
                db.add(session)
                db.commit()
                
                return {
                    "status": "success",
                    "message": "Grid layout updated successfully"
                }
            else:
                return {
                    "status": "error",
                    "message": "Invalid grid layout format"
                }
    except Exception as e:
        logger.error(f"Error updating grid layouts: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update grid layouts: {str(e)}")

@router.delete("/session/grid", response_model=Dict[str, str])
async def delete_grid_layouts(user=Depends(get_current_user)):
    """Reset the grid layouts to empty state"""
    user_id = user.id
    
    try:
        with Session(engine) as db:
            session = get_or_create_session(db, user_id)
            
            # Reset grid layout to empty arrays for each breakpoint
            session.grid_layout = {
                "lg": [], "md": [], "sm": [], "xs": [], "xxs": []
            }
            
            session.last_active = datetime.now(timezone.utc)
            db.add(session)
            db.commit()
            
            return {
                "status": "success",
                "message": "Grid layouts reset successfully"
            }
    except Exception as e:
        logger.error(f"Error deleting grid layouts: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to reset grid layouts: {str(e)}")

# ===== MODULE MANAGEMENT ENDPOINTS =====

# [SES-008] Module List Update Endpoint - For updating active modules only
@router.put("/session/modules", response_model=Dict[str, Any])
async def update_active_modules(modules: List[str] = Body(...), user=Depends(get_current_user)):
    """Update the list of active modules for a user session"""
    user_id = user.id
    
    try:
        with Session(engine) as db:
            session = get_or_create_session(db, user_id)
            
            # Validate module IDs - ensure they're in the correct format
            valid_modules = []
            for module_id in modules:
                parts = module_id.split("-")
                if len(parts) == 3 and parts[0] in ["SYSTEM", "SERVICE", "USER"]:
                    valid_modules.append(module_id)
                else:
                    logger.warning(f"Skipping invalid module ID: {module_id}")
            
            session.active_modules = valid_modules
            session.last_active = datetime.now(timezone.utc)
            db.add(session)
            db.commit()
            
            return {
                "status": "success",
                "message": "Active modules updated successfully",
                "count": len(valid_modules)
            }
    except Exception as e:
        logger.error(f"Error updating active modules: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update active modules: {str(e)}")

@router.delete("/session/modules/{module_id}", response_model=Dict[str, Any])
async def remove_module(module_id: str, user=Depends(get_current_user)):
    """Remove a specific module from active modules and grid layouts"""
    user_id = user.id
    
    try:
        with Session(engine) as db:
            session = get_or_create_session(db, user_id)
            
            # Remove from active modules
            if module_id in session.active_modules:
                session.active_modules.remove(module_id)
            
            # Remove from all breakpoints in grid layout
            for bp in session.grid_layout:
                if isinstance(session.grid_layout[bp], list):
                    session.grid_layout[bp] = [
                        item for item in session.grid_layout[bp]
                        if item.get('i') != module_id
                    ]
            
            # Remove from pane states if exists
            if session.pane_states and module_id in session.pane_states:
                del session.pane_states[module_id]
            
            session.last_active = datetime.now(timezone.utc)
            db.add(session)
            db.commit()
            
            return {
                "status": "success",
                "message": f"Module {module_id} removed successfully"
            }
    except Exception as e:
        logger.error(f"Error removing module {module_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to remove module: {str(e)}")

# ===== PANE STATE ENDPOINTS =====

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
            
            # Initialize pane_states if missing
            if not session.pane_states:
                session.pane_states = {}
            
            # Store the state for this pane
            session.pane_states[pane_id] = state
            
            session.last_active = datetime.now(timezone.utc)
            db.add(session)
            db.commit()
            
            return {
                "status": "success",
                "message": f"State updated for pane {pane_id}"
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
            
            # Return state if it exists, otherwise empty object
            if session.pane_states and pane_id in session.pane_states:
                return {
                    "state": session.pane_states[pane_id]
                }
            else:
                return {
                    "state": {}
                }
    except Exception as e:
        logger.error(f"Error retrieving pane state for {pane_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve pane state: {str(e)}")

@router.delete("/session/pane/{pane_id}", response_model=Dict[str, Any])
async def delete_pane_state(pane_id: str, user=Depends(get_current_user)):
    """Delete the state for a specific pane"""
    user_id = user.id
    
    try:
        with Session(engine) as db:
            session = get_or_create_session(db, user_id)
            
            # Delete state if it exists
            if session.pane_states and pane_id in session.pane_states:
                del session.pane_states[pane_id]
                logger.info(f"Deleted pane state for {pane_id}")
            else:
                logger.info(f"No state found for pane {pane_id} to delete")
                
            session.last_active = datetime.now(timezone.utc)
            db.add(session)
            db.commit()
            
            return {
                "status": "success",
                "message": f"State deleted for pane {pane_id}"
            }
    except Exception as e:
        logger.error(f"Error deleting pane state for {pane_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete pane state: {str(e)}")

# ===== USER PREFERENCES ENDPOINTS =====

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
            
            # Initialize preferences if missing
            if not session.preferences:
                session.preferences = {}
            
            # Update with new preferences (merge with existing)
            session.preferences.update(preferences)
            
            session.last_active = datetime.now(timezone.utc)
            db.add(session)
            db.commit()
            
            return {
                "status": "success",
                "message": "Preferences updated successfully"
            }
    except Exception as e:
        logger.error(f"Error updating preferences: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update preferences: {str(e)}")
    
    
# @router.put("/session", response_model=Dict[str, Any])
# async def update_session(
#     payload: Dict[str, Any] = Body(...),
#     user=Depends(get_current_user)
# ):
#     """Update the user session with complete data
    
#     This is a comprehensive update endpoint that can handle:
#     - Updating grid layouts
#     - Updating active modules
#     - Removing specific pane states
#     """
#     user_id = user.id
    
#     try:
#         with Session(engine) as db:
#             session = get_or_create_session(db, user_id)
            
#             # Handle grid layout updates if included
#             if "grid_layout" in payload and isinstance(payload["grid_layout"], dict):
#                 grid_layout = payload["grid_layout"]
#                 # Validate each breakpoint's array of items
#                 for bp in ['lg', 'md', 'sm', 'xs', 'xxs']:
#                     if bp in grid_layout:
#                         grid_layout[bp] = validate_layout_array(grid_layout[bp])
                
#                 session.grid_layout = grid_layout
            
#             # Handle active modules updates if included
#             if "active_modules" in payload and isinstance(payload["active_modules"], list):
#                 # Validate module IDs - ensure they're in the correct format
#                 valid_modules = []
#                 for module_id in payload["active_modules"]:
#                     parts = module_id.split("-")
#                     if len(parts) == 3 and parts[0] in ["SYSTEM", "SERVICE", "USER"]:
#                         valid_modules.append(module_id)
#                     else:
#                         logger.warning(f"Skipping invalid module ID: {module_id}")
                
#                 session.active_modules = valid_modules
            
#             # Handle pane state removal if specified
#             if "remove_pane_state" in payload and payload["remove_pane_state"]:
#                 pane_id = payload["remove_pane_state"]
#                 if session.pane_states and pane_id in session.pane_states:
#                     logger.info(f"Removing pane state for: {pane_id}")
#                     del session.pane_states[pane_id]
            
#             session.last_active = datetime.now(timezone.utc)
#             db.add(session)
#             db.commit()
            
#             return {
#                 "status": "success",
#                 "message": "Session updated successfully"
#             }
#     except Exception as e:
#         logger.error(f"Error updating session: {str(e)}")
#         raise HTTPException(status_code=500, detail=f"Failed to update session: {str(e)}")
