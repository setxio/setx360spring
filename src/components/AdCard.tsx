import { ExternalLink, Sparkles, Megaphone } from 'lucide-react';
import './AdCard.css';

interface AdCardProps {
  ad?: any;
  isPlaceholder?: boolean;
  onPromote?: () => void;
  user?: any;
}

export const AdCard: React.FC<AdCardProps> = ({ ad, isPlaceholder, onPromote, user }) => {
  if (isPlaceholder) {
    return (
      <div className="premium-card ad-card ad-placeholder" onClick={onPromote}>
        <Megaphone size={32} className="sparkle-icon" />
        <h4>Your Ad Here</h4>
        <p>Promote your business to your neighbors in <strong>{user?.community || 'your community'}</strong>.</p>
        <button className="primary-btn" style={{ width: 'auto', padding: '8px 24px' }}>
          Advertise Now
        </button>
      </div>
    );
  }

  return (
    <div className="premium-card ad-card" style={{ 
      marginBottom: '16px', 
      border: '2px solid var(--primary)',
      position: 'relative',
      overflow: 'hidden',
      cursor: 'pointer'
    }}>
      {/* Promotional Slider */}
      <div className="ad-promo-slider" onClick={(e) => {
        e.stopPropagation();
        onPromote?.();
      }}>
        <div className="ad-promo-text">
          <Megaphone size={14} /> WANT THIS SPOT? REACH {user?.community || 'LOCAL'} NEIGHBORS
        </div>
      </div>
      <div style={{ 
        position: 'absolute',
        top: '12px',
        right: '12px',
        background: 'var(--primary)',
        color: 'white',
        padding: '2px 8px',
        borderRadius: '10px',
        fontSize: '0.65rem',
        fontWeight: 800,
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        zIndex: 1
      }}>
        <Sparkles size={10} /> SPONSORED
      </div>

      <div className="ad-content">
        <h4 style={{ fontWeight: 800, marginBottom: '8px', paddingRight: '100px' }}>{ad.title}</h4>
        <p style={{ marginBottom: '16px', fontSize: '0.95rem' }}>{ad.content}</p>
        
        {ad.image_url && (
          <img 
            src={ad.image_url} 
            alt={ad.title} 
            style={{ width: '100%', borderRadius: '12px', marginBottom: '16px', maxHeight: '300px', objectFit: 'cover' }} 
          />
        )}

        {ad.target_url && (
          <a 
            href={ad.target_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="primary-btn"
            style={{ 
              width: '100%', 
              textDecoration: 'none',
              fontSize: '0.9rem',
              gap: '8px'
            }}
          >
            Learn More <ExternalLink size={16} />
          </a>
        )}
      </div>
    </div>
  );
};
