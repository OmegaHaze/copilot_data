# Module routes package
from backend.routes.module.routes_modules import router as module_router
from backend.routes.module.routes_api_modules import router as api_modules_router
from backend.routes.module.routes_module_installer import router as module_installer_router
from backend.routes.module.routes_reset_db import router as reset_db_router

# Export the routers directly
__all__ = ['module_router', 'api_modules_router', 'module_installer_router', 'reset_db_router']