from sqlmodel import SQLModel
from backend.db.session import engine
import backend.db.models  # This imports all models

print("Dropping all tables...")
SQLModel.metadata.drop_all(engine)
print("Creating all tables with updated schema...")
SQLModel.metadata.create_all(engine)
print("Database reset complete!")
