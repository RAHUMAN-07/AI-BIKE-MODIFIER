import os
import uuid
import shutil
from fastapi import UploadFile
from core.config import settings

_backend_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
STORAGE_PATH = os.path.join(_backend_root, settings.STORAGE_DIR)
STORAGE_PATH = os.path.abspath(STORAGE_PATH)

def save_upload_file(upload_file: UploadFile, subfolder: str = "uploads", session_id: str | None = None) -> tuple[str, str]:
    """Save an uploaded file to local storage and return (session_id, file_path)."""
    resolved_session_id = session_id or str(uuid.uuid4())
    ext = os.path.splitext(upload_file.filename)[1] if upload_file.filename else ".png"
    filename = f"{resolved_session_id}{ext}"

    dest_dir = os.path.join(STORAGE_PATH, subfolder)
    os.makedirs(dest_dir, exist_ok=True)
    file_path = os.path.join(dest_dir, filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)

    return resolved_session_id, file_path

def get_file_url(subfolder: str, filename: str) -> str:
    """Generate a relative URL for accessing a stored file."""
    return f"/storage/{subfolder}/{filename}"
