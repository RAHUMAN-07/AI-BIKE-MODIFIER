import { create } from 'zustand';
import { 
  type PartState, 
  type Modification, 
  type ProcessingStage, 
  type MaterialType,
  BIKE_PARTS 
} from '../types';

interface BikeState {
  // Processing
  processingStage: ProcessingStage;
  processingProgress: number;
  processingMessage: string;

  // Model
  modelUrl: string | null;
  uploadedImageUrl: string | null;

  // Parts
  parts: Record<string, PartState>;
  selectedPart: string | null;
  hoveredPart: string | null;

  // Modifications
  modifications: Modification[];

  // UI
  activeTab: 'color' | 'style' | 'parts';
  showExport: boolean;

  // Actions
  setProcessingStage: (stage: ProcessingStage, progress?: number, message?: string) => void;
  setModelUrl: (url: string) => void;
  setUploadedImage: (url: string) => void;
  initializeParts: (partIds: string[]) => void;
  selectPart: (partId: string | null) => void;
  hoverPart: (partId: string | null) => void;
  applyColor: (partId: string, color: string) => void;
  applyMaterial: (partId: string, material: MaterialType) => void;
  applyStyle: (partId: string, styleId: string) => void;
  applyReplacement: (partId: string, replacementId: string) => void;
  undoLastModification: () => void;
  resetPart: (partId: string) => void;
  resetAll: () => void;
  setActiveTab: (tab: 'color' | 'style' | 'parts') => void;
  toggleExport: () => void;
}

// Default colors for bike parts
const DEFAULT_PART_COLORS: Record<string, string> = {
  fuel_tank: '#dc2626',
  fairing: '#1e40af',
  seat: '#1a1a1a',
  exhaust: '#c0c0c0',
  handlebar: '#374151',
  mirror_left: '#1a1a1a',
  mirror_right: '#1a1a1a',
  headlight: '#e5e7eb',
  taillight: '#dc2626',
  front_wheel: '#1a1a1a',
  rear_wheel: '#1a1a1a',
  front_rim: '#c0c0c0',
  rear_rim: '#c0c0c0',
  mudguard_front: '#1e40af',
  mudguard_rear: '#1e40af',
  chain_cover: '#374151',
  engine: '#6b7280',
  frame: '#1a1a1a',
};

const DEFAULT_MATERIALS: Record<string, MaterialType> = {
  fuel_tank: 'gloss',
  fairing: 'gloss',
  seat: 'matte',
  exhaust: 'chrome',
  handlebar: 'metallic',
  mirror_left: 'gloss',
  mirror_right: 'gloss',
  headlight: 'chrome',
  taillight: 'gloss',
  front_wheel: 'matte',
  rear_wheel: 'matte',
  front_rim: 'metallic',
  rear_rim: 'metallic',
  mudguard_front: 'gloss',
  mudguard_rear: 'gloss',
  chain_cover: 'matte',
  engine: 'metallic',
  frame: 'matte',
};

export const useBikeStore = create<BikeState>((set, get) => ({
  // Initial state
  processingStage: 'idle',
  processingProgress: 0,
  processingMessage: '',
  modelUrl: null,
  uploadedImageUrl: null,
  parts: {},
  selectedPart: null,
  hoveredPart: null,
  modifications: [],
  activeTab: 'color',
  showExport: false,

  // Actions
  setProcessingStage: (stage, progress = 0, message = '') => 
    set({ processingStage: stage, processingProgress: progress, processingMessage: message }),

  setModelUrl: (url) => set({ modelUrl: url }),

  setUploadedImage: (url) => set({ uploadedImageUrl: url }),

  initializeParts: (partIds) => {
    const parts: Record<string, PartState> = {};
    for (const id of partIds) {
      const def = BIKE_PARTS[id];
      if (def) {
        const color = DEFAULT_PART_COLORS[id] || '#6b7280';
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
