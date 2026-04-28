import React, { useState, useEffect } from 'react';
import { CloudSun, Wind, Droplets, Thermometer, Newspaper, ArrowRight, AlertTriangle, Map, Trophy, Loader2 } from 'lucide-react';
import { fetchLocalWeather, fetchLocalSports } from '../lib/admin';
import { useApp } from '../context/AppContext';
import './WeatherNewsView.css';

const NEWS_ARTICLES = [
  { id: 'n1', category: 'Jefferson', title: 'Port of Beaumont Expansion Project Hits New Milestone', source: 'Beaumont Enterprise', time: '2h ago', img: 'https://images.unsplash.com/photo-1549421263-524f2f4b304c?auto=format&fit=crop&q=80&w=600' },
  { id: 'n2', category: 'Orange', title: 'Chevron Phillips Chemical Continues Construction on Golden Triangle Polymers', source: '12NewsNow', time: '4h ago', img: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=600' },
  { id: 'n3', category: 'Regional', title: 'SETX Schools Announce New STEM Initiatives for Fall Semester', source: 'KFDM News', time: '7h ago', img: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=600' }
];

const NEWS_SOURCES = [
  { name: '12NewsNow', url: 'https://www.12newsnow.com', type: 'TV' },
  { name: 'Beaumont Enterprise', url: 'https://www.beaumontenterprise.com', type: 'Paper' },
  { name: 'KFDM / Fox 4', url: 'https://kfdm.com', type: 'TV' },
  { name: 'Port Arthur News', url: 'https://www.panews.com', type: 'Paper' },
  { name: 'Orange Leader', url: 'https://www.orangeleader.com', type: 'Paper' },
  { name: 'The Examiner', url: 'https://www.theexaminer.com', type: 'Paper' },
  { name: 'KLVI 560 AM', url: 'https://klvi.iheart.com', type: 'Radio' }
];

const FORECAST = [
  { day: 'Mon', temp: 78, icon: <CloudSun size={20} /> },
  { day: 'Tue', temp: 82, icon: <CloudSun size={20} /> },
  { day: 'Wed', temp: 75, icon: <Droplets size={20} /> },
  { day: 'Thu', temp: 72, icon: <CloudSun size={20} /> },
  { day: 'Fri', temp: 80, icon: <CloudSun size={20} /> }
];

export const WeatherNewsView: React.FC<{ activeTab?: number; user?: any; scope?: string }> = ({ user: propUser, scope = 'national' }) => {
  const [activeCounty, setActiveCounty] = useState<'Jefferson' | 'Orange'>('Jefferson');
  const [weather, setWeather] = useState<any>(null);
  const [sports, setSports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [escalatedScope, setEscalatedScope] = useState<string | null>(null);

  const { user: contextUser } = useApp();
  const user = propUser || contextUser;

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      let currentEscalation: string | null = null;
      const needsGeoFilter = user && scope !== 'national';

      if (needsGeoFilter) {
        // Mock escalation for weather since it's hardcoded to Jefferson/Orange
        const escalationMap: Record<string, { nextScope: string; label: string }> = {
          city: { nextScope: 'county', label: `${user.county || 'your'} County` },
          county: { nextScope: 'state', label: user.state || 'your state' },
          state: { nextScope: 'national', label: 'nationwide' },
        };
        const esc = escalationMap[scope];
        if (esc && (scope === 'city')) {
           currentEscalation = esc.label; // Only escalate if it's city level since we show county data
        }
      }

      const [w, s] = await Promise.all([
        fetchLocalWeather(activeCounty === 'Jefferson' ? '77701' : '77630'),
        fetchLocalSports()
      ]);
      setWeather(w);
      setSports(s);
      setEscalatedScope(currentEscalation);
      setIsLoading(false);
    }
    loadData();
  }, [activeCounty, scope, user]);

  return (
    <div className="weather-news-container">
      <div className="county-selector">
        <button 
          className={`county-btn ${activeCounty === 'Jefferson' ? 'active' : ''}`}
          onClick={() => setActiveCounty('Jefferson')}
        >
          Jefferson County
        </button>
        <button 
          className={`county-btn ${activeCounty === 'Orange' ? 'active' : ''}`}
          onClick={() => setActiveCounty('Orange')}
        >
          Orange County
        </button>
      </div>

      {escalatedScope && (
        <div style={{
          padding: '10px 16px',
          marginBottom: '16px',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(157,0,255,0.08))',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.82rem',
          color: 'var(--text-muted)',
          fontWeight: 500
        }}>
          <span>Expanded to <strong style={{ color: 'var(--primary)' }}>{escalatedScope}</strong> — viewing county weather</span>
        </div>
      )}

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px', width: '100%' }}>
          <Loader2 className="animate-spin" size={32} color="var(--primary)" />
        </div>
      ) : (
      <>
      <section className="weather-hero premium-card">
        <div className="weather-location-badge">
          <Map size={14} /> {activeCounty === 'Jefferson' ? 'Beaumont / Port Arthur, TX' : 'Orange / Vidor, TX'}
        </div>
        <div className="weather-main">
          <div className="temp-wrap">
            <h1 className="current-temp">{weather?.temp || 76}°</h1>
            <div className="weather-condition">
              <CloudSun size={32} />
              <span>{weather?.condition || 'Mostly Sunny'}</span>
            </div>
          </div>
          <div className="weather-details-grid">
            <div className="w-detail"><Wind size={16} /> {weather?.wind || 12} mph</div>
            <div className="w-detail"><Droplets size={16} /> {weather?.humidity || 45}%</div>
            <div className="w-detail"><Thermometer size={16} /> H: {weather?.high || 82}° L: {weather?.low || 68}°</div>
          </div>
        </div>
        <div className="weather-forecast">
          {FORECAST.map((f, i) => (
            <div key={i} className="forecast-item">
              <span className="f-day">{f.day}</span>
              {f.icon}
              <span className="f-temp">{f.temp}°</span>
            </div>
          ))}
        </div>
      </section>

      {/* Local Sports Highlight (New Logic) */}
      {sports.length > 0 && (
        <section className="sports-highlight">
          <div className="section-header">
            <h3 className="section-subtitle"><Trophy size={20} color="var(--admin-gold)" /> Local Sports</h3>
            <button className="view-all-btn">Full Schedule <ArrowRight size={14} /></button>
          </div>
          <div className="sports-scroll">
            {sports.map(game => (
              <div key={game.id} className="game-card glass">
                <div className="game-sport">{game.content.split('\n')[0] || 'Sport'}</div>
                <div className="game-teams">{game.content.split('\n')[1] || 'Matchup'}</div>
                <div className="game-meta">{game.event_location} • {new Date(game.event_start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="weather-alert">
        <AlertTriangle size={20} />
        <div className="alert-content">
          <h4 className="alert-title">Coastal Flood Watch</h4>
          <p className="alert-text">Jefferson and Orange County coastlines may experience minor flooding during high tide.</p>
        </div>
      </div>

      <section className="news-section">
        <div className="section-header">
          <h3 className="section-subtitle"><Newspaper size={20} /> {activeCounty} County News</h3>
          <button className="view-all-btn">View All <ArrowRight size={14} /></button>
        </div>
        <div className="news-vertical-list">
          {NEWS_ARTICLES.filter(a => a.category === activeCounty || a.category === 'Regional').map(article => (
            <div key={article.id} className="news-item premium-card" onClick={() => window.open('https://www.12newsnow.com', '_blank')}>
              <img src={article.img} alt={article.title} className="news-thumb" />
              <div className="news-meta-wrap">
                <div className="news-top-meta">
                  <span className="news-cat">{article.category}</span>
                  <span className="news-dot">•</span>
                  <span className="news-time">{article.time}</span>
                </div>
                <h4 className="news-headline">{article.title}</h4>
                <span className="news-source">{article.source}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="news-sources-directory">
          <h4 className="directory-title">Local Media Directory</h4>
          <div className="sources-scroll">
            {NEWS_SOURCES.map(source => (
              <button key={source.name} className="source-link-card" onClick={() => window.open(source.url, '_blank')}>
                <span className="source-type-tag">{source.type}</span>
                <span className="source-name">{source.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* SETX Industry & Coastal Hub */}
        <div className="industry-hub glass" style={{ marginTop: '32px', padding: '20px', borderRadius: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Wind size={24} color="var(--primary)" />
            <h4 style={{ fontWeight: 800 }}>Coastal & Industry Hub</h4>
          </div>
          <div className="industry-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="industry-card glass" style={{ padding: '12px', borderRadius: '16px', fontSize: '0.85rem' }}>
              <div style={{ fontWeight: 700, marginBottom: '4px' }}>Sabine Pass Tide</div>
              <div style={{ color: 'var(--text-muted)' }}>High: 2.4ft @ 4:12 PM</div>
            </div>
            <div className="industry-card glass" style={{ padding: '12px', borderRadius: '16px', fontSize: '0.85rem' }}>
              <div style={{ fontWeight: 700, marginBottom: '4px' }}>Refinery Status</div>
              <div style={{ color: 'var(--text-muted)' }}>All Systems Normal</div>
            </div>
            <div className="industry-card glass" style={{ padding: '12px', borderRadius: '16px', fontSize: '0.85rem' }}>
              <div style={{ fontWeight: 700, marginBottom: '4px' }}>Port of Beaumont</div>
              <div style={{ color: 'var(--text-muted)' }}>3 Vessels Docked</div>
            </div>
            <div className="industry-card glass" style={{ padding: '12px', borderRadius: '16px', fontSize: '0.85rem' }}>
              <div style={{ fontWeight: 700, marginBottom: '4px' }}>Air Quality</div>
              <div style={{ color: '#10b981' }}>Good (34 AQI)</div>
            </div>
          </div>
        </div>
      </section>
      </>
      )}
    </div>
  );
};
