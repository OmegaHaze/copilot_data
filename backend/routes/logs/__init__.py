from fastapi import APIRouter
from .routes_logs import router as logs_router
from .routes_errors import router as errors_router
from .routes_error_logs import router as error_logs_router

# Create router for logs endpoints
router = APIRouter()

# Include the logs and errors routers
router.include_router(logs_router, prefix="", tags=["logs"])
router.include_router(errors_router, prefix="/errors", tags=["errors"])
router.include_router(error_logs_router, prefix="", tags=["logs"])
