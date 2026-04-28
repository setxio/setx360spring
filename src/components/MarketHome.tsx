import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowRight, Plus, Loader2, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ProductDetailsModal } from './ProductDetailsModal';

interface MarketHomeProps {
  user: any;
  scope?: 'national' | 'state' | 'county' | 'city';
  onNavigateToStore?: (id: string) => void;
}

export const MarketHome: React.FC<MarketHomeProps> = ({ user, scope = 'national', onNavigateToStore }) => {
  const { theme } = useApp();
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [escalatedScope, setEscalatedScope] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, [scope]);

  const fetchProducts = async () => {
    setIsLoading(true);

    // Use !inner joins only when we need geographic filtering
    const needsGeoFilter = user && scope !== 'national';
    const storeJoin = needsGeoFilter
      ? 'stores!inner ( *, seller:profiles!owner_id!inner ( community, county, state, country ) )'
      : 'stores ( *, seller:profiles!owner_id ( community, county, state, country ) )';

    let query = supabase
      .from('products')
      .select(`*, ${storeJoin}`)
      .order('avg_rating', { ascending: false })
      .limit(6);

    // Apply geo filter based on active notch
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

    const { data, error } = await query;
    let fetchedProducts = data || [];
    
    // Escalation Logic for Products
    let currentEscalation: string | null = null;
    if (needsGeoFilter && fetchedProducts.length < 3) {
      const isSETX = theme.startsWith('setx-');
      const escalationMap: Record<string, { nextScope: string; filterKey: string; filterValue: string; label: string }> = {
        city: { nextScope: 'county', filterKey: 'stores.seller.county', filterValue: user.county, label: `${user.county || 'your'} County` },
        // Hide state/national escalation for SETX project
        ...(!isSETX ? {
          county: { nextScope: 'state', filterKey: 'stores.seller.state', filterValue: user.state, label: user.state || 'your state' },
          state: { nextScope: 'national', filterKey: '', filterValue: '', label: 'nationwide' },
        } : {}),
      };
      
      const esc = escalationMap[scope];
      if (esc && esc.filterValue) {
        let escQuery = supabase.from('products').select(`*, stores!inner ( *, seller:profiles!owner_id!inner ( community, county, state, country ) )`).order('avg_rating', { ascending: false }).limit(6);
        if (esc.nextScope !== 'national') {
          escQuery = escQuery.eq(esc.filterKey, esc.filterValue);
        }
        const { data: escData } = await escQuery;
        if (escData && escData.length > 0) {
          const existingIds = new Set(fetchedProducts.map((p: any) => p.id));
          const newProducts = escData.filter((p: any) => !existingIds.has(p.id));
          fetchedProducts = [...fetchedProducts, ...newProducts];
          currentEscalation = esc.label;
        }
      }
    }
    
    setEscalatedScope(currentEscalation);

    if (error) {
      console.error('Error fetching products:', error);
    } else {
      setProducts(fetchedProducts);
    }
    setIsLoading(false);
  };

  return (
    <div className="market-home">
      {/* Hero Banner */}
      <div className="premium-card hero-banner" style={{ 
        background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
        color: 'white',
        marginBottom: '24px',
        border: 'none',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px' }}>Spring Sale is Live!</h3>
          <p style={{ opacity: 0.9, marginBottom: '16px' }}>Get up to 40% off on all local artisanal products.</p>
          <button style={{ 
            background: 'white', 
            color: 'var(--primary)', 
            border: 'none', 
            padding: '8px 16px', 
            borderRadius: '20px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer'
          }}>
            Shop Now <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* SETX Spotlight */}
      <div className="setx-spotlight glass" style={{ padding: '20px', borderRadius: '24px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Star size={20} color="var(--primary)" fill="var(--primary)" />
            <h4 style={{ fontWeight: 800 }}>SETX Local Spotlight</h4>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700 }}>Featured This Week</span>
        </div>
        <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }} className="no-scrollbar">
          {['Beaumont Botanicals', 'Orange Outfitters', 'Neches River Crafts'].map(name => (
            <div key={name} className="spotlight-card glass" style={{ minWidth: '160px', padding: '12px', borderRadius: '16px', textAlign: 'center' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--primary)', margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800 }}>{name[0]}</div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{name}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Verified Seller</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h4 style={{ fontWeight: 700 }}>Featured Products</h4>
        <span style={{ color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}>See All</span>
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
          <span>Expanded to <strong style={{ color: 'var(--primary)' }}>{escalatedScope}</strong> — not enough local products yet</span>
        </div>
      )}

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <Loader2 className="animate-spin" size={32} color="var(--primary)" />
        </div>
      ) : products.length === 0 ? (
        <div className="premium-card" style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: 'var(--text-muted)' }}>No products found. Check back soon!</p>
        </div>
      ) : (
        <div className="product-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', 
          gap: '16px' 
        }}>
          {products.map(product => (
            <div 
              key={product.id} 
              className="premium-card product-card" 
              style={{ padding: '8px', cursor: 'pointer', transition: 'transform 0.2s' }}
              onClick={() => setSelectedProduct(product)}
            >
              <img 
                src={product.image_urls?.[0] || 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=300&h=300&fit=crop'} 
                alt={product.name} 
                style={{ width: '100%', borderRadius: '12px', marginBottom: '8px', aspectRatio: '1/1', objectFit: 'cover' }} 
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <p 
                  style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, cursor: 'pointer' }}
                  onClick={(e) => { e.stopPropagation(); if (product.store_id) onNavigateToStore?.(product.store_id); }}
                >
                  {product.stores?.name || 'Local Store'}
                </p>
                {product.review_count > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#f59e0b', fontSize: '0.7rem', fontWeight: 700 }}>
                    <Star size={10} fill="currentColor" />
                    <span>{product.avg_rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
              <h5 style={{ fontWeight: 700, fontSize: '0.85rem', margin: '2px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</h5>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '0.95rem' }}>${product.price}</span>
                <button 
                  style={{ 
                    background: 'var(--primary)', 
                    color: 'white', 
                    border: 'none', 
                    padding: '6px', 
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <Plus size={14} />
                </button>
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
