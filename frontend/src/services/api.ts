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
  colors?: Record<string, string> | null;
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

// ---------- Default Model ----------

export async function getDefaultModel(): Promise<{ status: string, modelUrl?: string }> {
  const response = await fetch(`${API_BASE}/default-model`);
  if (!response.ok) {
    throw new Error('Failed to get default model');
  }
  return response.json();
}

// ---------- Segmentation (Phase 3 — stub for now) ----------

export async function startSegmentation(_sessionId: string): Promise<void> {
  // Directly handled by getSegmentationStatus now.
  return Promise.resolve();
}

export async function getSegmentationStatus(sessionId: string): Promise<SegmentationStatus> {
  const response = await fetch(`${API_BASE}/detect-parts/${sessionId}`);

  if (!response.ok) {
    throw new Error('Failed to get segmentation data from backend');
  }

  const data = await response.json();
  
  return {
    status: 'complete',
    progress: 100,
    parts: data.parts ? data.parts.map((p: any) => p.id) : [],
    colors: data.colors || null
  };
}

// ---------- AI Generation (Phase 4 — stub for now) ----------

export async function generateModification(request: GenerationRequest): Promise<GenerationResult[]> {
  const response = await fetch(`${API_BASE}/reconstruct`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: request.sessionId,
      partId: request.partId,
      selectedItem: request.prompt || request.parameters?.style || 'custom'
    })
  });

  if (!response.ok) {
    throw new Error('Failed to generate image from backend');
  }

  const data = await response.json();

  return [
    { imageUrl: toBackendUrl(data.resultUrl) }
  ];
}

// ---------- Helpers ----------

/** Convert a relative backend URL to an absolute URL */
export function toBackendUrl(path: string): string {
  if (path.startsWith('http')) return path;
  return `${BACKEND_BASE}${path}`;
}

// ---------- AI Part Suggestions ----------

export interface PartSuggestion {
  id: string;
  brand: string;
  model: string;
  style: string;
  price: number;
  compatible: boolean;
  icon: string;
}

export interface SuggestionsResponse {
  part_id: string;
  suggestions: PartSuggestion[];
  total: number;
  powered_by: string;
}

export async function suggestParts(partId: string, style = 'all'): Promise<SuggestionsResponse> {
  const response = await fetch(`${API_BASE}/parts/${partId}/suggest?style=${style}`);
  if (!response.ok) throw new Error('Failed to fetch part suggestions');
  return response.json();
}

export default {
  uploadImage,
  startReconstruction,
  getReconstructionStatus,
  getDefaultModel,
  startSegmentation,
  getSegmentationStatus,
  generateModification,
  suggestParts,
  toBackendUrl,
};
