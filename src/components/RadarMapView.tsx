import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import { Loader2, Store, Calendar, Navigation, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';
import 'leaflet/dist/leaflet.css';
import './RadarMapView.css';

// Fix for default marker icons in Leaflet with React
const storeIcon = new Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1177/1177568.png', // Or a local SVG
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

const eventIcon = new Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3702/3702202.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

interface RadarMapViewProps {
  user?: any;
  scope?: 'national' | 'state' | 'county' | 'city';
}

export const RadarMapView: React.FC<RadarMapViewProps> = ({ user, scope = 'national' }) => {
  const { theme } = useApp();
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [escalatedScope, setEscalatedScope] = useState<string | null>(null);
  const [center, setCenter] = useState<[number, number]>([30.0802, -94.1266]); // Default Beaumont, TX area
  const [zoom] = useState(13);

  useEffect(() => {
    fetchMapData();
    if (navigator.geolocation && scope === 'national') { // Only auto-recenter on national to avoid fighting the notch
      navigator.geolocation.getCurrentPosition(
        (pos) => setCenter([pos.coords.latitude, pos.coords.longitude]),
        (err) => console.log('Geolocation denied or failed', err)
      );
    }
  }, [scope]);

  const fetchMapData = async () => {
    setIsLoading(true);
    try {
      // Build queries with geo filters
      let storeQuery = supabase.from('stores').select('*, seller:profiles!owner_id!inner(community, county, state, country)');
      let eventQuery = supabase.from('posts').select('*, profiles!inner(name, community, county, state, country)').eq('type', 'event');

      if (user && scope !== 'national') {
        const isSETX = theme.startsWith('setx-');

        if (scope === 'city') {
          storeQuery = storeQuery.eq('seller.community', user.community);
          eventQuery = eventQuery.or(`location.eq."${user.community}",profiles.community.eq."${user.community}"`);
        } else if (scope === 'county') {
          if (isSETX) {
            storeQuery = storeQuery.in('seller.county', ['Jefferson', 'Orange', 'Jefferson County', 'Orange County']);
            eventQuery = eventQuery.in('profiles.county', ['Jefferson', 'Orange', 'Jefferson County', 'Orange County']);
          } else if (user.county) {
            storeQuery = storeQuery.eq('seller.county', user.county);
            eventQuery = eventQuery.eq('profiles.county', user.county);
          }
        } else if (scope === 'state') {
          storeQuery = storeQuery.eq('seller.state', user.state);
          eventQuery = eventQuery.eq('profiles.state', user.state);
        }
      }

      // Fetch with coordinates
      const { data: stores } = await storeQuery.not('lat', 'is', null).not('lng', 'is', null);
      const { data: events } = await eventQuery.not('lat', 'is', null).not('lng', 'is', null);

      const mapItems = [
        ...(stores?.map(s => ({ ...s, mapType: 'store' })) || []),
        ...(events?.map(e => ({ ...e, mapType: 'event' })) || [])
      ];

      let currentEscalation: string | null = null;
      if (user && scope !== 'national' && mapItems.length < 3) {
        const escalationMap: Record<string, { nextScope: string; label: string }> = {
          city: { nextScope: 'county', label: `${user.county || 'your'} County` },
          county: { nextScope: 'state', label: user.state || 'your state' },
          state: { nextScope: 'national', label: 'nationwide' },
        };
        const esc = escalationMap[scope];
        if (esc) currentEscalation = esc.label;
      }

      setItems(mapItems);
      setEscalatedScope(currentEscalation);
    } catch (err) {
      console.error('Error fetching map data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="map-loading">
        <Loader2 className="animate-spin" size={48} color="var(--primary)" />
        <p>Scanning the horizon...</p>
      </div>
    );
  }

  return (
    <div className="radar-map-container">
      <div className="map-overlay-header glass">
        <div className="radar-stats">
          <div className="stat-pill">
            <Store size={14} /> {items.filter(i => i.mapType === 'store').length} Businesses
          </div>
          <div className="stat-pill">
            <Calendar size={14} /> {items.filter(i => i.mapType === 'event').length} Events
          </div>
        </div>
        <button className="refresh-map-btn" onClick={fetchMapData}>
          <Navigation size={16} /> Recenter
        </button>
      </div>

      {escalatedScope && (
        <div style={{
          position: 'absolute',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          padding: '8px 16px',
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '20px',
          color: 'white',
          fontSize: '0.85rem',
          fontWeight: 600,
          whiteSpace: 'nowrap'
        }}>
          Expanded Map to {escalatedScope}
        </div>
      )}

      <MapContainer 
        center={center} 
        zoom={zoom} 
        style={{ height: '100%', width: '100%', borderRadius: '24px' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {items.map((item) => (
          <Marker 
            key={`${item.mapType}-${item.id}`}
            position={[item.lat, item.lng]}
            icon={item.mapType === 'store' ? storeIcon : eventIcon}
          >
            <Popup className="premium-popup">
              <div className="popup-content">
                {item.mapType === 'store' ? (
                  <>
                    <h4 className="store-name"><Store size={14} /> {item.name}</h4>
                    <p className="store-desc">{item.description?.substring(0, 80)}...</p>
                    <button className="popup-action">Visit Store</button>
                  </>
                ) : (
                  <>
                    <h4 className="event-name"><Calendar size={14} /> {item.profiles?.name} Event</h4>
                    <p className="event-desc">{item.content?.substring(0, 80)}...</p>
                    <div className="event-loc"><MapPin size={12} /> {item.location}</div>
                    <button className="popup-action">View Event</button>
                  </>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
        <RecenterMap center={center} />
      </MapContainer>
    </div>
  );
};

// Helper to update center programmatically
function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}
