import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Navigation, Package, CheckCircle2, Truck, Phone, MessageSquare } from 'lucide-react';
import './OrderTrackingMap.css';

interface OrderTrackingMapProps {
  orderId: string;
  productName: string;
  storeName: string;
  onClose: () => void;
}

export const OrderTrackingMap: React.FC<OrderTrackingMapProps> = ({ orderId, productName, storeName, onClose }) => {
  const [stage, setStage] = useState(0); // 0: Preparing, 1: Picked Up, 2: En Route, 3: Arriving, 4: Delivered
  
  useEffect(() => {
    // Simulate the delivery journey
    const timers = [
      setTimeout(() => setStage(1), 3000),   // 3s: Picked up
      setTimeout(() => setStage(2), 6000),   // 6s: En route
      setTimeout(() => setStage(3), 12000),  // 12s: Arriving
      setTimeout(() => setStage(4), 18000),  // 18s: Delivered
    ];
    
    return () => timers.forEach(clearTimeout);
  }, []);

  const getStatusText = () => {
    switch(stage) {
      case 0: return "Preparing your order at " + storeName;
      case 1: return "Driver picked up your order";
      case 2: return "Heading your way (ETA: 4 mins)";
      case 3: return "Driver is approaching!";
      case 4: return "Delivered safely!";
      default: return "";
    }
  };

  // Car progress percentage across the SVG map line
  const getCarProgress = () => {
    switch(stage) {
      case 0: return 0;
      case 1: return 10;
      case 2: return 50;
      case 3: return 90;
      case 4: return 100;
      default: return 0;
    }
  };

  return (
    <div className="tracking-modal-overlay">
      <motion.div 
        className="tracking-modal-content"
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25 }}
      >
        <button className="close-tracking-btn" onClick={onClose}><X size={20} /></button>
        
        <div className="tracking-header">
          <h3>Live Tracking</h3>
          <p>Order #{orderId.substring(0, 8).toUpperCase()} • {productName}</p>
        </div>

        <div className="tracking-map-container">
          {/* Mock Map Background (SVG Grid & Streets) */}
          <div className="mock-map-bg">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
                </pattern>
                <linearGradient id="route-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2563eb" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              
              {/* Route Line */}
              <path 
                d="M 50 50 Q 150 50 150 150 T 250 200 T 350 150 T 450 250" 
                fill="none" 
                stroke="rgba(59, 130, 246, 0.2)" 
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray="10 10"
              />
              
              <path 
                d="M 50 50 Q 150 50 150 150 T 250 200 T 350 150 T 450 250" 
                fill="none" 
                stroke="url(#route-gradient)" 
                strokeWidth="4"
                strokeLinecap="round"
              />

              {/* Start (Store) */}
              <circle cx="50" cy="50" r="12" fill="#ef4444" />
              <text x="50" y="45" fill="white" fontSize="20" textAnchor="middle" dominantBaseline="middle">🏢</text>
              
              {/* End (Home) */}
              <circle cx="450" cy="250" r="12" fill="#22c55e" />
              <text x="450" y="245" fill="white" fontSize="20" textAnchor="middle" dominantBaseline="middle">🏠</text>
            </svg>

            {/* The Driver Icon moving across */}
            <motion.div 
              className="live-driver-marker"
              initial={{ x: 50, y: 50 }}
              animate={
                stage === 0 ? { x: 50, y: 50 } :
                stage === 1 ? { x: 150, y: 150 } :
                stage === 2 ? { x: 250, y: 200 } :
                stage === 3 ? { x: 350, y: 150 } :
                { x: 450, y: 250 }
              }
              transition={{ duration: 2.5, ease: "easeInOut" }}
            >
              <div className="pulse-ring"></div>
              <div className="driver-car-icon">
                <Truck size={18} color="#fff" />
              </div>
            </motion.div>
          </div>
        </div>

        <div className="tracking-status-panel">
          <h2 className="status-headline">{getStatusText()}</h2>
          
          <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{ width: `${getCarProgress()}%` }}></div>
          </div>

          <div className="steps-container">
            <div className={`step-item ${stage >= 0 ? 'active' : ''}`}>
              <div className="step-icon"><Package size={16} /></div>
              <span>Preparing</span>
            </div>
            <div className={`step-item ${stage >= 1 ? 'active' : ''}`}>
              <div className="step-icon"><Truck size={16} /></div>
              <span>Picked Up</span>
            </div>
            <div className={`step-item ${stage >= 2 ? 'active' : ''}`}>
              <div className="step-icon"><Navigation size={16} /></div>
              <span>En Route</span>
            </div>
            <div className={`step-item ${stage >= 4 ? 'active' : ''}`}>
              <div className="step-icon"><CheckCircle2 size={16} /></div>
              <span>Delivered</span>
            </div>
          </div>
        </div>

        <div className="driver-info-card">
          <div className="driver-avatar-placeholder">
            <img src="https://i.pravatar.cc/150?img=11" alt="Driver" />
          </div>
          <div className="driver-details">
            <h4>Marcus T.</h4>
            <p>Local Express Courier • 4.9 ⭐</p>
          </div>
          <div className="driver-actions">
            <button className="icon-btn"><MessageSquare size={18} /></button>
            <button className="icon-btn"><Phone size={18} /></button>
          </div>
        </div>

      </motion.div>
    </div>
  );
};
