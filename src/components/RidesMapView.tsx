import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { divIcon } from 'leaflet';

import 'leaflet/dist/leaflet.css';
import './RidesMapView.css';

// Custom driver icon using raw HTML/CSS for a "dot" effect or a car icon
const driverIcon = divIcon({
  className: 'driver-marker',
  html: `<div class="driver-pulse"></div><div class="driver-car">🚗</div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

const userIcon = divIcon({
  className: 'user-marker',
  html: `<div class="user-pulse"></div><div class="user-dot"></div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

interface Driver {
  id: string;
  lat: number;
  lng: number;
  heading: number;
}

export const RidesMapView: React.FC = () => {
  const [center, setCenter] = useState<[number, number]>([30.0802, -94.1266]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    // Initial geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const userLat = pos.coords.latitude;
          const userLng = pos.coords.longitude;
          setCenter([userLat, userLng]);
          generateInitialDrivers(userLat, userLng);
        },
        (err) => {
          console.log('Geolocation failed', err);
          generateInitialDrivers(30.0802, -94.1266);
        }
      );
    } else {
      generateInitialDrivers(30.0802, -94.1266);
    }
  }, []);

  const generateInitialDrivers = (lat: number, lng: number) => {
    const newDrivers: Driver[] = Array.from({ length: 5 }).map((_, i) => ({
      id: `driver-${i}`,
      lat: lat + (Math.random() - 0.5) * 0.02,
      lng: lng + (Math.random() - 0.5) * 0.02,
      heading: Math.random() * 360
    }));
    setDrivers(newDrivers);
  };

  // Simulate driver movement
  useEffect(() => {
    const interval = setInterval(() => {
      setDrivers(prev => prev.map(d => ({
        ...d,
        lat: d.lat + (Math.random() - 0.5) * 0.0002,
        lng: d.lng + (Math.random() - 0.5) * 0.0002,
        heading: d.heading + (Math.random() - 0.5) * 20
      })));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rides-map-container">
      <MapContainer 
        center={center} 
        zoom={14} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        
        <Marker position={center} icon={userIcon} />

        {drivers.map(driver => (
          <Marker 
            key={driver.id} 
            position={[driver.lat, driver.lng]} 
            icon={driverIcon}
          />
        ))}

        <RecenterMap center={center} isFirstLoad={isFirstLoad} />
      </MapContainer>
    </div>
  );
};

function RecenterMap({ center, isFirstLoad }: { center: [number, number], isFirstLoad: React.MutableRefObject<boolean> }) {
  const map = useMap();
  useEffect(() => {
    if (isFirstLoad.current) {
      map.setView(center);
      isFirstLoad.current = false;
    }
  }, [center, map]);
  return null;
}
