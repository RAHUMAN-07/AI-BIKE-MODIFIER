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
  const { processingStage, modifications, undoLastModification, resetAll } = useBikeStore();
  const currentIndex = getStageIndex(processingStage);

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
      </div>
    </header>
  );
}
