import { useBikeStore } from './stores/bikeStore';
import Header from './components/Header';
import UploadZone from './components/UploadZone';
import BikeViewer from './components/BikeViewer';
import ModificationPanel from './components/ModificationPanel';
import LoadingOverlay from './components/LoadingOverlay';
import ExportPanel from './components/ExportPanel';

function App() {
  const { processingStage, selectedPart } = useBikeStore();

  const isReady = processingStage === 'ready';
  const isProcessing = processingStage === 'uploading' || 
                       processingStage === 'reconstructing' || 
                       processingStage === 'segmenting';

  return (
    <div className="app-layout">
      <Header />
      <main className={`app-main ${selectedPart && isReady ? 'app-main--with-panel' : ''}`}>
        {processingStage === 'idle' && <UploadZone />}
        
        {isReady && (
          <>
            <BikeViewer />
            {selectedPart && <ModificationPanel />}
            <ExportPanel />
          </>
        )}

        {isProcessing && <LoadingOverlay />}
      </main>
    </div>
  );
}

export default App;
