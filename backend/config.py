import os
from dotenv import load_dotenv

# Load .env from project root
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

class Settings:
    # Replicate / AI APIs
    REPLICATE_API_TOKEN: str = os.getenv("REPLICATE_API_TOKEN", "")
    FAL_KEY: str = os.getenv("FAL_KEY", "")
    TRIPO_API_KEY: str = os.getenv("TRIPO_API_KEY", "")
    
    # Supabase Storage
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    
    # Firebase / Firestore
    FIREBASE_PROJECT_ID: str = os.getenv("FIREBASE_PROJECT_ID", "")
    FIREBASE_PRIVATE_KEY: str = os.getenv("FIREBASE_PRIVATE_KEY", "")
    FIREBASE_CLIENT_EMAIL: str = os.getenv("FIREBASE_CLIENT_EMAIL", "")
    FIREBASE_DATABASE_URL: str = os.getenv("FIREBASE_DATABASE_URL", "")
    
    # Local Storage (fallback)
    STORAGE_DIR: str = os.getenv("STORAGE_DIR", "storage")
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")

settings = Settings()

# Ensure storage directories exist
_base = os.path.dirname(__file__)
os.makedirs(os.path.join(_base, settings.STORAGE_DIR, "uploads"), exist_ok=True)
os.makedirs(os.path.join(_base, settings.STORAGE_DIR, "models"), exist_ok=True)
