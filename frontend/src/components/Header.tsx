import { useState, useCallback } from 'react';
import { useBikeStore } from '../stores/bikeStore';

const STAGES = [
  { id: 'upload', label: 'Upload' },
  { id: 'reconstruct', label: '3D Reconstruct' },
  { id: 'segment', label: 'Segment' },
  { id: 'customize', label: 'Customize' },
];

function getStageIndex(stage: string): number {
  switch (stage) {
    case 'idle': return 0;
    case 'uploading': return 1;
    case 'reconstructing': return 2;
    case 'segmenting': return 3;
    case 'ready': return 4;
    default: return 0;
  }
}

export default function Header() {
  const { processingStage, modifications, undoLastModification, resetAll, loadRemoteModel } = useBikeStore();
  const [remoteUrl, setRemoteUrl] = useState('');
  const [showSketchfabHelper, setShowSketchfabHelper] = useState(false);
  const currentIndex = getStageIndex(processingStage);

  const handleLoadRemote = useCallback(() => {
    const url = remoteUrl.trim();
    if (!url) return;
    loadRemoteModel(url);
  }, [loadRemoteModel, remoteUrl]);

  const toggleSketchfabHelper = useCallback(() => {
    setShowSketchfabHelper((value) => !value);
  }, []);

  return (
    <header className="header">
      <div className="header__brand">
        <div className="header__logo">M</div>
        <div>
          <div className="header__title">MotoForge AI</div>
          <div className="header__subtitle">Bike Customization Studio</div>
        </div>
      </div>

      <div className="header__stage">
        {STAGES.map((stage, i) => (
          <div key={stage.id} style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
            <div
              className={`header__stage-item ${
                i < currentIndex ? 'header__stage-item--completed' :
                i === currentIndex ? 'header__stage-item--active' : ''
              }`}
            >
              <span className="header__stage-dot" />
              <span>{stage.label}</span>
            </div>
            {i < STAGES.length - 1 && <div className="header__stage-line" style={{ margin: '0 8px' }} />}
          </div>
        ))}
      </div>

      <div className="header__actions">
        {processingStage === 'ready' && (
          <>
            <button
              className="btn btn--ghost"
              onClick={undoLastModification}
              disabled={modifications.length === 0}
              title="Undo last change"
            >
              ↩ Undo
            </button>
            <button
              className="btn btn--ghost"
              onClick={resetAll}
              disabled={modifications.length === 0}
              title="Reset all modifications"
            >
              🔄 Reset
            </button>
            <span
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--text-tertiary)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {modifications.length} change{modifications.length !== 1 ? 's' : ''}
            </span>
          </>
        )}

        <div className="header__remote-loader" style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 260 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="text"
              value={remoteUrl}
              onChange={(e) => setRemoteUrl(e.target.value)}
              placeholder="Paste .glb URL or Sketchfab page"
              style={{ flex: 1, padding: '8px 10px', borderRadius: 12, border: '1px solid rgba(148, 163, 184, 0.4)', background: '#ffffff', color: '#0f172a' }}
            />
            <button
              className="btn btn--primary"
              onClick={handleLoadRemote}
              disabled={!remoteUrl.trim()}
              title="Load remote model"
            >
              Load
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              className="btn btn--ghost"
              onClick={toggleSketchfabHelper}
              type="button"
            >
              Sketchfab helper
            </button>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
              Load remote GLB here.
            </span>
          </div>
          {showSketchfabHelper && (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', background: '#f8fafc', borderRadius: 12, padding: 10, border: '1px solid rgba(148, 163, 184, 0.25)' }}>
              <strong>Sketchfab helper:</strong>
              <p style={{ margin: '6px 0 0' }}>
                Sketchfab pages cannot be loaded directly. Export or download the model as a <code>.glb</code>, then paste the direct file URL here.
              </p>
              <p style={{ margin: '6px 0 0' }}>
                If you host the file yourself, use that URL. Remote CORS-enabled GLB links work best.
              </p>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
