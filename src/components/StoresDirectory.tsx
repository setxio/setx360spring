import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, Star, MapPin, Globe, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import './StoresDirectory.css';

const storeCategories = [
  'All Categories', 'Boutiques', 'Home Decor', 'Electronics',
  'Groceries', 'Services', 'Dining', 'Health & Beauty', 'Beauty', 'Arts & Crafts',
  'Clothing & Apparel', 'Jewelry & Accessories', 'Sporting Goods', 
  'Toys & Hobbies', 'Gifts & Souvenirs'
];

type LocationType = 'all' | 'physical' | 'online';

interface StoresDirectoryProps {
  user?: any;
  scope?: 'national' | 'state' | 'county' | 'city';
  onNavigateToStore?: (id: string) => void;
}

const isOpenNow = (businessHours: any): boolean => {
  if (!businessHours || typeof businessHours !== 'object') return false;
  try {
    const now = new Date();
    const day = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const hours = businessHours[day];
    if (!hours || hours.closed || !hours.open || !hours.close) return false;
    const [curH, curM] = [now.getHours(), now.getMinutes()];
    const [openH, openM] = hours.open.split(':').map(Number);
    const [closeH, closeM] = hours.close.split(':').map(Number);
    const cur = curH * 60 + curM;
    return cur >= openH * 60 + openM && cur <= closeH * 60 + closeM;
  } catch { return false; }
};

export const StoresDirectory: React.FC<StoresDirectoryProps> = ({ user, scope = 'national', onNavigateToStore }) => {
  const [stores, setStores] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [locationFilter, setLocationFilter] = useState<LocationType>('all');
  const { theme } = useApp();
  const isSETX = theme.startsWith('setx-');
  const [escalatedScope, setEscalatedScope] = useState<string | null>(null);

  useEffect(() => { fetchStores(); }, [searchQuery, selectedCategory, locationFilter, scope]);

  const fetchStores = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('stores')
        .select('*, seller:profiles!owner_id(community, county, state, country)');

      if (searchQuery) query = query.ilike('name', `%${searchQuery}%`);
      if (selectedCategory !== 'All Categories') query = query.eq('category', selectedCategory);
      if (locationFilter !== 'all') query = query.eq('type', locationFilter);

      const { data, error } = await query;
      if (error) throw error;

      let fetchedStores: any[] = data || [];

      if (user && scope !== 'national') {
        const geoFiltered = fetchedStores.filter((s: any) => {
          const seller = s.seller;
          if (!seller) return true;
          if (scope === 'city') return seller.community === user.community;
          if (scope === 'county') return seller.county === user.county;
          if (scope === 'state') return seller.state === user.state;
          return true;
        });

        if (geoFiltered.length < 3) {
          const escalationMap: Record<string, string> = {
            city: 'county',
            ...(!isSETX ? { county: 'state', state: 'national' } : {})
          };
          const labelMap: Record<string, string> = {
            city: `${user.county || 'your'} County`,
            ...(!isSETX ? {
              county: user.state || 'your state',
              state: 'nationwide'
            } : {})
          };
          const nextScope = escalationMap[scope];
          if (nextScope && nextScope !== 'national') {
            const broader = fetchedStores.filter((s: any) => {
              const seller = s.seller;
              if (!seller) return true;
              if (nextScope === 'county') return seller.county === user.county;
              if (nextScope === 'state') return seller.state === user.state;
              return true;
            });
            const existingIds = new Set(geoFiltered.map((s: any) => s.id));
            const added = broader.filter((s: any) => !existingIds.has(s.id));
            if (added.length > 0) {
              fetchedStores = [...geoFiltered, ...added];
              setEscalatedScope(labelMap[scope]);
            } else {
              fetchedStores = geoFiltered;
              setEscalatedScope(null);
            }
          } else {
            setEscalatedScope(fetchedStores.length > geoFiltered.length ? labelMap[scope] : null);
          }
        } else {
          fetchedStores = geoFiltered;
          setEscalatedScope(null);
        }
      } else {
        setEscalatedScope(null);
      }

      setStores(fetchedStores);
    } catch (err) {
      console.error('Error fetching stores:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const renderSkeletons = () => (
    <div className="stores-loading-grid">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="store-grid-card store-skeleton">
          <div className="skeleton" style={{ height: '140px' }} />
          <div style={{ padding: '40px 24px 24px' }}>
            <div className="skeleton" style={{ width: '60%', height: '24px', marginBottom: '12px' }} />
            <div className="skeleton" style={{ width: '40%', height: '14px', marginBottom: '20px' }} />
            <div className="skeleton" style={{ width: '100%', height: '14px', marginBottom: '8px' }} />
            <div className="skeleton" style={{ width: '100%', height: '14px', marginBottom: '24px' }} />
            <div className="skeleton" style={{ width: '100%', height: '40px', borderRadius: '12px' }} />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="stores-directory">
      <div className="stores-title-row">
        <h2>Merchant Directory</h2>
        <div className="location-toggle">
          {(['all', 'physical', 'online'] as LocationType[]).map(type => (
            <button key={type} className={`toggle-btn ${locationFilter === type ? 'active' : ''}`} onClick={() => setLocationFilter(type)}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="directory-controls premium-card">
        <div className="search-bar-wrapper">
          <Search size={20} className="search-icon" />
          <input type="text" placeholder="Search brands, shops, artisans..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="store-search-input" />
        </div>
        <div className="category-select-wrapper">
          <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="store-category-select">
            {storeCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <ChevronDown size={18} className="select-arrow" />
        </div>
      </div>

      {escalatedScope && (
        <div className="premium-card" style={{
          padding: '12px 20px',
          marginBottom: '32px',
          background: 'linear-gradient(135deg, rgba(var(--primary-rgb),0.1), rgba(var(--secondary-rgb),0.05))',
          border: '1px solid rgba(var(--primary-rgb),0.2)',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '0.9rem',
          color: 'var(--text)',
          fontWeight: 600
        }}>
          <MapPin size={18} color="var(--primary)" />
          <span>Showing results from <strong style={{ color: 'var(--primary)' }}>{escalatedScope}</strong> to provide more options.</span>
        </div>
      )}

      {isLoading ? renderSkeletons() : (
        <div className="stores-grid">
          {stores.length > 0 ? (
            stores.map(store => {
              const open = isOpenNow(store.business_hours);
              const isPhysical = store.type === 'physical';
              const bannerUrl = store.banner_url || store.image_url || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=200&fit=crop';

              return (
                <div key={store.id} className="store-grid-card" onClick={() => onNavigateToStore?.(store.id)}>
                  <div className="sgc-banner" style={{ backgroundImage: `url(${bannerUrl})` }}>
                    <span className="sgc-category">{store.subcategory || store.category || 'Merchant'}</span>
                    {isPhysical && (
                      <span className={`sgc-status ${open ? 'open' : 'closed'}`}>
                        {open ? 'Open Now' : 'Closed'}
                      </span>
                    )}
                    <div className="sgc-logo-wrap">
                      {store.image_url ? (
                        <img src={store.image_url} alt={store.name} className="sgc-logo" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      ) : (
                        <div className="sgc-logo-fallback">
                          {(store.name || 'S').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="sgc-body">
                    <div className="sgc-meta">
                      <div>
                        <h4 className="sgc-name">{store.name}</h4>
                        <div className="sgc-sub">
                          {isPhysical ? <MapPin size={12} /> : <Globe size={12} />}
                          <span>{isPhysical ? 'Physical Location' : 'Global Online Store'}</span>
                          <span className="sgc-dot">·</span>
                          <span>{store.products_count || 0} Products</span>
                        </div>
                      </div>
                      <div className="sgc-rating">
                        <Star size={14} fill="currentColor" />
                        <span>{Number(store.avg_rating || 0).toFixed(1)}</span>
                      </div>
                    </div>
                    {store.bio && <p className="sgc-bio">{store.bio}</p>}
                    <button className="sgc-visit-btn" onClick={e => { e.stopPropagation(); onNavigateToStore?.(store.id); }}>
                      View Shop <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="no-results premium-card" style={{ gridColumn: '1 / -1', padding: '60px', textAlign: 'center' }}>
              <h4 style={{ fontWeight: 800, marginBottom: '8px' }}>No matches found</h4>
              <p style={{ color: 'var(--text-muted)' }}>Try adjusting your search or filters to find what you're looking for.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

