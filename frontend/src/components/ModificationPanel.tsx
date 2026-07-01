import { useBikeStore } from '../stores/bikeStore';
import ColorPicker from './ColorPicker';
import StyleVariants from './StyleVariants';
import PartsCatalog from './PartsCatalog';

export default function ModificationPanel() {
  const { selectedPart, parts, activeTab, setActiveTab, selectPart, resetPart } = useBikeStore();
  
  if (!selectedPart) return null;
  const part = parts[selectedPart];
  if (!part) return null;

  const tabs = [
    { id: 'color' as const, label: '🎨 Color', icon: '🎨' },
    { id: 'style' as const, label: '✨ Style', icon: '✨' },
    { id: 'parts' as const, label: '🔧 Parts', icon: '🔧' },
  ];

  return (
    <div 
      className="mod-panel"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      onPointerOver={(e) => e.stopPropagation()}
      onPointerOut={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="mod-panel__header">
        <div className="mod-panel__part-info">
          <div className="mod-panel__part-icon">{part.icon}</div>
          <div>
            <div className="mod-panel__part-name">{part.displayName}</div>
            <div className="mod-panel__part-type">{part.materialType}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            className="btn btn--ghost btn--icon"
            onClick={() => resetPart(selectedPart)}
            title="Reset this part"
          >
            🔄
          </button>
          <button
            className="btn btn--ghost btn--icon"
            onClick={() => selectPart(null)}
            title="Close panel"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mod-panel__tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`mod-panel__tab ${activeTab === tab.id ? 'mod-panel__tab--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="mod-panel__body">
        {activeTab === 'color' && <ColorPicker />}
        {activeTab === 'style' && <StyleVariants />}
        {activeTab === 'parts' && <PartsCatalog />}
      </div>
    </div>
  );
}
