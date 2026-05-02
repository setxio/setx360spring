import React, { useState, useEffect, useRef } from 'react';
import { Search, X, User, MessageSquare, Store, ShoppingBag, ArrowRight, Loader2, Map } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import { Avatar } from './Avatar';
import './SearchOverlay.css';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (env: string, tab: number, params?: any) => void;
  scope?: 'national' | 'state' | 'county' | 'city';
  user?: any;
}

export const SearchOverlay: React.FC<SearchOverlayProps> = ({ isOpen, onClose, onNavigate, scope = 'national', user }) => {
  const { isSetxDomain } = useApp();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [history, setHistory] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('search_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      setQuery('');
      setResults(null);
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length >= 2) {
        performSearch();
      } else {
        setResults(null);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const performSearch = async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    setSelectedIndex(-1);
    try {
      let scopeValue = null;
      if (scope === 'city') scopeValue = user?.community;
      else if (scope === 'county') scopeValue = user?.county;
      else if (scope === 'state') scopeValue = user?.state;

      const { data, error } = await supabase.rpc('global_search', { 
        search_query: query,
        p_scope_type: scope,
        p_scope_value: scopeValue
      });
      if (error) throw error;
      setResults(data);

      // Save to history if we have results
      const hasResults = Object.values(data).some((arr: any) => arr && arr.length > 0);
      if (hasResults && !history.includes(query)) {
        const newHistory = [query, ...history.slice(0, 4)];
        setHistory(newHistory);
        localStorage.setItem('search_history', JSON.stringify(newHistory));
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, getTotalResults() - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    }
    if (e.key === 'Enter' && selectedIndex >= 0) {
      const allItems = getAllResults();
      const item = allItems[selectedIndex];
      if (item) handleResultClick(item.type, item.data);
    }
  };

  const getAllResults = () => {
    if (!results) return [];
    const items: any[] = [];
    if (activeTab === 'all' || activeTab === 'profiles') results.profiles?.forEach((p: any) => items.push({ type: 'profiles', data: p }));
    if (activeTab === 'all' || activeTab === 'stores') results.stores?.forEach((s: any) => items.push({ type: 'stores', data: s }));
    if (activeTab === 'all' || activeTab === 'posts') results.posts?.forEach((p: any) => items.push({ type: 'posts', data: p }));
    if (activeTab === 'all' || activeTab === 'products') results.products?.forEach((p: any) => items.push({ type: 'products', data: p }));
    return items;
  };

  const getTotalResults = () => getAllResults().length;

  const handleResultClick = (type: string, item: any) => {
    onClose();
    if (!onNavigate) return;

    switch (type) {
      case 'profiles':
        onNavigate('social', 2, { userId: item.id }); // Route to directory as base, then open profile
        break;
      case 'posts':
        onNavigate('social', 0, { postId: item.id }); // Home/Feed as base, then open post
        break;
      case 'stores':
        onNavigate('market', 2, { storeId: item.id }); // Stores directory as base, then open store
        break;
      case 'products':
        onNavigate('market', 0); // Market home
        break;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="search-overlay-backdrop" onClick={onClose}>
      <motion.div 
        className="search-overlay-container glass"
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="search-header-sticky">
          <div className="search-input-wrapper-outer" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="search-input-wrapper-inner glass" style={{ flex: 1, margin: 0 }}>
              <Search className="search-icon" size={20} />
              <input
                ref={inputRef}
                type="text"
                placeholder={`Search ${isSetxDomain ? 'SETX 360' : 'Efutura'} ${scope === 'national' ? '' : scope === 'state' ? 'Statewide' : scope === 'city' ? 'City' : 'Regional'}...`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              {query && (
                <button className="clear-search" onClick={() => setQuery('')}>
                  <X size={18} />
                </button>
              )}
            </div>
            <button className="close-search-btn" onClick={onClose} style={{ flexShrink: 0, width: '45px', height: '45px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
              <X size={24} />
            </button>
          </div>

          <div className="search-tabs-container">
            <div className="search-tabs">
              <button className={activeTab === 'all' ? 'active' : ''} onClick={() => setActiveTab('all')}>All</button>
              <button className={activeTab === 'profiles' ? 'active' : ''} onClick={() => setActiveTab('profiles')}>People</button>
              <button className={activeTab === 'stores' ? 'active' : ''} onClick={() => setActiveTab('stores')}>Shops</button>
              <button className={activeTab === 'posts' ? 'active' : ''} onClick={() => setActiveTab('posts')}>Feed</button>
              <button className={activeTab === 'products' ? 'active' : ''} onClick={() => setActiveTab('products')}>Market</button>
            </div>
          </div>
        </div>

        <div className="search-results-area">
          {isLoading && (
            <div className="search-loader">
              <Loader2 className="animate-spin" size={32} />
              <p>Searching {scope === 'national' ? 'the nation' : scope === 'state' ? 'the state' : scope === 'city' ? 'the city' : 'the region'}...</p>
            </div>
          )}

          {!isLoading && query.length < 2 && (
            <div className="search-placeholder">
              {history.length > 0 && (
                <div className="recent-searches">
                  <h4>RECENT SEARCHES</h4>
                  <div className="history-tags">
                    {history.map((h, i) => (
                      <span key={i} onClick={() => setQuery(h)}>{h}</span>
                    ))}
                    <button className="clear-history" onClick={() => { setHistory([]); localStorage.removeItem('search_history'); }}>Clear</button>
                  </div>
                </div>
              )}

              <div className="discovery-header">
                <h3>DISCOVER {scope.toUpperCase()}</h3>
              </div>
              
              <div className="trending-bubbles-grid">
                <div className="trending-bubble-card" onClick={() => { onClose(); onNavigate?.('market', 2); }}>
                  <div className="bubble-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}><Store size={22} /></div>
                  <div className="bubble-text">
                    <span className="bubble-title">Nearby Stores</span>
                    <span className="bubble-desc">Shop local gems</span>
                  </div>
                </div>
                <div className="trending-bubble-card" onClick={() => { onClose(); onNavigate?.('social', 2); }}>
                  <div className="bubble-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}><User size={22} /></div>
                  <div className="bubble-text">
                    <span className="bubble-title">Discover People</span>
                    <span className="bubble-desc">Build your network</span>
                  </div>
                </div>
                <div className="trending-bubble-card" onClick={() => { onClose(); onNavigate?.('discover', 4); }}>
                  <div className="bubble-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}><Map size={22} /></div>
                  <div className="bubble-text">
                    <span className="bubble-title">Alert Radar</span>
                    <span className="bubble-desc">Real-time safety</span>
                  </div>
                </div>
                <div className="trending-bubble-card" onClick={() => { onClose(); onNavigate?.('market', 0); }}>
                  <div className="bubble-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}><ShoppingBag size={22} /></div>
                  <div className="bubble-text">
                    <span className="bubble-title">Hot Deals</span>
                    <span className="bubble-desc">Local savings</span>
                  </div>
                </div>
              </div>

              <div className="search-suggestions">
                <span className="suggestion-pill" onClick={() => setQuery('#Events')}>#Events</span>
                <span className="suggestion-pill" onClick={() => setQuery('#LocalNews')}>#LocalNews</span>
                <span className="suggestion-pill" onClick={() => setQuery('#Artisan')}>#Artisan</span>
                <span className="suggestion-pill" onClick={() => setQuery('#Community')}>#Community</span>
              </div>
            </div>
          )}

          {!isLoading && results && (
            <div className="results-grid">
              {/* Profiles */}
              {(activeTab === 'all' || activeTab === 'profiles') && results.profiles?.length > 0 && (
                <section className="results-section">
                  <h3><User size={16} /> People</h3>
                  {results.profiles.map((p: any, idx: number) => {
                    const globalIdx = idx; 
                    return (
                      <div key={p.id} className={`result-item ${selectedIndex === globalIdx ? 'selected' : ''}`} onClick={() => handleResultClick('profiles', p)}>
                        <Avatar url={p.avatar_url} name={p.name} size={32} />
                        <div className="result-info">
                          <span className="result-name">{p.name}</span>
                          <span className="result-subline">{p.role?.replace('_', ' ') || 'Member'} • {p.community || p.county}</span>
                        </div>
                        <ArrowRight size={14} className="result-arrow" />
                      </div>
                    );
                  })}
                </section>
              )}

              {/* Stores */}
              {(activeTab === 'all' || activeTab === 'stores') && results.stores?.length > 0 && (
                <section className="results-section">
                  <h3><Store size={16} /> Businesses</h3>
                  {results.stores.map((s: any, idx: number) => {
                    const globalIdx = (activeTab === 'all' ? (results.profiles?.length || 0) : 0) + idx;
                    return (
                      <div key={s.id} className={`result-item ${selectedIndex === globalIdx ? 'selected' : ''}`} onClick={() => handleResultClick('stores', s)}>
                        <div className="result-img-wrapper">
                          {s.image_url ? <img src={s.image_url} alt="" /> : <Store size={20} />}
                        </div>
                        <div className="result-info">
                          <span className="result-name">{s.name}</span>
                          <span className="result-subline">{s.category || 'Local Business'} • {s.description?.substring(0, 40)}...</span>
                        </div>
                        <ArrowRight size={14} className="result-arrow" />
                      </div>
                    );
                  })}
                </section>
              )}

              {/* Posts */}
              {(activeTab === 'all' || activeTab === 'posts') && results.posts?.length > 0 && (
                <section className="results-section">
                  <h3><MessageSquare size={16} /> Social Feed</h3>
                  {results.posts.map((post: any, idx: number) => {
                    const globalIdx = (activeTab === 'all' ? ((results.profiles?.length || 0) + (results.stores?.length || 0)) : 0) + idx;
                    return (
                      <div key={post.id} className={`result-item ${selectedIndex === globalIdx ? 'selected' : ''}`} onClick={() => handleResultClick('posts', post)}>
                        <div className="result-info">
                          <span className="result-name">{post.content?.substring(0, 50)}...</span>
                          <span className="result-subline">{new Date(post.created_at).toLocaleDateString()} • {post.type}</span>
                        </div>
                        <ArrowRight size={14} className="result-arrow" />
                      </div>
                    );
                  })}
                </section>
              )}

              {/* Products */}
              {(activeTab === 'all' || activeTab === 'products') && results.products?.length > 0 && (
                <section className="results-section">
                  <h3><ShoppingBag size={16} /> Marketplace</h3>
                  {results.products.map((pd: any, idx: number) => {
                    const globalIdx = (activeTab === 'all' ? ((results.profiles?.length || 0) + (results.stores?.length || 0) + (results.posts?.length || 0)) : 0) + idx;
                    return (
                      <div key={pd.id} className={`result-item ${selectedIndex === globalIdx ? 'selected' : ''}`} onClick={() => handleResultClick('products', pd)}>
                        <div className="result-img-wrapper">
                          {pd.image_urls?.[0] ? <img src={pd.image_urls[0]} alt="" /> : <ShoppingBag size={20} />}
                        </div>
                        <div className="result-info">
                          <span className="result-name">{pd.name}</span>
                          <span className="result-subline">${pd.price}</span>
                        </div>
                        <ArrowRight size={14} className="result-arrow" />
                      </div>
                    );
                  })}
                </section>
              )}

              {getTotalResults() === 0 && (
                <div className="search-empty">
                  <p>No results found for "{query}" {activeTab !== 'all' ? `in ${activeTab}` : ''}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
