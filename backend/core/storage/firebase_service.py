import json
import firebase_admin
from firebase_admin import credentials, firestore
from core.config import settings

_db: firestore.client.Client | None = None
_initialized = False

def initialize_firebase() -> bool:
    """Initialize Firebase Admin SDK using service account credentials."""
    global _initialized
    
    if _initialized:
        return True
    
    try:
        if not settings.FIREBASE_PROJECT_ID or not settings.FIREBASE_PRIVATE_KEY:
            print("WARNING: Firebase credentials not configured. Using MongoDB fallback.")
            return False
        
        private_key = settings.FIREBASE_PRIVATE_KEY.replace("\\n", "\n")
        
        cred_dict = {
            "type": "service_account",
            "project_id": settings.FIREBASE_PROJECT_ID,
            "private_key": private_key,
            "client_email": settings.FIREBASE_CLIENT_EMAIL,
            "client_id": "123456789",
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
        }
        
        cred = credentials.Certificate(cred_dict)
        firebase_admin.initialize_app(cred, {
            "databaseURL": settings.FIREBASE_DATABASE_URL
        })
        
        _initialized = True
        print("✅ Firebase initialized successfully")
        return True
        
    except Exception as e:
        print(f"❌ Firebase initialization failed: {e}")
        _initialized = False
        return False

def get_firestore() -> firestore.client.Client | None:
    """Get Firestore client. Initialize if needed."""
    global _db
    
    if not _initialized:
        if not initialize_firebase():
            return None
    
    if _db is None:
        try:
            _db = firestore.client()
        except Exception as e:
            print(f"Error getting Firestore client: {e}")
            return None
    
    return _db

def get_sessions_collection():
    """Get Firestore 'sessions' collection reference."""
    db = get_firestore()
    if db:
        return db.collection("sessions")
    return None

def get_builds_collection():
    """Get Firestore 'builds' collection reference."""
    db = get_firestore()
    if db:
        return db.collection("builds")
    return None

def get_users_collection():
    """Get Firestore 'users' collection reference."""
    db = get_firestore()
    if db:
        return db.collection("users")
    return None
