# filepath: /home/vaio/vaio-board/backend/services/service_manager.py
# MODULE-FLOW-4.1: Service Manager - Supervisor Integration
# COMPONENT: Core Services - Module Lifecycle Control
# PURPOSE: Controls starting/stopping of modules through Supervisor
# FLOW: Called by module routes (MODULE-FLOW-2.1) and socket handlers (MODULE-FLOW-5.2)
# MERMAID-FLOW: flowchart TD; MOD4.1[Service Manager] -->|Calls| MOD4.1.1[Supervisor];
#               MOD4.1 -->|References| MOD5.3[Module Tracker];
#               MOD4.1 -->|Updates| MOD5.2.1[Socket Status]

import os
import subprocess
import shutil
import logging

# Socket helpers and module tracker are now imported at function level to avoid circular imports
# (Previous imports removed to fix circular dependencies)

logger = logging.getLogger(__name__)

# Updated supervisor configuration for the new socket location
SUPERVISOR_CONF = "/home/vaio/vaio-board/workspace/supervisor/supervisord.conf"
SUPERVISORCTL_PATH = shutil.which("supervisorctl") or "supervisorctl"
SUPERVISOR_SOCK = "/home/vaio/vaio-board/workspace/supervisor/supervisor.sock"

# Check if supervisor is actually installed and available
SUPERVISOR_AVAILABLE = os.path.exists(SUPERVISOR_CONF) and os.path.exists(SUPERVISOR_SOCK)

# MODULE-FLOW-4.1.1: Module Status Check
# COMPONENT: Core Services - Module Status Detection
# PURPOSE: Gets the current runtime status of a module from supervisor
# FLOW: Called by socket handlers (MODULE-FLOW-5.2) to deliver status updates
# MERMAID-FLOW: flowchart TD; MOD4.1.1[Get Status] -->|Checks| MOD4.1.1.1[Supervisor Status];
#               MOD4.1.1 -->|Lookups| MOD5.3[Module Tracker];
#               MOD4.1.1 -->|Returns| MOD4.1.1.2[Status String]
def _get_status(module_name: str) -> str:
    """Get the status of a module from supervisor."""
    if not SUPERVISOR_AVAILABLE:
        logger.warning(f"[ServiceManager] Supervisor not available, returning simulated status for {module_name}")
        return "SIMULATED"
    
    try:
        if not os.path.exists(SUPERVISOR_CONF):
            logger.error(f"[ServiceManager] Supervisor config not found at {SUPERVISOR_CONF}")
            return "UNAVAILABLE"
            
        if not os.path.exists(SUPERVISOR_SOCK):
            logger.error(f"[ServiceManager] Supervisor socket not found at {SUPERVISOR_SOCK}")
            return "UNAVAILABLE"
            
        # First check if the module exists - function level import to avoid circular dependencies
        from backend.sockets.module.module_tracker import get_module
        module = get_module(module_name)
        if not module:
            logger.warning(f"[ServiceManager] Module {module_name} not found in database")
            return "NOT_INSTALLED"
            
        out = subprocess.check_output(
            [SUPERVISORCTL_PATH, "-c", SUPERVISOR_CONF, "status", module_name],
            stderr=subprocess.STDOUT
        ).decode()
        
        # Log the raw output for debugging
        logger.debug(f"[ServiceManager] Raw supervisor output for {module_name}: {out}")
        
        if "RUNNING" in out:
            return "RUNNING"
        elif "STARTING" in out:
            return "STARTING"
        elif "STOPPED" in out:
            return "STOPPED"
        elif "FATAL" in out or "ERROR" in out:
            return "ERROR"
        else:
            logger.warning(f"[ServiceManager] Unknown status for {module_name}: {out}")
            return "UNKNOWN"
            
    except subprocess.CalledProcessError as e:
        logger.error(f"[ServiceManager] Subprocess error checking status for {module_name}: {e}")
        return "ERROR"
    except Exception as e:
        logger.error(f"[ServiceManager] Unexpected error checking status for {module_name}: {e}")
        return "UNAVAILABLE"

# MODULE-FLOW-4.1.2: Start Service
# COMPONENT: Core Services - Module Control
# PURPOSE: Starts a module service and emits status via socket
# FLOW: Called by socket handlers (MODULE-FLOW-5.2) to start a module
# MERMAID-FLOW: flowchart TD; MOD4.1.2[Start Service] -->|Calls| MOD4.1.1[Get Status];
#               MOD4.1.2 -->|Emits| MOD5.2.1[Socket Status]
def start_service(module_name: str, sio=None) -> str:
    """Start a service using supervisorctl."""
    try:
        # Get the module for type information - function-level import
        from backend.sockets.module.module_tracker import get_module
        module = get_module(module_name)
        
        subprocess.run(
            [SUPERVISORCTL_PATH, "-c", SUPERVISOR_CONF, "start", module_name],
            check=True,
            stderr=subprocess.PIPE
        )
        status = _get_status(module_name)
        if sio:
            # Function-level import to avoid circular dependencies
            from backend.sockets.utils.socket_helpers import emit_to_namespace
            emit_to_namespace(sio, f"/modules/{module_name}", "statusUpdate", {
                "name": module_name,
                "status": status,
                "module_type": str(module.module_type) if module and hasattr(module, 'module_type') else "unknown"
            })
        return status
    except subprocess.CalledProcessError as e:
        error_msg = e.stderr.decode() if e.stderr else str(e)
        logger.error(f"[ServiceManager] Error starting {module_name}: {error_msg}")
        return "ERROR"
    except Exception as e:
        logger.error(f"[ServiceManager] Unexpected error starting {module_name}: {e}")
        return "ERROR"

# MODULE-FLOW-4.1.3: Stop Service
# COMPONENT: Core Services - Module Control
# PURPOSE: Stops a running module service via supervisor
# FLOW: Called by module routes (MODULE-FLOW-2.1) and socket handlers (MODULE-FLOW-5.2)
# MERMAID-FLOW: flowchart TD; MOD4.1.3[Stop Service] -->|Calls| MOD4.1.1[Get Status];
#               MOD4.1.3 -->|Controls| MOD4.1.1.1[Supervisor];
#               MOD4.1.3 -->|Returns| MOD4.1.3.1[Status String]
def stop_service(module_name: str) -> str:
    """Stop a service using supervisorctl."""
    if not SUPERVISOR_AVAILABLE:
        logger.warning(f"[ServiceManager] Supervisor not available, simulating stop of {module_name}")
        return "STOPPED"
        
    try:
        subprocess.run(
            [SUPERVISORCTL_PATH, "-c", SUPERVISOR_CONF, "stop", module_name],
            check=True,
            stderr=subprocess.PIPE
        )
        return _get_status(module_name)
    except subprocess.CalledProcessError as e:
        error_msg = e.stderr.decode() if e.stderr else str(e)
        logger.error(f"[ServiceManager] Error stopping {module_name}: {error_msg}")
        return "ERROR"
    except Exception as e:
        logger.error(f"[ServiceManager] Unexpected error stopping {module_name}: {e}")
        return "ERROR"

def uninstall_service(module_name: str) -> str:
    """Uninstall a service through supervisor."""
    # MODULE-FLOW-4.1.4: Uninstall Service
    # COMPONENT: Core Services - Module Control
    # PURPOSE: Uninstalls a module service and removes its configuration
    # FLOW: Called by socket handlers (MODULE-FLOW-5.2) to uninstall a module
    # MERMAID-FLOW: flowchart TD; MOD4.1.4[Uninstall Service] -->|Calls| MOD4.1.1[Get Status];
    #               MOD4.1.4 -->|Removes| MOD5.3[Module Tracker];
    #               MOD4.1.4 -->|Updates| MOD5.2.1[Socket Status]
    if not SUPERVISOR_AVAILABLE:
        logger.warning(f"[ServiceManager] Supervisor not available, simulating uninstall of {module_name}")
        return "SIMULATED"
        
    try:
        # Function-level import to avoid circular dependencies
        from backend.sockets.module.module_tracker import get_module
        module = get_module(module_name)
        if not module:
            logger.error(f"[ServiceManager] Cannot uninstall {module_name} - module not found")
            return "NOT_INSTALLED"
            
        # First stop the service if it's running
        current_status = _get_status(module_name)
        if current_status in ["RUNNING", "STARTING"]:
            stop_service(module_name)
            
        # Remove the supervisor configuration
        conf_path = os.path.join(os.path.dirname(SUPERVISOR_CONF), "conf.d", f"{module_name}.conf")
        if os.path.exists(conf_path):
            os.remove(conf_path)
            logger.info(f"[ServiceManager] Removed supervisor config for {module_name}")
            
            # Reload supervisor configuration
            try:
                subprocess.run(
                    [SUPERVISORCTL_PATH, "-c", SUPERVISOR_CONF, "reread"],
                    check=True,
                    stderr=subprocess.PIPE
                )
                subprocess.run(
                    [SUPERVISORCTL_PATH, "-c", SUPERVISOR_CONF, "update"],
                    check=True,
                    stderr=subprocess.PIPE
                )
            except subprocess.CalledProcessError as e:
                logger.error(f"[ServiceManager] Error reloading supervisor config: {e.stderr.decode()}")
                
        return "UNINSTALLED"
    except Exception as e:
        logger.error(f"[ServiceManager] Unexpected error uninstalling {module_name}: {e}")
        return "ERROR"
