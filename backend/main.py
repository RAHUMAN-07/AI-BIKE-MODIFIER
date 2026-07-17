import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from features.upload.router import router as upload_router
from features.reconstruction.router import router as reconstruct_router
from features.customization.router import router as customization_router

app = FastAPI(title="MotoForge AI API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

STORAGE_DIR = os.path.join(os.path.dirname(__file__), "storage")
try:
    os.makedirs(os.path.join(STORAGE_DIR, "uploads"), exist_ok=True)
    os.makedirs(os.path.join(STORAGE_DIR, "models"), exist_ok=True)
except OSError:
    STORAGE_DIR = "/tmp/storage"
    try:
        os.makedirs(os.path.join(STORAGE_DIR, "uploads"), exist_ok=True)
        os.makedirs(os.path.join(STORAGE_DIR, "models"), exist_ok=True)
    except Exception as e:
        print(f"Warning: could not create storage directories: {e}")

if os.path.exists(STORAGE_DIR):
    app.mount("/storage", StaticFiles(directory=STORAGE_DIR), name="storage")

app.include_router(upload_router, prefix="/api", tags=["Upload"])
app.include_router(reconstruct_router, prefix="/api", tags=["Reconstruction & 3D AI"])
app.include_router(customization_router, prefix="/api", tags=["Customization & Parts"])

@app.get("/")
def read_root():
    return {
        "service": "MotoForge AI API",
        "status": "online",
        "architecture": "Feature-Based"
    }
