import React from 'react';
import { OptimizedImage } from './OptimizedImage';

interface AvatarProps {
  url?: string;
  name?: string;
  size?: number;
  style?: React.CSSProperties;
  className?: string;
  badges?: string[];
}

export const Avatar: React.FC<AvatarProps> = ({ url, name, size = 40, style, className, badges = [] }) => {
  // Generate initials (Up to 2)
  const nameParts = (name || 'User').split(' ');
  const initials = nameParts.length > 1 
    ? (nameParts[0][0] + nameParts[1][0]).toUpperCase()
    : (nameParts[0][0] + (nameParts[0][1] || '')).toUpperCase();

  const initialsFallback = (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-soft)',
      borderRadius: '50%'
    }}>
      <span style={{
        fontWeight: 800,
        fontSize: size * 0.4,
        background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        display: 'inline-block'
      }}>
        {initials}
      </span>
    </div>
  );

  // Check if we should use the image URL.
  const hasValidUrl = url && !url.includes('pravatar.cc') && (url.startsWith('http') || url.startsWith('/') || url.startsWith('storage'));

  return (
    <div 
      className={className}
      style={{
        position: 'relative',
        width: size,
        height: size,
        borderRadius: '50%',
        padding: '2px',
        background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        ...style
      }}
      title={name}
    >
      {hasValidUrl ? (
        <OptimizedImage
          src={url}
          alt={name || 'User Avatar'}
          fallback={initialsFallback}
          style={{ 
            width: '100%', 
            height: '100%', 
            borderRadius: '50%',
            objectFit: 'cover', 
            background: 'var(--bg)'
          }}
        />
      ) : (
        initialsFallback
      )}
      
      {/* Badges Overlay */}
      {badges && badges.length > 0 && (
        <div style={{
          position: 'absolute',
          bottom: -4,
          right: -4,
          display: 'flex',
          flexDirection: 'row-reverse',
          gap: '-4px',
          zIndex: 10
        }}>
          {badges.slice(0, 3).map((badgeId, i) => {
            const badgeIcons: Record<string, string> = {
              'gator_hunter': '🐊',
              'gulf_coast_skipper': '🚢',
              'spindletop_tycoon': '🛢️',
              'windmill_defender': '🌷',
              'golden_pecan': '🌰'
            };
            return (
              <div 
                key={`${badgeId}-${i}`}
                style={{
                  width: size * 0.35,
                  height: size * 0.35,
                  minWidth: '16px',
                  minHeight: '16px',
                  borderRadius: '50%',
                  background: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: Math.max(10, size * 0.2),
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  border: '1px solid #e5e7eb',
                  marginLeft: i > 0 ? '-6px' : '0',
                  zIndex: 10 - i
                }}
                title={badgeId.replace(/_/g, ' ')}
              >
                {badgeIcons[badgeId] || '🏆'}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
