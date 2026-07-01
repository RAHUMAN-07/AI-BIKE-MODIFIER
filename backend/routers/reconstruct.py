import os
from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel
from services.reconstruction import generate_3d_mesh
from services.storage import STORAGE_PATH
import asyncio

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
    try:
        reconstruction_jobs[session_id] = {"status": "processing", "progress": 20}
        
        # Look for the nob-bg image first, fallback to original
        nobg_path = os.path.join(STORAGE_PATH, "uploads", f"{session_id}_nobg.png")
        orig_path = os.path.join(STORAGE_PATH, "uploads", f"{session_id}.png") # Assume png for simplicity, should check actual ext
        
        # Simple check for which file exists
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
            
        reconstruction_jobs[session_id]["progress"] = 50
        
        # Call AI API
        model_url = generate_3d_mesh(input_path, session_id)
        
        reconstruction_jobs[session_id] = {
            "status": "complete",
            "progress": 100,
            "modelUrl": model_url
        }
    except Exception as e:
        reconstruction_jobs[session_id] = {"status": "error", "progress": 0, "error": str(e)}

@router.post("/reconstruct/{session_id}", response_model=ReconstructResponse)
async def start_reconstruction(session_id: str, background_tasks: BackgroundTasks):
    if session_id in reconstruction_jobs and reconstruction_jobs[session_id]["status"] == "processing":
        return {"status": "processing", "message": "Already processing"}
        
    reconstruction_jobs[session_id] = {"status": "pending", "progress": 0}
    background_tasks.add_task(process_reconstruction, session_id)
    
    return {"status": "started", "message": "Reconstruction job queued"}

@router.get("/reconstruct/{session_id}/status", response_model=ReconstructStatus)
async def get_status(session_id: str):
    if session_id not in reconstruction_jobs:
        return {"status": "error", "progress": 0, "error": "Job not found"}
        
    return reconstruction_jobs[session_id]
