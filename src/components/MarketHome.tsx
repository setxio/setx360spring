import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowRight, Plus, Star, Filter, ShoppingBag, Zap, Award, MapPin, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryKeys } from '../lib/queryKeys';
import { ProductDetailsModal } from './ProductDetailsModal';
import './MarketHome.css';

interface MarketHomeProps {
  user: any;
  scope?: 'national' | 'state' | 'county' | 'city';
  onNavigateToStore?: (id: string) => void;
}

const CATEGORIES = [
  { id: 'all', name: 'All Shops', icon: <ShoppingBag size={16} /> },
  { id: 'artisanal', name: 'Artisanal', icon: <Award size={16} /> },
  { id: 'fashion', name: 'Fashion', icon: <Zap size={16} /> },
  { id: 'home', name: 'Home & Living', icon: <Plus size={16} /> },
  { id: 'tech', name: 'Tech', icon: <Plus size={16} /> },
  { id: 'local', name: 'SETX Only', icon: <MapPin size={16} /> }
];

export const MarketHome: React.FC<MarketHomeProps> = ({ user, scope = 'national', onNavigateToStore }) => {
  const { theme } = useApp();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState('all');

  const fetchProducts = async () => {
    const needsGeoFilter = user && scope !== 'national';
    const storeJoin = needsGeoFilter
      ? 'stores!inner ( *, seller:profiles!owner_id!inner ( community, county, state, country ) )'
      : 'stores ( *, seller:profiles!owner_id ( community, county, state, country ) )';

    let query = supabase
      .from('products')
      .select(`*, ${storeJoin}`)
      .order('avg_rating', { ascending: false });

    if (needsGeoFilter) {
      const isSETX = theme.startsWith('setx-');
      if (scope === 'city' && user.community) {
        query = query.eq('stores.seller.community', user.community);
      } else if (scope === 'county') {
        if (isSETX) {
          query = query.in('stores.seller.county', ['Jefferson', 'Orange', 'Jefferson County', 'Orange County']);
        } else if (user.county) {
          query = query.eq('stores.seller.county', user.county);
        }
      } else if (scope === 'state' && user.state) {
        query = query.eq('stores.seller.state', user.state);
      }
    }

    const { data, error } = await query.limit(12);
    let fetchedProducts = data || [];

    const { data: activeAds } = await supabase
      .from('platform_ads')
      .select('*, content_product:products!content_id(*, stores(*))')
      .eq('content_type', 'product').eq('status', 'active')
      .order('budget', { ascending: false });

    if (activeAds) {
      const adProducts = activeAds.filter(ad => ad.content_product).map(ad => ({ ...ad.content_product, is_sponsored: true }));
      fetchedProducts = [...adProducts, ...fetchedProducts];
    }

    // Geo escalation: if < 3 results, widen scope
    let escalation: string | null = null;
    if (needsGeoFilter && fetchedProducts.length < 3) {
      const isSETX = theme.startsWith('setx-');
      const escalationMap: Record<string, { filterKey: string; filterValue: string; label: string }> = {
        city: { filterKey: 'stores.seller.county', filterValue: user.county, label: `${user.county || 'your'} County` },
        ...(!isSETX ? {
          county: { filterKey: 'stores.seller.state', filterValue: user.state, label: user.state || 'your state' },
        } : {}),
      };
      const esc = escalationMap[scope];
      if (esc?.filterValue) {
        const { data: escData } = await supabase.from('products')
          .select('*, stores!inner ( *, seller:profiles!owner_id!inner ( community, county, state, country ) )')
          .eq(esc.filterKey, esc.filterValue).order('avg_rating', { ascending: false }).limit(12);
        if (escData?.length) {
          const existingIds = new Set(fetchedProducts.map((p: any) => p.id));
          fetchedProducts = [...fetchedProducts, ...escData.filter((p: any) => !existingIds.has(p.id))];
          escalation = esc.label;
        }
      }
    }

    if (error) throw error;
    return { products: fetchedProducts, escalatedScope: escalation };
  };

  const { data, isLoading } = useQuery({
    queryKey: [...queryKeys.stores.list(scope), activeCategory],
    queryFn: fetchProducts,
  });

  const products = data?.products ?? [];
  const escalatedScope = data?.escalatedScope ?? null;


  const renderSkeletons = () => (
    <div className="product-premium-grid">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="product-premium-card" style={{ height: '320px' }}>
          <div className="skeleton" style={{ width: '100%', height: '220px' }} />
          <div style={{ padding: '16px' }}>
            <div className="skeleton" style={{ width: '40%', height: '12px', marginBottom: '8px' }} />
            <div className="skeleton" style={{ width: '80%', height: '16px', marginBottom: '12px' }} />
            <div className="skeleton" style={{ width: '30%', height: '20px' }} />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="market-home">
      {/* Premium Hero */}
      <div className="market-hero">
        <img 
          src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1200" 
          alt="Market Hero" 
          className="market-hero-img"
        />
        <div className="market-hero-content">
          <h2 className="fade-in">Experience Local <br/> Craftsmanship</h2>
          <p className="fade-in">Discover unique products from verified merchants in your community. Quality goods, delivered with care.</p>
          <button className="shop-now-btn fade-in">
            Shop New Arrivals <ArrowRight size={18} />
          </button>
        </div>
      </div>

      {/* Category Scroller */}
      <div className="category-scroller no-scrollbar">
        {CATEGORIES.map(cat => (
          <button 
            key={cat.id} 
            className={`category-pill ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.icon}
            {cat.name}
          </button>
        ))}
      </div>

      {/* Featured Stores Spotlight */}
      <div className="market-section-header">
        <h4>Verified Storefronts</h4>
        <div className="see-all-link" onClick={() => onNavigateToStore?.('all')}>
          View Directory <ArrowRight size={14} />
        </div>
      </div>
      
      <div className="spotlight-container no-scrollbar">
        {['Beaumont Botanicals', 'Orange Outfitters', 'Neches River Crafts'].map((name, i) => (
          <div key={name} className="store-card-premium" onClick={() => onNavigateToStore?.(`store-${i}`)}>
            <div className="store-logo-wrapper">
              {name[0]}
            </div>
            <div className="store-info">
              <h5>{name}</h5>
              <p>Verified Merchant • 4.9 <Star size={10} fill="var(--primary)" color="var(--primary)" /></p>
            </div>
            <ChevronRight size={18} style={{ marginLeft: 'auto', opacity: 0.3 }} />
          </div>
        ))}
      </div>

      <div className="market-section-header">
        <h4>Trending Products</h4>
        <div className="see-all-link">
          Show All <Filter size={14} />
        </div>
      </div>
      
      {escalatedScope && (
        <div style={{
          padding: '12px 16px',
          marginBottom: '24px',
          background: 'linear-gradient(135deg, rgba(var(--primary-rgb),0.1), rgba(var(--secondary-rgb),0.05))',
          border: '1px solid rgba(var(--primary-rgb),0.2)',
          borderRadius: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.85rem',
          color: 'var(--text-muted)',
          fontWeight: 600
        }}>
          <MapPin size={16} color="var(--primary)" />
          <span>Showing results from <strong style={{ color: 'var(--primary)' }}>{escalatedScope}</strong> due to local availability.</span>
        </div>
      )}

      {isLoading ? renderSkeletons() : products.length === 0 ? (
        <div className="premium-card" style={{ textAlign: 'center', padding: '60px', borderRadius: '32px' }}>
          <ShoppingBag size={48} color="var(--primary)" style={{ opacity: 0.2, marginBottom: '16px' }} />
          <h4 style={{ fontWeight: 800, marginBottom: '8px' }}>No products here yet</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>The local market is still growing. Try changing your search or scope!</p>
        </div>
      ) : (
        <div className="product-premium-grid">
          {products.map(product => (
            <div 
              key={product.id} 
              className="product-premium-card" 
              onClick={() => setSelectedProduct(product)}
            >
              {product.is_sponsored ? (
                <div className="product-badge" style={{ background: 'var(--primary)', color: 'white' }}>
                    <Zap size={10} fill="currentColor" /> Sponsored
                </div>
              ) : product.priority > 0 && (
                <div className="product-badge">Featured</div>
              )}
              <div className="product-image-container">
                <img 
                  src={product.image_urls?.[0] || 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&h=500&fit=crop'} 
                  alt={product.name} 
                  loading="lazy"
                />
                <button 
                  className="quick-add-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Quick add logic
                  }}
                >
                  <Plus size={20} />
                </button>
              </div>
              
              <div className="product-details-content">
                <div 
                  className="product-store-link"
                  onClick={(e) => { e.stopPropagation(); if (product.store_id) onNavigateToStore?.(product.store_id); }}
                >
                  {product.stores?.name || 'Local Store'}
                </div>
                <h5 className="product-name-premium">{product.name}</h5>
                
                <div className="product-price-row">
                  <div className="product-price-premium">${product.price}</div>
                  {product.review_count > 0 && (
                    <div className="product-rating-premium">
                      <Star size={12} fill="currentColor" />
                      <span>{product.avg_rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedProduct && (
        <ProductDetailsModal 
          product={selectedProduct} 
          user={user} 
          onClose={() => setSelectedProduct(null)} 
        />
      )}
    </div>
  );
};

