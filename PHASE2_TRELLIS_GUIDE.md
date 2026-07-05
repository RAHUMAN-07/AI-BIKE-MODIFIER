# Phase 2: AI Image-to-3D Pipeline Implementation Guide

This document covers the **TRELLIS** integration for real-time 3D model generation from bike images.

## Overview

**Phase 2** implements the complete Image → 3D Model pipeline:

```
User uploads bike image
    ↓
Backend processes image (rembg for background removal)
    ↓
Send to TRELLIS via Replicate API
    ↓
TRELLIS generates 3D mesh as GLB file
    ↓
Download GLB from Replicate CDN
    ↓
Upload GLB to Supabase Storage
    ↓
Save model URL to Firebase Firestore
    ↓
Frontend receives 3D model ready for viewer
```

## What's Implemented

### 1. Enhanced Reconstruction Service (`services/reconstruction.py`)

**Features:**
- ✅ Calls TRELLIS model via Replicate API
- ✅ Handles multiple output formats (URL string, list, dict)
- ✅ Downloads GLB file with retry logic (3 attempts)
- ✅ Uploads GLB to Supabase Storage
- ✅ Saves model metadata to Firebase Firestore
- ✅ Progress tracking with callbacks (5% → 100%)
- ✅ Comprehensive logging for debugging

**Key Functions:**
- `generate_3d_mesh()` - Main pipeline orchestrator
- `_extract_glb_url()` - Parse TRELLIS output formats
- `_download_file()` - Robust file download with retry

### 2. Updated Reconstruction Router (`routers/reconstruct.py`)

**Endpoints:**
- `POST /api/reconstruct/{session_id}` - Start 3D generation (background task)
- `GET /api/reconstruct/{session_id}/status` - Poll generation status
- Returns progress: 0% (pending) → 100% (complete)

**Database Integration:**
- Saves `model_url` and `model_generated_at` to Firestore
- Compatible with both Firebase and MongoDB

### 3. Updated Upload Router (`routers/upload.py`)

**Enhancements:**
- Saves session metadata to Firestore (not just MongoDB)
- Compatible with both Firebase and MongoDB backends
- Graceful fallback if cloud storage fails

### 4. Configuration (`config.py`)

**Added Variables:**
```python
FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID", "")
FIREBASE_PRIVATE_KEY = os.getenv("FIREBASE_PRIVATE_KEY", "")
FIREBASE_CLIENT_EMAIL = os.getenv("FIREBASE_CLIENT_EMAIL", "")
FIREBASE_DATABASE_URL = os.getenv("FIREBASE_DATABASE_URL", "")
REPLICATE_API_TOKEN = os.getenv("REPLICATE_API_TOKEN", "")
```

## Prerequisites

### 1. Replicate Account
- Sign up: https://replicate.com
- Get API token: Settings → API Tokens
- Add to `.env`:
```bash
REPLICATE_API_TOKEN=your-token-here
```

### 2. Supabase Storage Bucket
- Bucket name: `motoforge-models`
- Set to **Public** for direct access
- Images go to: `motoforge-images` (from Phase 1)
- Models go to: `motoforge-models` (new)

### 3. Firebase Firestore
- Database must be created (from Phase 1)
- Collections: `sessions`, `builds`, `users`
- `sessions` collection stores model URLs

## Testing the Pipeline

### Test via pytest

```bash
cd backend
python -m pytest tests/test_phase2_reconstruction.py -v -s
```

Expected output:
```
📤 Step 1: Uploading image...
✅ Image uploaded. Session ID: <uuid>
🚀 Step 2: Starting 3D reconstruction...
✅ Reconstruction job started
⏳ Step 3: Polling reconstruction status...
   Current status: complete (100%)
✅ Model URL: https://supabase...models/<uuid>.glb
```

### Test via HTTP

**1. Upload a bike image:**
```powershell
$file = Get-Item "path\to\your\bike.jpg"
$response = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/upload" -Method Post -Form @{file=$file}
$sessionId = $response.sessionId
$response
```

**2. Start 3D reconstruction:**
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/reconstruct/$sessionId" -Method Post
```

**3. Poll status (TRELLIS takes 2-5 minutes):**
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/reconstruct/$sessionId/status" -Method Get
```

Expected response when complete:
```json
{
  "status": "complete",
  "progress": 100,
  "modelUrl": "https://supabase.example.com/storage/v1/object/public/motoforge-models/models/..."
}
```

## TRELLIS Model Details

### Model Name
```
jeffrey-hou/trellis:1960133c9b4860b0d359cc751855e96a40a463c7847c2da4a81ed738a9d16b25
```

### Input Parameters
- `image` (required): Input image file or URL
- `ss_anti_aliasing` (optional): Enable anti-aliasing (default: True)
- `ss_num_planes` (optional): Mesh subdivision (default: 32, higher = better quality)

### Output
- Returns a URL to a `.glb` file (3D mesh in GL Transmission Format)
- GLB includes: geometry, materials, textures

### Processing Time
- **GPU (NVIDIA A40)**: 2-5 minutes per image
- **Quality**: High-quality 3D mesh suitable for AR/VR

## How to Get a Replicate API Token

1. Go to https://replicate.com/signin
2. Sign up or login
3. Click your avatar → **Settings**
4. Click **API Tokens**
5. Copy your API token
6. Add to `.env`:
```
REPLICATE_API_TOKEN=r8_XXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

## Troubleshooting

### "REPLICATE_API_TOKEN not configured"
- **Issue**: Environment variable not set
- **Fix**: Add `REPLICATE_API_TOKEN=...` to `.env` and restart backend
- **Fallback**: Without token, reconstruction returns demo URL

### "Failed to download GLB from Replicate"
- **Issue**: Network timeout or Replicate CDN issue
- **Fix**: Retry logic will attempt 3 times with 5-second delays
- **Check**: Monitor `requests.get()` in logs

### "Invalid output from TRELLIS"
- **Issue**: Model output is null or malformed
- **Fix**: Check Replicate console for model errors
- **Debug**: Look for `.glb` URL in the output

### "Supabase upload failed"
- **Issue**: Bucket permissions or credentials
- **Fix**: Verify bucket is **Public** and credentials in `.env`
- **Fallback**: Uses local URL if cloud upload fails

### "TRELLIS processing timeout"
- **Issue**: Model takes >30 minutes (rare)
- **Fix**: Check Replicate console for stuck jobs
- **Restart**: Kill job and retry with smaller/simpler image

## Performance Optimization

### For Faster Generation
1. Use simpler bike images (clear background helps)
2. Use smaller images (512×512 works well)
3. Lower `ss_num_planes` if quality permits

### For Better Quality
1. Use high-resolution images (2048×2048+)
2. Clean, well-lit photography
3. Multiple angles if possible

## Cost Considerations

**Replicate Pricing** (as of 2026):
- TRELLIS: ~$0.02 - $0.05 per image
- Depends on processing time
- Free tier: $5/month worth of usage

**Supabase Storage**:
- 5 GB free per project
- GLB files: ~5-20 MB per model
- ~250-1000 models on free tier

## Frontend Integration

When model generation completes, the frontend receives:
```json
{
  "sessionId": "abc-123-def",
  "modelUrl": "https://supabase.../models/abc-123-def.glb",
  "status": "complete"
}
```

The frontend can then:
1. Load the GLB into Three.js/Babylon.js viewer
2. Display 360° rotation
3. Allow part selection and modification

## Next Steps

1. ✅ **Phase 1 Complete**: Supabase Storage + Firebase Firestore
2. ✅ **Phase 2 Complete**: TRELLIS 3D Generation
3. **Phase 3 Next**: Frontend 3D Viewer & Part Detection
   - Update BikeViewer.tsx to render GLB models
   - Integrate YOLOv8 part detection
   - Implement parts catalog UI

---

## Documentation Links

- **Replicate TRELLIS**: https://replicate.com/JeffreyHou/trellis
- **GLB Format**: https://www.khronos.org/gltf/
- **Supabase Storage**: https://supabase.com/docs/guides/storage
- **Firebase Firestore**: https://firebase.google.com/docs/firestore
