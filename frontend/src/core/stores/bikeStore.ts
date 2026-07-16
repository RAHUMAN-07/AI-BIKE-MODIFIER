import { create } from 'zustand';
import { 
  type PartState, 
  type Modification, 
  type ProcessingStage, 
  type MaterialType,
  BIKE_PARTS 
} from '../types';

interface BikeState {
  currentPage: 'login' | 'upload' | 'viewer';
  user: { email: string } | null;

  processingStage: ProcessingStage;
  processingProgress: number;
  processingMessage: string;

  modelUrl: string | null;
  uploadedImageUrl: string | null;

  parts: Record<string, PartState>;
  selectedPart: string | null;
  hoveredPart: string | null;

  modifications: Modification[];

  activeTab: 'color' | 'style' | 'parts';
  showExport: boolean;
  viewerMode: 'hd' | 'raw';

  login: (email: string) => void;
  logout: () => void;
  setCurrentPage: (page: 'login' | 'upload' | 'viewer') => void;
  setProcessingStage: (stage: ProcessingStage, progress?: number, message?: string) => void;
  setModelUrl: (url: string) => void;
  setUploadedImage: (url: string) => void;
  initializeParts: (partIds: string[], customColors?: Record<string, string> | null) => void;
  setViewerMode: (mode: 'hd' | 'raw') => void;
  selectPart: (partId: string | null) => void;
  hoverPart: (partId: string | null) => void;
  applyColor: (partId: string, color: string) => void;
  applyMaterial: (partId: string, material: MaterialType) => void;
  applyStyle: (partId: string, styleId: string) => void;
  applyRaceLivery: () => void;
  applyReplacement: (partId: string, replacementId: string) => void;
  undoLastModification: () => void;
  resetPart: (partId: string) => void;
  resetAll: () => void;
  setActiveTab: (tab: 'color' | 'style' | 'parts') => void;
  toggleExport: () => void;
}

const DEFAULT_PART_COLORS: Record<string, string> = {
  fuel_tank: '#1a1a1a',
  fairing: '#1a1a1a',
  seat: '#1a1a1a',
  exhaust: '#4a4a4a',
  handlebar: '#222222',
  mirror_left: '#111827',
  mirror_right: '#111827',
  headlight: '#f0f4f8',
  taillight: '#dc2626',
  front_wheel: '#1a1a1a',
  rear_wheel: '#1a1a1a',
  front_rim: '#ff6600',
  rear_rim: '#ff6600',
  winglet_left: '#f5f5f5',
  winglet_right: '#f5f5f5',
  mudguard_front: '#1a1a1a',
  mudguard_rear: '#1a1a1a',
  chain_cover: '#222222',
  radiator: '#333333',
  swingarm: '#ff6600',
  subframe: '#ff6600',
  footpeg_left: '#444444',
  footpeg_right: '#444444',
  air_intake: '#1a1a1a',
  engine: '#1a1a1a',
  frame: '#ff6600',
  rear_sprocket: '#ff6600',
  chain: '#3a3a3a',
  fork_guard_left: '#ff6600',
  fork_guard_right: '#ff6600',
  steering_damper: '#2a2a2e',
};

const DEFAULT_MATERIALS: Record<string, MaterialType> = {
  fuel_tank: 'gloss',
  fairing: 'gloss',
  seat: 'matte',
  exhaust: 'metallic',
  handlebar: 'metallic',
  mirror_left: 'gloss',
  mirror_right: 'gloss',
  headlight: 'chrome',
  taillight: 'gloss',
  front_wheel: 'matte',
  rear_wheel: 'matte',
  front_rim: 'metallic',
  rear_rim: 'metallic',
  winglet_left: 'carbon',
  winglet_right: 'carbon',
  mudguard_front: 'carbon',
  mudguard_rear: 'carbon',
  chain_cover: 'carbon',
  radiator: 'metallic',
  swingarm: 'metallic',
  subframe: 'matte',
  footpeg_left: 'metallic',
  footpeg_right: 'metallic',
  air_intake: 'carbon',
  engine: 'metallic',
  frame: 'matte',
  rear_sprocket: 'metallic',
  chain: 'metallic',
  fork_guard_left: 'carbon',
  fork_guard_right: 'carbon',
  steering_damper: 'metallic',
};

const DEFAULT_BIKE_PART_IDS = Object.keys(BIKE_PARTS);

function createDefaultParts(partIds: string[], customColors: Record<string, string> | null = null) {
  const parts: Record<string, PartState> = {};
  for (const id of partIds) {
    const def = BIKE_PARTS[id];
    if (!def) continue;
    const color = customColors?.[id] || DEFAULT_PART_COLORS[id] || '#6b7280';
    const material = DEFAULT_MATERIALS[id] || 'gloss';
    parts[id] = {
      id,
      name: id,
      displayName: def.displayName,
      icon: def.icon,
      color,
      materialType: material,
      originalColor: color,
      originalMaterialType: material,
      styleVariant: null,
      replacementPart: null,
    };
  }
  return parts;
}

export const useBikeStore = create<BikeState>((set, get) => ({
  currentPage: 'upload',
  user: null,
  processingStage: 'idle',
  processingProgress: 0,
  processingMessage: 'Upload your bike image to get started',
  modelUrl: null,
  uploadedImageUrl: null,
  parts: createDefaultParts(DEFAULT_BIKE_PART_IDS),
  selectedPart: null,
  hoveredPart: null,
  modifications: [],
  activeTab: 'color',
  showExport: false,
  viewerMode: 'hd',

  login: (email) => set({ user: { email }, currentPage: 'upload' }),
  logout: () => set({ user: null, currentPage: 'login', modelUrl: null, processingStage: 'idle' }),
  setCurrentPage: (page) => set({ currentPage: page }),

  setProcessingStage: (stage, progress = 0, message = '') => 
    set({ processingStage: stage, processingProgress: progress, processingMessage: message }),

  setModelUrl: (url) => set({ modelUrl: url }),

  setUploadedImage: (url) => set({ uploadedImageUrl: url }),

  initializeParts: (partIds, customColors = null) => {
    const parts: Record<string, PartState> = {};
    for (const id of partIds) {
      const def = BIKE_PARTS[id];
      if (def) {
        const color = customColors?.[id] || DEFAULT_PART_COLORS[id] || '#6b7280';
        const material = DEFAULT_MATERIALS[id] || 'gloss';
        parts[id] = {
          id,
          name: id,
          displayName: def.displayName,
          icon: def.icon,
          color,
          materialType: material,
          originalColor: color,
          originalMaterialType: material,
          styleVariant: null,
          replacementPart: null,
        };
      }
    }
    set({ parts });
  },

  setViewerMode: (mode) => set({ viewerMode: mode }),

  selectPart: (partId) => set({ selectedPart: partId }),

  hoverPart: (partId) => set({ hoveredPart: partId }),

  applyColor: (partId, color) => {
    const { parts, modifications } = get();
    const part = parts[partId];
    if (!part) return;

    const mod: Modification = {
      id: `mod-${Date.now()}`,
      partId,
      type: 'color',
      previousValue: part.color,
      newValue: color,
      timestamp: Date.now(),
    };

    set({
      parts: {
        ...parts,
        [partId]: { ...part, color },
      },
      modifications: [...modifications, mod],
    });
  },

  applyMaterial: (partId, material) => {
    const { parts, modifications } = get();
    const part = parts[partId];
    if (!part) return;

    const mod: Modification = {
      id: `mod-${Date.now()}`,
      partId,
      type: 'material',
      previousValue: part.materialType,
      newValue: material,
      timestamp: Date.now(),
    };

    set({
      parts: {
        ...parts,
        [partId]: { ...part, materialType: material },
      },
      modifications: [...modifications, mod],
    });
  },

  applyStyle: (partId, styleId) => {
    const { parts, modifications } = get();
    const part = parts[partId];
    if (!part) return;

    const mod: Modification = {
      id: `mod-${Date.now()}`,
      partId,
      type: 'style',
      previousValue: part.styleVariant || 'default',
      newValue: styleId,
      timestamp: Date.now(),
    };

    set({
      parts: {
        ...parts,
        [partId]: { ...part, styleVariant: styleId },
      },
      modifications: [...modifications, mod],
    });
  },

  applyRaceLivery: () => {
    const { parts } = get();
    const preset = {
      fuel_tank: { color: '#ef4444', materialType: 'gloss' as MaterialType, styleVariant: 'race' },
      fairing: { color: '#ef4444', materialType: 'gloss' as MaterialType, styleVariant: 'race' },
      winglet_left: { color: '#f8fafc', materialType: 'gloss' as MaterialType, styleVariant: 'race' },
      winglet_right: { color: '#f8fafc', materialType: 'gloss' as MaterialType, styleVariant: 'race' },
      radiator: { color: '#111827', materialType: 'metallic' as MaterialType, styleVariant: 'race' },
      air_intake: { color: '#111827', materialType: 'gloss' as MaterialType, styleVariant: 'race' },
      mudguard_front: { color: '#111827', materialType: 'gloss' as MaterialType, styleVariant: 'race' },
      mudguard_rear: { color: '#111827', materialType: 'gloss' as MaterialType, styleVariant: 'race' },
      front_rim: { color: '#f8fafc', materialType: 'metallic' as MaterialType, styleVariant: 'race' },
      rear_rim: { color: '#f8fafc', materialType: 'metallic' as MaterialType, styleVariant: 'race' },
    };

    const updatedParts: Record<string, PartState> = { ...parts };
    Object.entries(preset).forEach(([id, values]) => {
      const part = updatedParts[id];
      if (!part) return;
      updatedParts[id] = {
        ...part,
        color: values.color,
        materialType: values.materialType,
        styleVariant: values.styleVariant,
      };
    });

    set({ parts: updatedParts });
  },

  applyReplacement: (partId, replacementId) => {
    const { parts, modifications } = get();
    const part = parts[partId];
    if (!part) return;

    const mod: Modification = {
      id: `mod-${Date.now()}`,
      partId,
      type: 'replacement',
      previousValue: part.replacementPart || 'original',
      newValue: replacementId,
      timestamp: Date.now(),
    };

    set({
      parts: {
        ...parts,
        [partId]: { ...part, replacementPart: replacementId },
      },
      modifications: [...modifications, mod],
    });
  },

  undoLastModification: () => {
    const { modifications, parts } = get();
    if (modifications.length === 0) return;

    const lastMod = modifications[modifications.length - 1];
    const part = parts[lastMod.partId];
    if (!part) return;

    const updatedPart = { ...part };
    switch (lastMod.type) {
      case 'color':
        updatedPart.color = lastMod.previousValue;
        break;
      case 'material':
        updatedPart.materialType = lastMod.previousValue as MaterialType;
        break;
      case 'style':
        updatedPart.styleVariant = lastMod.previousValue === 'default' ? null : lastMod.previousValue;
        break;
      case 'replacement':
        updatedPart.replacementPart = lastMod.previousValue === 'original' ? null : lastMod.previousValue;
        break;
    }

    set({
      parts: { ...parts, [lastMod.partId]: updatedPart },
      modifications: modifications.slice(0, -1),
    });
  },

  resetPart: (partId) => {
    const { parts } = get();
    const part = parts[partId];
    if (!part) return;

    set({
      parts: {
        ...parts,
        [partId]: {
          ...part,
          color: part.originalColor,
          materialType: part.originalMaterialType,
          styleVariant: null,
          replacementPart: null,
        },
      },
    });
  },

  resetAll: () => {
    const { parts } = get();
    const resetParts: Record<string, PartState> = {};
    for (const [id, part] of Object.entries(parts)) {
      resetParts[id] = {
        ...part,
        color: part.originalColor,
        materialType: part.originalMaterialType,
        styleVariant: null,
        replacementPart: null,
      };
    }
    set({ parts: resetParts, modifications: [] });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),

  toggleExport: () => set((state) => ({ showExport: !state.showExport })),
}));
