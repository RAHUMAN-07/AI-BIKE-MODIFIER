from pymongo import MongoClient
from pymongo.database import Database
from core.config import settings

IS_FIREBASE = False

try:
    from core.storage.firebase_service import (
        get_firestore,
        get_sessions_collection,
        get_builds_collection,
        get_users_collection,
        initialize_firebase
    )
    IS_FIREBASE = initialize_firebase()
except Exception as e:
    print(f"Firebase initialization info: {e}")
    IS_FIREBASE = False

_client: MongoClient | None = None
_db: Database | None = None

def get_db() -> Database:
    """Get MongoDB database (fallback if Firebase is not configured)."""
    global _client, _db
    if _client is None:
        _client = MongoClient(settings.MONGODB_URI)
        _db = _client.motoforge
    return _db

if IS_FIREBASE:
    __all__ = ['get_db', 'get_users_collection', 'get_builds_collection', 'get_sessions_collection', 'IS_FIREBASE']
else:
    def get_users_collection():
        return get_db()["users"]

    def get_builds_collection():
        return get_db()["builds"]

    def get_sessions_collection():
        return get_db()["sessions"]

    __all__ = ['get_db', 'get_users_collection', 'get_builds_collection', 'get_sessions_collection', 'IS_FIREBASE']
