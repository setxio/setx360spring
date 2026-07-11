import React from 'react';
import { useApp } from '../../context/AppContext';
import { WeatherForecastModal } from '../WeatherForecastModal';

export const WeatherView: React.FC = () => {
  const { setEnv } = useApp();

  return (
    <div className="weather-app-container">
      <style>{`
        .weather-app-container {
          position: fixed;
          inset: 0;
          z-index: 50;
          background-color: var(--bg-primary);
        }
        .weather-app-container .weather-modal-overlay {
          position: absolute;
          background: var(--bg-primary);
          backdrop-filter: none;
          -webkit-backdrop-filter: none;
        }
        .weather-app-container .weather-modal-content {
          height: 100vh !important;
          border-radius: 0 !important;
          box-shadow: none !important;
        }
      `}</style>
      <WeatherForecastModal isOpen={true} onClose={() => setEnv('home')} />
    </div>
  );
};
