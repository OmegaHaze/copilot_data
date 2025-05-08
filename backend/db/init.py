# (8.1map) Database initialization - Schema creation and setup
# Handles: Creating database tables from SQLModel definitions

from sqlmodel import SQLModel
from backend.db.session import engine

def init_db():
    SQLModel.metadata.create_all(engine)
