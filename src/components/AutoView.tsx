import React, { useState } from 'react';
import { 
  Car, 
  Search, 
  Filter, 
  Fuel, 
  Settings2, 
  Activity, 
  Calendar,
  ShieldCheck,
  TrendingUp,
  ChevronRight,
  Loader2,
  Tag
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import './AutoView.css';
import luxuryTruck from '../assets/luxury_truck.png';

interface Vehicle {
  id: string;
  name: string;
  price: string;
  year: number;
  miles: string;
  type: string;
  image: string;
  isFeatured?: boolean;
}

const VEHICLES: Vehicle[] = [
  {
    id: '1',
    name: 'SETX Electric Alpha',
    price: '$68,500',
    year: 2024,
    miles: '0',
    type: 'Truck',
    image: luxuryTruck,
    isFeatured: true
  },
  {
    id: '2',
    name: 'Modern Sedan X',
    price: '$32,000',
    year: 2023,
    miles: '12k',
    type: 'Sedan',
    image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: '3',
    name: 'Adventure SUV',
    price: '$45,000',
    year: 2023,
    miles: '5k',
    type: 'SUV',
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80'
  }
];

export const AutoView: React.FC<{ activeTab?: number; user?: any; scope?: string }> = ({ activeTab = 0, user: propUser, scope = 'national' }) => {
  const [activeType, setActiveType] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [escalatedScope, setEscalatedScope] = useState<string | null>(null);
  
  const { user: contextUser } = useApp();
  const user = propUser || contextUser;

  React.useEffect(() => {
    fetchVehicles();
  }, [scope, user]);

  const fetchVehicles = async () => {
    setIsLoading(true);
    let selectString = `*, seller:profiles!owner_id(community, county, state, country)`;
    const needsGeoFilter = user && scope !== 'national';
    if (needsGeoFilter) {
      selectString = `*, seller:profiles!owner_id!inner(community, county, state, country)`;
    }

    let query = supabase.from('vehicles').select(selectString).order('created_at', { ascending: false }).limit(20);

    if (needsGeoFilter) {
      if (scope === 'city') query = query.eq('seller.community', user.community);
      else if (scope === 'county') query = query.eq('seller.county', user.county);
      else if (scope === 'state') query = query.eq('seller.state', user.state);
    }

    const { data, error } = await query;
    let fetchedVehicles = data || [];
    let currentEscalation: string | null = null;

    if (needsGeoFilter && fetchedVehicles.length < 3 && scope !== 'national') {
      const escalationMap: Record<string, { nextScope: string; filterKey: string; filterValue: string; label: string }> = {
        city: { nextScope: 'county', filterKey: 'seller.county', filterValue: user.county, label: `${user.county || 'your'} County` },
        county: { nextScope: 'state', filterKey: 'seller.state', filterValue: user.state, label: user.state || 'your state' },
        state: { nextScope: 'national', filterKey: '', filterValue: '', label: 'nationwide' },
      };
      const esc = escalationMap[scope];
      if (esc && esc.filterValue) {
        let escQuery = supabase.from('vehicles').select(`*, seller:profiles!owner_id!inner(community, county, state, country)`).order('created_at', { ascending: false }).limit(20);
        if (esc.nextScope !== 'national') escQuery = escQuery.eq(esc.filterKey, esc.filterValue);
        const { data: escData } = await escQuery;
        if (escData && escData.length > 0) {
          const existingIds = new Set(fetchedVehicles.map((v: any) => v.id));
          const newVehicles = escData.filter((v: any) => !existingIds.has(v.id));
          fetchedVehicles = [...fetchedVehicles, ...newVehicles];
          currentEscalation = esc.label;
        }
      }
    }

    if (!error) {
      setVehicles(fetchedVehicles.length > 0 ? fetchedVehicles : VEHICLES);
      setEscalatedScope(currentEscalation);
    } else {
      setVehicles(VEHICLES);
      setEscalatedScope(null);
    }
    setIsLoading(false);
  };

  const renderHome = () => (
    <>
      <div className="auto-category-scroll">
        {['All', 'Trucks', 'SUV', 'Sedan', 'Electric', 'Performance', 'Luxury'].map(type => (
          <button 
            key={type} 
            className={`type-pill ${activeType === type ? 'active' : ''}`}
            onClick={() => setActiveType(type)}
          >
            {type}
          </button>
        ))}
      </div>

      <div className="vehicles-grid">
        <div className="section-title-row">
          <h2>Latest Arrivals</h2>
          <button className="view-link">See All Deals</button>
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
            <span>Expanded to <strong style={{ color: 'var(--primary)' }}>{escalatedScope}</strong> — not enough local vehicles yet</span>
          </div>
        )}

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px', width: '100%' }}>
            <Loader2 className="animate-spin" size={32} color="var(--primary)" />
          </div>
        ) : (
          vehicles.map((v: any) => (
          <div key={v.id} className="vehicle-card glass">
            <div className="vehicle-image">
              <img src={v.image} alt={v.name} className="home-image-inner" />
              {v.isFeatured && <span className="hot-tag"><TrendingUp size={12} /> Hot Deal</span>}
              <div className="v-price-overlay">{v.price}</div>
            </div>
            <div className="vehicle-body">
              <div className="v-header">
                <span className="v-year">{v.year}</span>
                <h3 className="v-title">{v.name}</h3>
              </div>
              <div className="v-meta">
                <span><Activity size={14} /> {v.miles} mi</span>
                <span><Fuel size={14} /> {v.type}</span>
              </div>
              <div className="v-footer">
                <div className="v-dealer">
                  <ShieldCheck size={14} className="verified-icon" />
                  <span>SETX Certified</span>
                </div>
                <button className="inquiry-btn">Message</button>
              </div>
            </div>
          </div>
        )))}
      </div>

      <div className="auto-tools-section">
        <h2>Ownership Suite</h2>
        <div className="tools-row">
          <div className="tool-box glass">
            <Tag size={24} />
            <span>Trade-In</span>
          </div>
          <div className="tool-box glass">
            <Calendar size={24} />
            <span>Service</span>
          </div>
          <div className="tool-box glass">
            <Settings2 size={24} />
            <span>VIN Log</span>
          </div>
        </div>
      </div>
    </>
  );

  const renderStock = () => (
    <div className="auto-content-v">
      <div className="section-title-row"><h2>Full Inventory</h2></div>
      <div className="vehicles-grid-h">
        {[...vehicles, ...vehicles].map((v: any, i) => (
          <div key={`${v.id}-${i}`} className="v-card-h glass">
             <div className="v-h-img" style={{ backgroundImage: `url(${v.image})` }} />
             <div className="v-h-info">
               <h4>{v.name}</h4>
               <p>{v.year} • {v.miles} mi</p>
               <strong>{v.price}</strong>
             </div>
             <ChevronRight size={18} />
          </div>
        ))}
      </div>
    </div>
  );

  const renderFinance = () => (
    <div className="auto-content-v">
      <div className="section-title-row"><h2>Auto Finance</h2></div>
      <div className="finance-card-auto glass">
        <div className="f-auto-header">
          <TrendingUp size={24} color="#10b981" />
          <h3>Rate: 4.9% APR</h3>
        </div>
        <div className="f-auto-body">
          <div className="f-item"><span>Vehicle Price</span><strong>$68,500</strong></div>
          <div className="f-item"><span>Term</span><strong>60 Months</strong></div>
          <div className="f-item"><span>Down Payment</span><strong>$10,000</strong></div>
          <div className="f-divider" />
          <div className="f-monthly">
            <span>Est. Payment</span>
            <h2>$1,102 / mo</h2>
          </div>
        </div>
        <button className="prequalify-btn">Prequalify Now</button>
      </div>
    </div>
  );

  const renderService = () => (
    <div className="auto-content-v">
      <div className="section-title-row"><h2>Service Center</h2></div>
      <div className="service-booking glass">
        <div className="s-b-header">
          <Settings2 size={24} color="var(--primary)" />
          <h3>Book Service</h3>
        </div>
        <div className="s-b-list">
          <div className="s-item"><span>Oil Change</span><strong>$59.99</strong></div>
          <div className="s-item"><span>Tire Rotation</span><strong>$29.99</strong></div>
          <div className="s-item"><span>Full Inspection</span><strong>$149.99</strong></div>
        </div>
        <button className="book-service-btn">Select Time Slot</button>
      </div>
    </div>
  );

  const renderAccount = () => (
    <div className="auto-content-v">
      <div className="auto-account-card glass">
        <div className="a-a-header">
          <Car size={32} color="var(--primary)" />
          <h3>My Garage</h3>
          <p>Manage your registered vehicles.</p>
        </div>
        <div className="garage-list">
          <div className="g-item glass">
             <div className="g-icon"><ShieldCheck size={20} /></div>
             <div className="g-info">
               <h4>2024 SETX Electric Alpha</h4>
               <p>Registered • VIN: 1XYZ...99</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );

  const content = () => {
    switch (activeTab) {
      case 0: return renderHome();
      case 1: return renderStock();
      case 2: return renderFinance();
      case 3: return renderService();
      case 4: return renderAccount();
      default: return renderHome();
    }
  };

  return (
    <div className="auto-container">
      <header className="auto-hero">
        <div className="hero-badge">Featured Dealer: SETX Ford</div>
        <h1>Your Next Drive</h1>
        <p>Explore the largest dealership network in SETX.</p>
        
        <div className="auto-search-box glass">
          <Search size={20} />
          <input 
            type="text" 
            placeholder="Search by make, model, or year" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="auto-filter-pill"><Filter size={16} /> Filters</button>
        </div>
      </header>
      {content()}
      <div className="auto-fab">
        <button className="sell-car-btn">
          <Car size={20} /> Sell Your Car
        </button>
      </div>
    </div>
  );
};
