import React, { useState } from 'react';
import { 
  Clock, 
  Calendar, 
  Car, 
  Star, 
  ChevronRight,
  ShieldCheck,
  CreditCard,
  Plus,
  Heart
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { RidesMapView } from './RidesMapView';
import './RidesView.css';

interface RideOption {
  id: string;
  name: string;
  basePrice: number;
  time: string;
  seats: number;
  image: string;
}

const RIDE_OPTIONS: RideOption[] = [
  { id: '1', name: 'SETX Economy', basePrice: 12.50, time: '4 min', seats: 4, image: '🚗' },
  { id: '2', name: 'SETX XL', basePrice: 22.00, time: '7 min', seats: 6, image: '🚙' },
  { id: '3', name: 'SETX Black', basePrice: 35.40, time: '5 min', seats: 4, image: '🤵' },
];

export const RidesView: React.FC<{ activeTab?: number; user?: any; scope?: string }> = ({ activeTab = 0, user }) => {
  const [destination, setDestination] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [onlineFavoritesCount, setOnlineFavoritesCount] = useState(0);

  React.useEffect(() => {
    if (user) fetchFavorites();
  }, [user]);

  const fetchFavorites = async () => {
    const { data } = await supabase.from('favorite_drivers').select('driver_id').eq('user_id', user.id);
    if (data) {
      const ids = data.map(f => f.driver_id);
      setFavorites(ids);
      
      // Check if any favorite drivers are online AND in proximity
      const { data: onlineDrivers } = await supabase
        .from('driver_profiles')
        .select('id, current_lat, current_lng')
        .in('id', ids)
        .eq('is_online', true);

      if (onlineDrivers && onlineDrivers.length > 0) {
        // Simple proximity check (e.g., 5 miles / ~8km)
        // In a real app, we would get the user's current location from context or geolocation
        const userLat = 30.0802; // Default Beaumont coords
        const userLng = -94.1266;

        const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
          const R = 3958.8; // Miles
          const dLat = (lat2 - lat1) * Math.PI / 180;
          const dLon = (lon2 - lon1) * Math.PI / 180;
          const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          return R * c;
        };

        const nearbyFavorites = onlineDrivers.filter(d => {
          if (!d.current_lat || !d.current_lng) return false;
          const dist = calculateDistance(userLat, userLng, d.current_lat, d.current_lng);
          return dist <= 5; // 5 mile threshold
        });

        setOnlineFavoritesCount(nearbyFavorites.length);
      } else {
        setOnlineFavoritesCount(0);
      }
    }
  };

  const toggleFavorite = async (driverId: string) => {
    if (favorites.includes(driverId)) {
      await supabase.from('favorite_drivers').delete().eq('user_id', user.id).eq('driver_id', driverId);
      setFavorites(prev => prev.filter(id => id !== driverId));
    } else {
      await supabase.from('favorite_drivers').insert({ user_id: user.id, driver_id: driverId });
      setFavorites(prev => [...prev, driverId]);
    }
  };
  
  // Dynamic Surge Algorithm
  const currentHour = new Date().getHours();
  const isRushHour = (currentHour >= 7 && currentHour <= 9) || (currentHour >= 16 && currentHour <= 18);
  const surgeMultiplier = isRushHour ? 1.4 : 1.0;

  const handleBook = () => {
    setIsBooking(true);
    setTimeout(() => {
      setIsBooking(false);
      setIsConfirmed(true);
    }, 3000);
  };

  const renderHome = () => (
    <div className="rides-content">
      <RidesMapView />

      <div className={`rides-sheet glass ${isConfirmed ? 'minimized' : ''}`}>
        <div className="drag-handle" />
        
        {isConfirmed ? (
          <div className="confirmed-status">
            <div className="driver-anim">🚙</div>
            <div className="status-text">
              <h3>Driver is 4 min away</h3>
              <p>Silver Toyota Camry • ABC-1234</p>
            </div>
            <button className="cancel-btn" onClick={() => setIsConfirmed(false)}>Cancel</button>
          </div>
        ) : (
          <>
            <header className="sheet-header">
              <h2>Where to?</h2>
              {isRushHour && <span className="surge-badge">⚡ High Demand</span>}
            </header>

            <div className="destination-search">
              <div className="search-row">
                <div className="dot start" />
                <input type="text" placeholder="Current Location" defaultValue="505 Orleans St, Beaumont" readOnly />
              </div>
              <div className="search-row">
                <div className="dot end" />
                <input 
                  type="text" 
                  placeholder="Enter destination" 
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                />
              </div>
            </div>

            <section className="saved-locations">
              <div className="location-item">
                <div className="icon-box"><Clock size={18} /></div>
                <div className="location-info">
                  <h4>Home</h4>
                  <p>123 Pine St, Nederland</p>
                </div>
                <ChevronRight size={18} />
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );

  const renderPickup = () => (
    <div className="rides-content">
      <RidesMapView />
      <div className="pickup-footer glass">
        {isBooking ? (
          <div className="booking-loader">
            <div className="radar-circle" />
            <p>{onlineFavoritesCount > 0 
              ? `Priority Matching: Found ${onlineFavoritesCount} favorite drivers nearby...` 
              : 'Connecting to nearest driver...'}</p>
          </div>
        ) : (
          <>
            <div className="ride-selection">
              {RIDE_OPTIONS.map(option => (
                <div key={option.id} className="ride-option-card">
                  <span className="ride-emoji">{option.image}</span>
                  <div className="ride-details">
                    <h4>{option.name}</h4>
                    <p>{option.time} away • {option.seats} seats</p>
                  </div>
                  <div className="ride-price">${(option.basePrice * surgeMultiplier).toFixed(2)}</div>
                </div>
              ))}
            </div>
            <button className="confirm-ride-btn" onClick={handleBook}>Confirm SETX Ride</button>
          </>
        )}
      </div>
    </div>
  );

  const renderReserve = () => (
    <div className="rides-content">
      <header className="page-header">
        <h1>Reserve a Ride</h1>
        <p>Choose when you'd like to be picked up</p>
      </header>
      <div className="reserve-card glass">
        <div className="reserve-row">
          <Calendar size={20} />
          <span>Select Date</span>
          <Plus size={18} className="ml-auto" />
        </div>
        <div className="reserve-row">
          <Clock size={20} />
          <span>Select Time</span>
          <Plus size={18} className="ml-auto" />
        </div>
      </div>
      <section className="benefits-section">
        <h3>Why Reserve?</h3>
        <div className="benefit-item">
          <ShieldCheck size={20} />
          <p>Locked-in pricing and guaranteed driver</p>
        </div>
      </section>
    </div>
  );

  const renderActivity = () => (
    <div className="rides-content">
      <header className="page-header">
        <h1>Past Activity</h1>
      </header>
      <div className="trips-list">
        {[
          { date: 'Yesterday, 6:30 PM', dest: 'Port Arthur Event Center', price: '$18.40', car: 'Economy' },
          { date: 'Oct 22, 11:15 AM', dest: 'Beaumont Regional Airport', price: '$24.50', car: 'XL' }
        ].map((trip, i) => (
          <div key={i} className="trip-item glass">
            <div className="trip-main">
              <div className="car-icon"><Car size={20} /></div>
              <div className="trip-info">
                <h4>{trip.dest}</h4>
                <p>{trip.date} • {trip.car}</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                <span className="trip-price">{trip.price}</span>
                <button 
                  onClick={() => toggleFavorite(`driver-${i}`)} // Mock ID
                  style={{ background: 'none', border: 'none', color: favorites.includes(`driver-${i}`) ? '#ef4444' : 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <Heart size={16} fill={favorites.includes(`driver-${i}`) ? '#ef4444' : 'none'} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAccount = () => (
    <div className="rides-content">
      <div className="rides-profile glass">
        <div className="profile-header">
          <div className="profile-avatar">JS</div>
          <div className="profile-text">
            <h3>James Sullivan</h3>
            <div className="rating">
              <Star size={14} fill="var(--rides-yellow)" color="var(--rides-yellow)" /> 
              <span>4.95 Rating</span>
            </div>
          </div>
        </div>
      </div>
      <section className="settings-list">
        <div className="setting-item glass">
          <CreditCard size={20} />
          <span>Payment Methods</span>
          <ChevronRight size={18} />
        </div>
        <div className="setting-item glass">
          <ShieldCheck size={20} />
          <span>Safety Settings</span>
          <ChevronRight size={18} />
        </div>
        
        <div className="driver-onboarding-promo premium-card" style={{ marginTop: '24px', padding: '24px', textAlign: 'center', background: 'linear-gradient(135deg, rgba(250, 204, 21, 0.1), transparent)', border: '1px solid rgba(250, 204, 21, 0.3)' }}>
          <Car size={48} color="var(--rides-yellow)" style={{ margin: '0 auto 16px' }} />
          <h3>Drive for SETX Rides</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '20px' }}>Turn your miles into money. Set your own schedule and earn on your terms.</p>
          <button className="primary-btn" style={{ background: 'var(--rides-yellow)', color: '#000' }}>Apply to Drive</button>
        </div>
      </section>
    </div>
  );

  switch (activeTab) {
    case 0: return renderHome();
    case 1: return renderPickup();
    case 2: return renderReserve();
    case 3: return renderActivity();
    case 4: return renderAccount();
    default: return renderHome();
  }
};
