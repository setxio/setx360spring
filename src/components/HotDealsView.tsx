import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Tag, ArrowUpRight, Loader2, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './HotDealsView.css';

interface Product {
  id: string;
  name: string;
  price: number;
  original_price: number;
  discount_percent: number;
  image_urls: string[];
  store: {
    name: string;
  };
}

interface HotDealsViewProps {
  user?: any;
  scope?: 'national' | 'state' | 'county' | 'city';
}

export const HotDealsView: React.FC<HotDealsViewProps> = ({ user, scope = 'national' }) => {
  const { theme } = useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHotDeals();
  }, [scope]);

  const fetchHotDeals = async () => {
    setIsLoading(true);
    try {
      let selectString = `
        *,
        store:stores (
          name,
          seller:profiles!owner_id (
            community,
            county,
            state,
            country
          )
        )
      `;

      // Apply inner joins if filtered
      if (user && scope !== 'national') {
        selectString = selectString.replace('store:stores', 'store:stores!inner');
      }

      let query = supabase.from('products').select(selectString);

      if (user && scope !== 'national') {
        const isSETX = theme.startsWith('setx-');

        if (scope === 'city') query = query.eq('store.seller.community', user.community);
        else if (scope === 'county') {
          if (isSETX) {
            query = query.in('store.seller.county', ['Jefferson', 'Orange', 'Jefferson County', 'Orange County']);
          } else if (user.county) {
            query = query.eq('store.seller.county', user.county);
          }
        }
        else if (scope === 'state') query = query.eq('store.seller.state', user.state);
      }

      query = query
        .gt('discount_percent', 0)
        .order('discount_percent', { ascending: false })
        .limit(20);

      const { data, error } = await query;
      if (error) throw error;
      setProducts((data as any[]) || []);
    } catch (err) {
      console.error('Error fetching hot deals:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="discovery-loading">
        <Loader2 className="animate-spin" size={40} color="var(--primary)" />
      </div>
    );
  }

  return (
    <div className="discovery-view-content animate-fade-in">
      <div className="discovery-hero deals-hero">
        <div className="hero-badge">
          <Zap size={14} fill="currentColor" /> Market Blowout
        </div>
        <h1>Highest Discounts</h1>
        <p>Verified savings from local vendors across the network.</p>
      </div>

      <div className="deals-grid">
        {products.length === 0 ? (
          <div className="empty-state premium-card">
            <Tag size={48} className="empty-icon" />
            <h3>No Active Blowouts</h3>
            <p>Check back later for high-discount marketplace deals.</p>
          </div>
        ) : (
          products.map((product) => (
            <div key={product.id} className="deal-card premium-card">
              <div className="discount-tag">-{Math.round(product.discount_percent)}%</div>
              <div className="deal-image-wrapper">
                <img src={product.image_urls[0] || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff'} alt={product.name} />
              </div>
              
              <div className="deal-content">
                <span className="deal-store-name">{product.store?.name}</span>
                <h3>{product.name}</h3>
                
                <div className="deal-pricing">
                  <span className="current-price">${product.price}</span>
                  <span className="original-price">${product.original_price}</span>
                </div>

                <button className="grab-deal-btn">
                  Grab Deal <ArrowUpRight size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
