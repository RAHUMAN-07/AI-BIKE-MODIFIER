from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from routers import upload, reconstruct
import os

app = FastAPI(title="MotoForge AI API", version="1.0.0")

# CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files (uploads and models)
STORAGE_DIR = os.path.join(os.path.dirname(__file__), "storage")
os.makedirs(os.path.join(STORAGE_DIR, "uploads"), exist_ok=True)
os.makedirs(os.path.join(STORAGE_DIR, "models"), exist_ok=True)
app.mount("/storage", StaticFiles(directory=STORAGE_DIR), name="storage")

# Include routers
app.include_router(upload.router, prefix="/api", tags=["Upload"])
app.include_router(reconstruct.router, prefix="/api", tags=["Reconstruct"])

@app.get("/")
def read_root():
    return {"message": "MotoForge AI API is running"}
