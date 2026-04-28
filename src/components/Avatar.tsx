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
  // Check if we should use the image URL.
  const hasValidUrl = url && !url.includes('pravatar.cc') && url.startsWith('http');

  if (hasValidUrl) {
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
        ...style
      }}>
        <OptimizedImage
          src={url}
          alt={name || 'User Avatar'}
          style={{ 
            width: '100%', 
            height: '100%', 
            borderRadius: '50%',
            objectFit: 'cover', 
            background: 'var(--bg)'
          }}
        />
      </div>
    );
  }

  // Generate initials (Up to 2)
  const nameParts = (name || 'User').split(' ');
  const initials = nameParts.length > 1 
    ? (nameParts[0][0] + nameParts[1][0]).toUpperCase()
    : (nameParts[0][0] + (nameParts[0][1] || '')).toUpperCase();

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        background: 'transparent',
        border: '2px solid transparent',
        backgroundImage: 'linear-gradient(var(--bg), var(--bg)), linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
        backgroundOrigin: 'border-box',
        backgroundClip: 'padding-box, border-box',
        ...style
      }}
      title={name}
    >
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
};
