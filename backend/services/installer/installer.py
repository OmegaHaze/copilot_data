import importlib
import os
from typing import Optional, Dict, Any, List
from backend.services.service_manager import uninstall_service
from backend.db.session import engine
from sqlmodel import Session, select
from backend.db.models import Module, Service, ModuleType
import logging

logger = logging.getLogger(__name__)

def install_module(slug: str, user_id: Optional[int] = None, module_type: str = "service", config: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Install a module and register it in the database
    
    Args:
        slug: Unique identifier for the module
        user_id: Owner of the module if it's a user module
        module_type: Type of module (system, service, user)
        config: Custom configuration for the module
    
    Returns:
        Dict with status and module info
    """
    # Convert module_type string to enum
    try:
        module_type_enum = ModuleType(module_type.lower())
    except ValueError:
        raise ValueError(f"Invalid module type: {module_type}. Must be one of: system, service, user")
    
    # Check if module already exists
    with Session(engine) as db:
        statement = select(Module).where(Module.name == slug)
        existing = db.exec(statement).first()
        if existing:
            return {"status": "already_installed", "message": f"Module {slug} is already installed", "module": existing}
    
    # Try to load and run the installer
    try:
        # Import the installer module
        installer_mod = importlib.import_module(f"backend.services.installers.{slug}_installer")
        install_func = getattr(installer_mod, f"install_{slug}", None)
        
        if not callable(install_func):
            raise RuntimeError(f"No install function found for module '{slug}'")
            
        # Run the installer
        install_result_raw = install_func(config) if config else install_func()
        if not isinstance(install_result_raw, dict):
            raise TypeError(f"Expected install_func to return a dict, got {type(install_result_raw).__name__}")
        install_result: Dict[str, Any] = install_result_raw
        
        # Get installation details
        module_info = {
            "name": slug,
            "module": slug,
            "description": install_result.get("description", f"{slug.capitalize()} module"),
            "category": install_result.get("category", "general"),
            "paneComponent": install_result.get("paneComponent", f"{slug.capitalize()}Pane"),
            "defaultSize": install_result.get("defaultSize", "medium"),
            "visible": install_result.get("visible", True),
            "supportsStatus": install_result.get("supportsStatus", False),
            "socketNamespace": install_result.get("socketNamespace"),
            "autostart": install_result.get("autostart", False),
            "logoUrl": install_result.get("logoUrl"),
            "module_type": module_type_enum,
            "is_installed": True,
            "user_id": user_id if module_type_enum == ModuleType.USER else None
        }
        
        # Register the module in the database
        with Session(engine) as db:
            # Create the module record
            new_module = Module(**module_info)
            db.add(new_module)
            db.commit()
            db.refresh(new_module)
            
            # Ensure new_module.id is not None
            if new_module.id is None:
                raise RuntimeError("Failed to retrieve module ID after commit")
            
            # If the module has services, register them
            if isinstance(install_result, dict) and "services" in install_result and isinstance(install_result["services"], list):
                for svc_info in install_result["services"]:
                    svc = Service(
                        name=svc_info["name"],
                        description=svc_info.get("description", ""),
                        path=svc_info["path"],
                        autostart=svc_info.get("autostart", False),
                        visible=svc_info.get("visible", True),
                        supportsStatus=svc_info.get("supportsStatus", False),
                        socketNamespace=svc_info.get("socketNamespace"),
                        status="INSTALLED",
                        module_id=new_module.id,
                        user_id=user_id if module_type_enum == ModuleType.USER else None
                    )
                    db.add(svc)
                
                db.commit()
            
            return {
                "status": "success",
                "message": f"Module {slug} installed successfully",
                "module": new_module,
                "install_result": install_result
            }
            
    except ModuleNotFoundError:
        logger.error(f"No installer found for module '{slug}'")
        raise RuntimeError(f"No installer defined for module '{slug}'")
    except Exception as e:
        logger.exception(f"Failed to install module '{slug}': {str(e)}")
        raise RuntimeError(f"Failed to install module '{slug}': {str(e)}")

def uninstall_module(slug: str, user_id: Optional[int] = None) -> Dict[str, Any]:
    """
    Uninstall a module and remove it from the database
    
    Args:
        slug: Module identifier
        user_id: For user modules, the owner ID
        
    Returns:
        Dict with status and message
    """
    try:
        # First, find the module in the database
        with Session(engine) as db:
            # Build the query using SQLModel's select
            statement = select(Module).where(Module.name == slug)
            
            # If user_id is provided, add that condition
            if user_id is not None:
                statement = statement.where(Module.user_id == user_id)
                
            module = db.exec(statement).first()
            
            if not module:
                return {"status": "not_found", "message": f"Module {slug} not found"}
            
            # Get all associated services
            services = db.exec(select(Service).where(Service.module_id == module.id)).all()
            
            # Try to run the uninstaller for each service
            for service in services:
                try:
                    uninstall_service(service.name)
                except Exception as e:
                    logger.warning(f"Failed to uninstall service {service.name}: {str(e)}")
                    
                # Remove the service from the database regardless
                db.delete(service)
            
            # Try to find a specific uninstaller for this module
            try:
                installer_mod = importlib.import_module(f"backend.services.installers.{slug}_installer")
                uninstall_func = getattr(installer_mod, f"uninstall_{slug}", None)
                
                if callable(uninstall_func):
                    uninstall_func()
            except (ModuleNotFoundError, AttributeError):
                logger.info(f"No specific uninstaller found for module {slug}, using default cleanup")
                
            # Delete the module from the database
            db.delete(module)
            db.commit()
            
            return {"status": "success", "message": f"Module {slug} uninstalled successfully"}
            
    except Exception as e:
        logger.exception(f"Failed to uninstall module {slug}: {str(e)}")
        return {"status": "error", "message": f"Failed to uninstall module {slug}: {str(e)}"}

def list_available_modules() -> List[Dict[str, Any]]:
    """
    List all available modules that can be installed
    
    Returns:
        List of available module info dictionaries
    """
    available_modules = []
    
    # Look for installers in the installers directory
    installer_dir = os.path.join(os.path.dirname(__file__), "installers")
    if os.path.exists(installer_dir):
        for filename in os.listdir(installer_dir):
            if filename.endswith('_installer.py'):
                module_slug = filename.replace('_installer.py', '')
                
                try:
                    # Import the installer to get module info
                    installer_mod = importlib.import_module(f"backend.services.installers.{module_slug}_installer")
                    
                    # Try to get module info function
                    get_info_func = getattr(installer_mod, f"get_{module_slug}_info", None)
                    
                    if callable(get_info_func):
                        module_info = get_info_func()
                    else:
                        module_info = {
                            "name": module_slug,
                            "display_name": module_slug.capitalize(),
                            "description": f"{module_slug.capitalize()} module",
                            "version": "0.1.0"
                        }
                        
                    # Check if this module is already installed
                    with Session(engine) as db:
                        statement = select(Module).where(Module.name == module_slug)
                        existing = db.exec(statement).first()

                        # Create a new dict with explicit type annotation to avoid type issues
                        result_info: Dict[str, Any] = {}
                        
                        # Copy existing info
                        if isinstance(module_info, dict):
                            for k, v in module_info.items():
                                result_info[k] = v
                        else:
                            result_info["name"] = module_slug
                            
                        # Add installed status with proper typing
                        result_info["installed"] = bool(existing)
                        
                    available_modules.append(result_info)
                        
                except Exception as e:
                    logger.warning(f"Failed to load info for module {module_slug}: {str(e)}")
    
    return available_modules
