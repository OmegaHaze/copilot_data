# (6map) Module management router - Module registry and operations
# Handles: Module listing, installation, uninstallation, and control

# backend/api/routes_modules.py

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

@router.get("/registry")
def list_available_modules():
    """Return all module definitions from registry (full system module map)."""
    return get_all_modules()

@router.get("/visible")
def get_visible_modules(session: Session = Depends(get_session)):
    """Return only modules that are marked visible in the dashboard."""
    stmt = select(Module).where(Module.visible)
    return session.exec(stmt).all()

@router.post("/{slug}/install")
def install(slug: str):
    try:
        result = install_module(slug)
        return {"status": "ok", "result": result}
    except Exception as e:
        return {"status": "error", "error": str(e)}

@router.delete("/{slug}/install")
def uninstall(slug: str):
    try:
        uninstall_module(slug)
        return {"status": "uninstalled"}
    except Exception as e:
        return {"status": "error", "error": str(e)}

@router.get("/system")
def get_system_info():
    """Get system information including CPU details"""
    try:
        # CPU information
        cpu_count = psutil.cpu_count(logical=False)
        cpu_count_logical = psutil.cpu_count(logical=True)
        cpu_model = ""
        try:
            # Try to get CPU model from /proc/cpuinfo (Linux)
            with open("/proc/cpuinfo", "r") as f:
                for line in f:
                    if "model name" in line:
                        cpu_model = line.split(":", 1)[1].strip()
                        break
        except Exception:
            cpu_model = "CPU Model"
        
        # Memory information
        memory = psutil.virtual_memory()
        
        return {
            "system": {
                "hostname": platform.node(),
                "platform": platform.system(),
                "release": platform.release(),
                "version": platform.version(),
                "machine": platform.machine(),
                "cpu": {
                    "model": cpu_model,
                    "physical_cores": cpu_count,
                    "logical_cores": cpu_count_logical,
                    "cores": cpu_count_logical  # For backward compatibility
                },
                "memory": {
                    "total": memory.total,
                    "available": memory.available,
                    "percent": memory.percent
                }
            }
        }
    except Exception as e:
        return {"error": str(e)}
    
@router.post("/{slug}/start")
def start(slug: str, request: Request):
    sio = request.app.state.sio
    start_service(slug, sio)
    return {"status": "started"}

@router.post("/{slug}/stop")
def stop(slug: str, request: Request):
    stop_service(slug)
    return {"status": "stopped"}
