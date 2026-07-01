import os
from fastapi import APIRouter, File, UploadFile, HTTPException
from services.storage import save_upload_file, STORAGE_PATH
from pydantic import BaseModel

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
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    # Save original
    session_id, file_path = save_upload_file(file, "uploads")
    
    filename = os.path.basename(file_path)
    output_filename = f"{session_id}_nobg.png"
    output_path = os.path.join(STORAGE_PATH, "uploads", output_filename)

    # Remove background if rembg is available
    if REMBG_AVAILABLE:
        try:
            input_image = Image.open(file_path)
            output_image = remove(input_image)
            output_image.save(output_path)
            final_filename = output_filename
        except Exception as e:
            print(f"Background removal failed: {e}")
            final_filename = filename
    else:
        final_filename = filename

    return {
        "sessionId": session_id,
        "imageUrl": f"/storage/uploads/{final_filename}"
    }
