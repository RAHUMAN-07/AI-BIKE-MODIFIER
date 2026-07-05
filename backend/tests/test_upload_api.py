import io
import unittest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from main import app


class UploadAPITests(unittest.TestCase):
    def setUp(self) -> None:
        self.client = TestClient(app)

    @patch("routers.upload.upload_file_to_storage", return_value="https://example.com/uploaded.png")
    @patch("routers.upload.get_sessions_collection")
    @patch("routers.upload.REMBG_AVAILABLE", False)
    def test_upload_returns_session_and_url(self, mock_collection, _mock_upload):
        """Test that upload endpoint returns sessionId and imageUrl."""
        # Mock the collection to work with both Firebase and MongoDB patterns
        mock_col = MagicMock()
        mock_collection.return_value = mock_col
        
        response = self.client.post(
            "/api/upload",
            files={"file": ("bike.png", io.BytesIO(b"fake-image-bytes"), "image/png")},
        )

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertIn("sessionId", body)
        self.assertIn("imageUrl", body)
        self.assertTrue(body["imageUrl"].startswith(("http://", "https://", "/storage/")))
        
        # Verify collection was accessed (either insert_one for MongoDB or document for Firebase)
        self.assertTrue(
            mock_col.insert_one.called or mock_col.document.called,
            "Collection should be called for saving session"
        )

    def test_upload_rejects_non_images(self):
        """Test that upload endpoint rejects non-image files."""
        response = self.client.post(
            "/api/upload",
            files={"file": ("document.txt", io.BytesIO(b"not an image"), "text/plain")},
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("image", response.json()["detail"].lower())

    @patch("routers.upload.get_sessions_collection")
    def test_detect_parts_requires_session(self, mock_collection):
        """Test that detect-parts requires a valid session."""
        mock_col = MagicMock()
        mock_collection.return_value = mock_col
        
        # Simulate session not found
        if hasattr(mock_col, 'document'):
            mock_col.document.return_value.get.return_value.to_dict.return_value = None
        else:
            mock_col.find_one.return_value = None
        
        response = self.client.get("/api/detect-parts/nonexistent-session")
        self.assertEqual(response.status_code, 404)


if __name__ == "__main__":
    unittest.main()

