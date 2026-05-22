import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Store, Navigation, Camera, AlertCircle } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import './ARDiscoveryMode.css';

interface ARDiscoveryModeProps {
  onClose: () => void;
}

export const ARDiscoveryMode: React.FC<ARDiscoveryModeProps> = ({ onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const { error: toastError, info } = useToast();

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasPermission(true);
        info('AR Mode Active: Scanning environment...');
      } catch (err: any) {
        setHasPermission(false);
        setErrorMsg('Camera access denied or unavailable. Please check permissions.');
        toastError('Failed to access camera for AR mode.');
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [toastError, info]);

  const mockLocations = [
    { id: 1, name: "Luigi's Italian", distance: "0.2 mi", category: "Restaurant", delay: 1 },
    { id: 2, name: "SETX Artisan Goods", distance: "0.4 mi", category: "Retail", delay: 3 },
    { id: 3, name: "Local Coffee Roasters", distance: "0.1 mi", category: "Cafe", delay: 2 },
  ];

  return (
    <div className="ar-mode-overlay fade-in">
      {/* Live Camera Feed Background */}
      <div className="ar-video-container">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="ar-camera-feed"
        />
      </div>

      {/* AR HUD Overlay */}
      <div className="ar-hud-layer">
        <div className="ar-header">
          <div className="ar-status">
            <div className="recording-dot"></div>
            <span>LIVE AR SCAN</span>
          </div>
          <button className="close-ar-btn" onClick={onClose}><X size={24} /></button>
        </div>

        {/* Reticle / Crosshair */}
        <div className="ar-reticle">
          <div className="reticle-corner top-left"></div>
          <div className="reticle-corner top-right"></div>
          <div className="reticle-corner bottom-left"></div>
          <div className="reticle-corner bottom-right"></div>
          <div className="reticle-center"></div>
        </div>

        {/* Floating Data Cards */}
        {hasPermission === true && (
          <div className="ar-cards-container">
            {mockLocations.map((loc, i) => (
              <motion.div 
                key={loc.id}
                className="ar-floating-card"
                initial={{ opacity: 0, scale: 0.5, y: 100 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1, 
                  y: [20, -20, 20],
                  x: [0, (i % 2 === 0 ? 30 : -30), 0]
                }}
                transition={{ 
                  opacity: { delay: loc.delay, duration: 0.5 },
                  scale: { delay: loc.delay, type: 'spring' },
                  y: { duration: 6 + i, repeat: Infinity, ease: 'easeInOut' },
                  x: { duration: 8 + i, repeat: Infinity, ease: 'easeInOut' }
                }}
                style={{
                  top: `${30 + (i * 20)}%`,
                  left: `${15 + (i * 25)}%`,
                  zIndex: 10 - i
                }}
              >
                <div className="ar-card-glass">
                  <div className="ar-card-icon">
                    {loc.category === 'Restaurant' ? <Store size={20} /> : <MapPin size={20} />}
                  </div>
                  <div className="ar-card-info">
                    <h4>{loc.name}</h4>
                    <p>{loc.category} • <strong>{loc.distance}</strong></p>
                  </div>
                  <button className="ar-nav-btn"><Navigation size={16} /></button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Error State */}
        {hasPermission === false && (
          <div className="ar-error-state">
            <AlertCircle size={48} color="#ef4444" />
            <h2>Camera Required</h2>
            <p>{errorMsg}</p>
            <button className="ar-fallback-btn" onClick={onClose}>Return to Discover</button>
          </div>
        )}

        {/* Bottom Bar */}
        <div className="ar-footer">
          <p><Camera size={14} /> Point your camera around to discover local spots.</p>
        </div>
      </div>
    </div>
  );
};
