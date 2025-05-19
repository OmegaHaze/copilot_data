# (8map) Database session - Connection and session management
# Handles: Database engine creation, session context management

from sqlmodel import create_engine, Session
import os

# Use environment variable with existing default as fallback
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://vaio:postgres@/vaio?host=/home/vaio/vaio-board/workspace/postgres/socket"
)

# Add basic error handling around engine creation
try:
    engine = create_engine(DATABASE_URL, echo=False)
except Exception as e:
    print(f"Critical error: Failed to create database engine: {e}")
    raise

def get_session():
    with Session(engine) as session:
        yield session