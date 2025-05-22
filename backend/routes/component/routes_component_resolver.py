from fastapi import APIRouter, HTTPException
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/components/resolve")  
async def resolve_component(component_id: str):
    """Resolve component by ID - matches frontend expectation"""
    try:
        logger.info(f"Component resolve requested for: {component_id}")
        
        return {
            "status": "deprecated",
            "message": "Component resolution is handled client-side",
            "component_id": component_id
        }
    except Exception as e:
        logger.error(f"Error in component resolver: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))