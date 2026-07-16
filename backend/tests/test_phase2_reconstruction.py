"""
Phase 2 Integration Test: 3D Model Generation via Tripo3D AI API & TRELLIS Fallback
"""

import io
import os
import time
import logging
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from main import app

logger = logging.getLogger(__name__)

class TestPhase2Reconstruction:
    """Test 3D model generation pipeline with feature-based architecture."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.client = TestClient(app)
    
    @patch("features.reconstruction.router.get_sessions_collection")
    @patch("features.reconstruction.trellis_service.upload_file_to_storage")
    @patch("features.reconstruction.trellis_service.replicate.run")
    @patch("features.reconstruction.trellis_service.requests.get")
    @patch("features.upload.router.get_sessions_collection")
    @patch("features.upload.router.upload_file_to_storage")
    @patch("features.upload.router.REMBG_AVAILABLE", False)
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
        
        mock_upload_col = MagicMock()
        mock_reconstruct_col = MagicMock()
        mock_get_collection_upload.return_value = mock_upload_col
        mock_get_collection_reconstruct.return_value = mock_reconstruct_col
        mock_upload_image.return_value = "https://supabase.example.com/uploads/test.png"
        
        fake_image = io.BytesIO(b"fake-image-data-123")
        
        upload_response = self.client.post(
            "/api/upload",
            files={"file": ("bike.jpg", fake_image, "image/jpeg")},
        )
        
        assert upload_response.status_code == 200, f"Upload failed: {upload_response.json()}"
        upload_data = upload_response.json()
        session_id = upload_data["sessionId"]
        
        fake_glb_url = "https://replicate.com/example-bucket/output-glb.glb"
        mock_replicate_run.return_value = fake_glb_url
        
        fake_glb_data = b"GLB_MOCK_DATA_" + b"0" * 1000
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.content = fake_glb_data
        mock_response.headers = {"content-length": str(len(fake_glb_data))}
        mock_requests_get.return_value = mock_response
        
        mock_upload_model.return_value = f"https://supabase.example.com/models/{session_id}.glb"
        
        reconstruct_response = self.client.post(f"/api/reconstruct/{session_id}")
        assert reconstruct_response.status_code == 200
        reconstruct_data = reconstruct_response.json()
        assert reconstruct_data["status"] == "started"
        
        time.sleep(1.0)
        status_response = self.client.get(f"/api/reconstruct/{session_id}/status")
        assert status_response.status_code == 200
        status_data = status_response.json()
        assert status_data["status"] in ["pending", "processing", "complete"]

    def test_reconstruct_without_upload_fails(self):
        """Test that reconstruction without valid session fails."""
        response = self.client.get("/api/reconstruct/nonexistent-session-id/status")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "error"

    @patch("features.reconstruction.service.settings.TRIPO_API_KEY", "mock_tripo_key")
    @patch("features.reconstruction.tripo_service.requests.post")
    @patch("features.reconstruction.tripo_service.requests.get")
    def test_tripo3d_service_integration(self, mock_get, mock_post):
        """Test Tripo3D API generation flow with mocked endpoints."""
        from features.reconstruction.tripo_service import generate_tripo_3d_mesh
        import tempfile
        
        # 1. Mock Upload response
        mock_upload_resp = MagicMock()
        mock_upload_resp.json.return_value = {"code": 0, "data": {"image_token": "img_token_123"}}
        
        # 2. Mock Task creation response
        mock_task_resp = MagicMock()
        mock_task_resp.json.return_value = {"code": 0, "data": {"task_id": "task_123"}}
        mock_post.side_effect = [mock_upload_resp, mock_task_resp]
        
        # 3. Mock Polling success response + GLB binary download response
        mock_poll_resp = MagicMock()
        mock_poll_resp.status_code = 200
        mock_poll_resp.json.return_value = {
            "code": 0,
            "data": {
                "status": "success",
                "progress": 100,
                "result": {"model": {"url": "https://tripo3d.ai/models/test.glb"}}
            }
        }
        
        mock_dl_resp = MagicMock()
        mock_dl_resp.status_code = 200
        mock_dl_resp.content = b"fake-glb-binary-data"
        
        mock_get.side_effect = [mock_poll_resp, mock_dl_resp]
        
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
            tmp.write(b"fake-image")
            tmp_path = tmp.name
            
        try:
            url = generate_tripo_3d_mesh(tmp_path, "session_tripo_test")
            assert "session_tripo_test.glb" in url or "storage" in url
            print("✅ Tripo3D API service test passed!")
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)


if __name__ == "__main__":
    import pytest
    pytest.main([__file__, "-v", "-s"])
