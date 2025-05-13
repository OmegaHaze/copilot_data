# filepath: /home/vaio/vaio-board/backend/sockets/status/service_status.py
import asyncio
import logging
from sqlmodel import Session, select
from backend.db.session import engine
from backend.db.models import Module
from backend.services.status.status_checker import get_all_service_statuses
from backend.services.service_registry import get_all_services

logger = logging.getLogger(__name__)

# Helper function to get a module by name
def get_module_by_name(name: str):
    try:
        with Session(engine) as session:
            stmt = select(Module).where(Module.name == name)
            return session.exec(stmt).first()
    except Exception as e:
        logger.error(f"Error retrieving module {name}: {str(e)}")
        return None

async def check_all_services():
    try:
        raw_statuses = get_all_service_statuses()
        all_services = get_all_services()
        
        logger.debug(f"Raw status check results: {raw_statuses}")
        
        service_map = {getattr(s, 'name', '').lower(): s for s in all_services}
        enhanced_services = []

        for status_info in raw_statuses:
            service_name = status_info["name"]
            service_status = status_info["status"]
            
            service_obj = service_map.get(service_name.lower())
            service_id = getattr(service_obj, 'id', None) if service_obj else None
            service_desc = getattr(service_obj, 'description', '') if service_obj else ''

            # Get the module for this service to determine its type
            # First, check if module_type is already included in status_info
            module_type = status_info.get("module_type", None)
            
            # If not provided, try to get it from the database
            if not module_type:
                module = get_module_by_name(service_name)
                module_type = str(module.module_type) if module and hasattr(module, 'module_type') else "unknown"
                
            enhanced_service = {
                "name": service_name,
                "status": service_status,
                "id": str(service_id) if service_id else service_name.lower(),
                "description": service_desc if service_desc else "",
                "module_type": module_type
            }
            
            enhanced_services.append(enhanced_service)
        
        return enhanced_services
    except Exception as e:
        logger.error(f"Error checking services: {str(e)}")
        return []

async def stream_service_status(sio):
    """Stream service status updates with proper error handling and cleanup."""
    logger.info("Starting service status streaming")
    task = None
    
    try:
        while True:
            try:
                services = await check_all_services()
                if services:
                    logger.debug(f"Emitting service status for {len(services)} services")
                    
                    # Emit status update as background task to avoid blocking
                    if task:
                        if not task.done():
                            # Previous task still running, skip this update
                            logger.warning("Previous status update still in progress, skipping")
                            continue
                        try:
                            await task  # Clean up previous task
                        except Exception as e:
                            logger.error(f"Error in previous status update: {str(e)}")
                    
                    # Create new task for status update
                    async def emit_status():
                        try:
                            await sio.emit("service_status", services)
                            await sio.emit("service_status_update", services)
                        except Exception as e:
                            logger.error(f"Error emitting service status: {str(e)}")
                            
                    task = asyncio.create_task(emit_status())

            except Exception as e:
                logger.error(f"Error in service status stream: {str(e)}")
                # Don't exit the loop on transient errors
                
            await asyncio.sleep(5)
            
    except asyncio.CancelledError:
        logger.info("Service status stream shutting down")
        # Clean up final task if it exists
        if task and not task.done():
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass
        raise  # Re-raise to properly handle the cancellation
    except Exception as e:
        logger.error(f"Fatal error in service status stream: {str(e)}")
        raise  # Re-raise to ensure the error is properly logged
