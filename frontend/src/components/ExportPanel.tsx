import { useState, useCallback } from 'react';
import { useBikeStore } from '../stores/bikeStore';

export default function ExportPanel() {
  const { showExport, toggleExport, modifications } = useBikeStore();
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExport = useCallback((format: string) => {
    if (format === 'png') {
      // Real screenshot: grab the Three.js WebGL canvas and download it
      const canvas = document.querySelector<HTMLCanvasElement>('.viewer-canvas canvas');
      if (!canvas) {
        alert('3D viewer not found. Make sure the bike is loaded first.');
        return;
      }
      setExporting('png');
      // Use requestAnimationFrame to ensure the frame has rendered
      requestAnimationFrame(() => {
        try {
          const dataUrl = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.download = `motoforge-build-${Date.now()}.png`;
          link.href = dataUrl;
          link.click();
        } catch {
          alert('Screenshot failed — try disabling browser security restrictions.');
        } finally {
          setExporting(null);
        }
      });
      return;
    }

    setExporting(format);
    // Simulate export for other formats
    setTimeout(() => {
      setExporting(null);
      const messages: Record<string, string> = {
        mp4: '360° Video export — connect the rendering backend to generate turntable videos.',
        glb: '3D GLB download — use the Raw AI Mesh mode and connect your API keys to generate a real mesh.',
        share: 'Share Link — coming soon with backend session persistence.',
      };
      alert(messages[format] || `Export as ${format.toUpperCase()} — feature coming soon!`);
    }, 1500);
  }, []);

  const exportOptions = [
    {
      id: 'png',
      name: 'High-Res Image',
      desc: 'PNG render from current view',
      icon: '🖼️',
    },
    {
      id: 'mp4',
      name: '360° Video',
      desc: 'Auto-rotate turntable video',
      icon: '🎬',
    },
    {
      id: 'glb',
      name: '3D Model File',
      desc: 'Download modified GLB mesh',
      icon: '📦',
    },
    {
      id: 'share',
      name: 'Share Link',
      desc: 'Copy shareable preview link',
      icon: '🔗',
    },
  ];

  return (
    <div 
      className="export-panel"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      onPointerOver={(e) => e.stopPropagation()}
      onPointerOut={(e) => e.stopPropagation()}
    >
      {/* Toggle button */}
      <button
        className="btn"
        onClick={toggleExport}
        style={{ alignSelf: 'flex-end' }}
      >
        {showExport ? '✕ Close' : '📤 Export'}
        {modifications.length > 0 && !showExport && (
          <span style={{
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: 'var(--accent-blue)',
            color: 'white',
            fontSize: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
          }}>
            {modifications.length}
          </span>
        )}
      </button>

      {/* Expanded panel */}
      {showExport && (
        <div className="export-panel--expanded">
          <div className="export-panel__title">Export Your Build</div>
          
          {exportOptions.map((option) => (
            <div
              key={option.id}
              className="export-option"
              onClick={() => handleExport(option.id)}
              style={{
                opacity: exporting && exporting !== option.id ? 0.5 : 1,
                pointerEvents: exporting ? 'none' : 'auto',
              }}
            >
              <div className="export-option__icon">
                {exporting === option.id ? '⏳' : option.icon}
              </div>
              <div className="export-option__info">
                <div className="export-option__name">{option.name}</div>
                <div className="export-option__desc">{option.desc}</div>
              </div>
            </div>
          ))}

          {/* Save Preset */}
          <div style={{ marginTop: 'var(--space-2)' }}>
            <button
              className="btn"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => {
                const name = prompt('Name your preset:');
                if (name) {
                  // Save to localStorage
                  const presets = JSON.parse(localStorage.getItem('motoforge-presets') || '{}');
                  presets[name] = {
                    timestamp: Date.now(),
                    modifications: useBikeStore.getState().modifications,
                    parts: useBikeStore.getState().parts,
                  };
                  localStorage.setItem('motoforge-presets', JSON.stringify(presets));
                  alert(`Preset "${name}" saved!`);
                }
              }}
            >
              💾 Save Preset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
