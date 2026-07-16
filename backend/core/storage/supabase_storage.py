import os
from supabase import create_client, Client
from core.config import settings

_supabase: Client | None = None

def get_supabase() -> Client:
    global _supabase
    if _supabase is None:
        if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in .env")
        _supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    return _supabase

def upload_file_to_storage(bucket_name: str, file_path: str, destination_path: str) -> str:
    """
    Uploads a file to Supabase storage and returns the public URL.
    """
    supabase = get_supabase()
    
    with open(file_path, "rb") as f:
        supabase.storage.from_(bucket_name).upload(
            path=destination_path,
            file=f,
            file_options={"content-type": _get_content_type(file_path)}
        )
    
    public_url = supabase.storage.from_(bucket_name).get_public_url(destination_path)
    return public_url

def _get_content_type(file_path: str) -> str:
    if file_path.lower().endswith(('.png', '.jpg', '.jpeg')):
        return "image/jpeg" if file_path.lower().endswith(('jpg', 'jpeg')) else "image/png"
    elif file_path.lower().endswith('.glb'):
        return "model/gltf-binary"
    return "application/octet-stream"
