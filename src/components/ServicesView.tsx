import React, { useState } from 'react';
import { 
  Search, 
  MapPin, 
  Star, 
  ShieldCheck, 
  ChevronRight, 
  MessageSquare,
  Hammer,
  Zap,
  Lightbulb,
  Droplets,
  Scissors,
  Truck,
  Paintbrush,
  Filter,
  Calendar,
  Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import { SETX_COUNTY_LIST } from '../utils/geo';
import './ServicesView.css';

const CATEGORIES = [
  { id: 'home', label: 'Home Fix', icon: <Hammer size={24} />, color: '#f59e0b' },
  { id: 'electric', label: 'Electrical', icon: <Zap size={24} />, color: '#ef4444' },
  { id: 'plumbing', label: 'Plumbing', icon: <Droplets size={24} />, color: '#3b82f6' },
  { id: 'beauty', label: 'Personal', icon: <Scissors size={24} />, color: '#ec4899' },
  { id: 'moving', label: 'Delivery', icon: <Truck size={24} />, color: '#10b981' },
  { id: 'design', label: 'Creative', icon: <Paintbrush size={24} />, color: '#8b5cf6' },
];

const SERVICES = [
  {
    id: 's1',
    name: 'SETX Electric Pros',
    provider: 'Mike Henderson',
    rating: 4.9,
    reviews: 420,
    price: 'From $75/hr',
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
    tags: ['Licensed', '24/7 Emergency'],
    isVerified: true
  },
  {
    id: 's2',
    name: 'Clear Flow Plumbing',
    provider: 'Sarah Chen',
    rating: 4.8,
    reviews: 215,
    price: 'Free Quote',
    image: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=600&q=80',
    tags: ['Residential', 'Commercial'],
    isVerified: true
  },
  {
    id: 's3',
    name: 'Precision Paint Co.',
    provider: 'Robert Miller',
    rating: 4.7,
    reviews: 89,
    price: 'From $250/room',
    image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80',
    tags: ['Interior', 'Exterior'],
    isVerified: false
  }
];

export const ServicesView: React.FC<{ activeTab?: number; user?: any; scope?: string }> = ({ activeTab = 0, user, scope = 'city' }) => {
  const { theme } = useApp();
  const isSETX = theme.startsWith('setx-');
  const [searchQuery, setSearchQuery] = useState('');
  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [escalatedScope, setEscalatedScope] = useState<string | null>(null);

  React.useEffect(() => {
    fetchServices();
  }, [scope, user]);

  const fetchServices = async () => {
    setIsLoading(true);
    let selectString = `*, seller:profiles!owner_id(community, county, state, country)`;
    const needsGeoFilter = user && scope !== 'national';
    if (needsGeoFilter) {
      selectString = `*, seller:profiles!owner_id!inner(community, county, state, country)`;
    }

    let query = supabase.from('stores').select(selectString).eq('category', 'Services').order('created_at', { ascending: false }).limit(20);

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
    let fetchedServices = data || [];
    let currentEscalation: string | null = null;

    if (needsGeoFilter && fetchedServices.length < 3 && scope !== 'national') {
      const escalationMap: Record<string, { nextScope: string; filterKey: string; filterValue: string; label: string }> = {
        city: { nextScope: 'county', filterKey: 'seller.county', filterValue: user.county, label: `${user.county || 'your'} County` },
        county: { nextScope: 'state', filterKey: 'seller.state', filterValue: user.state, label: user.state || 'your state' },
        state: { nextScope: 'national', filterKey: '', filterValue: '', label: 'nationwide' },
      };
      const esc = escalationMap[scope];
      if (esc && esc.filterValue) {
        let escQuery = supabase.from('stores').select(`*, seller:profiles!owner_id!inner(community, county, state, country)`).eq('category', 'Services').order('created_at', { ascending: false }).limit(20);
        if (esc.nextScope !== 'national') escQuery = escQuery.eq(esc.filterKey, esc.filterValue);
        const { data: escData } = await escQuery;
        if (escData && escData.length > 0) {
          const existingIds = new Set(fetchedServices.map((s: any) => s.id));
          const newServices = escData.filter((s: any) => !existingIds.has(s.id));
          fetchedServices = [...fetchedServices, ...newServices];
          currentEscalation = esc.label;
        }
      }
    }

    if (!error) {
      const mapped = fetchedServices.map((store: any) => ({
        id: store.id,
        name: store.name,
        provider: store.seller?.name || 'Local Pro',
        rating: store.avg_rating || 4.8,
        reviews: store.products_count || 10,
        price: 'Contact for Quote',
        image: store.image_url || 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
        tags: [store.subcategory || 'Professional'],
        isVerified: store.is_verified || false
      }));
      setServices(mapped.length > 0 ? mapped : SERVICES);
      setEscalatedScope(currentEscalation);
    } else {
      setServices(SERVICES);
      setEscalatedScope(null);
    }
    setIsLoading(false);
  };

  // Derived scope name for UI labels
  const scopeLabel = () => {
    if (scope === 'city') return user?.community || 'Groves';
    if (scope === 'county') return user?.county || 'Jefferson County';
    if (scope === 'state') return user?.state || 'Texas';
    return 'National';
  };

  const renderHome = () => (
    <div className="services-content">
      <section className="services-section">
        <div className="section-header">
          <h2>Categories</h2>
        </div>
        <div className="services-categories">
          {CATEGORIES.map(cat => (
            <div key={cat.id} className="service-cat-card glass">
              <div className="s-cat-icon" style={{ background: `${cat.color}15`, color: cat.color }}>
                {cat.icon}
              </div>
              <span>{cat.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="services-section">
        <div className="section-header">
          <h2>Recommended Pros in {scopeLabel()}</h2>
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
            <span>Expanded to <strong style={{ color: 'var(--primary)' }}>{escalatedScope}</strong> — not enough local pros yet</span>
          </div>
        )}

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px', width: '100%' }}>
            <Loader2 className="animate-spin" size={32} color="var(--primary)" />
          </div>
        ) : (
        <div className="pros-list">
          {services.map(service => (
            <div key={service.id} className="pro-card glass">
              <div className="pro-image" style={{ backgroundImage: `url(${service.image})` }}>
                {service.isVerified && (
                  <div className="v-check">
                    <ShieldCheck size={14} fill="currentColor" />
                  </div>
                )}
              </div>
              <div className="pro-details">
                <div className="pro-title-row">
                  <div>
                    <h3>{service.name}</h3>
                    <p className="pro-owner">By {service.provider}</p>
                  </div>
                  <div className="pro-rating">
                    <Star size={12} fill="#f59e0b" color="#f59e0b" />
                    <span>{service.rating}</span>
                  </div>
                </div>
                <div className="pro-tags">
                  {service.tags.map((t: string) => <span key={t} className="s-tag">{t}</span>)}
                </div>
                <div className="pro-footer">
                  <span className="pro-price">{service.price}</span>
                  <div className="pro-actions">
                    <button className="contact-icon-btn"><MessageSquare size={18} /></button>
                    <button className="hire-btn">Hire Now</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}
      </section>

      <section className="service-guarantee glass">
        <div className="guarantee-icon"><ShieldCheck size={32} color="#10b981" /></div>
        <div className="guarantee-text">
          <h3>The SETX 360 Guarantee</h3>
          <p>Every booking is protected by our professional coverage.</p>
        </div>
        <ChevronRight size={24} className="arrow" />
      </section>
    </div>
  );

  const renderPros = () => (
    <div className="services-content">
      <div className="section-header">
        <h2>Top Rated Pros</h2>
      </div>
      <div className="pros-list">
        {[...services, ...services].map((s, i) => (
          <div key={`${s.id}-${i}`} className="pro-card-mini glass">
             <div className="p-mini-img" style={{ backgroundImage: `url(${s.image})` }} />
             <div className="p-mini-info">
               <h4>{s.name}</h4>
               <p>{s.tags[0]}</p>
               <span><Star size={12} fill="#f59e0b" color="#f59e0b" /> {s.rating}</span>
             </div>
             <button className="chat-mini-btn"><MessageSquare size={16} /></button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSchedule = () => (
    <div className="services-content">
      <div className="section-header">
        <h2>Availability</h2>
      </div>
      <div className="calendar-placeholder glass">
        <div className="cal-header">October 2026</div>
        <div className="cal-grid">
          {[...Array(31)].map((_, i) => (
            <div key={i} className={`cal-day ${i === 12 ? 'active' : ''}`}>{i + 1}</div>
          ))}
        </div>
        <p className="cal-hint">Select a date to see available pros.</p>
      </div>
    </div>
  );

  const renderBookings = () => (
    <div className="services-content">
      <div className="section-header">
        <h2>My Bookings</h2>
      </div>
      <div className="booking-card glass">
        <div className="booking-status">CONFIRMED</div>
        <h3>SETX Electric Pros</h3>
        <p><Calendar size={14} /> Oct 24, 2026 • 2:00 PM</p>
        <p><MapPin size={14} /> 123 Pine St, Groves, TX</p>
        <div className="booking-actions">
          <button className="b-btn secondary">Reschedule</button>
          <button className="b-btn primary">Manage</button>
        </div>
      </div>
    </div>
  );

  const renderAccount = () => (
    <div className="services-content">
      <div className="be-a-pro glass">
        <h3>Are you a local pro?</h3>
        <p>List your services and grow your business in Southeast Texas.</p>
        <button className="join-btn">Register as Pro</button>
      </div>
      <div className="service-history-mini">
        <h4>Recent History</h4>
        <div className="hist-item glass">
          <p>Plumbing Repair</p>
          <span>Completed • Oct 15</span>
        </div>
      </div>
    </div>
  );

  const content = () => {
    switch (activeTab) {
      case 0: return renderHome();
      case 1: return renderPros();
      case 2: return renderSchedule();
      case 3: return renderBookings();
      case 4: return renderAccount();
      default: return renderHome();
    }
  };

  return (
    <div className="services-container">
      <header className="services-header">
        <div className="services-welcome">
          <div className="expert-badge">
            <Lightbulb size={16} />
            <span>AI Matching: <strong>Active</strong></span>
          </div>
          <h1>Pro Services</h1>
          <p>Hire top-rated local experts for any task.</p>
        </div>

        <div className="services-search-bar glass">
          <Search size={20} className="search-icon" />
          <input 
            type="text" 
            placeholder="What do you need help with?" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="filter-btn"><Filter size={18} /></button>
        </div>
      </header>
      {content()}
    </div>
  );
};
