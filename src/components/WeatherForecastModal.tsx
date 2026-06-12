import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Clock, CalendarDays, Wind, Droplets, CloudRain, Sun, Cloud, CloudFog, CloudLightning, Snowflake, Map } from 'lucide-react';
import { getWeatherFromCoords, getUserLocation, getLocationNameFromCoords, WeatherData } from '../lib/weatherService';
import './WeatherForecastModal.css';

interface WeatherForecastModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWeatherLoaded?: (data: WeatherData) => void;
}

const getWeatherIcon = (condition: string, size = 24) => {
  const c = condition.toLowerCase();
  if (c.includes('clear')) return <Sun size={size} color="#FFD700" />;
  if (c.includes('partly')) return <CloudSun size={size} color="#FFD700" />;
  if (c.includes('cloud')) return <Cloud size={size} color="#A0AAB2" />;
  if (c.includes('rain') || c.includes('drizzle') || c.includes('showers')) return <CloudRain size={size} color="#4DA8DA" />;
  if (c.includes('thunder')) return <CloudLightning size={size} color="#8A2BE2" />;
  if (c.includes('snow')) return <Snowflake size={size} color="#FFFFFF" />;
  if (c.includes('fog')) return <CloudFog size={size} color="#D3D3D3" />;
  return <Sun size={size} color="#FFD700" />;
};

// Also import CloudSun locally since it's not exported from lucide above directly if we want a custom color
const CloudSun = ({ size, color }: any) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v2"></path>
      <path d="M5.22 5.22l1.42 1.42"></path>
      <path d="M20 12h2"></path>
      <path d="M17.36 17.36l1.42 1.42"></path>
      <path d="M12 20v2"></path>
      <path d="M6.64 17.36l-1.42 1.42"></path>
      <path d="M2 12h2"></path>
      <path d="M5.22 8.78l1.42-1.42"></path>
      <path d="M16 14A4 4 0 0 0 8 14"></path>
    </svg>
  );
};


export const WeatherForecastModal: React.FC<WeatherForecastModalProps> = ({ isOpen, onClose, onWeatherLoaded }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadWeather();
    }
  }, [isOpen]);

  const loadWeather = async () => {
    setLoading(true);
    setError(null);
    try {
      const coords = await getUserLocation();
      const locationName = await getLocationNameFromCoords(coords.lat, coords.lon);
      const weatherData = await getWeatherFromCoords(coords.lat, coords.lon, locationName);
      setData(weatherData);
      if (onWeatherLoaded) {
        onWeatherLoaded(weatherData);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load weather forecast.");
    } finally {
      setLoading(false);
    }
  };

  const getBackgroundClass = () => {
    if (!data) return 'day-clear';
    const isDay = data.current.isDay;
    const cond = data.current.condition.toLowerCase();
    const isCloudy = cond.includes('cloud') || cond.includes('rain') || cond.includes('snow') || cond.includes('fog');
    return isDay 
      ? (isCloudy ? 'day-cloudy' : 'day-clear')
      : (isCloudy ? 'night-cloudy' : 'night-clear');
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: 'numeric' });
  };

  const formatDay = (date: Date, index: number) => {
    if (index === 0) return 'Today';
    return date.toLocaleDateString([], { weekday: 'short' });
  };

  // Find overall min/max for the 10-day period to scale the bars
  const overallMin = data ? Math.min(...data.daily.map(d => d.low)) : 0;
  const overallMax = data ? Math.max(...data.daily.map(d => d.high)) : 100;
  const tempRange = overallMax - overallMin || 1;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="weather-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div 
            className={`weather-modal-content ${getBackgroundClass()}`}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="weather-modal-close" onClick={onClose}>
              <X size={20} />
            </button>

            {loading ? (
              <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
                <div className="loader" style={{ borderTopColor: 'var(--primary)', width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.2)', borderTop: '3px solid #fff', animation: 'spin 1s linear infinite' }}></div>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                <p>Getting local weather...</p>
              </div>
            ) : error || !data ? (
              <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center' }}>
                <p>{error || "Unable to load weather."}</p>
                <button onClick={loadWeather} style={{ background: 'var(--primary)', border: 'none', padding: '8px 16px', borderRadius: '8px', color: '#fff', marginTop: 16 }}>Retry</button>
              </div>
            ) : (
              <>
                <div className="weather-modal-header">
                  <h2 className="weather-location-title">
                    <MapPin size={24} />
                    {data.locationName}
                  </h2>
                  <h1 className="weather-huge-temp">
                    {data.current.temp}°
                  </h1>
                  <div className="weather-current-condition">
                    {data.current.condition}
                  </div>
                  <p className="weather-high-low">
                    H:{data.current.high}° L:{data.current.low}°
                  </p>
                </div>

                <div className="weather-modal-scroll-area">
                  {/* Hourly Forecast */}
                  <div className="weather-hourly-container">
                    <h3 className="weather-hourly-header">
                      <Clock size={16} /> 24-Hour Forecast
                    </h3>
                    <div className="weather-hourly-scroll">
                      {data.hourly.map((h, i) => (
                        <div key={i} className="hourly-item">
                          <span className="hourly-time">{i === 0 ? 'Now' : formatTime(h.time)}</span>
                          {getWeatherIcon(h.condition, 24)}
                          <span className="hourly-temp">{h.temp}°</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 10-Day Forecast */}
                  <div className="weather-daily-container">
                    <h3 className="weather-daily-header">
                      <CalendarDays size={16} /> 10-Day Forecast
                    </h3>
                    <div className="weather-daily-list">
                      {data.daily.map((d, i) => {
                        const leftPercent = ((d.low - overallMin) / tempRange) * 100;
                        const widthPercent = ((d.high - d.low) / tempRange) * 100;
                        
                        return (
                          <div key={i} className="daily-item">
                            <div className="daily-day">{formatDay(d.date, i)}</div>
                            <div className="daily-icon">
                              {getWeatherIcon(d.condition, 20)}
                            </div>
                            <div className="daily-temps">
                              <span className="daily-temp-min">{d.low}°</span>
                              <div className="daily-temp-bar-container">
                                <div 
                                  className="daily-temp-bar" 
                                  style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                                />
                              </div>
                              <span className="daily-temp-max">{d.high}°</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Additional Details */}
                  <div className="weather-details-modal-grid">
                    <div className="weather-detail-card">
                      <div className="weather-detail-title"><Wind size={16} /> Wind</div>
                      <div className="weather-detail-value">{data.current.wind} mph</div>
                    </div>
                    <div className="weather-detail-card">
                      <div className="weather-detail-title"><Droplets size={16} /> Humidity</div>
                      <div className="weather-detail-value">{data.current.humidity}%</div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
