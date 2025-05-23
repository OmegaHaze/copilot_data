# MODULE-FLOW-2.1: Module Management Router
# COMPONENT: HTTP API - Module Registry and Operations
# PURPOSE: Provides REST endpoints for module listing, installation, control
# FLOW: Entry point for REST API access to module system
# MERMAID-FLOW: flowchart TD; MOD2.1[Module Routes] -->|Queries| MOD3.1[Service Registry];
#               MOD2.1 -->|Controls| MOD4.1[Service Manager];
#               MOD2.1 -->|Exposes| MOD2.1.1[Module API]

from fastapi import APIRouter, Depends, Request
from sqlmodel import Session, select
from backend.db.session import get_session
from backend.db.models import Module
from backend.services.service_registry import get_all_modules
from backend.services.installer.installer import install_module, uninstall_module
from backend.services.service_manager import start_service, stop_service
import psutil
import platform

router = APIRouter()

# MODULE-FLOW-2.1.1: Module Registry Endpoint
# COMPONENT: HTTP API - Module Discovery
# PURPOSE: Provides complete module registry for frontend components
# FLOW: Calls service_registry (MODULE-FLOW-3.1) to fetch all modules
# MERMAID-FLOW: flowchart TD; MOD2.1.1[Registry Endpoint] -->|Calls| MOD3.1[Service Registry];
#               MOD2.1.1 -->|Returns| MOD2.1.1.1[JSON Module List]
@router.get("/registry")
def list_available_modules():
    """Return all module definitions from registry (full system module map)."""
    return get_all_modules()

# MODULE-FLOW-2.1.2: Visible Modules Endpoint
# COMPONENT: HTTP API - UI Module Filtering
# PURPOSE: Provides filtered list of modules for dashboard display
# FLOW: Accesses Module model (MODULE-FLOW-1.3) directly via DB session
# MERMAID-FLOW: flowchart TD; MOD2.1.2[Visible Modules] -->|Queries| MOD1.3[Module Model];
#               MOD2.1.2 -->|Returns| MOD2.1.2.1[Filtered Module List]
@router.get("/visible")
def get_visible_modules(session: Session = Depends(get_session)):
    """Return only modules that are marked visible in the dashboard."""
    stmt = select(Module).where(Module.visible)
    return session.exec(stmt).all()

# MODULE-FLOW-2.1.3: Module Installation Endpoint
# COMPONENT: HTTP API - Module Installation
# PURPOSE: Triggers the installation process for new modules
# FLOW: Calls installer service to register and configure new modules
# MERMAID-FLOW: flowchart TD; MOD2.1.3[Install Endpoint] -->|Calls| MOD3.2[Module Installer];
#               MOD2.1.3 -->|Creates| MOD1.3[Module Records]
@router.post("/{slug}/install")
def install(slug: str):
    try:
        result = install_module(slug)
        return {"status": "ok", "result": result}
    except Exception as e:
        return {"status": "error", "error": str(e)}

# MODULE-FLOW-2.1.4: Module Uninstallation Endpoint
# COMPONENT: HTTP API - Module Uninstallation
# PURPOSE: Triggers the uninstallation process for existing modules
# FLOW: Calls installer service to unregister and remove module files
# MERMAID-FLOW: flowchart TD; MOD2.1.4[Uninstall Endpoint] -->|Calls| MOD3.2[Module Installer];
#               MOD2.1.4 -->|Deletes| MOD1.3[Module Records]
@router.delete("/{slug}/install")
def uninstall(slug: str):
    try:
        uninstall_module(slug)
        return {"status": "uninstalled"}
    except Exception as e:
        return {"status": "error", "error": str(e)}

# MODULE-FLOW-2.1.5: Module Start Endpoint
# COMPONENT: HTTP API - Module Start
# PURPOSE: Initiates module execution via supervisor
# FLOW: Sends start command to service manager for the specified module
# MERMAID-FLOW: flowchart TD; MOD2.1.5[Start Endpoint] -->|Controls| MOD4.1[Service Manager];
#               MOD2.1.5 -->|Starts| MOD1.3[Module Service]
@router.post("/{slug}/start")
def start(slug: str, request: Request):
    sio = request.app.state.sio
    start_service(slug, sio)
    return {"status": "started"}

# MODULE-FLOW-2.1.6: Module Stop Endpoint
# COMPONENT: HTTP API - Module Stop
# PURPOSE: Terminates module execution via supervisor
# FLOW: Sends stop command to service manager for the specified module
# MERMAID-FLOW: flowchart TD; MOD2.1.6[Stop Endpoint] -->|Controls| MOD4.1[Service Manager];
#               MOD2.1.6 -->|Stops| MOD1.3[Module Service]
@router.post("/{slug}/stop")
def stop(slug: str, request: Request):
    stop_service(slug)
    return {"status": "stopped"}

# MODULE-FLOW-2.1.7: System Information Endpoint - MOVED TO routes_system_info.py
# This endpoint has been moved to the routes_system_info.py file
# Now accessible at /api/system-info instead of /api/modules/system-info
