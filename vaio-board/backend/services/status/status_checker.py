# backend/services/status/status_checker.py

import xmlrpc.client
from pathlib import Path
from functools import lru_cache
from typing import Dict, List, Any, cast

from backend.services.service_registry import get_all_services

SUPERVISOR_RPC_URL = "http://localhost:9001/RPC2"
SUPERVISOR_SOCKET_PATH = "/home/vaio/vaio-board/workspace/supervisor/supervisord.conf"  # adjust if needed

# Supervisor states returned by XML-RPC
VALID_STATES = {
    "RUNNING",
    "STOPPED",
    "STARTING",
    "STOPPING",
    "FATAL",
    "BACKOFF",
    "EXITED",
    "UNKNOWN"
}

@lru_cache(maxsize=1)
def get_supervisor_proxy():
    return xmlrpc.client.ServerProxy(SUPERVISOR_RPC_URL, allow_none=True)

def _safe_rpc_call(func, *args) -> Dict[str, Any]:
    try:
        result = func(*args)
        # Convert non-dict results to dict format for consistent return typing
        if isinstance(result, dict):
            return cast(Dict[str, Any], result)
        else:
            return {"status": "OK", "result": result}
    except Exception as e:
        return {"status": "ERROR", "detail": str(e)}

def get_service_status(service: Dict[str, Any]) -> Dict[str, Any]:
    name = service["name"]
    check_path = Path(service.get("checkPath", "/dev/null"))
    module_type = service.get("module_type", "unknown")

    # System modules are considered always running
    if service.get("alwaysAvailable") or module_type == "system":
        return {"name": name, "status": "RUNNING"}

    # Not installed
    if not check_path.exists():
        return {"name": name, "status": "NOT_INSTALLED"}

    # Query SupervisorD
    try:
        proxy = get_supervisor_proxy()
        info = proxy.supervisor.getProcessInfo(name)
        # Ensure info is a dict before using get()
        if isinstance(info, dict):
            state = info.get("statename", "UNKNOWN")
            return {
                "name": name,
                "status": state if state in VALID_STATES else "UNKNOWN"
            }
        else:
            # Handle unexpected info format
            return {
                "name": name, 
                "status": "UNKNOWN", 
                "detail": f"Unexpected info format: {type(info)}"
            }
    except xmlrpc.client.Fault as e:
        return {"name": name, "status": "ERROR", "detail": str(e)}
    except Exception as e:
        return {"name": name, "status": "UNKNOWN", "detail": str(e)}

def get_module_type_for_service(service):
    """Helper function to get module_type safely without circular imports"""
    # First try to get from service.module if available
    if hasattr(service, "module") and service.module and hasattr(service.module, "module_type"):
        return str(service.module.module_type)
    
    # If not available, determine based on service name
    service_name = service.name.lower() if hasattr(service, "name") else ""
    if service_name in ["supervisor", "system"]:
        return "system"
    elif service_name in ["nvidia", "cpu", "memory", "disk", "network"]:
        return "service"
    else:
        return "unknown"

def get_all_service_statuses() -> List[Dict[str, Any]]:
    services = get_all_services()
    
    return [get_service_status({
        "name": s.name,
        "command": getattr(s, "command", None),
        "checkPath": getattr(s, "path", "/invalid"),
        "alwaysAvailable": getattr(s, "alwaysAvailable", False),
        "module_type": get_module_type_for_service(s)
    }) for s in services]

# === Control actions ===

def start_service(name: str) -> Dict[str, Any]:
    proxy = get_supervisor_proxy()
    return _safe_rpc_call(proxy.supervisor.startProcess, name)

def stop_service(name: str) -> Dict[str, Any]:
    proxy = get_supervisor_proxy()
    return _safe_rpc_call(proxy.supervisor.stopProcess, name)

def restart_service(name: str) -> Dict[str, Any]:
    proxy = get_supervisor_proxy()
    stop_result = _safe_rpc_call(proxy.supervisor.stopProcess, name)
    start_result = _safe_rpc_call(proxy.supervisor.startProcess, name)
    return {
        "stopped": stop_result,
        "started": start_result
    }
