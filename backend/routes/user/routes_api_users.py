# filepath: /home/vaio/vaio-board/backend/routes/user/routes_api_users.py

from fastapi import APIRouter
from backend.services.service_registry import get_all_users
from typing import List
from pydantic import BaseModel

class UserResponse(BaseModel):
    id: int
    username: str
    name: str
    active: bool
    
    model_config = {"from_attributes": True}

router = APIRouter()

@router.get("/users", response_model=List[UserResponse])
async def get_users():
    """Get all users for the frontend"""
    users = get_all_users()
    return [UserResponse.model_validate(user) for user in users]
