from pymongo import MongoClient
from pymongo.database import Database
from config import settings

_client: MongoClient | None = None
_db: Database | None = None

def get_db() -> Database:
    global _client, _db
    if _client is None:
        _client = MongoClient(settings.MONGODB_URI)
        _db = _client.motoforge  # Default database name
    return _db

def get_users_collection():
    return get_db()["users"]

def get_builds_collection():
    return get_db()["builds"]

def get_sessions_collection():
    return get_db()["sessions"]
