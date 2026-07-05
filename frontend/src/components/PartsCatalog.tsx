import { useState } from 'react';
import { useBikeStore } from '../stores/bikeStore';
import { CATALOG_PARTS } from '../types';
import { suggestParts, type PartSuggestion } from '../services/api';

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
  const [aiSuggestions, setAiSuggestions] = useState<PartSuggestion[] | null>(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

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

      {/* AI Suggestions */}
      <div style={{
        marginTop: 'var(--space-4)',
        padding: 'var(--space-4)',
        borderRadius: 'var(--radius-lg)',
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1))',
        border: '1px solid rgba(139, 92, 246, 0.2)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
          <div>
            <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
              ✨ AI Part Suggestions
            </div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', marginTop: 2 }}>
              Powered by backend catalog API
            </div>
          </div>
          <button
            className="btn btn--primary"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
              border: 'none',
              color: 'white',
              fontSize: 'var(--font-size-xs)',
              padding: '6px 14px',
            }}
            disabled={isLoadingSuggestions}
            onClick={async () => {
              if (showSuggestions && aiSuggestions) {
                setShowSuggestions(false);
                return;
              }
              setIsLoadingSuggestions(true);
              try {
                const result = await suggestParts(selectedPart);
                setAiSuggestions(result.suggestions);
                setShowSuggestions(true);
              } catch {
                setAiSuggestions(null);
                alert('Could not fetch suggestions. Is the backend running?');
              } finally {
                setIsLoadingSuggestions(false);
              }
            }}
          >
            {isLoadingSuggestions ? '⏳ Loading…' : showSuggestions ? 'Hide' : '🔍 Find Upgrades'}
          </button>
        </div>

        {showSuggestions && aiSuggestions && aiSuggestions.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {aiSuggestions.map((s) => (
              <div
                key={s.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(139,92,246,0.15)',
                  cursor: 'pointer',
                }}
                onClick={() => applyReplacement(selectedPart, s.id)}
              >
                <div style={{ fontSize: '1.4rem' }}>{s.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>
                    {s.brand} — {s.model}
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 'var(--radius-full)', background: 'rgba(139,92,246,0.2)', color: '#c084fc' }}>
                      {s.style.toUpperCase()}
                    </span>
                    {s.compatible && (
                      <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 'var(--radius-full)', background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                        ✓ Compatible
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ fontWeight: 700, color: '#a78bfa', fontSize: 'var(--font-size-sm)', whiteSpace: 'nowrap' }}>
                  ${s.price}
                </div>
              </div>
            ))}
          </div>
        )}

        {showSuggestions && (!aiSuggestions || aiSuggestions.length === 0) && (
          <div style={{ textAlign: 'center', padding: 'var(--space-4)', color: 'var(--text-tertiary)', fontSize: 'var(--font-size-xs)' }}>
            No suggestions found for this part.
          </div>
        )}
      </div>

      {/* Order CTA */}
      {catalogEntries.length > 0 && (
        <div style={{
          marginTop: 'var(--space-4)',
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
