import os
import time
import requests
import replicate
from config import settings
from services.storage import STORAGE_PATH
from services.supabase_storage import upload_file_to_storage

def generate_3d_mesh(image_path: str, session_id: str, progress_callback=None) -> str:
    """
    Generate a 3D .glb model from an image using TRELLIS via Replicate.
    """
    if not settings.REPLICATE_API_TOKEN:
        print("WARNING: REPLICATE_API_TOKEN not set. Using demo mode.")
        return "demo"

    print(f"[TRELLIS] Starting 3D reconstruction for {session_id}...")
    try:
        if progress_callback:
            progress_callback("uploading_to_trellis", 10)
            
        model_name = "jeffrey-hou/trellis:1960133c9b4860b0d359cc751855e96a40a463c7847c2da4a81ed738a9d16b25"
        
        with open(image_path, "rb") as image_file:
            if progress_callback:
                progress_callback("processing", 40)
            output = replicate.run(
                model_name,
                input={"image": image_file, "ss_anti_aliasing": True}
            )

        # Output is usually a URI to the GLB or a list containing the GLB
        glb_url = None
        if isinstance(output, list):
            for item in output:
                if str(item).endswith(".glb"):
                    glb_url = str(item)
                    break
            if not glb_url and len(output) > 0:
                glb_url = str(output[0])
        else:
            glb_url = str(output)

        if not glb_url or not glb_url.startswith("http"):
            raise Exception(f"Invalid output from TRELLIS: {output}")

        if progress_callback:
            progress_callback("downloading_glb", 80)
            
        # Download GLB locally first
        output_filename = f"{session_id}.glb"
        local_output_path = os.path.join(STORAGE_PATH, "models", output_filename)
        
        response = requests.get(glb_url)
        if response.status_code == 200:
            with open(local_output_path, "wb") as f:
                f.write(response.content)
        else:
            raise Exception(f"Failed to download GLB from Replicate: {response.status_code}")

        if progress_callback:
            progress_callback("uploading_to_supabase", 90)

        # Upload to Supabase Storage
        bucket_name = "motoforge-models"
        dest_path = f"models/{output_filename}"
        public_url = upload_file_to_storage(bucket_name, local_output_path, dest_path)
        
        if progress_callback:
            progress_callback("complete", 100)
            
        return public_url

    except Exception as e:
        print(f"[TRELLIS] Failed: {e}")
        return "demo"
