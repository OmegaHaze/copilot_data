from fastapi import APIRouter, Query
from sqlmodel import Session, select
from backend.db.session import engine
from backend.db.models import ServiceError
from typing import Optional, List

router = APIRouter()

@router.get("/errors", response_model=List[ServiceError])
def get_errors(service: Optional[str] = None, limit: int = Query(25, ge=1)):
    with Session(engine) as session:
        query = select(ServiceError)
        if service:
            query = query.where(ServiceError.service == service)
        # Use a string to reference the column name
        query = query.order_by("timestamp desc").limit(limit)
        results = session.exec(query).all()
        return results
