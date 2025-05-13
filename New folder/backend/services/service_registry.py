# (13map) Service registry - Database access for services, modules, and users
# Handles: Service discovery, module registration, and user management

from typing import Optional, List
from sqlmodel import Session, select
from sqlmodel.sql.expression import SelectOfScalar
from sqlalchemy import desc  # Import desc from sqlalchemy for type-safe ordering
from backend.db.session import engine
from backend.db.models import Service, User, Module, ModuleType, UserSession

def get_all_services() -> List[Service]:
    with Session(engine) as session:
        statement: SelectOfScalar[Service] = select(Service)
        return list(session.exec(statement))

def get_service_by_id(service_id: int) -> Optional[Service]:
    with Session(engine) as session:
        statement: SelectOfScalar[Service] = select(Service).where(Service.id == service_id)
        return session.exec(statement).first()

def get_services_by_module(module_id: int) -> List[Service]:
    with Session(engine) as session:
        statement: SelectOfScalar[Service] = select(Service).where(Service.module_id == module_id)
        return list(session.exec(statement))

def get_all_modules() -> List[Module]:
    with Session(engine) as session:
        statement: SelectOfScalar[Module] = select(Module)
        return list(session.exec(statement))

def get_installed_modules() -> List[Module]:
    with Session(engine) as session:
        statement: SelectOfScalar[Module] = select(Module).where(Module.is_installed)
        return list(session.exec(statement))

def get_visible_modules() -> List[Module]:
    with Session(engine) as session:
        statement: SelectOfScalar[Module] = select(Module).where(Module.visible)
        return list(session.exec(statement))

def get_modules_by_type(module_type: str, user_id: Optional[int] = None) -> List[Module]:
    try:
        module_type_enum = ModuleType[module_type.upper()]
    except KeyError:
        raise ValueError(f"Invalid module type: {module_type}")

    with Session(engine) as session:
        statement: SelectOfScalar[Module] = select(Module).where(Module.module_type == module_type_enum)
        if module_type_enum == ModuleType.USER and user_id is not None:
            statement = statement.where(Module.user_id == user_id)
        return list(session.exec(statement))

def get_all_users() -> List[User]:
    with Session(engine) as session:
        statement: SelectOfScalar[User] = select(User)
        return list(session.exec(statement))

def get_user_by_id(user_id: int) -> Optional[User]:
    with Session(engine) as session:
        statement: SelectOfScalar[User] = select(User).where(User.id == user_id)
        return session.exec(statement).first()

def get_user_by_username(username: str) -> Optional[User]:
    with Session(engine) as session:
        statement: SelectOfScalar[User] = select(User).where(User.username == username)
        return session.exec(statement).first()

def get_user_session(user_id: int) -> Optional[UserSession]:
    with Session(engine) as session:
        # For SQLModel with explicit sa_column, reference the column by name string
        statement: SelectOfScalar[UserSession] = (
            select(UserSession)
            .where(UserSession.user_id == user_id)
            .order_by(desc("last_active"))
        )
        return session.exec(statement).first()


def create_or_get_module(
    name: str,
    module_key: str,
    pane_component: Optional[str] = None,
    static_identifier: Optional[str] = None, 
    module_type: ModuleType = ModuleType.USER,
    user_id: Optional[int] = None,
    visible: bool = True,
    supports_status: bool = False,
    socket_namespace: Optional[str] = None,
    description: Optional[str] = None,
    category: str = "general"
) -> Module:
    with Session(engine) as session:
        statement = select(Module).where(Module.module == module_key)
        if user_id:
            statement = statement.where(Module.user_id == user_id)

        existing = session.exec(statement).first()
        if existing:
            return existing

        # If no static_identifier is provided but pane_component is,
        # use pane_component as both (since they serve similar purposes)
        if not static_identifier and pane_component:
            static_identifier = pane_component
        # If neither is provided, derive from module_key
        elif not static_identifier:
            static_identifier = f"{module_key.capitalize()}Pane"

        new_module = Module(
            name=name,
            module=module_key,
            description=description or f"{name} Module",
            paneComponent=pane_component or f"{module_key.capitalize()}Pane",
            staticIdentifier=static_identifier,
            visible=visible,
            supportsStatus=supports_status,
            socketNamespace=socket_namespace,
            category=category,
            module_type=module_type,
            user_id=user_id
        )

        session.add(new_module)
        session.commit()
        session.refresh(new_module)
        return new_module
