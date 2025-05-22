# filepath: /backend/routes/routes.py
from fastapi import APIRouter
# -----------------------------
# Authentication
# -----------------------------
from backend.routes.auth.routes_auth import router as auth_router
# -----------------------------
# Logs
# -----------------------------
from backend.routes.logs.routes_logs import router as logs_router
# -----------------------------
# Core Services
# -----------------------------
from backend.routes.service.routes_service_ops import router as service_ops_router
from backend.routes.service.routes_status import router as status_router
from backend.routes.service.routes_api_services import router as api_services_router
# -----------------------------
# Modules
# -----------------------------
from backend.routes.module.routes_modules import router as module_router
from backend.routes.module.routes_api_modules import router as api_modules_router
from backend.routes.module.routes_module_installer import router as module_installer_router
from backend.routes.module.routes_reset_db import router as reset_db_router
# -----------------------------
# Users
# -----------------------------
from backend.routes.user.routes_user import router as user_router
from backend.routes.user.routes_api_users import router as api_users_router
# -----------------------------
# Layouts (User Session / Pane Layouts)
# -----------------------------
from backend.routes.layout.pane_layout import router as session_router
# -----------------------------
# Metrics / Environment
# -----------------------------
from backend.routes.env.routes_metrics_history import router as metrics_history_router
from backend.routes.env.routes_system_info import router as system_info_router
from backend.routes.env.routes_ml_environment import router as ml_environment_router
# -----------------------------
# Commands Setup
# -----------------------------
from backend.routes.env.routes_commands import router as commands_router
# -----------------------------
# Router Setup
# -----------------------------
router = APIRouter()  # ✅ Define first
# -----------------------------
# Attach Routers (Grouped by Purpose)
# -----------------------------




# -----------------------------
# Authentication
# -----------------------------
router.include_router(auth_router, prefix="/api", tags=["Auth"])

# -----------------------------
# Logs
# -----------------------------
router.include_router(logs_router, prefix="/api/logs", tags=["Logs"])

# -----------------------------
# Core Services
# -----------------------------
router.include_router(service_ops_router, prefix="/api/service", tags=["Service Operations"])
router.include_router(status_router, prefix="/api/service", tags=["Status"])
router.include_router(api_services_router, prefix="/api", tags=["API Services"])

# -----------------------------
# Modules
# -----------------------------
router.include_router(module_router, prefix="/api/modules", tags=["Modules"])
router.include_router(api_modules_router, prefix="/api", tags=["API Modules"])
router.include_router(module_installer_router, prefix="/api/modules/installer", tags=["Module Installation"])
router.include_router(reset_db_router, prefix="/api/modules", tags=["Database Reset"])

# -----------------------------
# Users
# -----------------------------
router.include_router(user_router, prefix="/api/user", tags=["Users"])
router.include_router(api_users_router, prefix="/api", tags=["API Users"])

# -----------------------------
# Layouts (User Session / Pane Layouts)
# -----------------------------
router.include_router(session_router, prefix="/api/user", tags=["User Sessions"])

# -----------------------------
# Metrics / Environment
# -----------------------------
router.include_router(metrics_history_router, tags=["Metrics History"])
router.include_router(system_info_router, prefix="/api/system-info", tags=["System Info"])
router.include_router(ml_environment_router, prefix="/api/ml-environment", tags=["ML Environment"])


# -----------------------------
# Commands Setup
# -----------------------------
router.include_router(commands_router, prefix="", tags=["Commands"])  # Commands have no /api prefix to match frontend
