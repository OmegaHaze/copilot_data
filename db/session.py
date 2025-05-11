# (8map) Database session - Connection and session management
# Handles: Database engine creation, session context management

from sqlmodel import create_engine, Session
import os

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://vaio:postgres@/vaio?host=/home/vaio/vaio-board/workspace/postgres/socket"
)

engine = create_engine(DATABASE_URL, echo=False)

def get_session():
    with Session(engine) as session:
        yield session
