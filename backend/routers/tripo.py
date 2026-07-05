import os
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from services.storage import STORAGE_PATH
from services.reconstruction import generate_3d_mesh

router = APIRouter()

DEFAULT_IMAGE_PATH = os.path.join(STORAGE_PATH, "uploads", "default_bike.jpg")
DEFAULT_MODEL_PATH = os.path.join(STORAGE_PATH, "models", "default_bike.glb")

class GenerateRequest(BaseModel):
    image_url: str = None # Optional URL if we want to fetch it

class DefaultModelResponse(BaseModel):
    status: str
    modelUrl: str | None = None
    message: str | None = None

@router.get("/default-model", response_model=DefaultModelResponse)
async def get_default_model():
    """Returns the URL of the pre-generated default bike model if it exists."""
    if os.path.exists(DEFAULT_MODEL_PATH):
        return {
            "status": "ready",
            "modelUrl": "/storage/models/default_bike.glb"
        }
    return {
        "status": "not_found",
        "message": "Default model not yet generated."
    }

def process_generate_default():
    print("Generating default bike model via Tripo3D...")
    if not os.path.exists(DEFAULT_IMAGE_PATH):
        print(f"Error: Default image not found at {DEFAULT_IMAGE_PATH}")
        return
        
    try:
        # We use a special session ID 'default_bike'
        model_url = generate_3d_mesh(DEFAULT_IMAGE_PATH, "default_bike")
        print(f"Default model successfully generated: {model_url}")
    except Exception as e:
        print(f"Failed to generate default model: {e}")

@router.post("/generate-default")
async def generate_default(background_tasks: BackgroundTasks):
    """Triggers the generation of the default bike model."""
    if os.path.exists(DEFAULT_MODEL_PATH):
        return {"status": "already_exists", "message": "Default model already exists."}
        
    if not os.path.exists(DEFAULT_IMAGE_PATH):
        raise HTTPException(status_code=404, detail="Default image not found. Please place default_bike.jpg in storage/uploads/")

    background_tasks.add_task(process_generate_default)
    return {"status": "started", "message": "Generation of default model started in background."}
