import { useBikeStore } from './core/stores/bikeStore';

// Core UI Components
import Header from './core/components/Header';
import LoadingOverlay from './core/components/LoadingOverlay';
import Login from './core/components/Login';

// Feature UI Components
import UploadZone from './features/upload/components/UploadZone';
import BikeViewer from './features/viewer/components/BikeViewer';
import ModificationPanel from './features/customization/components/ModificationPanel';
import ExportPanel from './features/export/components/ExportPanel';

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
  const { currentPage, processingStage, selectedPart } = useBikeStore();

  const isLoading = processingStage !== 'ready' && processingStage !== 'idle';

  if (currentPage === 'login') {
    return <Login />;
  }

  return (
    <div className="app-layout">
      <Header />

      <main className="app-main">
        {isLoading && <LoadingOverlay />}

        {currentPage === 'upload' ? (
          <UploadZone />
        ) : (
          <div className="studio-layout">
            <PartsListPanel />

            <div className="studio-viewer-wrapper">
              <BikeViewer />

              <div className="studio-export-wrapper">
                <ExportPanel />
              </div>
            </div>

            {selectedPart && (
              <div className="studio-panel-wrapper">
                <ModificationPanel />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
