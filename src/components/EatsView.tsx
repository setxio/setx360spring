import React, { useState } from 'react';
import { 
  Search, 
  MapPin, 
  Clock, 
  Star, 
  ChevronRight, 
  Pizza, 
  Coffee, 
  IceCream, 
  Soup, 
  Beef,
  Flame,
  Zap,
  TicketPercent,
  Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import './EatsView.css';

const CATEGORIES = [
  { id: 'offers', label: 'Offers', icon: <TicketPercent size={24} />, color: '#ef4444' },
  { id: 'burgers', label: 'Burgers', icon: <Beef size={24} />, color: '#f59e0b' },
  { id: 'pizza', label: 'Pizza', icon: <Pizza size={24} />, color: '#f97316' },
  { id: 'asian', label: 'Asian', icon: <Soup size={24} />, color: '#10b981' },
  { id: 'coffee', label: 'Coffee', icon: <Coffee size={24} />, color: '#8b4513' },
  { id: 'steaks', label: 'Steaks', icon: <Beef size={24} />, color: '#b91c1c' },
  { id: 'desserts', label: 'Sweets', icon: <IceCream size={24} />, color: '#ec4899' },
];

const FEATURED_DEALS = [
  { id: 1, title: '50% Off First Order', subtitle: 'On all local restaurants', code: 'EATS50', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80' },
  { id: 2, title: 'Free Delivery', subtitle: 'Within 5 miles of Groves', code: 'FREEDEL', image: 'https://images.unsplash.com/photo-1476224484781-a35a17265171?auto=format&fit=crop&w=800&q=80' },
];

const RESTAURANTS = [
  {
    id: 'r1',
    name: 'SETX Burger Co.',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
    rating: 4.8,
    reviews: 120,
    time: '20-30 min',
    fee: '$0.99 Delivery Fee',
    tags: ['Burgers', 'American'],
    isPromo: true
  },
  {
    id: 'r2',
    name: 'Groves Pizza Kitchen',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80',
    rating: 4.6,
    reviews: 85,
    time: '25-35 min',
    fee: 'Free Delivery',
    tags: ['Pizza', 'Italian'],
    isPromo: false
  },
  {
    id: 'r3',
    name: 'Szechuan Express',
    image: 'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=600&q=80',
    rating: 4.5,
    reviews: 210,
    time: '15-25 min',
    fee: '$1.49 Delivery Fee',
    tags: ['Chinese', 'Spicy'],
    isPromo: false
  },
  {
    id: 'r4',
    name: 'The Daily Grind',
    image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80',
    rating: 4.9,
    reviews: 340,
    time: '10-15 min',
    fee: '$0.49 Delivery Fee',
    tags: ['Coffee', 'Bakery'],
    isPromo: true
  }
];

export const EatsView: React.FC<{ activeTab?: number; user?: any; scope?: string }> = ({ activeTab = 0, user, scope = 'city' }) => {
  const { theme } = useApp();
  const isSETX = theme.startsWith('setx-');
  const [searchQuery, setSearchQuery] = useState('');
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [escalatedScope, setEscalatedScope] = useState<string | null>(null);

  React.useEffect(() => {
    fetchRestaurants();
  }, [scope, user]);

  const fetchRestaurants = async () => {
    setIsLoading(true);
    let selectString = `*, seller:profiles!owner_id(community, county, state, country)`;
    const needsGeoFilter = user && scope !== 'national';
    if (needsGeoFilter) {
      selectString = `*, seller:profiles!owner_id!inner(community, county, state, country)`;
    }

    let query = supabase.from('stores').select(selectString).eq('category', 'Dining').order('created_at', { ascending: false }).limit(20);

    if (needsGeoFilter) {
      if (scope === 'city') query = query.eq('seller.community', user.community);
      else if (scope === 'county') query = query.eq('seller.county', user.county);
      else if (scope === 'state') query = query.eq('seller.state', user.state);
    }

    const { data, error } = await query;
    let fetchedRestaurants = data || [];
    let currentEscalation: string | null = null;

    if (needsGeoFilter && fetchedRestaurants.length < 3 && scope !== 'national') {
      const escalationMap: Record<string, { nextScope: string; filterKey: string; filterValue: string; label: string }> = {
        city: { nextScope: 'county', filterKey: 'seller.county', filterValue: user.county, label: `${user.county || 'your'} County` },
        // Hide state/national escalation for SETX project
        ...(!isSETX ? {
          county: { nextScope: 'state', filterKey: 'seller.state', filterValue: user.state, label: user.state || 'your state' },
          state: { nextScope: 'national', filterKey: '', filterValue: '', label: 'nationwide' },
        } : {}),
      };
      const esc = escalationMap[scope];
      if (esc && esc.filterValue) {
        let escQuery = supabase.from('stores').select(`*, seller:profiles!owner_id!inner(community, county, state, country)`).eq('category', 'Dining').order('created_at', { ascending: false }).limit(20);
        if (esc.nextScope !== 'national') escQuery = escQuery.eq(esc.filterKey, esc.filterValue);
        const { data: escData } = await escQuery;
        if (escData && escData.length > 0) {
          const existingIds = new Set(fetchedRestaurants.map((r: any) => r.id));
          const newRestaurants = escData.filter((r: any) => !existingIds.has(r.id));
          fetchedRestaurants = [...fetchedRestaurants, ...newRestaurants];
          currentEscalation = esc.label;
        }
      }
    }

    if (!error) {
      // Map Supabase store model to frontend Restaurant model
      const mapped = fetchedRestaurants.map((store: any) => ({
        id: store.id,
        name: store.name,
        image: store.image_url || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
        rating: store.avg_rating || 4.5,
        reviews: store.products_count || 10, // reuse products_count for mock review count
        time: '20-30 min',
        fee: '$0.99 Delivery Fee',
        tags: [store.subcategory || 'Food'],
        isPromo: store.is_verified || false
      }));
      setRestaurants(mapped.length > 0 ? mapped : RESTAURANTS);
      setEscalatedScope(currentEscalation);
    } else {
      setRestaurants(RESTAURANTS);
      setEscalatedScope(null);
    }
    setIsLoading(false);
  };
  // Derived location string based on notch/scope
  const locationDisplay = () => {
    if (scope === 'city') return user?.community || 'Groves, TX';
    if (scope === 'county') return user?.county ? `${user.county} County` : 'Jefferson County';
    if (scope === 'state') return user?.state || 'Texas';
    return 'National';
  };

  // Demonstration of content filtering based on notch
  const filteredDeals = FEATURED_DEALS.filter(deal => {
    if (scope === 'city') return true; // Show everything in city
    if (scope === 'county') return !deal.subtitle.toLowerCase().includes('groves'); // Hide city-specific deals in county view
    return true;
  });

  const renderHome = () => (
    <div className="eats-content">
      {/* Horizontal Categories */}
      <div className="categories-scroller">
        {CATEGORIES.map(cat => (
          <div key={cat.id} className="category-card">
            <div className="category-icon-wrapper" style={{ background: `${cat.color}15`, color: cat.color }}>
              {cat.icon}
            </div>
            <span className="category-label">{cat.label}</span>
          </div>
        ))}
      </div>

      {/* Promotions Slider */}
      <div className="promo-slider">
        {filteredDeals.map(deal => (
          <div key={deal.id} className="promo-card" style={{ backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.8), transparent), url(${deal.image})` }}>
            <div className="promo-info">
              <span className="promo-tag">LIMITED OFFER</span>
              <h3>{deal.title}</h3>
              <p>{deal.subtitle}</p>
              <div className="promo-code">Code: <span>{deal.code}</span></div>
            </div>
          </div>
        ))}
      </div>

      {/* Featured Section */}
      <section className="restaurants-section">
        <div className="section-header">
          <h2>Popular Near You</h2>
          <button className="view-all">See all <ChevronRight size={14} /></button>
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
            <span>Expanded to <strong style={{ color: 'var(--primary)' }}>{escalatedScope}</strong> — not enough local options yet</span>
          </div>
        )}

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px', width: '100%' }}>
            <Loader2 className="animate-spin" size={32} color="var(--primary)" />
          </div>
        ) : (
        <div className="restaurant-grid">
          {restaurants.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase())).map(restaurant => (
            <div key={restaurant.id} className="restaurant-card">
              <div className="restaurant-image-wrapper">
                <img src={restaurant.image} alt={restaurant.name} loading="lazy" />
                {restaurant.isPromo && (
                  <div className="promo-badge">
                    <Zap size={10} fill="currentColor" /> Featured
                  </div>
                )}
                <div className="time-badge">
                  <Clock size={10} /> {restaurant.time}
                </div>
              </div>
              <div className="restaurant-info">
                <div className="res-title-row">
                  <h3>{restaurant.name}</h3>
                  <div className="res-rating">
                    <Star size={12} fill="#f59e0b" color="#f59e0b" />
                    <span>{restaurant.rating}</span>
                  </div>
                </div>
                <div className="res-meta">
                  <span className="res-tags">{restaurant.tags.join(' • ')}</span>
                </div>
                <div className="res-footer">
                  <span className="res-fee">{restaurant.fee}</span>
                  <span className="res-reviews">({restaurant.reviews}+ reviews)</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}
      </section>

      {/* Fast Picks Section */}
      <section className="restaurants-section">
        <div className="section-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Flame size={20} color="#ef4444" /> Trending Now
          </h2>
        </div>
        <div className="fast-picks-scroll">
           {RESTAURANTS.slice().reverse().map(restaurant => (
             <div key={restaurant.id + '-pick'} className="fast-pick-card">
                <img src={restaurant.image} alt="" />
                <div className="fast-pick-info">
                  <span className="fast-pick-name">{restaurant.name}</span>
                  <span className="fast-pick-time">{restaurant.time}</span>
                </div>
             </div>
           ))}
        </div>
      </section>
    </div>
  );

  const renderRestaurants = () => (
    <div className="eats-content">
      <div className="section-header">
        <h2>All Restaurants</h2>
      </div>
      <div className="restaurant-grid full">
        {[...restaurants, ...restaurants].map((res, i) => (
          <div key={`${res.id}-${i}`} className="restaurant-card horizontal glass">
             <img src={res.image} alt="" />
             <div className="res-info">
               <h3>{res.name}</h3>
               <p>{res.tags.join(', ')}</p>
               <div className="res-meta-mini">
                 <Star size={12} fill="#f59e0b" color="#f59e0b" /> {res.rating} • {res.time}
               </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderOrders = () => (
    <div className="eats-content">
      <div className="section-header">
        <h2>Active Orders</h2>
      </div>
      <div className="active-order-card glass">
        <div className="order-status-badge">PREPARING</div>
        <h3>SETX Burger Co.</h3>
        <p>1x Double Smash Burger, 1x Truffle Fries</p>
        <div className="order-progress">
          <div className="progress-fill" style={{ width: '40%' }}></div>
        </div>
        <div className="order-eta">Arriving in 15-20 min</div>
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="eats-content">
      <div className="section-header">
        <h2>Recent Orders</h2>
      </div>
      <div className="history-list">
        {RESTAURANTS.map(res => (
          <div key={res.id + '-hist'} className="history-item glass">
            <div className="hist-main">
              <h4>{res.name}</h4>
              <span>$24.50 • Oct 22</span>
            </div>
            <button className="reorder-btn">Reorder</button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="eats-content">
      <div className="eats-profile-card glass">
        <div className="profile-hero-mini">
          <div className="p-avatar">JD</div>
          <h3>John Doe</h3>
          <p>Platinum Foodie</p>
        </div>
        <div className="p-stats">
          <div className="p-stat"><span>12</span><p>Orders</p></div>
          <div className="p-stat"><span>$240</span><p>Saved</p></div>
        </div>
        
        <div className="driver-onboarding-promo" style={{ marginTop: '32px', padding: '24px', borderRadius: '24px', background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), transparent)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          <Zap size={40} color="#ef4444" style={{ margin: '0 auto 12px' }} />
          <h3>Deliver for SETX Eats</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>Earn money by delivering food to your neighbors.</p>
          <button className="primary-btn" style={{ background: '#ef4444', border: 'none' }}>Apply to Deliver</button>
        </div>
      </div>
    </div>
  );

  const content = () => {
    switch (activeTab) {
      case 0: return renderHome();
      case 1: return renderRestaurants();
      case 2: return renderOrders();
      case 3: return renderHistory();
      case 4: return renderProfile();
      default: return renderHome();
    }
  };

  return (
    <div className="eats-container">
      {/* Search & Location Bar */}
      <div className="eats-header-sticky glass">
        <div className="location-selector">
          <MapPin size={14} className="location-icon" />
          <span className="current-location">Delivery to • {locationDisplay()}</span>
          <ChevronRight size={14} />
        </div>
        <div className="eats-search-bar">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Food, groceries, drinks..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      {content()}
    </div>
  );
};
