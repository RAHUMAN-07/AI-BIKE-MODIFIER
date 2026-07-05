import os
import time
import requests
import replicate
import logging
from config import settings
from services.storage import STORAGE_PATH
from services.supabase_storage import upload_file_to_storage

logger = logging.getLogger(__name__)

def generate_3d_mesh(image_path: str, session_id: str, progress_callback=None) -> str:
    """
    Generate a 3D .glb model from an image using TRELLIS via Replicate API.
    
    Args:
        image_path: Path to the input image (local or remote)
        session_id: Unique session identifier
        progress_callback: Optional callback function(stage, progress_percent)
    
    Returns:
        Public URL to the generated GLB model (Supabase Storage)
    """
    if not settings.REPLICATE_API_TOKEN:
        logger.warning("REPLICATE_API_TOKEN not configured. Returning demo model URL.")
        return "/storage/models/demo.glb"

    logger.info(f"🚀 Starting TRELLIS 3D reconstruction for session {session_id}")
    
    try:
        # Verify input image exists
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Image not found: {image_path}")
        
        if progress_callback:
            progress_callback("preparing", 5)

        # TRELLIS model via Replicate
        # Latest: https://replicate.com/JeffreyHou/trellis
        trellis_model = "jeffrey-hou/trellis:1960133c9b4860b0d359cc751855e96a40a463c7847c2da4a81ed738a9d16b25"
        
        logger.info(f"📤 Uploading image to Replicate API...")
        if progress_callback:
            progress_callback("uploading", 15)
        
        # Read image and call Replicate
        with open(image_path, "rb") as image_file:
            image_data = image_file.read()
        
        # Call TRELLIS via Replicate
        logger.info("⚙️  Running TRELLIS model (this may take 2-5 minutes)...")
        if progress_callback:
            progress_callback("processing", 40)
        
        try:
            output = replicate.run(
                trellis_model,
                input={
                    "image": image_data,
                    "ss_anti_aliasing": True,
                    "ss_num_planes": 32,  # Higher = better quality, slower
                }
            )
        except replicate.exceptions.ReplicateError as e:
            logger.error(f"Replicate API error: {e}")
            raise Exception(f"TRELLIS API error: {str(e)}")

        # Parse output from Replicate
        # Output can be: list of URIs, single URI, or dict with 'glb' key
        glb_url = _extract_glb_url(output)
        
        if not glb_url:
            logger.error(f"Could not extract GLB URL from TRELLIS output: {output}")
            raise Exception(f"Invalid TRELLIS output format: {output}")

        logger.info(f"✅ TRELLIS generated model: {glb_url}")
        
        # Download GLB from Replicate
        logger.info("📥 Downloading GLB model...")
        if progress_callback:
            progress_callback("downloading", 70)
        
        glb_data = _download_file(glb_url)
        if not glb_data:
            raise Exception(f"Failed to download GLB from {glb_url}")

        # Save locally first
        os.makedirs(os.path.join(STORAGE_PATH, "models"), exist_ok=True)
        local_glb_path = os.path.join(STORAGE_PATH, "models", f"{session_id}.glb")
        
        with open(local_glb_path, "wb") as f:
            f.write(glb_data)
        logger.info(f"💾 Saved local GLB: {local_glb_path}")

        # Upload to Supabase Storage
        logger.info("☁️  Uploading to Supabase Storage...")
        if progress_callback:
            progress_callback("uploading_cloud", 85)
        
        try:
            bucket_name = "motoforge-models"
            dest_path = f"models/{session_id}.glb"
            public_url = upload_file_to_storage(bucket_name, local_glb_path, dest_path)
            logger.info(f"✅ Model uploaded to Supabase: {public_url}")
        except Exception as e:
            logger.warning(f"Supabase upload failed: {e}. Using local URL fallback.")
            public_url = f"/storage/models/{session_id}.glb"

        if progress_callback:
            progress_callback("complete", 100)
        
        logger.info(f"🎉 3D reconstruction complete for session {session_id}")
        return public_url

    except Exception as e:
        logger.error(f"❌ TRELLIS reconstruction failed: {e}")
        if progress_callback:
            progress_callback("error", 0)
        raise

def _extract_glb_url(output) -> str:
    """Extract GLB URL from various TRELLIS output formats."""
    if isinstance(output, str):
        if output.endswith(".glb") and output.startswith("http"):
            return output
        logger.warning(f"Output string doesn't look like GLB URL: {output}")
    
    elif isinstance(output, list):
        for item in output:
            item_str = str(item)
            if item_str.endswith(".glb") and item_str.startswith("http"):
                logger.info(f"Found GLB URL in list: {item_str}")
                return item_str
    
    elif isinstance(output, dict):
        # Check for 'glb' key or similar
        for key in ["glb", "model", "output", "mesh"]:
            if key in output:
                url = str(output[key])
                if url.endswith(".glb") and url.startswith("http"):
                    logger.info(f"Found GLB URL in dict['{key}']: {url}")
                    return url
    
    logger.warning(f"Could not extract GLB URL from output type {type(output)}")
    return None

def _download_file(url: str, timeout: int = 300) -> bytes:
    """Download file from URL with timeout and retry logic."""
    max_retries = 3
    for attempt in range(max_retries):
        try:
            logger.info(f"Downloading from {url} (attempt {attempt + 1}/{max_retries})")
            response = requests.get(url, timeout=timeout, stream=True)
            
            if response.status_code == 200:
                content_length = response.headers.get("content-length")
                if content_length:
                    logger.info(f"Downloading {int(content_length) / 1024 / 1024:.2f} MB...")
                
                return response.content
            else:
                logger.warning(f"HTTP {response.status_code}: {response.reason}")
                if attempt < max_retries - 1:
                    time.sleep(5)
                continue
        except requests.Timeout:
            logger.warning(f"Download timeout (attempt {attempt + 1}/{max_retries})")
            if attempt < max_retries - 1:
                time.sleep(5)
            continue
        except Exception as e:
            logger.error(f"Download failed: {e}")
            if attempt < max_retries - 1:
                time.sleep(5)
            continue
    
    logger.error(f"Failed to download {url} after {max_retries} attempts")
    return None

