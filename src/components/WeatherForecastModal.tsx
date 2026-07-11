import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Clock, CalendarDays, Wind, Droplets, CloudRain, Sun, Cloud, CloudFog, CloudLightning, Snowflake, Map, Thermometer, Activity, Factory, ChevronLeft } from 'lucide-react';
import { getWeatherFromCoords, getUserLocation, getLocationNameFromCoords, WeatherData, getMascotImage } from '../lib/weatherService';
import './WeatherForecastModal.css';

interface WeatherForecastModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWeatherLoaded?: (data: WeatherData) => void;
}

export const getWeatherIcon = (condition: string, size = 24) => {
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

const getAqiRating = (aqi: number) => {
  if (aqi <= 50) return { level: 1, text: 'Excellent', color: '#4CAF50' };
  if (aqi <= 100) return { level: 2, text: 'Good', color: '#8BC34A' };
  if (aqi <= 150) return { level: 3, text: 'Moderate', color: '#FFC107' };
  if (aqi <= 200) return { level: 4, text: 'Poor', color: '#FF9800' };
  return { level: 5, text: 'Bad', color: '#F44336' };
};

const getPm25Rating = (pm25: number) => {
  if (pm25 <= 12) return { level: 1, text: 'Excellent', color: '#4CAF50' };
  if (pm25 <= 35) return { level: 2, text: 'Good', color: '#8BC34A' };
  if (pm25 <= 55) return { level: 3, text: 'Moderate', color: '#FFC107' };
  if (pm25 <= 150) return { level: 4, text: 'Poor', color: '#FF9800' };
  return { level: 5, text: 'Bad', color: '#F44336' };
};

const getSo2Rating = (so2: number) => {
  if (so2 <= 20) return { level: 1, text: 'Excellent', color: '#4CAF50' };
  if (so2 <= 50) return { level: 2, text: 'Good', color: '#8BC34A' };
  if (so2 <= 100) return { level: 3, text: 'Moderate', color: '#FFC107' };
  if (so2 <= 200) return { level: 4, text: 'Poor', color: '#FF9800' };
  return { level: 5, text: 'Bad', color: '#F44336' };
};


export const WeatherForecastModal: React.FC<WeatherForecastModalProps> = ({ isOpen, onClose, onWeatherLoaded }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<WeatherData | null>(null);
  const [coords, setCoords] = useState<{lat: number, lon: number} | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRadar, setShowRadar] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadWeather();
    }
  }, [isOpen]);

  const loadWeather = async () => {
    setLoading(true);
    setError(null);
    try {
      const locationCoords = await getUserLocation();
      setCoords(locationCoords);
      const locationName = await getLocationNameFromCoords(locationCoords.lat, locationCoords.lon);
      const weatherData = await getWeatherFromCoords(locationCoords.lat, locationCoords.lon, locationName);
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
            {showRadar && coords ? (
              <div className="radar-fullscreen-view" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <button 
                    onClick={() => setShowRadar(false)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 600, padding: 0 }}
                  >
                    <ChevronLeft size={24} /> Back to Weather
                  </button>
                  <button className="weather-modal-close" onClick={onClose} style={{ position: 'relative', top: 'auto', right: 'auto', background: 'var(--glass-bg)' }}>
                    <X size={20} />
                  </button>
                </div>
                <iframe 
                  width="100%" 
                  style={{ flex: 1, borderRadius: '20px', backgroundColor: '#1E293B', border: '1px solid var(--border-color)' }}
                  src={`https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=in&metricTemp=°F&metricWind=mph&zoom=8&overlay=radar&product=radar&level=surface&lat=${coords.lat}&lon=${coords.lon}`}
                  frameBorder="0"
                ></iframe>
              </div>
            ) : (
              <>
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
                    <div 
                      className="weather-modal-header scenic-header"
                      style={{ backgroundImage: `url(${getMascotImage(data)})` }}
                    >
                  <div className="scenic-overlay"></div>
                  <div className="scenic-content">
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
                    {data.current.feelsLike !== undefined && (
                      <div className="weather-detail-card">
                        <div className="weather-detail-title"><Thermometer size={16} /> Feels Like</div>
                        <div className="weather-detail-value">{data.current.feelsLike}°</div>
                      </div>
                    )}
                    {data.current.precip !== undefined && (
                      <div className="weather-detail-card">
                        <div className="weather-detail-title"><CloudRain size={16} /> Rainfall</div>
                        <div className="weather-detail-value">{data.current.precip}"</div>
                      </div>
                    )}
                    {data.current.aqi !== undefined && (
                      <div className="weather-detail-card">
                        <div className="weather-detail-title"><Activity size={16} /> Air Quality</div>
                        <div className="weather-detail-value" style={{ color: getAqiRating(data.current.aqi).color, fontSize: '1.2rem' }}>
                          Level {getAqiRating(data.current.aqi).level}: {getAqiRating(data.current.aqi).text}
                        </div>
                      </div>
                    )}
                    {data.current.pm25 !== undefined && (
                      <div className="weather-detail-card">
                        <div className="weather-detail-title"><CloudFog size={16} /> Smoke Level</div>
                        <div className="weather-detail-value" style={{ color: getPm25Rating(data.current.pm25).color, fontSize: '1.2rem' }}>
                          Level {getPm25Rating(data.current.pm25).level}: {getPm25Rating(data.current.pm25).text}
                        </div>
                      </div>
                    )}
                    {data.current.so2 !== undefined && (
                      <div className="weather-detail-card">
                        <div className="weather-detail-title"><Factory size={16} /> Refinery Level</div>
                        <div className="weather-detail-value" style={{ color: getSo2Rating(data.current.so2).color, fontSize: '1.2rem' }}>
                          Level {getSo2Rating(data.current.so2).level}: {getSo2Rating(data.current.so2).text}
                        </div>
                      </div>
                    )}
                    <div 
                      className="weather-detail-card" 
                      onClick={() => setShowRadar(true)}
                      style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--primary, #3b82f6)', color: 'white', minHeight: '80px', gap: '4px' }}
                    >
                      <Map size={24} color="#fff" />
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff' }}>Live Radar</div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
