import React, { useState } from 'react';
import { 
  Home, 
  MapPin, 
  Search, 
  Filter, 
  Bed, 
  Bath, 
  Square, 
  Heart,
  Calculator,
  Building2,
  Loader2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { SETX_COUNTY_LIST } from '../utils/geo';
import './HomesView.css';
import luxuryHome from '../assets/luxury_home.png';

interface Listing {
  id: string;
  title: string;
  price: string;
  location: string;
  beds: number;
  baths: number;
  sqft: string;
  type: string;
  image: string;
  isNew?: boolean;
}

const LISTINGS: Listing[] = [
  {
    id: '1',
    title: 'Modern Waterfront Villa',
    price: '$745,000',
    location: 'Lumberton, TX',
    beds: 4,
    baths: 3,
    sqft: '3,200',
    type: 'Single Family',
    image: luxuryHome,
    isNew: true
  },
  {
    id: '2',
    title: 'Luxury Downtown Loft',
    price: '$320,000',
    location: 'Beaumont, TX',
    beds: 2,
    baths: 2,
    sqft: '1,500',
    type: 'Condo',
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: '3',
    title: 'Spacious Ranch Home',
    price: '$450,000',
    location: 'Sour Lake, TX',
    beds: 3,
    baths: 2.5,
    sqft: '2,800',
    type: 'Ranch',
    image: 'https://images.unsplash.com/photo-1500315331616-db4f707c24d1?auto=format&fit=crop&w=600&q=80'
  }
];

export const HomesView: React.FC<{ activeTab?: number; user?: any; scope?: string }> = ({ activeTab = 0, user: propUser, scope = 'national' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [properties, setProperties] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [escalatedScope, setEscalatedScope] = useState<string | null>(null);
  
  const { user: contextUser, theme } = useApp();
  const user = propUser || contextUser;
  const isSETX = theme.startsWith('setx-');

  React.useEffect(() => {
    fetchProperties();
  }, [scope, user]);

  const fetchProperties = async () => {
    setIsLoading(true);
    let selectString = `*, seller:profiles!owner_id(community, county, state, country)`;
    const needsGeoFilter = user && scope !== 'national';
    if (needsGeoFilter) {
      selectString = `*, seller:profiles!owner_id!inner(community, county, state, country)`;
    }

    let query = supabase.from('properties').select(selectString).order('created_at', { ascending: false }).limit(20);

    if (needsGeoFilter) {
      if (scope === 'city') query = query.eq('seller.community', user.community);
      else if (scope === 'county') {
        if (isSETX) {
          query = query.in('seller.county', SETX_COUNTY_LIST);
        } else {
          query = query.eq('seller.county', user.county);
        }
      }
      else if (scope === 'state') query = query.eq('seller.state', user.state);
    }

    const { data, error } = await query;
    let fetchedProperties = data || [];
    let currentEscalation: string | null = null;

    if (needsGeoFilter && fetchedProperties.length < 3 && scope !== 'national') {
      const escalationMap: Record<string, { nextScope: string; filterKey: string; filterValue: string; label: string }> = {
        city: { nextScope: 'county', filterKey: 'seller.county', filterValue: user.county, label: `${user.county || 'your'} County` },
        county: { nextScope: 'state', filterKey: 'seller.state', filterValue: user.state, label: user.state || 'your state' },
        state: { nextScope: 'national', filterKey: '', filterValue: '', label: 'nationwide' },
      };
      const esc = escalationMap[scope];
      if (esc && esc.filterValue) {
        let escQuery = supabase.from('properties').select(`*, seller:profiles!owner_id!inner(community, county, state, country)`).order('created_at', { ascending: false }).limit(20);
        if (esc.nextScope !== 'national') escQuery = escQuery.eq(esc.filterKey, esc.filterValue);
        const { data: escData } = await escQuery;
        if (escData && escData.length > 0) {
          const existingIds = new Set(fetchedProperties.map((p: any) => p.id));
          const newProperties = escData.filter((p: any) => !existingIds.has(p.id));
          fetchedProperties = [...fetchedProperties, ...newProperties];
          currentEscalation = esc.label;
        }
      }
    }

    if (!error) {
      setProperties(fetchedProperties.length > 0 ? fetchedProperties : LISTINGS);
      setEscalatedScope(currentEscalation);
    } else {
      setProperties(LISTINGS);
      setEscalatedScope(null);
    }
    setIsLoading(false);
  };

  const renderHome = () => (
    <>
      <div className="listings-scroll">
        <div className="section-title">
          <h2>Featured Listings</h2>
          <span>{properties.length} Homes Found</span>
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
            <span>Expanded to <strong style={{ color: 'var(--primary)' }}>{escalatedScope}</strong> — not enough local properties yet</span>
          </div>
        )}

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px', width: '100%' }}>
            <Loader2 className="animate-spin" size={32} color="var(--primary)" />
          </div>
        ) : (
        <div className="listings-grid">
          {properties.map((home: any) => (
            <div key={home.id} className="home-card glass">
              <div className="home-image">
                <div className="home-image-inner" style={{ backgroundImage: `url(${home.image})` }}></div>
                {home.isNew && <span className="new-badge">NEW</span>}
                <button className="favorite-btn"><Heart size={18} /></button>
                <div className="price-tag">{home.price}</div>
              </div>
              <div className="home-body">
                <h3 className="home-title">{home.title}</h3>
                <div className="home-loc">
                  <MapPin size={14} /> {home.location}
                </div>
                <div className="home-specs">
                  <span><Bed size={14} /> {home.beds}</span>
                  <span><Bath size={14} /> {home.baths}</span>
                  <span><Square size={14} /> {home.sqft}</span>
                </div>
                <div className="home-footer">
                  <span className="home-type">{home.type}</span>
                  <button className="contact-agent">Contact</button>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>

      <div className="homes-tools-section">
        <h2>Real Estate Tools</h2>
        <div className="homes-tools-grid">
          <div className="h-tool-card glass">
            <Calculator size={24} />
            <div>
              <h4>Mortgage Calculator</h4>
              <p>Estimate your monthly payments.</p>
            </div>
          </div>
          <div className="h-tool-card glass">
            <Building2 size={24} />
            <div>
              <h4>Agent Directory</h4>
              <p>Work with local SETX experts.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  const renderSearch = () => (
    <div className="homes-content-v">
      <div className="section-title"><h2>Advanced Search</h2></div>
      <div className="listings-grid full">
        {[...properties, ...properties].map((h: any, i) => (
          <div key={`${h.id}-${i}`} className="home-card glass">
             <div className="home-image" style={{ height: 120 }}>
               <div className="home-image-inner" style={{ backgroundImage: `url(${h.image})` }}></div>
               <div className="price-tag mini">{h.price}</div>
             </div>
             <div className="home-body mini">
               <h4>{h.title}</h4>
               <p>{h.location}</p>
             </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSaved = () => (
    <div className="homes-content-v">
      <div className="section-title"><h2>Saved Properties</h2></div>
      <div className="empty-state glass">
        <Heart size={48} color="#ef4444" />
        <h3>No saved homes</h3>
        <p>Tap the heart icon on any listing to save it here.</p>
      </div>
    </div>
  );

  const renderFinance = () => (
    <div className="homes-content-v">
      <div className="section-title"><h2>Mortgage Finance</h2></div>
      <div className="finance-card glass">
        <div className="f-row"><span>Home Price</span><strong>$450,000</strong></div>
        <div className="f-row"><span>Down Payment</span><strong>$90,000 (20%)</strong></div>
        <div className="f-row"><span>Interest Rate</span><strong>6.8%</strong></div>
        <div className="f-divider" />
        <div className="f-total">
          <span>Est. Monthly Payment</span>
          <h3>$2,642 / mo</h3>
        </div>
        <button className="apply-btn">Get Pre-Approved</button>
      </div>
    </div>
  );

  const renderAgent = () => (
    <div className="homes-content-v">
      <div className="section-title"><h2>Local Experts</h2></div>
      <div className="agent-list">
        {['Mike Henderson', 'Sarah Jenkins', 'Robert Miller'].map(a => (
          <div key={a} className="agent-card-h glass">
            <div className="a-img-placeholder">{a.charAt(0)}</div>
            <div className="a-info">
              <h4>{a}</h4>
              <p>Senior Real Estate Consultant</p>
              <span>SETX 360 Verified</span>
            </div>
            <button className="a-chat-btn"><Search size={16} /></button>
          </div>
        ))}
      </div>
    </div>
  );

  const content = () => {
    switch (activeTab) {
      case 0: return renderHome();
      case 1: return renderSearch();
      case 2: return renderSaved();
      case 3: return renderFinance();
      case 4: return renderAgent();
      default: return renderHome();
    }
  };

  return (
    <div className="homes-container">
      <header className="homes-header">
        <div className="title-section">
          <h1>Real Estate</h1>
          <p>Find your place in Southeast Texas.</p>
        </div>

        <div className="homes-search-bar glass">
          <Search size={20} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search by city, neighborhood, or ZIP"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="filter-btn"><Filter size={18} /></button>
        </div>

        <div className="homes-quick-filters">
          <button className="q-pill active">Buy</button>
          <button className="q-pill">Rent</button>
          <button className="q-pill">Sell</button>
          <div className="v-divider" />
          <button className="q-pill">Price</button>
          <button className="q-pill">Beds</button>
          <button className="q-pill">Type</button>
        </div>
      </header>
      {content()}
      <div className="homes-fab">
        <button className="list-property-btn">
          <Home size={20} /> List Property
        </button>
      </div>
    </div>
  );
};
