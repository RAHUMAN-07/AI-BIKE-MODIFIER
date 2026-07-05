import { useEffect } from 'react';
import { useBikeStore } from './stores/bikeStore';
import { BIKE_PARTS } from './types';
import Header from './components/Header';
import BikeViewer from './components/BikeViewer';
import ModificationPanel from './components/ModificationPanel';
import LoadingOverlay from './components/LoadingOverlay';
import UploadZone from './components/UploadZone';
import ExportPanel from './components/ExportPanel';

// Parts list sidebar shown when bike is ready
function PartsListPanel() {
  const { parts, selectedPart, selectPart } = useBikeStore();
  const partEntries = Object.entries(parts);

  if (partEntries.length === 0) return null;

  return (
    <div className="parts-list-panel">
      <div className="parts-list-panel__title">🏍️ Detected Parts</div>
      <div className="parts-list-panel__list">
        {partEntries.map(([id, part]) => (
          <button
            key={id}
            className={`parts-list-panel__item ${selectedPart === id ? 'parts-list-panel__item--active' : ''} ${part.styleVariant === 'race' ? 'parts-list-panel__item--race' : ''}`}
            onClick={() => selectPart(selectedPart === id ? null : id)}
            title={part.displayName}
          >
            <span className="parts-list-panel__item-icon">{part.icon}</span>
            <span className="parts-list-panel__item-name">{part.displayName}</span>
            {(part.color !== part.originalColor || part.materialType !== part.originalMaterialType || part.styleVariant || part.replacementPart) && (
              <span className="parts-list-panel__item-dot" title="Modified" />
            )}
          </button>
        ))}
      </div>

      {/* Quick color preview strip for selected part */}
      {selectedPart && parts[selectedPart] && (
        <div className="parts-list-panel__color-strip">
          <div
            style={{
              width: '100%',
              height: 6,
              borderRadius: 3,
              background: parts[selectedPart].color,
              boxShadow: `0 0 12px ${parts[selectedPart].color}66`,
            }}
          />
          <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
            {parts[selectedPart].color.toUpperCase()} · {parts[selectedPart].materialType}
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const { processingStage, selectedPart, modelUrl, loadDefaultModel } = useBikeStore();

  useEffect(() => {
    loadDefaultModel();
  }, [loadDefaultModel]);

  const isLoading = processingStage !== 'ready' && processingStage !== 'idle';

  return (
    <div className="app-layout">
      <Header />

      <main className="app-main">
        {isLoading && <LoadingOverlay />}
        {processingStage === 'idle' && <UploadZone />}

        <div className="studio-layout">
          {/* Left: Parts list sidebar */}
          <PartsListPanel />

          {/* Center: 3D viewer */}
          <div className="studio-viewer-wrapper">
            <BikeViewer />

            {/* Export panel floating in top right */}
            <div className="studio-export-wrapper">
              <ExportPanel />
            </div>
          </div>

          {/* Right: Modification panel (slides in when part is selected) */}
          {selectedPart && (
            <div className="studio-panel-wrapper">
              <ModificationPanel />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
