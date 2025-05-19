from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, JSON, DateTime
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from enum import Enum


class ModuleType(str, Enum):
    SYSTEM = "SYSTEM"
    SERVICE = "SERVICE"
    USER = "USER"


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    username: str
    password: str  # hashed
    role: str = Field(default="SU")
    active: bool = Field(default=True)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True), nullable=False)
    )

    modules: List["Module"] = Relationship(back_populates="user")
    sessions: List["UserSession"] = Relationship(back_populates="user")
    services: List["Service"] = Relationship(back_populates="user")


class Module(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    module: str  # path or identifier
    description: Optional[str] = None
    category: Optional[str] = Field(default="general")
    paneComponent: Optional[str] = None
    staticIdentifier: Optional[str] = None  # Explicit static identifier for component mapping
    defaultSize: Optional[str] = Field(default="medium")
    visible: bool = Field(default=True)
    supportsStatus: bool = Field(default=False)
    socketNamespace: Optional[str] = None
    autostart: bool = Field(default=False)
    logoUrl: Optional[str] = None
    module_type: ModuleType = Field(default=ModuleType.SYSTEM)
    is_installed: bool = Field(default=True)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True), nullable=False)
    )

    user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    user: Optional["User"] = Relationship(back_populates="modules")
    services: List["Service"] = Relationship(back_populates="module")


class Service(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    description: Optional[str] = Field(default="")
    path: str
    autostart: bool = Field(default=False)
    visible: bool = Field(default=True)
    supportsStatus: bool = Field(default=False)
    socketNamespace: Optional[str] = None
    status: str = Field(default="OFFLINE")
    module_id: int = Field(foreign_key="module.id")
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")

    module: Module = Relationship(back_populates="services")
    user: Optional["User"] = Relationship(back_populates="services")


# [DBM-001] UserSession Model - Core model for storing user grid layout data
class UserSession(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    
    # [DBM-002] Grid Layout Storage - Uses array format for all breakpoints
    # Structure: {"lg": [], "md": [], "sm": [], "xs": [], "xxs": []}
    grid_layout: Dict[str, List[Dict[str, Any]]] = Field(
        default_factory=lambda: {"lg": [], "md": [], "sm": [], "xs": [], "xxs": []}, 
        sa_column=Column(JSON)
    )
    
    # [DBM-003] Active Modules - List of module IDs in three-part format
    # Format: "MODULETYPE-STATICIDENTIFIER-INSTANCEID"
    active_modules: List[str] = Field(default_factory=list, sa_column=Column(JSON))
    
    # [DBM-004] User Preferences and Pane States
    preferences: Dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    pane_states: Dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    
    # Timestamps
    last_active: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column("last_active", DateTime(timezone=True))
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column("created_at", DateTime(timezone=True))
    )

    user: User = Relationship(back_populates="sessions")


# [DBM-005] PaneLayout Model - For saving grid layouts as templates
class PaneLayout(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    
    user_id: int = Field(index=True, foreign_key="user.id")
    name: str = Field(index=True)

    # [DBM-006] Modules List - Stores active module IDs 
    # Format: ["SYSTEM-SupervisorPane-abc123", "SERVICE-NvidiaPane-def456"]
    modules: List[str] = Field(default_factory=list, sa_column=Column(JSON))
    
    # [DBM-007] Grid Layout - Matches frontend grid_layout format
    # Uses consistent array format for all breakpoints
    grid: Dict[str, List[Dict[str, Any]]] = Field(
        default_factory=lambda: {"lg": [], "md": [], "sm": [], "xs": [], "xxs": []},
        sa_column=Column(JSON)
    )

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True), nullable=False)
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True), nullable=False)
    )

    user: User = Relationship()  # Added relationship to User


class ServiceError(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    service: str
    message: str
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True), nullable=False)
    )
    log_file: str
    line_number: int
    
    service_id: Optional[int] = Field(default=None, foreign_key="service.id")  # Added service foreign key
    service_relation: Optional[Service] = Relationship()  # Added service relationship