from fastapi import APIRouter
from sqlmodel import Session, select
from backend.db.session import engine
from backend.db.models import Service
from typing import List, Optional
from pydantic import BaseModel

router = APIRouter()

class ServiceStatus(BaseModel):
    name: str
    status: str
    module_type: Optional[str] = None

@router.get("/status", response_model=List[ServiceStatus])
def get_service_status():
    with Session(engine) as session:
        services = session.exec(select(Service)).all()
        return [
            {
                "name": svc.name, 
                "status": svc.status or "UNKNOWN",
                "module_type": str(svc.module.module_type) if svc.module else "unknown"
            } 
            for svc in services
        ]
