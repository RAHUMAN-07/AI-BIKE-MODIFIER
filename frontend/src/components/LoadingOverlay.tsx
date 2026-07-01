import { useBikeStore } from '../stores/bikeStore';

export default function LoadingOverlay() {
  const { processingStage, processingProgress, processingMessage } = useBikeStore();

  const stageLabels: Record<string, string> = {
    uploading: '📤 Uploading',
    reconstructing: '🔮 3D Reconstruction',
    segmenting: '🧩 Part Segmentation',
  };

  return (
    <div className="loading-overlay">
      <div className="loading-overlay__content">
        <div className="loading-spinner">
          <div className="loading-spinner__ring" />
          <div className="loading-spinner__ring" />
          <div className="loading-spinner__ring" />
        </div>

        <div className="loading-overlay__stage">
          {stageLabels[processingStage] || 'Processing...'}
        </div>

        <div className="loading-overlay__detail">
          {processingMessage}
        </div>

        <div className="loading-progress">
          <div
            className="loading-progress__bar"
            style={{ width: `${Math.min(processingProgress, 100)}%` }}
          />
        </div>

        <div style={{
          fontSize: 'var(--font-size-xs)',
          color: 'var(--text-tertiary)',
          fontFamily: 'var(--font-mono)',
        }}>
          {Math.round(processingProgress)}% complete
        </div>
      </div>
    </div>
  );
}
