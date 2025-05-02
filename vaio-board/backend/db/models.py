from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, JSON, DateTime
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from enum import Enum
from uuid import UUID


class ModuleType(str, Enum):
    SYSTEM = "system"
    SERVICE = "service"
    USER = "user"


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


class Module(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    module: str  # path or identifier
    description: Optional[str] = None
    category: Optional[str] = Field(default="general")
    paneComponent: Optional[str] = None
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


class UserSession(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    grid_layout: Dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    grid_layout_breakpoints: Dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    active_modules: List[str] = Field(default_factory=list, sa_column=Column(JSON))
    preferences: Dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    pane_states: Dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    last_active: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column("last_active", DateTime(timezone=True))
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column("created_at", DateTime(timezone=True))
    )

    user: User = Relationship(back_populates="sessions")



class PaneLayout(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    user_id: UUID = Field(index=True)
    name: str = Field(index=True)

    modules: List[str] = Field(default_factory=list, sa_column=Column(JSON))
    grid: Dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True), nullable=False)
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True), nullable=False)
    )


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
