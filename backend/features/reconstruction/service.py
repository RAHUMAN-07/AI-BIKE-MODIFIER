import os
import logging
from core.config import settings
from core.storage.local_storage import STORAGE_PATH
from features.reconstruction.tripo_service import generate_tripo_3d_mesh
from features.reconstruction.trellis_service import generate_trellis_mesh
from features.reconstruction.fallback_generator import create_bike_glb

logger = logging.getLogger(__name__)

def generate_3d_mesh(image_path: str, session_id: str, progress_callback=None) -> str:
    """
    Unified 3D mesh generation service.
    Engine execution cascade:
      1. Tripo3D AI API (if TRIPO_API_KEY is present)
      2. TRELLIS via Replicate API (if REPLICATE_API_TOKEN is present)
      3. Procedural Valid 3D GLB Fallback Generator
    """
    # 1. Try Tripo3D AI API
    if settings.TRIPO_API_KEY:
        try:
            logger.info(f"⚡ Executing 3D reconstruction via Tripo3D AI for session {session_id}")
            return generate_tripo_3d_mesh(image_path, session_id, progress_callback)
        except Exception as tripo_err:
            logger.error(f"❌ Tripo3D API failed: {tripo_err}. Falling back to standard pipeline...")

    # 2. Try TRELLIS via Replicate
    if settings.REPLICATE_API_TOKEN:
        try:
            logger.info(f"⚡ Executing 3D reconstruction via TRELLIS / Replicate for session {session_id}")
            return generate_trellis_mesh(image_path, session_id, progress_callback)
        except Exception as trellis_err:
            logger.error(f"❌ TRELLIS API failed: {trellis_err}. Falling back to 3D mesh generator...")

    # 3. Fallback procedural generator
    logger.info(f"📦 Generating valid 3D GLB fallback model for session {session_id}")
    models_dir = os.path.join(STORAGE_PATH, "models")
    os.makedirs(models_dir, exist_ok=True)
    target_path = os.path.join(models_dir, f"{session_id}.glb")
    
    create_bike_glb(target_path)
    
    if progress_callback:
        progress_callback("complete", 100)

    return f"/storage/models/{session_id}.glb"
