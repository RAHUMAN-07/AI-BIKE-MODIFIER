import os
import time
import logging
import requests

from core.config import settings
from core.storage.local_storage import STORAGE_PATH
from core.storage.supabase_storage import upload_file_to_storage

logger = logging.getLogger(__name__)

TRIPO_API_BASE = "https://api.tripo3d.ai/v2/openapi"

def generate_tripo_3d_mesh(image_path: str, session_id: str, progress_callback=None) -> str:
    """
    Generate a 3D .glb model from an image using official Tripo3D AI API.
    
    Args:
        image_path: Absolute local path to the input image file.
        session_id: Unique session identifier.
        progress_callback: Optional callable(stage, progress_percent).
        
    Returns:
        Public URL to the stored GLB model.
    """
    if not settings.TRIPO_API_KEY:
        raise ValueError("TRIPO_API_KEY is not configured in environment variables.")

    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Input image not found at path: {image_path}")

    headers = {
        "Authorization": f"Bearer {settings.TRIPO_API_KEY}"
    }

    logger.info(f"🎨 Starting Tripo3D AI 3D model generation for session {session_id}")
    if progress_callback:
        progress_callback("uploading_to_tripo", 10)

    # Step 1: Upload image file to Tripo3D API
    ext = os.path.splitext(image_path)[1].lstrip('.').lower()
    file_type = ext if ext in ['png', 'jpg', 'jpeg', 'webp'] else 'png'

    upload_url = f"{TRIPO_API_BASE}/upload"
    with open(image_path, "rb") as img_file:
        files = {"file": (os.path.basename(image_path), img_file, f"image/{file_type}")}
        upload_resp = requests.post(upload_url, headers=headers, files=files, timeout=60)
        
    upload_resp.raise_for_status()
    upload_json = upload_resp.json()

    if upload_json.get("code") != 0 or "data" not in upload_json or "image_token" not in upload_json["data"]:
        raise RuntimeError(f"Tripo3D image upload failed: {upload_json}")

    image_token = upload_json["data"]["image_token"]
    logger.info(f"✅ Image uploaded to Tripo3D. Token: {image_token}")

    if progress_callback:
        progress_callback("creating_task", 25)

    # Step 2: Create Image-to-Model task
    task_url = f"{TRIPO_API_BASE}/task"
    payload = {
        "type": "image_to_model",
        "file": {
            "type": file_type if file_type != 'jpeg' else 'jpg',
            "file_token": image_token
        }
    }

    task_resp = requests.post(task_url, headers=headers, json=payload, timeout=30)
    task_resp.raise_for_status()
    task_json = task_resp.json()

    if task_json.get("code") != 0 or "data" not in task_json or "task_id" not in task_json["data"]:
        raise RuntimeError(f"Tripo3D task creation failed: {task_json}")

    task_id = task_json["data"]["task_id"]
    logger.info(f"🚀 Tripo3D Task created. Task ID: {task_id}")

    # Step 3: Poll task status
    max_polls = 120  # Poll for up to ~10 minutes
    poll_interval = 5
    model_url = None

    for attempt in range(max_polls):
        time.sleep(poll_interval)
        poll_url = f"{TRIPO_API_BASE}/task/{task_id}"
        poll_resp = requests.get(poll_url, headers=headers, timeout=30)
        
        if poll_resp.status_code != 200:
            logger.warning(f"Polling warning status {poll_resp.status_code}: {poll_resp.text}")
            continue

        poll_json = poll_resp.json()
        if poll_json.get("code") != 0:
            raise RuntimeError(f"Tripo3D polling returned error: {poll_json}")

        data = poll_json.get("data", {})
        status = data.get("status")
        progress = data.get("progress", 30)

        if progress_callback:
            scaled_pct = min(90, 25 + int(progress * 0.65))
            progress_callback("generating_mesh", scaled_pct)

        logger.info(f"⏳ Tripo3D Task status: {status} ({progress}%)")

        if status == "success":
            result = data.get("result", {})
            # Prefer PBR model if available, fallback to standard model
            if "pbr_model" in result and "url" in result["pbr_model"]:
                model_url = result["pbr_model"]["url"]
            elif "model" in result and "url" in result["model"]:
                model_url = result["model"]["url"]
            break
        elif status == "failed":
            error_msg = data.get("error", "Unknown error from Tripo3D API")
            raise RuntimeError(f"Tripo3D model generation failed: {error_msg}")

    if not model_url:
        raise TimeoutError(f"Tripo3D generation timed out for task {task_id}")

    logger.info(f"✅ Tripo3D generated model URL: {model_url}")

    # Step 4: Download model GLB binary
    if progress_callback:
        progress_callback("downloading_model", 92)

    dl_resp = requests.get(model_url, timeout=120)
    dl_resp.raise_for_status()

    models_dir = os.path.join(STORAGE_PATH, "models")
    os.makedirs(models_dir, exist_ok=True)
    local_glb_path = os.path.join(models_dir, f"{session_id}.glb")

    with open(local_glb_path, "wb") as f:
        f.write(dl_resp.content)

    # Step 5: Upload to Supabase Storage if configured
    try:
        bucket_name = "motoforge-models"
        dest_path = f"models/{session_id}.glb"
        public_url = upload_file_to_storage(bucket_name, local_glb_path, dest_path)
    except Exception as e:
        logger.warning(f"Supabase upload failed: {e}. Fallback to local URL.")
        public_url = f"/storage/models/{session_id}.glb"

    if progress_callback:
        progress_callback("complete", 100)

    return public_url
