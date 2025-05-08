from fastapi import APIRouter, HTTPException, Body, Query
from typing import Optional, Dict, Any, List
from backend.services.installer.installer import install_module, uninstall_module, list_available_modules
from pydantic import BaseModel

router = APIRouter()

class InstallModuleRequest(BaseModel):
    module_type: str = "service"
    config: Optional[Dict[str, Any]] = None

@router.get("/available")
async def get_available_modules():
    """List all modules available for installation"""
    try:
        modules = list_available_modules()
        return {"status": "success", "modules": modules}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{slug}/install")
async def install_module_endpoint(
    slug: str, 
    data: InstallModuleRequest = Body(...),
    user_id: Optional[int] = Query(None, description="User ID for user modules")
):
    """Install a module by slug"""
    try:
        result = install_module(
            slug=slug,
            user_id=user_id,
            module_type=data.module_type,
            config=data.config
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{slug}/uninstall")
async def uninstall_module_endpoint(
    slug: str,
    user_id: Optional[int] = Query(None, description="User ID for user modules")
):
    """Uninstall a module by slug"""
    try:
        result = uninstall_module(slug=slug, user_id=user_id)
        if result["status"] == "not_found":
            raise HTTPException(status_code=404, detail=result["message"])
        elif result["status"] == "error":
            raise HTTPException(status_code=500, detail=result["message"])
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
