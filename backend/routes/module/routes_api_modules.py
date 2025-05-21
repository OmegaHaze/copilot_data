# MODULE-FLOW-2.2: Module API Router - Extended Module API Operations
# COMPONENT: HTTP API - Module APIs for Frontend Integration
# PURPOSE: Provides refined API endpoints for module management with pagination, filtering
# FLOW: Entry point for advanced module API access
# MERMAID-FLOW: flowchart TD; MOD2.2[API Module Router] -->|Queries| MOD3.1[Service Registry];
#               MOD2.2 -->|Returns| MOD2.2.1[Formatted Module Data];
#               MOD2.2 -->|Creates| MOD2.2.2[New Module Records]

from fastapi import APIRouter, HTTPException, Query, Depends
from backend.services.service_registry import (
    get_all_modules,
    get_modules_by_type,
    create_or_get_module
)
from backend.services.auth.auth import get_current_user
from backend.db.models import ModuleType
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

# MODULE-FLOW-2.2.1: Module Listing API - Filtered Module Access
# COMPONENT: HTTP API - Advanced Module Filtering
# PURPOSE: Provides filtered module listing with type and user filtering
# FLOW: Calls service_registry functions based on filter parameters
# MERMAID-FLOW: flowchart TD; MOD2.2.1[Module Listing API] -->|Filters By| MOD2.2.1.1[Type/User];
#               MOD2.2.1 -->|Calls| MOD3.1.2[Module Listing Functions]

@router.get("/modules", response_model=List[ModuleResponse])
async def get_modules(
    module_type: Optional[str] = Query(None, description="Filter by module type (system, service, user)"),
    user_id: Optional[int] = Query(None, description="Filter by user ID for user modules")
):
    try:
        if module_type:
            # No need for normalization if everything is uppercase
            modules = get_modules_by_type(module_type, user_id)
        else:
            modules = get_all_modules()

        return [ModuleResponse.model_validate(m) for m in modules]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch modules: {str(e)}")

# MODULE-FLOW-2.2.2: Module Creation API - New Module Record Creation
# COMPONENT: HTTP API - Module Creation Endpoint
# PURPOSE: Facilitates the creation of new module records
# FLOW: Accepts module data, processes creation, and returns the new module record
# MERMAID-FLOW: flowchart TD; MOD2.2.2[Module Creation API] -->|Creates| MOD2.2.2.1[New Module Record];
#               MOD2.2.2 -->|Returns| MOD2.2.2.2[Created Module Data]

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
        }.get(module_type, ModuleType.USER)
        
        # Generate a proper module key from the name if not explicitly provided
        # This should be a unique identifier for the module, not the module type
        module_key = data.name.lower().replace(' ', '_')
        
        module = create_or_get_module(
            name=data.name,
            module_key=module_key,
            # Always use the explicit paneComponent and staticIdentifier if provided
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
