import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    APP_NAME = os.getenv("APP_NAME", "vaio")
    VERSION = os.getenv("VERSION", "0.1.0")
    ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
    HOST = os.getenv("HOST", "0.0.0.0")
    PORT = int(os.getenv("PORT", 1888))
    DEBUG = os.getenv("DEBUG", "true").lower() == "true"

config = Config()
