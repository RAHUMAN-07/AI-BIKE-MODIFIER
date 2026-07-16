import os
import time
import requests
import replicate
import logging
from core.config import settings
from core.storage.local_storage import STORAGE_PATH
from core.storage.supabase_storage import upload_file_to_storage

logger = logging.getLogger(__name__)

def generate_trellis_mesh(image_path: str, session_id: str, progress_callback=None) -> str:
    """
    Generate a 3D .glb model from an image using TRELLIS via Replicate API.
    """
    if not settings.REPLICATE_API_TOKEN:
        raise ValueError("REPLICATE_API_TOKEN not configured.")

    logger.info(f"🚀 Starting TRELLIS 3D reconstruction for session {session_id}")
    
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image not found: {image_path}")
    
    if progress_callback:
        progress_callback("preparing", 15)

    trellis_model = "jeffrey-hou/trellis"
    
    if progress_callback:
        progress_callback("processing", 40)
    
    with open(image_path, "rb") as image_file:
        output = replicate.run(
            trellis_model,
            input={
                "image": image_file,
                "ss_anti_aliasing": True,
                "ss_num_planes": 32,
            }
        )

    glb_url = _extract_glb_url(output)
    if not glb_url:
        raise Exception(f"Invalid TRELLIS output format: {output}")

    if progress_callback:
        progress_callback("downloading", 70)
    
    glb_data = _download_file(glb_url)
    if not glb_data:
        raise Exception(f"Failed to download GLB from {glb_url}")

    models_dir = os.path.join(STORAGE_PATH, "models")
    os.makedirs(models_dir, exist_ok=True)
    local_glb_path = os.path.join(models_dir, f"{session_id}.glb")
    
    with open(local_glb_path, "wb") as f:
        f.write(glb_data)

    try:
        bucket_name = "motoforge-models"
        dest_path = f"models/{session_id}.glb"
        public_url = upload_file_to_storage(bucket_name, local_glb_path, dest_path)
    except Exception as e:
        logger.warning(f"Supabase upload failed: {e}. Using local URL fallback.")
        public_url = f"/storage/models/{session_id}.glb"

    if progress_callback:
        progress_callback("complete", 100)
    
    return public_url

def _extract_glb_url(output) -> str:
    if isinstance(output, str):
        if output.endswith(".glb") and output.startswith("http"):
            return output
    elif isinstance(output, list):
        for item in output:
            item_str = str(item)
            if item_str.endswith(".glb") and item_str.startswith("http"):
                return item_str
    elif isinstance(output, dict):
        for key in ["glb", "model", "output", "mesh"]:
            if key in output:
                url = str(output[key])
                if url.endswith(".glb") and url.startswith("http"):
                    return url
    return None

def _download_file(url: str, timeout: int = 300) -> bytes:
    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = requests.get(url, timeout=timeout, stream=True)
            if response.status_code == 200:
                return response.content
            if attempt < max_retries - 1:
                time.sleep(3)
        except Exception:
            if attempt < max_retries - 1:
                time.sleep(3)
    return None
