# backend/main.py - FIXED VERSION
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlmodel import Session, select
import socketio
from contextlib import asynccontextmanager

# ONLY import the central router - it contains everything
from backend.routes.routes import router as core_router

from backend.core.config import config
from backend.db.init import init_db
from backend.db.models import Service
from backend.db.session import engine
from backend.sockets.router import register_sio_handlers
from backend.services.env.metrics_history import reset_all_history, start_periodic_reset

logger = logging.getLogger(__name__)
logger.info("Starting vAio Backend server")

# Socket.IO setup
sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")
register_sio_handlers(sio)
sio_app = socketio.ASGIApp(sio)

# FastAPI setup
fastapi_app = FastAPI(
    title=config.APP_NAME,
    version=config.VERSION,
    debug=config.DEBUG
)

fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database
init_db()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    with Session(engine) as session:
        for svc in session.exec(select(Service)).all():
            svc.status = "OFFLINE"
        session.commit()
    reset_all_history()
    start_periodic_reset()
    yield

# ============================================
# ROUTE REGISTRATION - SINGLE POINT OF TRUTH
# ============================================
# Include ONLY the central router - it handles all sub-routers internally
fastapi_app.include_router(core_router)

# Static files served last
fastapi_app.mount("/", StaticFiles(directory="dashboard/client/dist", html=True), name="static")

# Combined app
app = FastAPI(lifespan=lifespan)
app.mount("/socket.io", sio_app)
app.mount("/", fastapi_app)

logger.info("backend.main module loaded successfully - app is ready")