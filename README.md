# 🏍️ MotoForge AI — AI-Powered 3D Motorcycle Customization Studio

[![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20Three.js%20%7C%20FastAPI%20%7C%20TRELLIS-6366f1.svg)](#tech-stack)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](#license)

**MotoForge AI** is a cutting-edge web application that transforms 2D motorcycle photos into interactive 3D models. Users can select individual bike components directly in a 3D Canvas view, customize colors & materials in real time, and explore part modifications in a 360° cybernetic studio environment.

---

## 🌟 Key Features

- **📸 Image-to-3D AI Generation**: Upload any motorcycle photo to reconstruct an interactive `.GLB` 3D mesh powered by **TRELLIS / Replicate AI**.
- **🎯 Interactive 3D Part Selection**: Touch or click directly on 3D components in the canvas (wheels, fuel tank, seat, exhaust, fairing, frame) to select and highlight them.
- **🎨 Real-Time Material & Color Studio**: Custom paint finishes (Gloss, Matte, Metallic, Chrome, Carbon Fiber, Vinyl Wrap) with direct emissive glow feedback.
- **📐 Automatic 3D Framed Bounding & Elevation**: Auto-detects model boundaries and positions the bike cleanly above the studio floor grid without clipping.
- **⚡ Feature-Based Modular Architecture**: Decoupled domain features (`upload`, `reconstruction`, `viewer`, `customization`, `export`) on both Frontend and Backend.
- **☁️ Cloud & Local Hybrid Storage**: Seamless fallbacks between Supabase Storage / Firebase Firestore and local persistent storage.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 + TypeScript + Vite
- **3D Graphics Engine**: Three.js + React Three Fiber (`@react-three/fiber`) + Drei (`@react-three/drei`)
- **State Management**: Zustand
- **Styling**: Cybernetic Studio System + Tailwind CSS v4

### Backend
- **Framework**: Python FastAPI + Uvicorn
- **AI 3D Pipeline**: TRELLIS model via Replicate API
- **Computer Vision & Detection**: YOLOv8 nano / OpenCV / rembg
- **Storage & DB**: Supabase Storage + Firebase Firestore / Local Storage

---

## 📁 Repository Structure

```
AI-BIKE-MODIFIER/
├── frontend/                     # React + TypeScript + R3F Client App
│   ├── src/
│   │   ├── core/                 # Core utilities, state stores, and layout
│   │   │   ├── components/       # Header, Login, LoadingOverlay
│   │   │   ├── services/         # Centralized API service client
│   │   │   ├── stores/           # Zustand bike store state
│   │   │   └── types/            # TypeScript data definitions
│   │   └── features/             # Modular Domain Features
│   │       ├── upload/           # Drag-and-drop upload & AI generation trigger
│   │       ├── viewer/           # Three.js 3D Canvas & camera animator
│   │       ├── customization/    # Color pickers, material finishes, part catalog
│   │       └── export/           # 3D snapshot & build export
│   └── vite.config.ts            # Vite server & API proxy rules
│
└── backend/                      # FastAPI Python Application
    ├── core/                     # Storage handlers, database helpers & configs
    │   ├── database.py
    │   └── storage/              # Local & Supabase storage interfaces
    └── features/                 # Modular Feature Controllers
        ├── upload/               # Image processing & removal router
        ├── reconstruction/       # TRELLIS 3D mesh generation pipeline
        ├── detection/            # YOLOv8 part detection service
        └── customization/        # Part suggestions & modification catalog
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** v18+ & **npm**
- **Python** 3.10+
- **Replicate API Token** (for TRELLIS 3D model generation)

---

### 1. Environment Setup

Copy `.env.example` to `.env` in the root folder and configure your API credentials:

```env
# AI 3D Reconstruction Service
REPLICATE_API_TOKEN=r8_your_replicate_token_here

# Cloud Storage (Optional)
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

---

### 2. Frontend Setup & Run

```bash
cd frontend
npm install
npm run dev
```
The frontend will launch at **`http://localhost:3000`** with automatic proxy routing for backend requests.

---

### 3. Backend Setup & Run

```bash
cd backend
pip install -r requirements.txt

# Download YOLOv8 weights (Optional)
python -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"

# Start FastAPI server
uvicorn main:app --host 127.0.0.1 --port 8000
```
The backend API will run live at **`http://127.0.0.1:8000`**.

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
python -m pytest tests/test_phase2_reconstruction.py -v
```

### Frontend Build Verification
```bash
cd frontend
npm run build
```

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
