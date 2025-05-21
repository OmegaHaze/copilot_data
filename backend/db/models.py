from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, JSON, DateTime
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from enum import Enum


# MODULE-FLOW-1.1: Module Type Definition
# COMPONENT: Database Schema - Core Enums
# PURPOSE: Defines the foundational module type classification system
# FLOW: Entry point → Consumed by Module model (MODULE-FLOW-1.3)
# MERMAID-FLOW: flowchart TD; MOD1.1[ModuleType Enum] -->|Referenced by| MOD1.3[Module Model];
#               MOD1.1 -->|Defines Types| MOD1.1.1[SYSTEM/SERVICE/USER];
#               MOD1.1.1 -->|Controls Access| MOD4.1[Service Manager]
class ModuleType(str, Enum):
    SYSTEM = "SYSTEM"  # Core system modules with privileged access
    SERVICE = "SERVICE"  # External service modules with limited system access
    USER = "USER"  # User-created modules with restricted permissions


# MODULE-FLOW-1.2: User Model Definition
# COMPONENT: Database Schema - Authentication & Ownership
# PURPOSE: Foundation for module ownership and user authentication
# FLOW: Referenced by Module model (MODULE-FLOW-1.3) for ownership
# MERMAID-FLOW: flowchart TD; MOD1.2[User Model] -->|Owns| MOD1.3[Module Model];
#               MOD1.2 -->|Authenticates| MOD2.1[Auth Routes];
#               MOD1.2 -->|Has Sessions| MOD1.2.2[UserSession]
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

    # MODULE-FLOW-1.2.1: User-Module Relationships
    # COMPONENT: Database Schema - Relationship Definitions
    # PURPOSE: Establishes bidirectional links between users and modules/services
    # FLOW: Enables ownership lookups in module registry (MODULE-FLOW-3.1)
    modules: List["Module"] = Relationship(back_populates="user")
    sessions: List["UserSession"] = Relationship(back_populates="user")
    services: List["Service"] = Relationship(back_populates="user")


# MODULE-FLOW-1.3: Module Model Definition
# COMPONENT: Database Schema - Core Module Entity
# PURPOSE: Central model that defines loadable modules throughout the system
# FLOW: Referenced by Service model (MODULE-FLOW-1.4) and service registry (MODULE-FLOW-3.1)
# MERMAID-FLOW: flowchart TD; MOD1.3[Module Model] -->|Referenced by| MOD3.1[Service Registry];
#               MOD1.3 -->|Creates| MOD1.4[Service Model];
#               MOD1.3 -->|Tracked by| MOD5.3[Socket Module Tracker]
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

    # MODULE-FLOW-1.3.1: Module Relationships
    # COMPONENT: Database Schema - Module Ownership & Services
    # PURPOSE: Connects modules to their owning users and associated services
    # FLOW: Enables user permission checks (MODULE-FLOW-2.1) and service lookups (MODULE-FLOW-4.2)
    # MERMAID-FLOW: flowchart TD; MOD1.3.1[Module Relationships] -->|Enables| MOD2.1[Permission Checks];
    #               MOD1.3.1 -->|Provides| MOD4.2[Service Lookups];
    #               MOD1.3.1 -->|Connects to| MOD1.2[User Model]
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    user: Optional["User"] = Relationship(back_populates="modules")
    services: List["Service"] = Relationship(back_populates="module")


# MODULE-FLOW-1.4: Service Model Definition
# COMPONENT: Database Schema - Runtime Services
# PURPOSE: Represents running services that are managed through supervisor
# FLOW: Referenced by service manager (MODULE-FLOW-4.1) for lifecycle operations
# MERMAID-FLOW: flowchart TD; MOD1.4[Service Model] -->|Managed by| MOD4.1[Service Manager];
#               MOD1.4 -->|Status tracked by| MOD5.2[Socket Status Handler];
#               MOD1.4 -->|Belongs to| MOD1.3[Module Model]
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

    # MODULE-FLOW-1.4.1: Service Relationships
    # COMPONENT: Database Schema - Service Linkage
    # PURPOSE: Connects services back to their parent module and owning user
    # FLOW: Used by service manager (MODULE-FLOW-4.3) to find service ownership
    # MERMAID-FLOW: flowchart TD; MOD1.4.1[Service Relationships] -->|Enables| MOD4.3[Service Ownership];
    #               MOD1.4.1 -->|References| MOD1.2[User Model];
    #               MOD1.4.1 -->|References| MOD1.3[Module Model]
    module: Module = Relationship(back_populates="services")
    user: Optional["User"] = Relationship(back_populates="services")


# MODULE-FLOW-1.5: UserSession Model Definition
# COMPONENT: Database Schema - User Session & Module Instance Persistence
# PURPOSE: Stores active module instances and their layout for each user
# FLOW: References User model (MODULE-FLOW-1.2) and stores module state
# MERMAID-FLOW: flowchart TD; MOD1.5[UserSession] -->|Persists| MOD1.5.1[Module Instances];
#               MOD1.5 -->|References| MOD1.2[User Model];
#               MOD1.5 -->|Restored by| MOD2.4[Session Router]
class UserSession(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    
    # MODULE-FLOW-1.5.1: Grid Layout Storage
    # COMPONENT: Database Schema - Module Layout Persistence
    # PURPOSE: Stores responsive grid positions for module instances
    # FLOW: Used by frontend to restore module layout
    grid_layout: Dict[str, List[Dict[str, Any]]] = Field(
        default_factory=lambda: {"lg": [], "md": [], "sm": [], "xs": [], "xxs": []}, 
        sa_column=Column(JSON)
    )
    
    # MODULE-FLOW-1.5.2: Active Modules Storage
    # COMPONENT: Database Schema - Active Module Instance Registry
    # PURPOSE: Tracks which module instances are active in a user's session
    # FLOW: Used to restore module instances on login/page refresh
    active_modules: List[str] = Field(default_factory=list, sa_column=Column(JSON))
    
    # Remaining fields
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


# MODULE-FLOW-1.6: PaneLayout Model Definition
# COMPONENT: Database Schema - Module Layout Templates
# PURPOSE: Allows saving and loading of preset module configurations
# FLOW: Referenced by layout routes (MODULE-FLOW-2.4) for template management
# MERMAID-FLOW: flowchart TD; MOD1.6[PaneLayout] -->|Provides| MOD1.6.1[Layout Templates];
#               MOD1.6 -->|References| MOD1.2[User Model];
#               MOD1.6 -->|Managed by| MOD2.4[Layout Router]
class PaneLayout(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    
    user_id: int = Field(index=True, foreign_key="user.id")
    name: str = Field(index=True)

    # MODULE-FLOW-1.6.1: Module Instance Template Storage
    # COMPONENT: Database Schema - Module Template Configuration
    # PURPOSE: Records which modules are part of a saved layout template
    # FLOW: Used to instantiate modules when applying a template
    modules: List[str] = Field(default_factory=list, sa_column=Column(JSON))
    
    # MODULE-FLOW-1.6.2: Grid Layout Template Storage
    # COMPONENT: Database Schema - Module Positioning Template
    # PURPOSE: Stores the template grid positioning for saved layouts
    # FLOW: Applied to UserSession when a template is loaded
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


# MODULE-FLOW-1.7: ServiceError Model Definition
# COMPONENT: Database Schema - Module Error Logging
# PURPOSE: Persistent storage for module and service errors
# FLOW: Referenced by error handling system (MODULE-FLOW-6.1)
# MERMAID-FLOW: flowchart TD; MOD1.7[ServiceError] -->|Logs Errors from| MOD1.4[Service Model];
#               MOD1.7 -->|Consumed by| MOD6.1[Error Handling System];
#               MOD1.7 -->|Displayed in| MOD2.5[Logs Routes]
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