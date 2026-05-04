import React from 'react';
import { OptimizedImage } from './OptimizedImage';

interface AvatarProps {
  url?: string;
  name?: string;
  size?: number;
  style?: React.CSSProperties;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ url, name, size = 40, style, className }) => {
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
    </div>
  );
};
