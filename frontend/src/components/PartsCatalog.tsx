import { useState } from 'react';
import { useBikeStore } from '../stores/bikeStore';
import { CATALOG_PARTS } from '../types';

const STYLE_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'sport', label: 'Sport' },
  { id: 'retro', label: 'Retro' },
  { id: 'custom', label: 'Custom' },
  { id: 'oem', label: 'OEM' },
];

export default function PartsCatalog() {
  const { selectedPart, parts, applyReplacement } = useBikeStore();
  const [activeFilter, setActiveFilter] = useState('all');

  if (!selectedPart) return null;
  const part = parts[selectedPart];
  if (!part) return null;

  // Get catalog parts for this part category, or show generic message
  const catalogEntries = CATALOG_PARTS[selectedPart] || [];
  const filtered = activeFilter === 'all' 
    ? catalogEntries 
    : catalogEntries.filter(p => p.style === activeFilter);

  // Gradient backgrounds for part icons
  const styleColors: Record<string, string> = {
    sport: 'linear-gradient(135deg, #1e3a5f, #3b82f6)',
    retro: 'linear-gradient(135deg, #92400e, #d97706)',
    custom: 'linear-gradient(135deg, #5b21b6, #8b5cf6)',
    oem: 'linear-gradient(135deg, #065f46, #10b981)',
  };

  return (
    <div className="parts-catalog">
      <div style={{
        fontSize: 'var(--font-size-sm)',
        color: 'var(--text-secondary)',
        lineHeight: 1.6,
      }}>
        Browse aftermarket replacements for your{' '}
        <strong style={{ color: 'var(--text-primary)' }}>{part.displayName}</strong>.
      </div>

      {/* Style Filters */}
      <div className="parts-catalog__filters">
        {STYLE_FILTERS.map((filter) => (
          <button
            key={filter.id}
            className={`parts-catalog__filter ${activeFilter === filter.id ? 'parts-catalog__filter--active' : ''}`}
            onClick={() => setActiveFilter(filter.id)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Parts List */}
      <div className="parts-catalog__list">
        {/* Original part option */}
        <div
          className={`part-card ${!part.replacementPart ? 'part-card--active' : ''}`}
          onClick={() => applyReplacement(selectedPart, 'original')}
        >
          <div className="part-card__image" style={{ 
            background: 'var(--bg-elevated)',
            fontSize: '1.8rem',
          }}>
            {part.icon}
          </div>
          <div className="part-card__info">
            <div className="part-card__name">Original {part.displayName}</div>
            <div className="part-card__desc">Stock factory part — restore to default</div>
            <div className="part-card__tags">
              <span className="part-card__tag part-card__tag--oem">OEM</span>
            </div>
          </div>
        </div>

        {filtered.map((catalogPart) => (
          <div
            key={catalogPart.id}
            className={`part-card ${part.replacementPart === catalogPart.id ? 'part-card--active' : ''}`}
            onClick={() => applyReplacement(selectedPart, catalogPart.id)}
          >
            <div 
              className="part-card__image" 
              style={{ 
                background: styleColors[catalogPart.style] || 'var(--bg-elevated)',
                fontSize: '1.8rem',
              }}
            >
              {catalogPart.icon}
            </div>
            <div className="part-card__info">
              <div className="part-card__name">{catalogPart.name}</div>
              <div className="part-card__desc">{catalogPart.description}</div>
              <div className="part-card__tags">
                <span className={`part-card__tag part-card__tag--${catalogPart.style}`}>
                  {catalogPart.style.toUpperCase()}
                </span>
                {catalogPart.compatible && (
                  <span style={{
                    padding: '2px 6px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: 10,
                    background: 'rgba(16, 185, 129, 0.1)',
                    color: 'var(--accent-emerald)',
                    fontWeight: 600,
                  }}>
                    ✓ Compatible
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && catalogEntries.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: 'var(--space-8) var(--space-4)',
            color: 'var(--text-tertiary)',
          }}>
            <div style={{ fontSize: '2rem', marginBottom: 'var(--space-3)' }}>🔍</div>
            <div style={{ fontSize: 'var(--font-size-sm)' }}>
              No aftermarket parts found for {part.displayName} yet.
            </div>
            <div style={{ fontSize: 'var(--font-size-xs)', marginTop: 'var(--space-2)' }}>
              Connect the AI engine to generate custom alternatives.
            </div>
          </div>
        )}
      </div>

      {/* Order CTA */}
      {catalogEntries.length > 0 && (
        <div style={{
          padding: 'var(--space-4)',
          borderRadius: 'var(--radius-lg)',
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(139, 92, 246, 0.08))',
          border: '1px solid rgba(59, 130, 246, 0.15)',
          textAlign: 'center',
        }}>
          <div style={{ 
            fontSize: 'var(--font-size-sm)', 
            fontWeight: 600,
            marginBottom: 'var(--space-2)',
          }}>
            Ready to order?
          </div>
          <div style={{ 
            fontSize: 'var(--font-size-xs)', 
            color: 'var(--text-tertiary)',
            marginBottom: 'var(--space-3)',
          }}>
            Find local shops that carry these parts
          </div>
          <button className="btn btn--primary" style={{ width: '100%', justifyContent: 'center' }}>
            🏪 Find Local Shops
          </button>
        </div>
      )}
    </div>
  );
}
