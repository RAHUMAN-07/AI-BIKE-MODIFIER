import { useState } from 'react';
import { useBikeStore } from '../../../core/stores/bikeStore';
import { COLOR_PRESETS, type MaterialType } from '../../../core/types';

const MATERIAL_TYPES: { id: MaterialType; name: string; icon: string }[] = [
  { id: 'gloss', name: 'Gloss Paint', icon: '✨' },
  { id: 'matte', name: 'Matte Paint', icon: '🌑' },
  { id: 'metallic', name: 'Metallic', icon: '🪙' },
  { id: 'chrome', name: 'Chrome', icon: '🪞' },
  { id: 'carbon', name: 'Carbon Fiber', icon: '🏎️' },
  { id: 'wrapped', name: 'Vinyl Wrap', icon: '🎭' },
];

export default function ColorPicker() {
  const { selectedPart, parts, applyColor, applyMaterial } = useBikeStore();
  const [customColor, setCustomColor] = useState('#3b82f6');

  if (!selectedPart) return null;
  const part = parts[selectedPart];
  if (!part) return null;

  const colorSections = Object.entries(COLOR_PRESETS);

  return (
    <div className="color-picker">
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        padding: 'var(--space-3)',
        borderRadius: 'var(--radius-md)',
        background: 'var(--bg-glass)',
        border: '1px solid var(--border-subtle)',
      }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 'var(--radius-md)',
          background: part.color,
          border: '2px solid rgba(255,255,255,0.2)',
          flexShrink: 0,
        }} />
        <div>
          <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>Current Color</div>
          <div style={{ 
            fontSize: 'var(--font-size-xs)', 
            color: 'var(--text-tertiary)',
            fontFamily: 'var(--font-mono)' 
          }}>
            {part.color.toUpperCase()} · {part.materialType}
          </div>
        </div>
      </div>

      <div className="color-picker__section">
        <div className="color-picker__section-title">Material Finish</div>
        <div className="material-types">
          {MATERIAL_TYPES.map((mat) => (
            <button
              key={mat.id}
              className={`material-type ${part.materialType === mat.id ? 'material-type--active' : ''}`}
              onClick={() => applyMaterial(selectedPart, mat.id)}
            >
              <div className="material-type__icon">{mat.icon}</div>
              <div className="material-type__name">{mat.name}</div>
            </button>
          ))}
        </div>
      </div>

      {colorSections.map(([sectionName, colors]) => (
        <div key={sectionName} className="color-picker__section">
          <div className="color-picker__section-title">
            {sectionName.charAt(0).toUpperCase() + sectionName.slice(1)} Colors
          </div>
          <div className="color-picker__palette">
            {colors.map((preset) => (
              <button
                key={preset.name}
                className={`color-swatch ${part.color === preset.hex ? 'color-swatch--active' : ''} ${
                  preset.type === 'metallic' || preset.type === 'chrome' ? 'color-swatch--metallic' : ''
                }`}
                style={{ background: preset.hex }}
                onClick={() => {
                  applyColor(selectedPart, preset.hex);
                  applyMaterial(selectedPart, preset.type);
                }}
                title={preset.name}
              />
            ))}
          </div>
        </div>
      ))}

      <div className="color-picker__section">
        <div className="color-picker__section-title">Custom Color</div>
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          <input
            type="color"
            value={customColor}
            onChange={(e) => setCustomColor(e.target.value)}
            style={{
              width: 48,
              height: 48,
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              background: 'transparent',
            }}
          />
          <input
            type="text"
            value={customColor}
            onChange={(e) => setCustomColor(e.target.value)}
            style={{
              flex: 1,
              padding: 'var(--space-2) var(--space-3)',
              background: 'var(--bg-glass)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--font-size-sm)',
            }}
          />
          <button
            className="btn btn--primary"
            onClick={() => applyColor(selectedPart, customColor)}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
