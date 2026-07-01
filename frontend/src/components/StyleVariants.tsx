import { useState } from 'react';
import { useBikeStore } from '../stores/bikeStore';
import { STYLE_VARIANTS } from '../types';

export default function StyleVariants() {
  const { selectedPart, parts, applyStyle } = useBikeStore();
  const [isGenerating, setIsGenerating] = useState(false);

  if (!selectedPart) return null;
  const part = parts[selectedPart];
  if (!part) return null;

  const variants = STYLE_VARIANTS.default;

  const handleGenerateMore = () => {
    setIsGenerating(true);
    // Simulate AI generation delay
    setTimeout(() => setIsGenerating(false), 2000);
  };

  // Placeholder gradient backgrounds for style previews
  const styleGradients: Record<string, string> = {
    sporty: 'linear-gradient(135deg, #1e3a5f, #3b82f6, #06b6d4)',
    retro: 'linear-gradient(135deg, #92400e, #d97706, #fbbf24)',
    cafe: 'linear-gradient(135deg, #1a1a1a, #4a5568, #a0aec0)',
    custom: 'linear-gradient(135deg, #5b21b6, #8b5cf6, #c084fc)',
  };

  return (
    <div className="style-variants">
      <div style={{
        fontSize: 'var(--font-size-sm)',
        color: 'var(--text-secondary)',
        lineHeight: 1.6,
      }}>
        AI-generated style alternatives for your{' '}
        <strong style={{ color: 'var(--text-primary)' }}>{part.displayName}</strong>.
        Each style modifies the part's shape and aesthetic.
      </div>

      <div className="style-variants__grid">
        {variants.map((variant) => (
          <div
            key={variant.id}
            className={`style-card ${part.styleVariant === variant.id ? 'style-card--active' : ''}`}
            onClick={() => applyStyle(selectedPart, variant.id)}
          >
            <div
              className="style-card__image"
              style={{ background: styleGradients[variant.id] || 'var(--bg-elevated)' }}
            >
              <div style={{
                fontSize: '2.5rem',
                filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))',
              }}>
                {variant.id === 'sporty' ? '🏎️' :
                 variant.id === 'retro' ? '🏍️' :
                 variant.id === 'cafe' ? '☕' : '🎨'}
              </div>
              {/* AI badge */}
              <div style={{
                position: 'absolute',
                top: 8,
                right: 8,
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(10px)',
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--accent-cyan)',
                fontWeight: 600,
              }}>
                AI Generated
              </div>
            </div>
            <div className="style-card__info">
              <div className="style-card__name">{variant.name}</div>
              <div className="style-card__tag">{variant.tag}</div>
            </div>
          </div>
        ))}

        {/* Loading cards when generating */}
        {isGenerating && [1, 2].map((i) => (
          <div key={`loading-${i}`} className="style-card">
            <div className="style-card__image style-card__image--loading" />
            <div className="style-card__info">
              <div className="style-card__name" style={{ 
                width: '60%', 
                height: 14, 
                background: 'var(--bg-elevated)', 
                borderRadius: 'var(--radius-sm)' 
              }} />
              <div className="style-card__tag" style={{ 
                width: '40%', 
                height: 10, 
                background: 'var(--bg-elevated)', 
                borderRadius: 'var(--radius-sm)',
                marginTop: 4 
              }} />
            </div>
          </div>
        ))}
      </div>

      <button
        className="btn"
        onClick={handleGenerateMore}
        disabled={isGenerating}
        style={{ width: '100%', justifyContent: 'center' }}
      >
        {isGenerating ? (
          <>⏳ Generating with AI...</>
        ) : (
          <>🤖 Generate More Variants</>
        )}
      </button>

      <div style={{
        padding: 'var(--space-3)',
        borderRadius: 'var(--radius-md)',
        background: 'rgba(59, 130, 246, 0.05)',
        border: '1px solid rgba(59, 130, 246, 0.1)',
        fontSize: 'var(--font-size-xs)',
        color: 'var(--text-tertiary)',
        lineHeight: 1.5,
      }}>
        💡 <strong>Tip:</strong> Style changes use Stable Diffusion + ControlNet 
        to generate variations that respect your bike's geometry and lighting.
        Connect your API key in settings for live generation.
      </div>
    </div>
  );
}
