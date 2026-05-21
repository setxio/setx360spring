import type { User } from '../types/user';
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowRight, Plus, Star, Filter, ShoppingBag, Zap, Award, MapPin, ChevronRight, ChevronLeft, Search, Clock, Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryKeys } from '../lib/queryKeys';
import { ProductCardElite, ProductElite } from './ProductCardElite';
import { useCart } from '../context/CartContext';
import './MarketHome.css';

interface MarketHomeProps {
  user: User;
  scope?: 'national' | 'state' | 'county' | 'city';
  onNavigateToStore?: (id: string) => void;
}

const CATEGORIES = [
  { id: 'all', name: 'All Shops', icon: <ShoppingBag size={16} /> },
  { id: 'artisan', name: 'Artisanal', icon: <Award size={16} /> },
  { id: 'retail', name: 'Retail', icon: <ShoppingBag size={16} /> },
  { id: 'food', name: 'Food & Dining', icon: <Zap size={16} /> },
  { id: 'services', name: 'Services', icon: <Plus size={16} /> },
  { id: 'local', name: 'SETX Only', icon: <MapPin size={16} /> }
];

export const MarketHome: React.FC<MarketHomeProps> = ({ user, scope = 'national', onNavigateToStore }) => {
  const { theme, setActiveTab } = useApp();
  const { addToCart } = useCart();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchVal, setSearchVal] = useState('');

  const formatPrice = (p: number) => `$${(p || 0).toFixed(2)}`;

  const renderSkeletons = () => (
    <div className="product-premium-grid">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="product-premium-card" style={{ height: '320px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '16px', padding: '16px' }}>
          <div className="skeleton" style={{ width: '100%', height: '180px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.1)', marginBottom: '12px' }} />
          <div className="skeleton" style={{ width: '40%', height: '12px', background: 'rgba(255, 255, 255, 0.1)', marginBottom: '8px' }} />
          <div className="skeleton" style={{ width: '80%', height: '16px', background: 'rgba(255, 255, 255, 0.1)', marginBottom: '12px' }} />
          <div className="skeleton" style={{ width: '30%', height: '20px', background: 'rgba(255, 255, 255, 0.1)' }} />
        </div>
      ))}
    </div>
  );

  // Scroll handler for horizontal lanes
  const scrollLane = (laneId: string, direction: 'left' | 'right') => {
    const container = document.getElementById(laneId);
    if (container) {
      const scrollAmount = 400;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Countdown timer state for Deal of the Day
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 12, seconds: 45 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          return { hours: 23, minutes: 59, seconds: 59 }; // Reset
        }
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchProducts = async () => {
    const needsGeoFilter = user && scope !== 'national';
    const storeJoin = needsGeoFilter
      ? 'stores!inner ( *, seller:profiles!owner_id!inner ( community, county, state, country ) )'
      : 'stores ( *, seller:profiles!owner_id ( community, county, state, country ) )';

    let query = supabase
      .from('products')
      .select(`*, ${storeJoin}`);

    if (activeCategory !== 'all') {
      if (activeCategory === 'local') {
        query = query.in('stores.seller.county', ['Jefferson', 'Orange', 'Jefferson County', 'Orange County']);
      } else {
        query = query.eq('category', activeCategory);
      }
    }

    if (needsGeoFilter && activeCategory !== 'local') {
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

    const { data, error } = await query.limit(50);
    let fetchedProducts = data || [];

    // Fetch sponsored/ads
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
          .eq(esc.filterKey, esc.filterValue).limit(50);
        if (escData?.length) {
          const existingIds = new Set(fetchedProducts.map((p: any) => p.id));
          fetchedProducts = [...fetchedProducts, ...escData.filter((p: any) => !existingIds.has(p.id))];
          escalation = esc.label;
        }
      }
    }

    if (error) throw error;

    // Sort & partition data
    // 1. Deals (discount_percent > 0)
    const deals = [...fetchedProducts]
      .filter((p: any) => p.discount_percent && p.discount_percent > 0)
      .sort((a, b) => (b.discount_percent || 0) - (a.discount_percent || 0));
    
    let finalDeals = deals;
    if (finalDeals.length === 0) {
      // Fallback: lowest price products
      finalDeals = [...fetchedProducts].sort((a, b) => a.price - b.price);
    }

    // 2. Trending (views or rating desc)
    const trending = [...fetchedProducts]
      .sort((a, b) => (b.views || 0) - (a.views || 0));

    // 3. Top Rated (rating > 0)
    const topRated = [...fetchedProducts]
      .filter((p: any) => p.avg_rating && p.avg_rating > 0)
      .sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));

    // 4. New Arrivals (created_at desc)
    const newArrivals = [...fetchedProducts]
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

    return { 
      products: fetchedProducts, 
      deals: finalDeals.slice(0, 10),
      trending: trending.slice(0, 10),
      topRated: topRated.slice(0, 10),
      newArrivals: newArrivals.slice(0, 10),
      escalatedScope: escalation 
    };
  };

  const { data, isLoading } = useQuery({
    queryKey: [...queryKeys.stores.list(scope), activeCategory],
    queryFn: fetchProducts,
  });

  const products = data?.products ?? [];
  const deals = data?.deals ?? [];
  const trending = data?.trending ?? [];
  const topRated = data?.topRated ?? [];
  const newArrivals = data?.newArrivals ?? [];
  const escalatedScope = data?.escalatedScope ?? null;

  const fetchSpotlightStores = async () => {
    const { data: storeData, error } = await supabase
      .from('stores')
      .select('*')
      .eq('status', 'active')
      .order('is_verified', { ascending: false })
      .order('trust_score', { ascending: false })
      .limit(10);

    if (error) throw error;
    return storeData || [];
  };

  const { data: spotlightStores = [], isLoading: isLoadingStores } = useQuery({
    queryKey: ['stores', 'spotlight'],
    queryFn: fetchSpotlightStores,
  });

  // Selected Deal of the Day: first item in deals
  const dealOfTheDay = deals.length > 0 ? deals[0] : products.length > 0 ? products[0] : null;

  const handleProductSelect = (product: any) => {
    window.dispatchEvent(new CustomEvent('NAVIGATE_TO_PRODUCT', { detail: product }));
  };

  const formatCountdown = () => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(timeLeft.hours)}h : ${pad(timeLeft.minutes)}m : ${pad(timeLeft.seconds)}s`;
  };

  const renderProductCarousel = (items: any[], laneId: string) => {
    if (items.length === 0) {
      return (
        <div className="carousel-empty-state">
          <p>No products found under this section.</p>
        </div>
      );
    }

    return (
      <div className="carousel-relative-container">
        {/* Navigation Buttons */}
        <button 
          className="lane-arrow-btn left" 
          onClick={() => scrollLane(laneId, 'left')}
          aria-label="Scroll Left"
        >
          <ChevronLeft size={20} />
        </button>
        <button 
          className="lane-arrow-btn right" 
          onClick={() => scrollLane(laneId, 'right')}
          aria-label="Scroll Right"
        >
          <ChevronRight size={20} />
        </button>

        <div id={laneId} className="elite-product-carousel no-scrollbar">
          {items.map(product => {
            const eliteProduct: ProductElite = {
              id: product.id,
              name: product.name,
              price: product.price,
              image_urls: product.image_urls || [],
              stock_quantity: product.stock_quantity ?? Math.floor(Math.random() * 8) + 2,
              is_sponsored: product.is_sponsored,
              priority: product.priority,
              store_id: product.store_id,
              store_name: product.stores?.name,
              avg_rating: product.avg_rating,
              eligible_for_sameday: true
            };

            return (
              <div key={product.id} className="elite-carousel-item">
                <ProductCardElite 
                  product={eliteProduct}
                  onSelect={handleProductSelect}
                  onNavigateToStore={onNavigateToStore}
                  onQuickBuy={(p) => {
                    addToCart(p, 1);
                    setActiveTab(3);
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="market-home">
      {/* Search-First Premium Elite Hero */}
      <div className="market-hero elite-hero">
        <img 
          src="https://images.unsplash.com/photo-1555529771-835f59fc5efe?auto=format&fit=crop&q=80&w=1200" 
          alt="Market Hero" 
          className="market-hero-img"
          loading="eager"
        />
        <div className="elite-hero-gradient"></div>
        <div className="market-hero-content">
          <div className="elite-delivery-badge">
            <Zap size={14} fill="currentColor" /> Same-Day Delivery in {user.county || 'SETX'}
          </div>
          <h2 className="fade-in">Hyper-Local.<br/>Hyper-Fast.</h2>
          <p className="fade-in">Discover extraordinary local merchants. Delivered to your doorstep today.</p>
          
          {/* Bezos Search-First Bar */}
          <div className="hero-search-container fade-in">
            <div className="hero-search-wrapper">
              <Search className="hero-search-icon" size={18} />
              <input 
                type="text" 
                placeholder="Search products, local shops, artisans..." 
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setActiveTab(1); // Route to search tab
                  }
                }}
              />
              <button className="hero-search-btn" onClick={() => setActiveTab(1)}>
                Search
              </button>
            </div>
            <div className="hero-search-tags">
              <span>Trending:</span>
              <button onClick={() => { setSearchVal('Honey'); setActiveTab(1); }}>Artisan Honey</button>
              <button onClick={() => { setSearchVal('Salsa'); setActiveTab(1); }}>Local Salsa</button>
              <button onClick={() => { setSearchVal('Handmade'); setActiveTab(1); }}>Handmade Decor</button>
            </div>
          </div>
        </div>
      </div>

      {/* Category Card/Pill Scroller */}
      <div className="category-scroller-section">
        <h4 className="market-section-title">Shop by Category</h4>
        <div className="category-scroller no-scrollbar">
          {CATEGORIES.map(cat => (
            <button 
              key={cat.id} 
              className={`category-pill ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.icon}
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Deal of the Day (Spotlight / High Conversion Banner) */}
      {dealOfTheDay && activeCategory === 'all' && (
        <div className="deal-of-the-day-section fade-in">
          <div className="market-section-header">
            <h4>
              <Sparkles size={18} className="sparkle-icon" /> Featured Local Spotlight
            </h4>
          </div>
          <div className="deal-of-the-day-card glass" onClick={() => handleProductSelect(dealOfTheDay)}>
            <div className="deal-image-container">
              <img 
                src={dealOfTheDay.image_urls?.[0] || 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&h=600&fit=crop'} 
                alt={dealOfTheDay.name} 
              />
              <div className="deal-discount-badge">
                {dealOfTheDay.discount_percent ? `${dealOfTheDay.discount_percent}% OFF` : 'Best Value'}
              </div>
            </div>
            <div className="deal-details">
              <div className="deal-timer-container">
                <Clock size={16} />
                <span className="deal-timer-label">Flash Deal Ends In:</span>
                <span className="deal-timer-countdown">{formatCountdown()}</span>
              </div>
              <h3 className="deal-title">{dealOfTheDay.name}</h3>
              <p className="deal-store" onClick={(e) => {
                e.stopPropagation();
                if (dealOfTheDay.store_id) onNavigateToStore?.(dealOfTheDay.store_id);
              }}>
                <MapPin size={12} /> Sold by {dealOfTheDay.stores?.name || 'Local Verified Merchant'}
              </p>
              <p className="deal-description">
                {dealOfTheDay.description || 'Exclusive local product available for same-day delivery. Secure yours before the deal expires.'}
              </p>
              
              <div className="deal-pricing-row">
                <div className="deal-price-block">
                  <span className="deal-current-price">{formatPrice(dealOfTheDay.price)}</span>
                  {dealOfTheDay.original_price && (
                    <span className="deal-original-price">{formatPrice(dealOfTheDay.original_price)}</span>
                  )}
                </div>
                {dealOfTheDay.avg_rating && (
                  <div className="deal-rating">
                    <Star size={14} fill="currentColor" />
                    <span>{dealOfTheDay.avg_rating.toFixed(1)} ({dealOfTheDay.review_count || 12} reviews)</span>
                  </div>
                )}
              </div>
              
              <button className="claim-deal-btn">
                Claim Same-Day Deal <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Geo escalation warning if any */}
      {escalatedScope && (
        <div className="geo-escalation-banner fade-in">
          <MapPin size={16} />
          <span>Showing results from <strong>{escalatedScope}</strong> due to local availability.</span>
        </div>
      )}

      {/* LOADING STATE */}
      {isLoading ? (
        <div style={{ marginTop: '24px' }}>
          <h4 className="market-section-title">Loading the Best of SETX...</h4>
          {renderSkeletons()}
        </div>
      ) : products.length === 0 ? (
        <div className="premium-card empty-market-state" style={{ textAlign: 'center', padding: '60px', borderRadius: '32px', marginTop: '24px' }}>
          <ShoppingBag size={48} className="empty-icon" style={{ opacity: 0.3, marginBottom: '16px' }} />
          <h4 style={{ fontWeight: 800, marginBottom: '8px' }}>No products found</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Try broadening your search, changing categories, or updating your scope.</p>
        </div>
      ) : (
        <>
          {/* LANE 1: 🔥 Trending Locally */}
          {trending.length > 0 && (
            <div className="market-lane-section fade-in">
              <div className="market-section-header">
                <h4>🔥 Trending Locally</h4>
                <div className="see-all-link" onClick={() => setActiveTab(1)}>
                  View All <ArrowRight size={14} />
                </div>
              </div>
              {renderProductCarousel(trending, 'lane-trending')}
            </div>
          )}

          {/* LANE 2: 💰 Steals & Deals */}
          {deals.length > 0 && (
            <div className="market-lane-section fade-in">
              <div className="market-section-header">
                <h4>💰 Steals & Deals</h4>
                <div className="see-all-link" onClick={() => setActiveTab(1)}>
                  View All <ArrowRight size={14} />
                </div>
              </div>
              {renderProductCarousel(deals, 'lane-deals')}
            </div>
          )}

          {/* LANE 3: ⭐ Top Rated */}
          {topRated.length > 0 && (
            <div className="market-lane-section fade-in">
              <div className="market-section-header">
                <h4>⭐ Top Rated</h4>
                <div className="see-all-link" onClick={() => setActiveTab(1)}>
                  View All <ArrowRight size={14} />
                </div>
              </div>
              {renderProductCarousel(topRated, 'lane-top-rated')}
            </div>
          )}

          {/* LANE 4: 🆕 Fresh Arrivals */}
          {newArrivals.length > 0 && (
            <div className="market-lane-section fade-in">
              <div className="market-section-header">
                <h4>🆕 Fresh Arrivals</h4>
                <div className="see-all-link" onClick={() => setActiveTab(1)}>
                  View All <ArrowRight size={14} />
                </div>
              </div>
              {renderProductCarousel(newArrivals, 'lane-new-arrivals')}
            </div>
          )}
        </>
      )}

      {/* Featured Stores Spotlight */}
      <div className="market-section-header verified-store-header fade-in">
        <h4>Verified Storefronts</h4>
        <div className="see-all-link" onClick={() => onNavigateToStore?.('all')}>
          View Directory <ArrowRight size={14} />
        </div>
      </div>
      
      <div className="spotlight-container no-scrollbar fade-in">
        {isLoadingStores ? (
          <div style={{ padding: '24px', textAlign: 'center', opacity: 0.5, width: '100%' }}>Loading storefronts...</div>
        ) : spotlightStores.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', opacity: 0.5, width: '100%' }}>No storefronts found.</div>
        ) : (
          spotlightStores.map((store: any) => (
            <div key={store.id} className="store-card-premium" onClick={() => onNavigateToStore?.(store.id)}>
              <div className="store-logo-wrapper">
                {store.logo_url ? (
                  <img src={store.logo_url} alt={store.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  store.name[0]
                )}
              </div>
              <div className="store-info">
                <h5 style={{ display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
                  {store.name}
                  {store.is_verified && (
                    <span style={{ fontSize: '10px', background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', padding: '1px 6px', borderRadius: '10px', fontWeight: 600 }}>
                      Verified
                    </span>
                  )}
                </h5>
                <p style={{ margin: '4px 0 0 0' }}>
                  {store.category || 'Local Merchant'} • {store.trust_score ? `${(store.trust_score / 20).toFixed(1)}` : '5.0'}{' '}
                  <Star size={10} fill="var(--market-secondary)" color="var(--market-secondary)" />
                </p>
              </div>
              <ChevronRight size={18} style={{ marginLeft: 'auto', opacity: 0.3 }} />
            </div>
          ))
        )}
      </div>
    </div>
  );
};
