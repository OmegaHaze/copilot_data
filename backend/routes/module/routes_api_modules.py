# MODULE-FLOW-2.2: Module API Router - Extended Module API Operations
# COMPONENT: HTTP API - Module APIs for Frontend Integration
# PURPOSE: Provides refined API endpoints for module management with pagination, filtering
# FLOW: Entry point for advanced module API access

from fastapi import APIRouter, HTTPException, Query, Depends
from sqlmodel import Session, select
from backend.db.session import engine
from backend.db.models import Module, ModuleType
from backend.services.service_registry import (
    get_all_modules,
    get_modules_by_type,
    create_or_get_module
)
from backend.services.auth.auth import get_current_user
from typing import List, Optional
from pydantic import BaseModel

class ModuleResponse(BaseModel):
    id: int | None = None
    name: str
    module: str
    description: str | None = None
    module_type: str
    category: str | None = None
    paneComponent: str | None = None
    staticIdentifier: str | None = None
    defaultSize: str | None = None
    visible: bool = True
    supportsStatus: bool = False
    socketNamespace: str | None = None
    autostart: bool = False
    logoUrl: str | None = None
    is_installed: bool = True
    status: str | None = None
    user_id: int | None = None

    model_config = {"from_attributes": True}

class ModuleCreateRequest(BaseModel):
    name: str
    paneComponent: Optional[str] = None
    staticIdentifier: Optional[str] = None
    visible: bool = True
    supportsStatus: bool = False
    module_type: Optional[str] = None
    socketNamespace: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = "general"

router = APIRouter()

# GET /api/modules - List all modules with optional filtering
@router.get("/modules", response_model=List[ModuleResponse])
async def get_modules(
    module_type: Optional[str] = Query(None, description="Filter by module type (system, service, user)"),
    user_id: Optional[int] = Query(None, description="Filter by user ID for user modules")
):
    try:
        if module_type:
            modules = get_modules_by_type(module_type, user_id)
        else:
            modules = get_all_modules()

        return [ModuleResponse.model_validate(m) for m in modules]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch modules: {str(e)}")

# POST /api/modules/{module_type} - Create new module
@router.post("/modules/{module_type}", response_model=ModuleResponse)
async def create_module(
    module_type: str,
    data: ModuleCreateRequest,
    user=Depends(get_current_user)
):
    try:
        module_type_enum = {
            "SYSTEM": ModuleType.SYSTEM,
            "SERVICE": ModuleType.SERVICE,
            "USER": ModuleType.USER
        }.get(module_type.upper(), ModuleType.USER)
        
        # Generate a proper module key from the name if not explicitly provided
        module_key = data.name.lower().replace(' ', '_')
        
        module = create_or_get_module(
            name=data.name,
            module_key=module_key,
            pane_component=data.paneComponent,
            static_identifier=data.staticIdentifier,
            module_type=module_type_enum,
            user_id=user.id,
            visible=data.visible,
            supports_status=data.supportsStatus,
            socket_namespace=data.socketNamespace or None,
            description=data.description or None,
            category=data.category or "general"
        )

        return ModuleResponse.model_validate(module)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create module: {str(e)}")

# GET /api/modules/{module_type}/{module_id} - Get specific module
@router.get("/modules/{module_type}/{module_id}", response_model=ModuleResponse)  
async def get_module_by_type_and_id(module_type: str, module_id: int):
    """Get module by type and ID - matches frontend call: GET /api/modules/:type/:id"""
    try:
        with Session(engine) as session:
            # Convert module_type to enum
            module_type_enum = {
                "system": ModuleType.SYSTEM,
                "service": ModuleType.SERVICE, 
                "user": ModuleType.USER
            }.get(module_type.lower(), ModuleType.SYSTEM)
            
            # Find module by type and ID
            stmt = select(Module).where(
                Module.module_type == module_type_enum,
                Module.id == module_id
            )
            module = session.exec(stmt).first()
            
            if not module:
                raise HTTPException(status_code=404, detail="Module not found")
                
            return ModuleResponse.model_validate(module)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get module: {str(e)}")

# PUT /api/modules/{module_type}/{module_id} - Update specific module
@router.put("/modules/{module_type}/{module_id}", response_model=ModuleResponse)
async def update_module_by_type_and_id(
    module_type: str, 
    module_id: int,
    data: ModuleCreateRequest,
    user=Depends(get_current_user)
):
    """Update module by type and ID - matches frontend call: PUT /api/modules/:type/:id"""
    try:
        with Session(engine) as session:
            # Convert module_type to enum
            module_type_enum = {
                "system": ModuleType.SYSTEM,
                "service": ModuleType.SERVICE,
                "user": ModuleType.USER
            }.get(module_type.lower(), ModuleType.SYSTEM)
            
            # Find module by type and ID
            stmt = select(Module).where(
                Module.module_type == module_type_enum,
                Module.id == module_id
            )
            module = session.exec(stmt).first()
            
            if not module:
                raise HTTPException(status_code=404, detail="Module not found")
                
            # Update fields
            module.name = data.name
            module.description = data.description
            module.visible = data.visible
            module.supportsStatus = data.supportsStatus
            module.socketNamespace = data.socketNamespace
            module.category = data.category
            
            session.add(module)
            session.commit()
            session.refresh(module)
            
            return ModuleResponse.model_validate(module)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update module: {str(e)}")

# DELETE /api/modules/{module_type}/{module_id} - Delete specific module
@router.delete("/modules/{module_type}/{module_id}")
async def delete_module_by_type_and_id(
    module_type: str, 
    module_id: int,
    user=Depends(get_current_user)
):
    """Delete module by type and ID - matches frontend call: DELETE /api/modules/:type/:id"""
    try:
        with Session(engine) as session:
            # Convert module_type to enum
            module_type_enum = {
                "system": ModuleType.SYSTEM,
                "service": ModuleType.SERVICE,
                "user": ModuleType.USER
            }.get(module_type.lower(), ModuleType.SYSTEM)
            
            # Find module by type and ID
            stmt = select(Module).where(
                Module.module_type == module_type_enum,
                Module.id == module_id
            )
            module = session.exec(stmt).first()
            
            if not module:
                raise HTTPException(status_code=404, detail="Module not found")
                
            session.delete(module)
            session.commit()
            
            return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete module: {str(e)}")