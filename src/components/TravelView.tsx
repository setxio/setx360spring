import React, { useState } from 'react';
import { 
  Plane, 
  Hotel, 
  MapPin, 
  Calendar, 
  Search, 
  Compass,
  Briefcase,
  ChevronRight,
  Star,
  Loader2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import './TravelView.css';
const travelHotel = '/travel_hotel.png';

interface Destination {
  id: string;
  name: string;
  location: string;
  price: string;
  rating: number;
  image: string;
  category: string;
}

const DESTINATIONS: Destination[] = [
  {
    id: '1',
    name: 'Boutique Downtown Hotel',
    location: 'Beaumont, TX',
    price: 'From $185/night',
    rating: 4.9,
    image: travelHotel,
    category: 'Stays'
  },
  {
    id: '2',
    name: 'Coastal Getaway Resort',
    location: 'Bolivar Peninsula, TX',
    price: 'From $250/night',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=600&q=80',
    category: 'Stays'
  },
  {
    id: '3',
    name: 'Sunset Bayou Cruise',
    location: 'Orange, TX',
    price: '$45/person',
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80',
    category: 'Tours'
  }
];

export const TravelView: React.FC<{ activeTab?: number; user?: any; scope?: string }> = ({ activeTab = 0, user: propUser, scope = 'national' }) => {
  const [subMode, setSubMode] = useState<'flights' | 'hotels' | 'packages'>('flights');
  const [destinations, setDestinations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [escalatedScope, setEscalatedScope] = useState<string | null>(null);

  const { user: contextUser } = useApp();
  const user = propUser || contextUser;

  React.useEffect(() => {
    // Travel doesn't have a DB table yet, but we structure the logic for when it does.
    setIsLoading(true);
    let currentEscalation: string | null = null;
    const needsGeoFilter = user && scope !== 'national';

    let fetchedDestinations = [...DESTINATIONS];

    if (needsGeoFilter) {
      if (fetchedDestinations.length < 3) {
        // Escalate
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
      setDestinations(fetchedDestinations);
      setEscalatedScope(currentEscalation);
      setIsLoading(false);
    }, 400);
  }, [scope, user]);

  const renderHome = () => (
    <>
      <header className="travel-hero">
        <div className="hero-content">
          <h1>Where to next?</h1>
          <p>Explore the world, starting from SETX.</p>
        </div>
        
        <div className="search-widget glass">
          <div className="widget-tabs">
            <button className={subMode === 'flights' ? 'active' : ''} onClick={() => setSubMode('flights')}><Plane size={18} /> Flights</button>
            <button className={subMode === 'hotels' ? 'active' : ''} onClick={() => setSubMode('hotels')}><Hotel size={18} /> Hotels</button>
            <button className={subMode === 'packages' ? 'active' : ''} onClick={() => setSubMode('packages')}><Briefcase size={18} /> Packages</button>
          </div>
          
          <div className="search-fields">
            <div className="field-group">
              <label>From</label>
              <div className="input-box">
                <MapPin size={16} />
                <input type="text" placeholder="BPT - Jack Brooks" defaultValue="Beaumont (BPT)" />
              </div>
            </div>
            <div className="field-group">
              <label>To</label>
              <div className="input-box">
                <Compass size={16} />
                <input type="text" placeholder="Destination" />
              </div>
            </div>
            <div className="field-group">
              <label>Dates</label>
              <div className="input-box">
                <Calendar size={16} />
                <input type="text" placeholder="Select dates" />
              </div>
            </div>
            <button className="search-btn-large">
              <Search size={20} />
            </button>
          </div>
        </div>
      </header>

      <section className="travel-section">
        <div className="section-header">
          <h2>Trending Destinations</h2>
          <button className="text-btn">View All <ChevronRight size={16} /></button>
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
            <span>Expanded to <strong style={{ color: 'var(--primary)' }}>{escalatedScope}</strong> — not enough local destinations yet</span>
          </div>
        )}

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px', width: '100%' }}>
            <Loader2 className="animate-spin" size={32} color="var(--primary)" />
          </div>
        ) : (
        <div className="destinations-grid">
          {destinations.map(d => (
            <div key={d.id} className="travel-card glass">
              <div className="travel-image" style={{ backgroundImage: `url(${d.image})` }}>
                <span className="travel-cat-badge">{d.category}</span>
                <div className="travel-rating">
                  <Star size={12} fill="#f59e0b" color="#f59e0b" />
                  <span>{d.rating}</span>
                </div>
              </div>
              <div className="travel-body">
                <h3>{d.name}</h3>
                <p className="travel-loc"><MapPin size={14} /> {d.location}</p>
                <div className="travel-footer">
                  <span className="travel-price">{d.price}</span>
                  <button className="book-travel-btn">Explore</button>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}
      </section>

      <section className="travel-section local-getaways">
        <div className="promo-banner glass">
          <div className="promo-text">
            <span className="badge">Local Highlight</span>
            <h3>Crystal Beach Weekend</h3>
            <p>Exclusive 20% off for SETX 360 members this month.</p>
            <button className="promo-btn">Claim Offer</button>
          </div>
          <div className="promo-icon">🌊</div>
        </div>
      </section>
    </>
  );

  const renderExplore = () => (
    <div className="travel-content-v">
      <div className="section-header"><h2>Explore Southeast Texas</h2></div>
      <div className="explore-grid">
        {['Beach Front', 'Nature Trails', 'Cajun Dining', 'Historic Sites'].map(cat => (
          <div key={cat} className="explore-item glass">
            <Compass size={24} color="var(--primary)" />
            <span>{cat}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderBookings = () => (
    <div className="travel-content-v">
      <div className="section-header"><h2>Your Bookings</h2></div>
      <div className="booking-card glass">
        <div className="b-header">
          <div className="b-tag">UPCOMING</div>
          <strong>BPT → DFW</strong>
        </div>
        <div className="b-body">
          <p>Oct 28 - Oct 30, 2023</p>
          <span>American Airlines • AA2341</span>
        </div>
        <div className="b-footer">
          <button className="b-manage-btn">Manage Trip</button>
        </div>
      </div>
    </div>
  );

  const renderGuide = () => (
    <div className="travel-content-v">
      <div className="section-header"><h2>Local Guides</h2></div>
      <div className="guide-list">
        <div className="guide-card glass">
          <div className="g-info">
            <h4>48 Hours in Beaumont</h4>
            <p>The ultimate weekend itinerary.</p>
          </div>
          <ChevronRight size={18} />
        </div>
      </div>
    </div>
  );

  const renderAccount = () => (
    <div className="travel-content-v">
      <div className="travel-account glass">
        <div className="a-header-t">
          <Briefcase size={32} color="var(--primary)" />
          <h3>Travel Profile</h3>
        </div>
        <div className="a-settings-t">
          <div className="a-item-t"><span>Passport Details</span><ChevronRight size={16} /></div>
          <div className="a-item-t"><span>Reward Points</span><strong>1,250 PTS</strong></div>
        </div>
      </div>
    </div>
  );

  const content = () => {
    switch (activeTab) {
      case 0: return renderHome();
      case 1: return renderExplore();
      case 2: return renderBookings();
      case 3: return renderGuide();
      case 4: return renderAccount();
      default: return renderHome();
    }
  };

  return (
    <div className="travel-container">
      {content()}
    </div>
  );
};
