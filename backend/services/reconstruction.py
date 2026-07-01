import os
import requests
import replicate
from config import settings
from services.storage import STORAGE_PATH

def generate_3d_mesh(image_path: str, session_id: str) -> str:
    """
    Calls Replicate API (TripoSR or Hunyuan3D) to generate a 3D model.
    Downloads the resulting .glb file to local storage.
    """
    if not settings.REPLICATE_API_TOKEN:
        print("WARNING: REPLICATE_API_TOKEN is not set. Simulating generation.")
        return simulate_generation(session_id)

    print(f"Starting 3D reconstruction for {session_id} using TripoSR...")
    
    # We use a hosted TripoSR model on Replicate
    # Example model: camenduru/triposr:e0d3dedbdc2718aa618ec993d500fb740a6b18536cbcd4db72e707e7c9f80721
    model_version = "camenduru/triposr:e0d3dedbdc2718aa618ec993d500fb740a6b18536cbcd4db72e707e7c9f80721"
    
    try:
        with open(image_path, "rb") as image_file:
            output = replicate.run(
                model_version,
                input={
                    "image": image_file
                }
            )
            
        print(f"Replicate API returned: {output}")
        # output is typically a URL to the .glb file
        glb_url = output
        
        if not glb_url:
            raise Exception("Failed to get GLB URL from Replicate")
            
        # Download the GLB file
        output_filename = f"{session_id}.glb"
        output_path = os.path.join(STORAGE_PATH, "models", output_filename)
        
        response = requests.get(glb_url)
        if response.status_code == 200:
            with open(output_path, "wb") as f:
                f.write(response.content)
            return f"/storage/models/{output_filename}"
        else:
            raise Exception(f"Failed to download GLB file: Status {response.status_code}")
            
    except Exception as e:
        print(f"Reconstruction error: {e}")
        return simulate_generation(session_id)

def simulate_generation(session_id: str) -> str:
    """Fallback simulated generation if API is not available."""
    # Just return a path to the demo model for now
    import shutil
    # Assuming frontend has demo model, we can just return a placeholder string 
    # that the frontend knows to interpret as "demo"
    return "demo"
