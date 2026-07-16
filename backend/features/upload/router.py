import os
import io
import datetime
import uuid
from fastapi import APIRouter, File, UploadFile, HTTPException
from pydantic import BaseModel

from core.storage.local_storage import save_upload_file, STORAGE_PATH
from core.storage.supabase_storage import upload_file_to_storage
from core.database import get_sessions_collection, IS_FIREBASE
from features.detection.service import detect_parts as run_detect_parts

try:
    from rembg import remove
    from PIL import Image
    REMBG_AVAILABLE = True
except ImportError:
    REMBG_AVAILABLE = False

router = APIRouter()

class UploadResponse(BaseModel):
    sessionId: str
    imageUrl: str

@router.post("/upload", response_model=UploadResponse)
async def upload_image(file: UploadFile = File(...)):
    """
    Upload a bike image, remove background, and save to cloud storage.
    Returns a session ID and the cloud URL of the processed image.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    session_id = str(uuid.uuid4())
    _, original_path = save_upload_file(file, "uploads", session_id)
    processed_path = original_path

    if REMBG_AVAILABLE:
        try:
            with open(original_path, "rb") as i:
                input_bg_bytes = i.read()
            output_bg_bytes = remove(input_bg_bytes)
            
            processed_filename = f"{session_id}_nobg.png"
            processed_path = os.path.join(STORAGE_PATH, "uploads", processed_filename)
            with open(processed_path, "wb") as o:
                o.write(output_bg_bytes)
        except Exception as e:
            print(f"Background removal failed: {e}")
            processed_path = original_path

    try:
        bucket_name = "motoforge-images"
        dest_path = f"uploads/{os.path.basename(processed_path)}"
        public_url = upload_file_to_storage(bucket_name, processed_path, dest_path)
    except Exception as e:
        print(f"Supabase upload failed: {e}")
        public_url = f"/storage/uploads/{os.path.basename(processed_path)}"

    try:
        sessions_col = get_sessions_collection()
        if sessions_col is None:
            raise Exception("No database collection available")
        
        session_doc = {
            "session_id": session_id,
            "original_image_path": original_path,
            "processed_image_url": public_url,
            "created_at": datetime.datetime.utcnow(),
            "status": "uploaded"
        }
        
        if IS_FIREBASE:
            sessions_col.document(session_id).set(session_doc)
        else:
            sessions_col.insert_one(session_doc)
            
        print(f"✅ Session {session_id} saved to database")
    except Exception as e:
        print(f"⚠️ Failed to save session to database: {e}")

    return {
        "sessionId": session_id,
        "imageUrl": public_url
    }

@router.get("/detect-parts/{session_id}")
async def detect_parts(session_id: str):
    """
    Analyzes the uploaded image with YOLOv8/SAM to return masks 
    and bounding boxes for the motorcycle parts.
    """
    sessions_col = get_sessions_collection()
    session = None
    
    try:
        if sessions_col is not None and IS_FIREBASE:
            doc = sessions_col.document(session_id).get()
            session = doc.to_dict() if doc.exists else None
        elif sessions_col is not None:
            session = sessions_col.find_one({"session_id": session_id})
    except Exception as db_err:
        print(f"Database query error in detect_parts: {db_err}")
        
    original_path = session.get("original_image_path") if session else None
    if not original_path or not os.path.exists(original_path):
        uploads_dir = os.path.join(STORAGE_PATH, "uploads")
        if os.path.exists(uploads_dir):
            for f in os.listdir(uploads_dir):
                if f.startswith(session_id) and not f.endswith("_nobg.png"):
                    original_path = os.path.join(uploads_dir, f)
                    break
                    
    if not original_path or not os.path.exists(original_path):
        raise HTTPException(status_code=404, detail="Original image not found locally for detection")

    try:
        detected = run_detect_parts(original_path)
        return detected
    except Exception as e:
        print(f"Error during part detection: {e}")
        raise HTTPException(status_code=500, detail=f"Part detection failed: {str(e)}")
