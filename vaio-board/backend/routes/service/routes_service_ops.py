# (5map) Service operations router - Service management endpoints
# Handles: Service retrieval, status information

from fastapi import APIRouter
from backend.services.service_registry import get_all_services

router = APIRouter()

@router.get("/services")
def get_services():
    """Get all services for the frontend"""
    try:
        services = get_all_services()
        return services
    except Exception as e:
        print(f"Error fetching services: {str(e)}")
        return []

@router.get("/status")
def get_service_status():
    """Get the status of all services"""
    services = get_all_services()
    # Here you would typically add code to check the actual status of each service
    # For now, we just return the services
    return services

@router.get("/restart/{service_id}")
def restart_service(service_id: int):
    """Restart a specific service by ID"""
    # This would integrate with your service manager
    # For now just return a placeholder
    return {"status": "success", "message": f"Service {service_id} restart initiated"}
