import sys
import os
import traceback

# Add backend directory to sys.path
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
backend_dir = os.path.join(base_dir, "backend")

if os.path.exists(backend_dir) and backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

try:
    from main import app
except Exception as err:
    print(f"CRITICAL ERROR initializing FastAPI app: {err}")
    traceback.print_exc()
    from fastapi import FastAPI
    app = FastAPI(title="MotoForge AI API Fallback")
    
    @app.get("/api/health")
    def fallback_health():
        return {"status": "degraded", "error": str(err)}
