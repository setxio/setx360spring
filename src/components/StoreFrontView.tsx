import React, { useState, useEffect } from 'react';
import { 
  Search, 
  MessageSquare, 
  Star, 
  ChevronRight, 
  ShoppingBag,
  Info,
  ArrowLeft,
  Loader2,
  ShieldCheck
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Avatar } from './Avatar';
import { QuickMessageModal } from './QuickMessageModal';
import './StoreFrontView.css';

interface StoreFrontViewProps {
  storeId: string;
  onBack: () => void;
  currentUser: any;
}

export const StoreFrontView: React.FC<StoreFrontViewProps> = ({ storeId, onBack, currentUser }) => {
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [showPolicies, setShowPolicies] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  useEffect(() => {
    fetchStoreData();
  }, [storeId]);

  const fetchStoreData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Store with custom theme
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('id', storeId)
        .single();

      if (storeError) throw storeError;
      setStore(storeData);

      // 2. Fetch Products
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeId)
        .eq('status', 'active');
      
      if (productsData) setProducts(productsData);

      // 3. Fetch Reviews
      const { data: reviewsData } = await supabase
        .from('store_reviews')
        .select('*, profiles(name, avatar_url)')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (reviewsData) setReviews(reviewsData);

    } catch (err) {
      console.error('Error fetching store data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="store-loader"><Loader2 className="animate-spin" size={48} /></div>;
  if (!store) return <div className="store-error">Store not found.</div>;

  const theme = store.custom_theme || {};
  const categories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
    : '0.0';

  const isStoreOpen = () => {
    if (store.is_vacation_mode) return false;
    const now = new Date();
    const day = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const hours = store.business_hours?.[day];
    
    // Safety check for missing hours or open/close times
    if (!hours || hours.closed || !hours.open || !hours.close) return false;

    try {
      const [currentH, currentM] = [now.getHours(), now.getMinutes()];
      const [openH, openM] = hours.open.split(':').map(Number);
      const [closeH, closeM] = hours.close.split(':').map(Number);

      const currentTime = currentH * 60 + currentM;
      const openTime = openH * 60 + openM;
      const closeTime = closeH * 60 + closeM;

      return currentTime >= openTime && currentTime <= closeTime;
    } catch (e) {
      console.error('Error calculating store hours:', e);
      return false;
    }
  };

  const storeStyles = {
    '--store-primary': theme.primary_color || '#2563eb',
    '--store-header-text': theme.header_color || '#ffffff',
    '--store-link': theme.link_color || '#2563eb',
    '--store-hover': theme.hover_color || '#1d4ed8',
    '--store-bg': theme.bg_color || '#f8fafc',
    '--store-bg-image': theme.bg_image_url ? `url(${theme.bg_image_url})` : 'none',
    '--store-bg-style': theme.bg_style === 'cover' ? 'cover' : 'auto'
  } as React.CSSProperties;

  return (
    <div className="store-front-view" style={storeStyles}>
      {/* Dynamic Background */}
      <div className={`store-bg-layer ${theme.bg_style}`} />

      {/* Header / Banner Section */}
      <header className="store-header">
        <div className="store-banner">
          {store.banner_url ? (
            <img src={store.banner_url} alt="Banner" className="banner-img" />
          ) : (
            <div className="banner-placeholder" />
          )}
          <button className="store-back-btn" onClick={onBack}><ArrowLeft size={20} /></button>
        </div>

        <div className="store-profile-bar glass">
          <div className="store-branding">
            <div className="store-logo-main" style={{ width: 80, height: 80, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '3px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {store.image_url ? (
                <img 
                  src={store.image_url} 
                  alt={store.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <span style={{ fontWeight: 800, fontSize: '1.5rem', color: 'var(--primary)' }}>
                  {(store.name || 'S').charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="store-title-info">
              <h1>{store.name} {store.is_verified && <ShieldCheck size={20} className="verified-icon" />}</h1>
              <div className="store-badges">
                <span className={`status-pill ${isStoreOpen() ? 'open' : 'closed'}`}>
                  {isStoreOpen() ? 'Open Now' : (store.is_vacation_mode ? 'On Vacation' : 'Closed')}
                </span>
                <span className="rating-pill"><Star size={14} fill="currentColor" /> {averageRating} ({reviews.length})</span>
                <span className="category-pill">{store.category}</span>
              </div>
            </div>
          </div>

          <div className="store-actions">
            <button className="contact-vendor-btn" onClick={() => setShowContactModal(true)}>
              <MessageSquare size={18} /> Contact Shop
            </button>
          </div>
        </div>
      </header>

      <main className="store-content">
        {/* Store Search & Categories */}
        <div className="store-filters-row">
          <div className="store-search-box glass">
            <Search size={18} />
            <input 
              type="text" 
              placeholder={`Search in ${store.name}...`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="store-categories-pills">
            {categories.map(cat => (
              <button 
                key={cat} 
                className={`cat-pill ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <section className="store-products-section">
          {filteredProducts.length === 0 ? (
            <div className="no-products glass">
              <ShoppingBag size={48} />
              <h3>No products found</h3>
              <p>Try adjusting your search or category filters.</p>
            </div>
          ) : (
            <div className="store-product-grid">
              {filteredProducts.map(product => (
                <div key={product.id} className="store-product-card glass fade-in">
                  <div className="product-img-wrapper">
                    <img src={product.image_urls?.[0]} alt={product.name} />
                  </div>
                  <div className="product-details">
                    <h4>{product.name}</h4>
                    <div className="product-price-row">
                      <span className="price">${product.price}</span>
                      <button className="add-to-cart-mini"><ShoppingBag size={14} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Info & Reviews Section */}
        <section className="store-info-grid">
          <div className="store-bio-card glass">
            <h3>About the Shop</h3>
            <p className="store-bio-text">{store.bio || "This shop hasn't shared their story yet."}</p>
            
            <div className="store-hours-list">
              <h4>Business Hours</h4>
              {Object.entries(store.business_hours || {}).length > 0 ? (
                Object.entries(store.business_hours).map(([day, hours]: [string, any]) => (
                  <div key={day} className="hour-row">
                    <span className="day-label">{day.charAt(0).toUpperCase() + day.slice(1)}</span>
                    <span className="hour-val">
                      {!hours || hours.closed ? 'Closed' : `${hours.open || '09:00'} - ${hours.close || '17:00'}`}
                    </span>
                  </div>
                ))
              ) : (
                <p className="no-hours-info">Hours not provided.</p>
              )}
            </div>
          </div>

          <div className="store-reviews-card glass">
            <div className="reviews-header">
              <h3>Reviews & Ratings</h3>
              <Star size={24} fill="var(--store-primary)" color="var(--store-primary)" />
            </div>
            <div className="reviews-list">
              {reviews.length === 0 ? (
                <p className="no-reviews">Be the first to review this shop!</p>
              ) : (
                reviews.map(review => (
                  <div key={review.id} className="review-item">
                    <div className="review-user">
                      <Avatar name={review.profiles?.name} url={review.profiles?.avatar_url} size={32} />
                      <div className="review-user-info">
                        <strong>{review.profiles?.name}</strong>
                        <div className="review-stars">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={10} fill={i < review.rating ? 'var(--store-primary)' : 'none'} color="var(--store-primary)" />
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="review-text">{review.comment}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Policies Footer */}
        <footer className="store-footer-policies">
          <button className="policy-toggle-btn" onClick={() => setShowPolicies(!showPolicies)}>
            <Info size={16} /> Returns & Policies <ChevronRight size={16} className={showPolicies ? 'rotated' : ''} />
          </button>
          {showPolicies && (
            <div className="policy-content glass fade-in">
              <h4>Return Policy</h4>
              <p>{store.return_policy || "Contact the shop owner for details on their return policy."}</p>
            </div>
          )}
        </footer>
      </main>

      {showContactModal && (
        <QuickMessageModal 
          user={currentUser}
          recipientId={store.owner_id}
          recipientName={store.name}
          recipientAvatar={store.image_url}
          onClose={() => setShowContactModal(false)}
        />
      )}
    </div>
  );
};
