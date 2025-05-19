# (15map) API Services Router - Endpoints for frontend service data
# Handles: Service listing and status information for the UI

from fastapi import APIRouter
from backend.services.service_registry import get_all_services
from typing import List, Optional
from pydantic import BaseModel, ConfigDict

# Define a Pydantic model for Service serialization
class ServiceResponse(BaseModel):
    id: Optional[int] = None
    name: str
    description: Optional[str] = None
    path: Optional[str] = None
    autostart: bool = False
    visible: bool = True
    supportsStatus: bool = False
    socketNamespace: Optional[str] = None
    status: str = "UNKNOWN"
    module_id: Optional[int] = None
    module_type: Optional[str] = None
    
    # Updated config using the new pattern
    model_config = ConfigDict(from_attributes=True)

router = APIRouter()

@router.get("/services", response_model=List[ServiceResponse])
async def get_services():
    """Get all services for the frontend"""
    try:
        services = get_all_services()
        # Add error handling and debugging
        print(f"Retrieved {len(services)} services from get_all_services()")
        
        # Prepare services with module_type information
        enhanced_services = []
        for service in services:
            # Create a dictionary from the service
            service_dict = service.__dict__.copy()
            
            # Add module_type information if available
            if hasattr(service, 'module') and service.module:
                service_dict['module_type'] = str(service.module.module_type)
            
            enhanced_services.append(service_dict)
        
        # Use model_validate with the enhanced service data
        return [ServiceResponse.model_validate(service) for service in enhanced_services]
    except Exception as e:
        print(f"Error in get_services(): {str(e)}")
        # Return empty list on error rather than 500 error
        return []
