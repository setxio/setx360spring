import React, { useState } from 'react';
import { 
  Heart, 
  MapPin, 
  Search, 
  Phone, 
  Activity, 
  Shield, 
  ChevronRight,
  Stethoscope,
  Pill,
  Baby,
  Thermometer,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import './CareView.css';

const CATEGORIES = [
  { id: 'general', label: 'General Care', icon: <Stethoscope size={24} />, color: '#10b981' },
  { id: 'pharmacy', label: 'Pharmacy', icon: <Pill size={24} />, color: '#3b82f6' },
  { id: 'pediatric', label: 'Pediatric', icon: <Baby size={24} />, color: '#f59e0b' },
  { id: 'urgent', label: 'Urgent Care', icon: <AlertCircle size={24} />, color: '#ef4444' },
];

const CLINICS = [
  {
    id: 'c1',
    name: 'SETX Regional Health',
    location: 'Beaumont, TX',
    rating: 4.9,
    reviews: 1240,
    time: 'Open now',
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80',
    specialties: ['Emergency', 'Surgery', 'Diagnostic'],
    isVerified: true
  },
  {
    id: 'c2',
    name: 'Port Arthur Wellness',
    location: 'Port Arthur, TX',
    rating: 4.7,
    reviews: 850,
    time: 'Opens 8 AM',
    image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=600&q=80',
    specialties: ['Primary Care', 'Wellness', 'Dental'],
    isVerified: true
  },
  {
    id: 'c3',
    name: 'Groves Community Clinic',
    location: 'Groves, TX',
    rating: 4.8,
    reviews: 320,
    time: 'Open now',
    image: 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=600&q=80',
    specialties: ['Family Medicine', 'Vaccinations'],
    isVerified: false
  }
];

export const CareView: React.FC<{ activeTab?: number; user?: any; scope?: string }> = ({ activeTab = 0, user: propUser, scope = 'national' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [clinics, setClinics] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [escalatedScope, setEscalatedScope] = useState<string | null>(null);

  const { user: contextUser } = useApp();
  const user = propUser || contextUser;

  React.useEffect(() => {
    setIsLoading(true);
    let currentEscalation: string | null = null;
    const needsGeoFilter = user && scope !== 'national';

    let fetchedClinics = [...CLINICS];

    if (needsGeoFilter) {
      if (fetchedClinics.length < 3) {
        const escalationMap: Record<string, { nextScope: string; label: string }> = {
          city: { nextScope: 'county', label: `${user.county || 'your'} County` },
          county: { nextScope: 'state', label: user.state || 'your state' },
          state: { nextScope: 'national', label: 'nationwide' },
        };
        const esc = escalationMap[scope];
        if (esc) currentEscalation = esc.label;
      }
    }

    setTimeout(() => {
      setClinics(fetchedClinics);
      setEscalatedScope(currentEscalation);
      setIsLoading(false);
    }, 400);
  }, [scope, user]);

  const renderHome = () => (
    <div className="care-content">
      <section className="emergency-grid">
        <div className="emergency-card glass critical">
          <div className="e-icon"><Phone size={24} /></div>
          <div className="e-info">
            <h4>911 Emergency</h4>
            <p>Immediate assistance</p>
          </div>
          <ChevronRight size={20} />
        </div>
        <div className="emergency-card glass">
          <div className="e-icon"><Thermometer size={24} /></div>
          <div className="e-info">
            <h4>Nurse Hotline</h4>
            <p>Speak with an expert</p>
          </div>
          <ChevronRight size={20} />
        </div>
      </section>

      <section className="care-section">
        <div className="section-header">
          <h2>Find Care by Category</h2>
        </div>
        <div className="care-categories">
          {CATEGORIES.map(cat => (
            <div key={cat.id} className="care-cat-card glass">
              <div className="cat-icon" style={{ background: `${cat.color}15`, color: cat.color }}>
                {cat.icon}
              </div>
              <span>{cat.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="care-section">
        <div className="section-header">
          <h2>Featured Healthcare Providers</h2>
          <button className="view-all">See All</button>
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
            <span>Expanded to <strong style={{ color: 'var(--primary)' }}>{escalatedScope}</strong> — not enough local care options yet</span>
          </div>
        )}

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px', width: '100%' }}>
            <Loader2 className="animate-spin" size={32} color="var(--primary)" />
          </div>
        ) : (
        <div className="clinics-list">
          {clinics.map(clinic => (
            <div key={clinic.id} className="clinic-card glass">
              <div className="clinic-image" style={{ backgroundImage: `url(${clinic.image})` }}>
                {clinic.isVerified && (
                  <div className="verified-badge">
                    <Shield size={12} fill="currentColor" /> Verified
                  </div>
                )}
              </div>
              <div className="clinic-info">
                <div className="clinic-title-row">
                  <h3>{clinic.name}</h3>
                  <div className="clinic-rating">
                    <Heart size={14} fill="#ef4444" color="#ef4444" />
                    <span>{clinic.rating}</span>
                  </div>
                </div>
                <div className="clinic-loc">
                  <MapPin size={14} /> {clinic.location}
                </div>
                <div className="clinic-tags">
                  {clinic.specialties.map((s: any) => <span key={s} className="c-tag">{s}</span>)}
                </div>
                <div className="clinic-footer">
                  <div className="clinic-status">
                    <Clock size={14} /> <span>{clinic.time}</span>
                  </div>
                  <button className="book-btn">Book Visit</button>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}
      </section>
    </div>
  );

  const renderAlerts = () => (
    <div className="care-content">
      <div className="section-header">
        <h2>Health Alerts</h2>
      </div>
      <div className="care-alerts-list">
        <div className="care-alert glass high">
          <AlertCircle size={24} />
          <div className="ca-info">
            <h4>Heat Advisory</h4>
            <p>Extreme temperatures expected in Port Arthur. Stay hydrated.</p>
          </div>
        </div>
        <div className="care-alert glass">
          <CheckCircle2 size={24} color="#10b981" />
          <div className="ca-info">
            <h4>Air Quality: Good</h4>
            <p>Conditions are optimal for outdoor activities today.</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderHotspot = () => (
    <div className="care-content">
      <div className="section-header">
        <h2>Nearby Facilities</h2>
      </div>
      <div className="hotspot-map glass">
        <div className="map-placeholder">
          <MapPin size={32} color="#ef4444" className="pin p1" />
          <MapPin size={32} color="#ef4444" className="pin p2" />
          <MapPin size={32} color="#ef4444" className="pin p3" />
          <div className="map-overlay">Interactive Map Loading...</div>
        </div>
      </div>
    </div>
  );

  const renderLog = () => (
    <div className="care-content">
      <div className="section-header">
        <h2>Wellness Log</h2>
      </div>
      <div className="wellness-tracker glass">
        <div className="tracker-header">
          <div className="tracker-title">
            <Activity size={24} color="var(--primary)" />
            <div>
              <h3>Personal Wellness</h3>
              <p>Track your health journey</p>
            </div>
          </div>
          <button className="open-tracker">New Entry</button>
        </div>
        <div className="tracker-stats">
          <div className="stat-item">
            <span className="stat-label">Daily Steps</span>
            <span className="stat-value">8,432</span>
            <div className="stat-progress"><div className="progress-bar" style={{ width: '84%' }}></div></div>
          </div>
          <div className="stat-item">
            <span className="stat-label">Sleep Quality</span>
            <span className="stat-value">Excellent</span>
            <div className="stat-progress"><div className="progress-bar" style={{ width: '92%', background: '#10b981' }}></div></div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAccount = () => (
    <div className="care-content">
      <div className="care-account-card glass">
        <div className="account-hero">
          <div className="a-avatar">JD</div>
          <h3>John Doe</h3>
          <p>Blood Type: O+</p>
        </div>
        <div className="care-settings-list">
          <div className="c-set-item glass">
            <span>Insurance Cards</span>
            <ChevronRight size={18} />
          </div>
          <div className="c-set-item glass">
            <span>Emergency Contacts</span>
            <ChevronRight size={18} />
          </div>
          <div className="c-set-item glass">
            <span>Medical History</span>
            <ChevronRight size={18} />
          </div>
        </div>
      </div>
    </div>
  );

  const content = () => {
    switch (activeTab) {
      case 0: return renderHome();
      case 1: return renderAlerts();
      case 2: return renderHotspot();
      case 3: return renderLog();
      case 4: return renderAccount();
      default: return renderHome();
    }
  };

  return (
    <div className="care-container">
      <header className="care-header">
        <div className="care-welcome">
          <div className="status-indicator">
            <Activity size={16} />
            <span>Community Health: <strong>Stable</strong></span>
          </div>
          <h1>Wellness & Care</h1>
          <p>Find trusted local care and health resources.</p>
        </div>

        <div className="care-search-bar glass">
          <Search size={20} className="search-icon" />
          <input 
            type="text" 
            placeholder="Clinics, pharmacies, or symptoms..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>
      {content()}
    </div>
  );
};
