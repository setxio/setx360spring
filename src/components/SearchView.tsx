import React, { useState, useRef, useEffect } from 'react';
import { Search, Compass, Rss, Store, Calendar, Zap, TrendingUp, History, User, MessageSquare, ShoppingBag, Globe, ArrowRight, Loader2, Play } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { Avatar } from './Avatar';
import './SearchView.css';

interface SearchViewProps {
  user: any;
  scope: string;
  onNavigate: (env: string, tab?: number, params?: any) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({ user, scope, onNavigate }) => {
  const { theme, isSetxIO } = useApp();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  
  const inputRef = useRef<HTMLInputElement>(null);

  const getHeaderLogo = () => {
    if (theme.startsWith('io-')) return '/logo-io.png';
    if (theme.startsWith('neo')) return '/logo-neo.png';
    if (theme.startsWith('twilight')) return '/logo-twilight.png';
    if (theme.startsWith('efutura')) return '/logo-efutura.png';
    return theme.includes('light') ? '/logo-setx-blue.png' : '/logo-setx-transparent.png';
  };

  const handleSearchSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) {
      setHasSearched(false);
      return;
    }
    
    setIsLoading(true);
    setHasSearched(true);
    
    try {
      let scopeValue = null;
      if (scope === 'city') scopeValue = user?.community;
      else if (scope === 'county') scopeValue = user?.county;
      else if (scope === 'state') scopeValue = user?.state;

      const { data, error } = await supabase.functions.invoke('semantic-search', {
        body: {
          query: query,
          scope_type: scope,
          scope_value: scopeValue
        }
      });
      
      if (error) throw error;
      setResults(data);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResultClick = (type: string, item: any) => {
    switch (type) {
      case 'profiles':
        onNavigate('social', 2, { userId: item.id });
        break;
      case 'posts':
        onNavigate('social', 0, { postId: item.id });
        break;
      case 'stores':
        onNavigate('market', 2, { storeId: item.id });
        break;
      case 'products':
        onNavigate('market', 0);
        break;
      case 'events':
        onNavigate('events', 0);
        break;
      case 'wiki':
        window.open(item.url || item.image_url, '_blank', 'noopener,noreferrer');
        break;
    }
  };

  const quickLinks = [
    { icon: <Store size={16} />, label: 'Market', env: 'market' },
    { icon: <Compass size={16} />, label: 'Discover', env: 'discover' },
    { icon: <Rss size={16} />, label: 'Social', env: 'social' },
    { icon: <Calendar size={16} />, label: 'Events', env: 'events' },
    { icon: <Zap size={16} />, label: 'Eats', env: 'eats' }
  ];

  const trendingSearches = [
    "Flash Sales Today",
    "Weekend Events in Beaumont",
    "Local Plumbers",
    "Food Trucks Near Me"
  ];

  const recentSearches = [
    "Used Cars",
    "Apartments for Rent"
  ];

  // Google-like Results View
  if (hasSearched) {
    return (
      <div className="search-results-layout">
        <div className="search-results-header">
          <div className="search-results-top-row">
            <img 
              src={getHeaderLogo()} 
              alt="Logo" 
              className="search-results-mini-logo" 
              onClick={() => {
                setHasSearched(false);
                setQuery('');
              }}
            />
            <form onSubmit={handleSearchSubmit} className="search-input-wrapper" style={{ margin: 0, flex: 1, maxWidth: '600px' }}>
              <Search className="search-input-icon" />
              <input 
                ref={inputRef}
                type="text" 
                className="search-main-input" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{ height: '44px' }}
              />
            </form>
          </div>
          
          <div className="search-results-tabs">
            <button className={`search-tab-btn ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>All</button>
            <button className={`search-tab-btn ${activeTab === 'stores' ? 'active' : ''}`} onClick={() => setActiveTab('stores')}>Places</button>
            <button className={`search-tab-btn ${activeTab === 'posts' ? 'active' : ''}`} onClick={() => setActiveTab('posts')}>Posts</button>
            <button className={`search-tab-btn ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>Market</button>
            <button className={`search-tab-btn ${activeTab === 'profiles' ? 'active' : ''}`} onClick={() => setActiveTab('profiles')}>People</button>
            <button className={`search-tab-btn ${activeTab === 'media' ? 'active' : ''}`} onClick={() => setActiveTab('media')}>Media</button>
          </div>
        </div>

        <div className="search-results-content">
          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginTop: '40px', color: 'var(--text-muted)' }}>
              <Loader2 className="animate-spin" size={32} color="var(--primary)" />
              <p>Searching the {scope}...</p>
            </div>
          ) : results ? (
            <div className="results-list">
              {/* People */}
              {(activeTab === 'all' || activeTab === 'profiles') && results.profiles?.length > 0 && (
                <div className="results-section-block">
                  <h3 style={{ fontSize: '1.2rem', margin: '0 0 16px', color: 'var(--text)' }}><User size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> People</h3>
                  {results.profiles.map((p: any) => (
                    <div key={p.id} className="search-result-card" onClick={() => handleResultClick('profiles', p)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Avatar url={p.avatar_url} name={p.name} size={40} />
                        <div>
                          <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem', color: 'var(--primary)' }}>{p.name}</h3>
                          <p>{p.role?.replace('_', ' ') || 'Member'} • {p.community || p.county}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Stores */}
              {(activeTab === 'all' || activeTab === 'stores') && results.stores?.length > 0 && (
                <div className="results-section-block" style={{ marginTop: '32px' }}>
                  <h3 style={{ fontSize: '1.2rem', margin: '0 0 16px', color: 'var(--text)' }}><Store size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> Places</h3>
                  {results.stores.map((s: any) => (
                    <div key={s.id} className="search-result-card" onClick={() => handleResultClick('stores', s)}>
                      <h3>{s.name}</h3>
                      <p style={{ color: 'var(--text)', marginBottom: '8px' }}>{s.category || 'Local Business'}</p>
                      <p>{s.description?.substring(0, 150)}...</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Posts */}
              {(activeTab === 'all' || activeTab === 'posts') && results.posts?.length > 0 && (
                <div className="results-section-block" style={{ marginTop: '32px' }}>
                  <h3 style={{ fontSize: '1.2rem', margin: '0 0 16px', color: 'var(--text)' }}><MessageSquare size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> Posts</h3>
                  {results.posts.map((post: any) => (
                    <div key={post.id} className="search-result-card" onClick={() => handleResultClick('posts', post)}>
                      <p style={{ color: 'var(--text)', marginBottom: '8px' }}>{post.content}</p>
                      <p style={{ fontSize: '0.8rem' }}>{new Date(post.created_at).toLocaleDateString()} • {post.type}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Products */}
              {(activeTab === 'all' || activeTab === 'products') && results.products?.length > 0 && (
                <div className="results-section-block" style={{ marginTop: '32px' }}>
                  <h3 style={{ fontSize: '1.2rem', margin: '0 0 16px', color: 'var(--text)' }}><ShoppingBag size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> Market</h3>
                  {results.products.map((pd: any) => (
                    <div key={pd.id} className="search-result-card" onClick={() => handleResultClick('products', pd)}>
                      <h3>{pd.name}</h3>
                      <p style={{ color: 'var(--text)', fontWeight: 'bold', marginBottom: '8px' }}>${pd.price}</p>
                      <p>{pd.description?.substring(0, 100)}</p>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Wiki */}
              {(activeTab === 'all' || activeTab === 'media' || activeTab === 'wiki') && results.wiki?.length > 0 && (
                <div className="results-section-block" style={{ marginTop: '32px' }}>
                  <h3 style={{ fontSize: '1.2rem', margin: '0 0 16px', color: 'var(--text)' }}><Globe size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> Web & Media</h3>
                  {results.wiki.map((w: any) => (
                    <div key={w.id} className="search-result-card" onClick={() => handleResultClick('wiki', w)}>
                      <h3 style={{ color: '#3b82f6' }}>{w.title}</h3>
                      {w.url && <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '8px' }}>{w.url}</p>}
                      <p>{w.description?.substring(0, 150)}...</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="search-empty">
              <p>No results found for "{query}"</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Classic Landing Page Mode
  return (
    <div className="search-view-container">
      <motion.div 
        className="search-view-content"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="search-logo-wrapper">
          <img src={getHeaderLogo()} alt="SETX 360 Logo" className="search-main-logo" />
        </div>
        
        <form className="search-input-wrapper" onSubmit={handleSearchSubmit}>
          <Search className="search-input-icon" />
          <input 
            type="text" 
            className="search-main-input" 
            placeholder={`Search ${scope === 'city' ? user?.community || 'Local' : 'SETX'}...`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>

        <div className="search-action-buttons">
          <button className="search-btn" onClick={handleSearchSubmit}>SETX Search</button>
          <button className="search-btn" onClick={() => onNavigate('discover')}>I'm Feeling Lucky</button>
        </div>

        <div className="search-quick-links">
          {quickLinks.map((link) => (
            <button 
              key={link.env} 
              className="quick-link-pill" 
              onClick={() => onNavigate(link.env)}
            >
              {link.icon} {link.label}
            </button>
          ))}
        </div>

        <div className="search-zero-state">
          <div className="zero-state-section">
            <h3 className="zero-state-title"><History size={14} /> Recent</h3>
            <div className="zero-state-tags">
              {recentSearches.map(s => (
                <span key={s} className="zero-state-tag" onClick={() => {
                  setQuery(s);
                  setTimeout(() => handleSearchSubmit(), 100);
                }}>{s}</span>
              ))}
            </div>
          </div>
          
          <div className="zero-state-section">
            <h3 className="zero-state-title"><TrendingUp size={14} /> Trending in {scope === 'city' ? user?.community || 'your area' : 'SETX'}</h3>
            <div className="zero-state-tags">
              {trendingSearches.map(s => (
                <span key={s} className="zero-state-tag trending" onClick={() => {
                  setQuery(s);
                  setTimeout(() => handleSearchSubmit(), 100);
                }}>{s}</span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
