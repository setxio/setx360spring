import type { User } from '../types/user';
import React, { useState, useEffect } from 'react';
import { Search, Loader2, Star, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ProductDetailsModal } from './ProductDetailsModal';
import { useApp } from '../context/AppContext';

interface ProductSearchProps {
  user: User;
  scope?: 'national' | 'state' | 'county' | 'city';
  onNavigateToStore?: (id: string) => void;
}

export const ProductSearch: React.FC<ProductSearchProps> = ({ user, scope = 'national', onNavigateToStore }) => {
  const { theme } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [sortBy, setSortBy] = useState('rating');
  const [category, setCategory] = useState('all');

  useEffect(() => {
    handleSearch();
  }, [scope, sortBy, category]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      handleSearch();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      const needsGeoFilter = user && scope !== 'national';
      const storeJoin = needsGeoFilter 
        ? `stores!inner (
            *,
            seller:profiles!owner_id!inner (
              community,
              county,
              state,
              country
            )
          )`
        : `stores (
            *,
            seller:profiles!owner_id (
              community,
              county,
              state,
              country
            )
          )`;

      let selectString = `
        *,
        ${storeJoin},
        avg_rating,
        review_count
      `;

      let query = supabase.from('products').select(selectString);

      if (searchTerm) query = query.ilike('name', `%${searchTerm}%`);
      if (category !== 'all') query = query.eq('category', category);

      if (user && scope !== 'national') {
        if (scope === 'city') query = query.eq('stores.seller.community', user.community);
        else if (scope === 'county') query = query.eq('stores.seller.county', user.county);
        else if (scope === 'state') query = query.eq('stores.seller.state', user.state);
      }

      if (sortBy === 'rating') query = query.order('avg_rating', { ascending: false });
      else if (sortBy === 'price_asc') query = query.order('price', { ascending: true });
      else if (sortBy === 'price_desc') query = query.order('price', { ascending: false });
      else if (sortBy === 'newest') query = query.order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error('Error searching products:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="product-search">
      <div className="search-bar-container" style={{ 
        marginBottom: '24px', 
        display: 'flex', 
        gap: '12px',
        background: theme.endsWith('-dark') ? 'rgba(255,255,255,0.03)' : '#fff',
        padding: '12px',
        borderRadius: '40px',
        border: theme === 'setx-light' ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
      }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.8 }} size={20} />
          <input 
            type="text" 
            placeholder="Search local products..." 
            className="premium-input"
            style={{ 
              width: '100%', 
              paddingLeft: '48px', 
              background: 'transparent', 
              border: 'none',
              fontSize: '1.05rem',
              fontWeight: 600,
              color: 'var(--text)'
            }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div style={{ width: '1px', background: 'var(--border)', opacity: 0.3, margin: '4px 0' }} />
        <select 
          className="premium-input" 
          style={{ 
            width: '140px', 
            fontSize: '0.85rem', 
            background: 'transparent', 
            border: 'none',
            fontWeight: 700,
            color: 'var(--primary)',
            cursor: 'pointer'
          }}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="rating">Top Rated</option>
          <option value="newest">Newest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>
      </div>

      <div className="category-tabs" style={{ 
        display: 'flex', 
        gap: '10px', 
        overflowX: 'auto', 
        paddingBottom: '20px', 
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}>
        {['all', 'artisan', 'food', 'services', 'retail', 'entertainment'].map(cat => (
          <button
            key={cat}
            className={`filter-pill ${category === cat ? 'active' : ''}`}
            onClick={() => setCategory(cat)}
            style={{ 
              padding: '10px 22px', 
              fontSize: '0.85rem', 
              whiteSpace: 'nowrap',
              background: category === cat 
                ? 'linear-gradient(135deg, var(--primary) 0%, #a855f7 100%)' 
                : theme.endsWith('-dark') ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
              color: category === cat ? 'white' : 'var(--text-muted)',
              border: 'none',
              borderRadius: '25px',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: category === cat ? '0 10px 20px rgba(99, 102, 241, 0.2)' : 'none',
              transform: category === cat ? 'translateY(-2px)' : 'none'
            }}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <Loader2 className="animate-spin" size={32} color="var(--primary)" />
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
              style={{ padding: '8px', cursor: 'pointer' }}
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
                    cursor: 'pointer'
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
          {!isLoading && products.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', opacity: 0.5 }}>
              <p>No products found for "{searchTerm}"</p>
            </div>
          )}
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
