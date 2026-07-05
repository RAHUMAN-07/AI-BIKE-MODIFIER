import os
from dotenv import load_dotenv

# Load .env from project root
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

class Settings:
    REPLICATE_API_TOKEN: str = os.getenv("REPLICATE_API_TOKEN", "")
    FAL_KEY: str = os.getenv("FAL_KEY", "")
    TRIPO_API_KEY: str = os.getenv("TRIPO_API_KEY", "")
    STORAGE_DIR: str = os.getenv("STORAGE_DIR", "storage")
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")

settings = Settings()

# Ensure storage directories exist
_base = os.path.dirname(__file__)
os.makedirs(os.path.join(_base, settings.STORAGE_DIR, "uploads"), exist_ok=True)
os.makedirs(os.path.join(_base, settings.STORAGE_DIR, "models"), exist_ok=True)
