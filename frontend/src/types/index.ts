// Types for the AI Bike Modification application

export type ProcessingStage = 
  | 'idle' 
  | 'uploading' 
  | 'reconstructing' 
  | 'segmenting' 
  | 'ready';

export type ModificationTab = 'color' | 'style' | 'parts';

export type MaterialType = 'gloss' | 'matte' | 'metallic' | 'chrome' | 'carbon' | 'wrapped';

export interface PartState {
  id: string;
  name: string;
  displayName: string;
  icon: string;
  color: string;
  materialType: MaterialType;
  originalColor: string;
  originalMaterialType: MaterialType;
  styleVariant: string | null;
  replacementPart: string | null;
}

export interface Modification {
  id: string;
  partId: string;
  type: 'color' | 'material' | 'style' | 'replacement';
  previousValue: string;
  newValue: string;
  timestamp: number;
}

export interface StyleVariant {
  id: string;
  name: string;
  tag: string;
  imageUrl: string | null;
  description: string;
}

export interface CatalogPart {
  id: string;
  name: string;
  description: string;
  category: string;
  style: 'sport' | 'retro' | 'custom' | 'oem';
  imageUrl: string | null;
  icon: string;
  compatible: boolean;
}

export interface ColorPreset {
  name: string;
  hex: string;
  type: MaterialType;
}

export interface ExportOptions {
  format: 'png' | 'mp4' | 'glb';
  resolution: '1080p' | '4k';
  background: 'transparent' | 'studio' | 'environment';
}

export interface CaptureAngle {
  id: string;
  name: string;
  icon: string;
  description: string;
  captured: boolean;
}

// Bike part definitions
export const BIKE_PARTS: Record<string, { displayName: string; icon: string }> = {
  fuel_tank: { displayName: 'Fuel Tank', icon: '⛽' },
  fairing: { displayName: 'Fairing', icon: '🛡️' },
  seat: { displayName: 'Seat', icon: '💺' },
  exhaust: { displayName: 'Exhaust', icon: '💨' },
  handlebar: { displayName: 'Handlebar', icon: '🎛️' },
  mirror_left: { displayName: 'Left Mirror', icon: '🪞' },
  mirror_right: { displayName: 'Right Mirror', icon: '🪞' },
  headlight: { displayName: 'Headlight', icon: '💡' },
  taillight: { displayName: 'Tail Light', icon: '🔴' },
  front_wheel: { displayName: 'Front Wheel', icon: '⭕' },
  rear_wheel: { displayName: 'Rear Wheel', icon: '⭕' },
  front_rim: { displayName: 'Front Rim', icon: '🔘' },
  rear_rim: { displayName: 'Rear Rim', icon: '🔘' },
  mudguard_front: { displayName: 'Front Mudguard', icon: '🛡️' },
  mudguard_rear: { displayName: 'Rear Mudguard', icon: '🛡️' },
  chain_cover: { displayName: 'Chain Cover', icon: '⛓️' },
  engine: { displayName: 'Engine', icon: '⚙️' },
  frame: { displayName: 'Frame', icon: '🏗️' },
};

// Color presets for motorcycle parts
export const COLOR_PRESETS: Record<string, ColorPreset[]> = {
  popular: [
    { name: 'Midnight Black', hex: '#1a1a1a', type: 'gloss' },
    { name: 'Pearl White', hex: '#f5f5f0', type: 'metallic' },
    { name: 'Racing Red', hex: '#dc2626', type: 'gloss' },
    { name: 'Deep Blue', hex: '#1e40af', type: 'metallic' },
    { name: 'Gunmetal', hex: '#374151', type: 'metallic' },
    { name: 'Neon Green', hex: '#22c55e', type: 'gloss' },
  ],
  metallic: [
    { name: 'Chrome Silver', hex: '#c0c0c0', type: 'chrome' },
    { name: 'Brushed Gold', hex: '#d4a843', type: 'metallic' },
    { name: 'Copper Bronze', hex: '#b87333', type: 'metallic' },
    { name: 'Titanium', hex: '#878681', type: 'metallic' },
    { name: 'Rose Gold', hex: '#e8b4b8', type: 'metallic' },
    { name: 'Gunmetal Blue', hex: '#2c3e6b', type: 'metallic' },
  ],
  matte: [
    { name: 'Stealth Black', hex: '#0a0a0a', type: 'matte' },
    { name: 'Military Green', hex: '#4a5d23', type: 'matte' },
    { name: 'Desert Tan', hex: '#c2b280', type: 'matte' },
    { name: 'Storm Grey', hex: '#6b7280', type: 'matte' },
    { name: 'Navy', hex: '#1e3a5f', type: 'matte' },
    { name: 'Terracotta', hex: '#c75b39', type: 'matte' },
  ],
  special: [
    { name: 'Carbon Fiber', hex: '#2d2d2d', type: 'carbon' },
    { name: 'Camo Green', hex: '#4a5d23', type: 'wrapped' },
    { name: 'Flames', hex: '#ff6b00', type: 'wrapped' },
    { name: 'Galaxy Blue', hex: '#1a0a3e', type: 'wrapped' },
    { name: 'Racing Stripes', hex: '#ffffff', type: 'wrapped' },
    { name: 'Tribal', hex: '#1a1a1a', type: 'wrapped' },
  ],
};

// Style variants for different parts
export const STYLE_VARIANTS: Record<string, StyleVariant[]> = {
  default: [
    { id: 'sporty', name: 'Sport', tag: 'Aggressive', imageUrl: null, description: 'Sharp angles, aerodynamic profile' },
    { id: 'retro', name: 'Retro', tag: 'Classic', imageUrl: null, description: 'Vintage curves, chrome accents' },
    { id: 'cafe', name: 'Cafe Racer', tag: 'Minimalist', imageUrl: null, description: 'Clean lines, low profile' },
    { id: 'custom', name: 'Custom', tag: 'Unique', imageUrl: null, description: 'One-of-a-kind design' },
  ],
};

// Catalog parts (mock data)
export const CATALOG_PARTS: Record<string, CatalogPart[]> = {
  exhaust: [
    { id: 'akrapovic-slip-on', name: 'Akrapovič Slip-On', description: 'Titanium slip-on exhaust with carbon end cap', category: 'exhaust', style: 'sport', imageUrl: null, icon: '🔥', compatible: true },
    { id: 'yoshimura-rs4', name: 'Yoshimura RS-4', description: 'Full stainless steel system, race-bred performance', category: 'exhaust', style: 'sport', imageUrl: null, icon: '💨', compatible: true },
    { id: 'sc-project-crtr', name: 'SC Project CR-T', description: 'Carbon fiber muffler, MotoGP inspired', category: 'exhaust', style: 'sport', imageUrl: null, icon: '🏁', compatible: true },
    { id: 'vance-hines-classic', name: 'Vance & Hines Classic', description: 'Chrome slash-cut pipes, deep rumble sound', category: 'exhaust', style: 'retro', imageUrl: null, icon: '🎵', compatible: true },
  ],
  seat: [
    { id: 'corbin-gunfighter', name: 'Corbin Gunfighter', description: 'Ergonomic sport seat with gel padding', category: 'seat', style: 'sport', imageUrl: null, icon: '🏍️', compatible: true },
    { id: 'saddlemen-cafe', name: 'Saddlemen Cafe Solo', description: 'Café racer solo seat, diamond stitch', category: 'seat', style: 'retro', imageUrl: null, icon: '💺', compatible: true },
    { id: 'custom-bobber', name: 'Custom Bobber Seat', description: 'Spring-mounted leather solo, hand-finished', category: 'seat', style: 'custom', imageUrl: null, icon: '🪑', compatible: true },
  ],
  headlight: [
    { id: 'motodemic-evo', name: 'Motodemic Evo', description: 'Adaptive LED projector, DRL ring', category: 'headlight', style: 'sport', imageUrl: null, icon: '💡', compatible: true },
    { id: 'classic-round', name: 'Classic Round', description: '7" round chrome bucket, halogen', category: 'headlight', style: 'retro', imageUrl: null, icon: '🔆', compatible: true },
  ],
  fuel_tank: [
    { id: 'acerbis-desert', name: 'Acerbis Desert 13L', description: 'Extended range adventure tank', category: 'fuel_tank', style: 'custom', imageUrl: null, icon: '⛽', compatible: true },
    { id: 'cafe-clubman', name: 'Café Clubman Tank', description: 'Narrow knee-indent tank, polished alloy', category: 'fuel_tank', style: 'retro', imageUrl: null, icon: '🏆', compatible: true },
  ],
};
