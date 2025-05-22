# backend/routes/routes.py - FIXED VERSION
from fastapi import APIRouter

# Import all individual routers
from backend.routes.auth.routes_auth import router as auth_router
from backend.routes.logs.routes_logs import router as logs_router
from backend.routes.logs.routes_errors import router as errors_router
from backend.routes.logs.routes_error_logs import router as error_logs_router
from backend.routes.service.routes_service_ops import router as service_ops_router
from backend.routes.service.routes_status import router as status_router
from backend.routes.service.routes_api_services import router as api_services_router
from backend.routes.module.routes_modules import router as module_router
from backend.routes.module.routes_api_modules import router as api_modules_router
from backend.routes.module.routes_module_installer import router as module_installer_router
from backend.routes.module.routes_reset_db import router as reset_db_router
from backend.routes.user.routes_user import router as user_router
from backend.routes.user.routes_api_users import router as api_users_router
from backend.routes.layout.pane_layout import router as pane_layout_router
from backend.routes.layout.routes_session import router as session_router
from backend.routes.env.routes_metrics_history import router as metrics_history_router
from backend.routes.env.routes_system_info import router as system_info_router
from backend.routes.env.routes_ml_environment import router as ml_environment_router
from backend.routes.env.routes_commands import router as commands_router
from backend.routes.component.routes_component_resolver import router as component_resolver_router
# Create the central router
router = APIRouter()

# ===== AUTHENTICATION =====
router.include_router(auth_router, prefix="/api", tags=["Auth"])

# ===== LOGS =====
router.include_router(logs_router, prefix="/api/logs", tags=["Logs"])
router.include_router(errors_router, prefix="/api/logs/errors", tags=["Errors"])
router.include_router(error_logs_router, prefix="/api/logs", tags=["Error Logs"])

# ===== SERVICES =====
router.include_router(service_ops_router, prefix="/api/service", tags=["Service Operations"])
router.include_router(status_router, prefix="/api/service", tags=["Service Status"])
router.include_router(api_services_router, prefix="/api", tags=["Services API"])

# ===== MODULES =====
router.include_router(component_resolver_router, prefix="/api", tags=["Components"])
router.include_router(module_router, prefix="/api/modules", tags=["Modules"])
router.include_router(api_modules_router, prefix="/api", tags=["Modules API"])
router.include_router(module_installer_router, prefix="/api/modules/installer", tags=["Module Installation"])
router.include_router(reset_db_router, prefix="/api/modules", tags=["Database Operations"])

# ===== USERS =====
router.include_router(user_router, prefix="/api/user", tags=["User Management"])
router.include_router(api_users_router, prefix="/api", tags=["Users API"])

# ===== LAYOUTS & SESSIONS =====
# IMPORTANT: These routers already have their prefixes defined!
# - pane_layout_router has prefix="/api/user/layouts" 
# - session_router has prefix="/api/user"
# Do NOT add additional prefixes here
router.include_router(pane_layout_router, tags=["Pane Layouts"])
router.include_router(session_router, tags=["User Sessions"])

# ===== ENVIRONMENT & METRICS =====
# metrics_history_router already has prefix="/api/history"
router.include_router(metrics_history_router, tags=["Metrics History"])
router.include_router(system_info_router, prefix="/api/system", tags=["System Info"])
router.include_router(ml_environment_router, prefix="/api", tags=["ML Environment"])

# ===== COMMANDS =====
# Commands router has no prefix - used as-is for backward compatibility
router.include_router(commands_router, tags=["Commands"])