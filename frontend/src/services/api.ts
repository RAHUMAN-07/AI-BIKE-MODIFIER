// API service — connects to the FastAPI backend
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const BACKEND_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export interface UploadResponse {
  sessionId: string;
  imageUrl: string;
}

export interface ReconstructionStatus {
  status: 'pending' | 'processing' | 'complete' | 'error';
  progress: number;
  modelUrl?: string;
  error?: string;
}

export interface SegmentationStatus {
  status: 'pending' | 'processing' | 'complete' | 'error';
  progress: number;
  parts?: string[];
  error?: string;
}

export interface GenerationRequest {
  sessionId: string;
  partId: string;
  type: 'color' | 'style' | 'replacement';
  prompt?: string;
  parameters?: Record<string, unknown>;
}

export interface GenerationResult {
  imageUrl: string;
  textureUrl?: string;
  meshUrl?: string;
}

// ---------- Upload ----------

export async function uploadImage(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(error.detail || 'Upload failed');
  }

  return response.json();
}

// ---------- 3D Reconstruction ----------

export async function startReconstruction(sessionId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/reconstruct/${sessionId}`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('Failed to start reconstruction');
  }
}

export async function getReconstructionStatus(sessionId: string): Promise<ReconstructionStatus> {
  const response = await fetch(`${API_BASE}/reconstruct/${sessionId}/status`);

  if (!response.ok) {
    throw new Error('Failed to get reconstruction status');
  }

  return response.json();
}

// ---------- Segmentation (Phase 3 — stub for now) ----------

export async function startSegmentation(_sessionId: string): Promise<void> {
  // Phase 3: will call real API
  await new Promise(resolve => setTimeout(resolve, 500));
}

export async function getSegmentationStatus(_sessionId: string): Promise<SegmentationStatus> {
  // Phase 3: will call real API. For now, return mock complete.
  return {
    status: 'complete',
    progress: 100,
    parts: [
      'fuel_tank', 'fairing', 'seat', 'exhaust', 'handlebar',
      'mirror_left', 'mirror_right', 'headlight', 'taillight',
      'front_wheel', 'rear_wheel', 'front_rim', 'rear_rim',
      'mudguard_front', 'mudguard_rear', 'chain_cover', 'engine', 'frame',
    ],
  };
}

// ---------- AI Generation (Phase 4 — stub for now) ----------

export async function generateModification(_request: GenerationRequest): Promise<GenerationResult[]> {
  await new Promise(resolve => setTimeout(resolve, 2000));
  return [
    { imageUrl: '', textureUrl: '' },
    { imageUrl: '', textureUrl: '' },
    { imageUrl: '', textureUrl: '' },
    { imageUrl: '', textureUrl: '' },
  ];
}

// ---------- Helpers ----------

/** Convert a relative backend URL to an absolute URL */
export function toBackendUrl(path: string): string {
  if (path.startsWith('http')) return path;
  return `${BACKEND_BASE}${path}`;
}

export default {
  uploadImage,
  startReconstruction,
  getReconstructionStatus,
  startSegmentation,
  getSegmentationStatus,
  generateModification,
  toBackendUrl,
};
