# (A1) Application entry point - FastAPI + Socket.IO server initialization and configuration
# Handles: Server setup, routing, database init, socket handlers, system modules
# Flow: A1 -> A2 -> A3 -> A4 -> B1
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlmodel import Session, select
import socketio
from contextlib import asynccontextmanager


from backend.routes.routes import router as core_router
from backend.routes.layout.routes_session import router as routes_session
from backend.routes.layout.pane_layout import router as pane_layout_router
# from backend.routes.user.routes_user import router as routes_user
from backend.routes.user.routes_api_users import router as routes_api_users
# from backend.routes.module.routes_components import router as component_router
from backend.core.config import config
from backend.db.init import init_db
from backend.db.models import Service
from backend.db.session import engine
from backend.sockets.router import register_sio_handlers
from backend.services.env.metrics_history import reset_all_history, start_periodic_reset

# Create a logger for this module
logger = logging.getLogger(__name__)

# Log startup message
logger.info("Starting vAio Backend server")

# -------------------------------
# (A2) SOCKET.IO SETUP - Creates socket server and registers handlers
# -------------------------------
sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")
# Flow: A2 -> C1 - Register socket handlers from router.py
register_sio_handlers(sio)
sio_app = socketio.ASGIApp(sio)

# -------------------------------
# (A3) FASTAPI SETUP - Configures REST API server
# -------------------------------
fastapi_app = FastAPI(
    title=config.APP_NAME,
    version=config.VERSION,
    debug=config.DEBUG
)

fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Temporarily allow all origins for debugging
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# (A4) DB initialization - Creates tables and ensures db structure
init_db()

# Seed system modules (commented out)
# seed_system_modules()

# (B1) REST routes registration - Attaches all route handlers to API
# Flow: B1 -> B2 (routes.py contains all route definitions)
fastapi_app.include_router(core_router)
# FIX: Remove the additional prefix - routes_session already has prefix="/api/user" defined
fastapi_app.include_router(routes_session)  # Don't add prefix="/api/user" again
fastapi_app.include_router(pane_layout_router)
# FIX: Check if routes_user already has a prefix defined; if so, remove this one too
# fastapi_app.include_router(routes_user, prefix="/api/user")
fastapi_app.include_router(routes_api_users, prefix="/api")
# Add component router for serving JSX components with correct MIME types
# fastapi_app.include_router(component_router)

# Serve frontend static files - but only after all API routes are registered
fastapi_app.mount("/", StaticFiles(directory="dashboard/client/dist", html=True), name="static")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Run startup code
    with Session(engine) as session:
        # Using exec() instead of deprecated query()
        for svc in session.exec(select(Service)).all():
            svc.status = "OFFLINE"
        session.commit()

    # seed_system_modules()
    reset_all_history()
    start_periodic_reset()
    
    yield  # This is where the application runs
    
# -------------------------------
# COMBINED SOCKETIO + FASTAPI APP
# -------------------------------

# This is the main app that Uvicorn will import - must be named "app"
app = FastAPI(lifespan=lifespan)  # FIX: Add lifespan parameter to use the context manager

# Socket.IO must be mounted directly at /socket.io to avoid 400 errors
# We don't need a custom middleware - we can mount the socketio app directly
app.mount("/socket.io", sio_app)

# Mount the rest of your FastAPI app (API + Static frontend)
app.mount("/", fastapi_app)

# Explicitly log that main.py loaded successfully
logger.info("backend.main module loaded successfully - app is ready")