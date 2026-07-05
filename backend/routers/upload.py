import os
import io
import datetime
from fastapi import APIRouter, File, UploadFile, HTTPException
from services.storage import save_upload_file, STORAGE_PATH
from services.object_detection import detect_parts as run_detect_parts
from services.supabase_storage import upload_file_to_storage
from database import get_sessions_collection
from pydantic import BaseModel
import uuid

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

    # Generate session ID
    session_id = str(uuid.uuid4())
    
    # Save original locally (temporarily)
    _, original_path = save_upload_file(file, "uploads", session_id)
    
    processed_path = original_path
    
    # Remove background if rembg is available
    if REMBG_AVAILABLE:
        try:
            with open(original_path, "rb") as i:
                input_bg_bytes = i.read()
            output_bg_bytes = remove(input_bg_bytes)
            
            # Save processed image locally
            processed_filename = f"{session_id}_nobg.png"
            processed_path = os.path.join(STORAGE_PATH, "uploads", processed_filename)
            with open(processed_path, "wb") as o:
                o.write(output_bg_bytes)
        except Exception as e:
            print(f"Background removal failed: {e}")
            # Fallback to original image
            processed_path = original_path

    # Upload to Supabase Storage when configured, otherwise fall back to local URL.
    try:
        bucket_name = "motoforge-images"
        dest_path = f"uploads/{os.path.basename(processed_path)}"
        public_url = upload_file_to_storage(bucket_name, processed_path, dest_path)
    except Exception as e:
        print(f"Supabase upload failed: {e}")
        public_url = f"/storage/uploads/{os.path.basename(processed_path)}"

    # Save to Firestore or MongoDB
    try:
        sessions_col = get_sessions_collection()
        if sessions_col is None:
            raise Exception("No database collection available")
        
        # Prepare session document
        session_doc = {
            "session_id": session_id,
            "original_image_path": original_path,
            "processed_image_url": public_url,
            "created_at": datetime.datetime.utcnow(),
            "status": "uploaded"
        }
        
        # For Firestore (has add/set), for MongoDB (has insert_one)
        if hasattr(sessions_col, 'document'):
            # Firebase Firestore
            sessions_col.document(session_id).set(session_doc)
        else:
            # MongoDB
            sessions_col.insert_one(session_doc)
            
        print(f"✅ Session {session_id} saved to database")
    except Exception as e:
        print(f"⚠️ Failed to save session to database: {e}")
        # Continue anyway - image is uploaded

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
    
    # Fetch session from database
    if hasattr(sessions_col, 'document'):
        # Firebase Firestore
        session = sessions_col.document(session_id).get().to_dict()
    else:
        # MongoDB
        session = sessions_col.find_one({"session_id": session_id})
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    original_path = session.get("original_image_path")
    if not original_path or not os.path.exists(original_path):
        raise HTTPException(status_code=404, detail="Original image not found locally for detection")

    try:
        detected = run_detect_parts(original_path)
        return detected
    except Exception as e:
        print(f"Error during part detection: {e}")
        raise HTTPException(status_code=500, detail=f"Part detection failed: {str(e)}")


