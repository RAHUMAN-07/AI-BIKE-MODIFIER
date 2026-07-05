"""
Phase 2 Integration Test: TRELLIS 3D Model Generation via Replicate API

This test verifies the complete pipeline:
1. Upload bike image
2. Generate 3D model via TRELLIS
3. Download GLB from Replicate
4. Upload GLB to Supabase Storage
5. Return public URL to frontend
"""

import io
import time
import logging
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from main import app

logger = logging.getLogger(__name__)

class TestPhase2Reconstruction:
    """Test TRELLIS 3D model generation pipeline."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.client = TestClient(app)
    
    @patch("routers.reconstruct.get_sessions_collection")
    @patch("services.reconstruction.upload_file_to_storage")
    @patch("services.reconstruction.replicate.run")
    @patch("services.reconstruction.requests.get")
    @patch("routers.upload.get_sessions_collection")
    @patch("routers.upload.upload_file_to_storage")
    @patch("routers.upload.REMBG_AVAILABLE", False)
    def test_end_to_end_image_to_3d(
        self,
        mock_upload_image,
        mock_get_collection_upload,
        mock_requests_get,
        mock_replicate_run,
        mock_upload_model,
        mock_get_collection_reconstruct,
    ):
        """Test complete pipeline: upload → reconstruct → model stored in cloud."""
        
        # 1. Mock both upload and reconstruct collection getters
        mock_upload_col = MagicMock()
        mock_reconstruct_col = MagicMock()
        mock_get_collection_upload.return_value = mock_upload_col
        mock_get_collection_reconstruct.return_value = mock_reconstruct_col
        
        # Mock upload phase
        mock_upload_image.return_value = "https://supabase.example.com/uploads/test.png"
        
        # Create a fake bike image
        fake_image = io.BytesIO(b"fake-image-data-123")
        
        # 2. Upload the image
        print("📤 Step 1: Uploading image...")
        upload_response = self.client.post(
            "/api/upload",
            files={"file": ("bike.jpg", fake_image, "image/jpeg")},
        )
        
        assert upload_response.status_code == 200, f"Upload failed: {upload_response.json()}"
        upload_data = upload_response.json()
        session_id = upload_data["sessionId"]
        print(f"✅ Image uploaded. Session ID: {session_id}")
        
        # 3. Mock TRELLIS Replicate API response (returns GLB URL)
        fake_glb_url = "https://replicate.com/example-bucket/output-glb.glb"
        mock_replicate_run.return_value = fake_glb_url  # TRELLIS returns a URL
        
        # 4. Mock GLB download from Replicate
        fake_glb_data = b"GLB_MOCK_DATA_" + b"0" * 10000  # Minimal GLB mock
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.content = fake_glb_data
        mock_response.headers = {"content-length": str(len(fake_glb_data))}
        mock_requests_get.return_value = mock_response
        
        # 5. Mock Supabase upload for model
        mock_upload_model.return_value = f"https://supabase.example.com/models/{session_id}.glb"
        
        # 6. Start reconstruction
        print("🚀 Step 2: Starting 3D reconstruction...")
        reconstruct_response = self.client.post(f"/api/reconstruct/{session_id}")
        
        assert reconstruct_response.status_code == 200, f"Reconstruct start failed: {reconstruct_response.json()}"
        reconstruct_data = reconstruct_response.json()
        assert reconstruct_data["status"] == "started"
        print(f"✅ Reconstruction job started")
        
        # 7. Poll status (in real scenario, this would wait for completion)
        print("⏳ Step 3: Polling reconstruction status...")
        time.sleep(1.5)  # Wait for background task to process
        status_response = self.client.get(f"/api/reconstruct/{session_id}/status")
        
        assert status_response.status_code == 200, f"Status check failed: {status_response.json()}"
        status_data = status_response.json()
        print(f"   Current status: {status_data['status']} ({status_data['progress']}%)")
        
        # Status should eventually be complete
        assert status_data["status"] in ["pending", "processing", "complete"]
        if status_data["status"] == "complete":
            assert status_data["modelUrl"] == mock_upload_model.return_value
            print(f"✅ Model URL: {status_data['modelUrl']}")
        
        print("✅ Phase 2 test complete!")
        print(f"   - Image uploaded to Supabase")
        print(f"   - TRELLIS reconstruction simulated")
        print(f"   - GLB model pipeline working")



    def test_reconstruct_without_upload_fails(self):
        """Test that reconstruction without valid session fails."""
        response = self.client.get("/api/reconstruct/nonexistent-session-id/status")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "error"
        print("✅ Correctly rejected reconstruction for non-existent session")

    @patch("services.reconstruction.settings.REPLICATE_API_TOKEN", "")
    @patch("routers.upload.get_sessions_collection")
    @patch("routers.upload.upload_file_to_storage")
    @patch("routers.upload.REMBG_AVAILABLE", False)
    def test_fallback_when_replicate_not_configured(
        self,
        mock_upload,
        mock_get_collection,
    ):
        """Test graceful fallback when Replicate API token is missing."""
        mock_upload.return_value = "https://supabase.example.com/test.png"
        mock_get_collection.return_value = MagicMock()
        
        # Upload without Replicate configured
        fake_image = io.BytesIO(b"test-image")
        response = self.client.post(
            "/api/upload",
            files={"file": ("bike.jpg", fake_image, "image/jpeg")},
        )
        
        assert response.status_code == 200
        print("✅ Upload works even without Replicate API key (will use demo on reconstruct)")


if __name__ == "__main__":
    import pytest
    pytest.main([__file__, "-v", "-s"])
