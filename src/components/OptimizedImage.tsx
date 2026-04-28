import React, { useState, useEffect } from 'react';
import { ImageIcon } from 'lucide-react';
import './OptimizedImage.css';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallback?: React.ReactNode;
  containerClassName?: string;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({ 
  src, 
  alt, 
  fallback, 
  containerClassName = '', 
  className = '',
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Reset state if src changes
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [src]);

  return (
    <div className={`optimized-image-container ${containerClassName} ${isLoaded ? 'loaded' : 'loading'}`}>
      {!isLoaded && !hasError && (
        <div className="image-placeholder animate-pulse">
          <div className="shimmer" />
        </div>
      )}
      
      {hasError ? (
        <div className="image-error">
          {fallback || (
            <div className="default-fallback">
              <ImageIcon size={24} style={{ opacity: 0.3 }} />
            </div>
          )}
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className={`optimized-image ${className} ${isLoaded ? 'visible' : 'hidden'}`}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          loading="lazy"
          {...props}
        />
      )}
    </div>
  );
};
