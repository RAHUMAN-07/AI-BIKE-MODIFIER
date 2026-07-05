# AI Bike Modify — MotoForge AI

AI-powered motorcycle customization studio. Upload a photo, get a 3D model, and customize every part.

## Quick Start

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8000
```

## Environment Setup

Copy `.env.example` to `.env` in the project root and fill in your API keys:

```env
REPLICATE_API_TOKEN=your_replicate_token_here
FAL_KEY=your_fal_ai_key_here
```

- **Replicate**: https://replicate.com — for 3D mesh generation via TripoSR
- **Fal.ai**: https://fal.ai — faster alternative for 3D reconstruction

## YOLOv8 Model

The YOLOv8 nano model weight (`yolov8n.pt`) is **not included** in the repo (binary file).
Download it automatically by running:

```bash
pip install ultralytics
python -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"
```

Or place `yolov8n.pt` manually in the `backend/` directory.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **3D Rendering**: Three.js + React Three Fiber + Drei
- **State**: Zustand
- **Styling**: Custom CSS Design System + Tailwind v4
- **Backend**: Python FastAPI + Uvicorn
- **AI / 3D**: YOLOv8 (part detection) · Fal.ai / Replicate TripoSR (3D reconstruction)

## Project Structure

```
frontend/           # React web application
├── src/
│   ├── components/ # UI components (BikeViewer, ModificationPanel, etc.)
│   ├── stores/     # Zustand state management
│   ├── services/   # API client
│   └── types/      # TypeScript type definitions
backend/            # Python FastAPI
├── routers/        # upload, reconstruct, parts endpoints
└── services/       # storage, object_detection, reconstruction
```
