import os
import time
import datetime
from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel
from services.reconstruction import generate_3d_mesh
from services.storage import STORAGE_PATH
from database import get_sessions_collection

router = APIRouter()

# In-memory status store for simplicity (use Redis in prod)
reconstruction_jobs = {}

class ReconstructResponse(BaseModel):
    status: str
    message: str

class ReconstructStatus(BaseModel):
    status: str
    progress: int
    modelUrl: str | None = None
    error: str | None = None

def process_reconstruction(session_id: str):
    """Background task to generate 3D model from uploaded image."""
    try:
        reconstruction_jobs[session_id] = {"status": "processing", "progress": 20}
        
        # Look for the no-bg image first, fallback to original
        files_in_upload = os.listdir(os.path.join(STORAGE_PATH, "uploads"))
        input_path = None
        for f in files_in_upload:
            if f.startswith(f"{session_id}_nobg"):
                input_path = os.path.join(STORAGE_PATH, "uploads", f)
                break
        
        if not input_path:
            for f in files_in_upload:
                if f.startswith(session_id) and not f.endswith("_nobg.png"):
                    input_path = os.path.join(STORAGE_PATH, "uploads", f)
                    break
                    
        if not input_path:
            reconstruction_jobs[session_id] = {"status": "error", "progress": 0, "error": "Image not found"}
            return
            
        def update_progress(status, pct):
            reconstruction_jobs[session_id]["progress"] = pct

        # Call AI API to generate 3D model
        model_url = generate_3d_mesh(input_path, session_id, progress_callback=update_progress)
        
        # Update session in database with model URL
        try:
            sessions_col = get_sessions_collection()
            if sessions_col is None:
                raise Exception("No database collection available")
            
            update_data = {
                "model_url": model_url,
                "model_generated_at": datetime.datetime.utcnow(),
                "status": "model_ready"
            }
            
            if hasattr(sessions_col, 'document'):
                # Firebase Firestore - update existing document
                sessions_col.document(session_id).update(update_data)
            else:
                # MongoDB - update existing document
                sessions_col.update_one({"session_id": session_id}, {"$set": update_data})
                
            print(f"✅ Model for session {session_id} saved to database")
        except Exception as e:
            print(f"⚠️ Failed to update session with model: {e}")
        
        reconstruction_jobs[session_id] = {
            "status": "complete",
            "progress": 100,
            "modelUrl": model_url
        }
    except Exception as e:
        reconstruction_jobs[session_id] = {"status": "error", "progress": 0, "error": str(e)}

@router.post("/reconstruct/{session_id}", response_model=ReconstructResponse)
async def start_reconstruction(session_id: str, background_tasks: BackgroundTasks):
    """Kick off the 3D reconstruction pipeline for a given session."""
    if session_id in reconstruction_jobs and reconstruction_jobs[session_id]["status"] == "processing":
        return {"status": "processing", "message": "Already processing"}
        
    reconstruction_jobs[session_id] = {"status": "pending", "progress": 0}
    background_tasks.add_task(process_reconstruction, session_id)
    
    return {"status": "started", "message": "Reconstruction job queued"}

@router.get("/reconstruct/{session_id}/status", response_model=ReconstructStatus)
async def get_status(session_id: str):
    """Poll reconstruction status for a given session."""
    if session_id not in reconstruction_jobs:
        return {"status": "error", "progress": 0, "error": "Job not found"}
        
    return reconstruction_jobs[session_id]

@router.post("/reconstruct")
async def reconstruct_part(request: dict):
    """
    Takes a part name (e.g. 'tyres') and a selected model (e.g. 'Pirelli Diablo')
    and uses Stable Diffusion inpainting via Replicate to generate the composited image.
    In production, connect your Replicate API key in the .env file.
    """
    session_id = request.get("sessionId")
    part_id = request.get("partId")
    selected_item = request.get("selectedItem")
    
    if not session_id or not part_id:
        raise HTTPException(status_code=400, detail="Missing sessionId or partId")

    # Simulate AI generation delay (in production, call Replicate inpainting API)
    time.sleep(1)
    
    # Mocking the generated image URL for frontend integration
    # In production:
    # import replicate
    # output = replicate.run(
    #     "stability-ai/stable-diffusion-inpainting:...",
    #     input={
    #         "prompt": f"A realistic {selected_item} on a motorcycle",
    #         "image": open(f"storage/uploads/{session_id}.png", "rb"),
    #         "mask": open(f"storage/masks/{session_id}_{part_id}.png", "rb")
    #     }
    # )
    mock_generated_url = f"/storage/models/mock_{part_id}_{selected_item}.png"

    return {
        "status": "success",
        "resultUrl": mock_generated_url,
        "message": f"Successfully applied {selected_item} to {part_id}"
    }

