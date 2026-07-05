from pymongo import MongoClient
from pymongo.database import Database
from config import settings

# Try Firebase first
try:
    from services.firebase import (
        get_firestore,
        get_sessions_collection,
        get_builds_collection,
        get_users_collection,
        initialize_firebase
    )
    _use_firebase = initialize_firebase()
except Exception as e:
    print(f"Firebase not available: {e}")
    _use_firebase = False

# MongoDB fallback
_client: MongoClient | None = None
_db: Database | None = None

def get_db() -> Database:
    """Get MongoDB database (fallback if Firebase is not configured)."""
    global _client, _db
    if _client is None:
        _client = MongoClient(settings.MONGODB_URI)
        _db = _client.motoforge  # Default database name
    return _db

# Export collection getters that work with both Firebase and MongoDB
if _use_firebase:
    # Firebase is primary
    __all__ = ['get_db', 'get_users_collection', 'get_builds_collection', 'get_sessions_collection']
else:
    # MongoDB fallback
    def get_users_collection():
        return get_db()["users"]

    def get_builds_collection():
        return get_db()["builds"]

    def get_sessions_collection():
        return get_db()["sessions"]

