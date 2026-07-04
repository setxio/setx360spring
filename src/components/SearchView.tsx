import React, { useState, useRef, useEffect } from 'react';
import { Search, Compass, Rss, Store, Calendar, Zap, TrendingUp, History, User, Users, MessageSquare, ShoppingBag, Globe, ArrowRight, Loader2, Play, ExternalLink, Image as ImageIcon, Video, MapPin, X, Moon, Sun } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { Avatar } from './Avatar';
import './SearchView.css';
import { WikiArticleView } from './wiki/WikiArticleView';
import { WikiEditModal } from './wiki/WikiEditModal';

interface SearchViewProps {
  user: any;
  scope: string;
  onNavigate: (env: string, tab?: number, params?: any) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({ user, scope, onNavigate }) => {
  const { theme, isSetxIO, toggleTheme, masterSearchQuery, setMasterSearchQuery } = useApp();
  const [query, setQuery] = useState(masterSearchQuery || '');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedWikiItem, setSelectedWikiItem] = useState<any>(null);
  const [wikiDetails, setWikiDetails] = useState<any>(null);
  const [isWikiLoading, setIsWikiLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [articleToEdit, setArticleToEdit] = useState<any>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);

  const getHeaderLogo = () => {
    if (theme.startsWith('io-')) return '/logo-io.png';
    if (theme.startsWith('neo')) return '/logo-neo.png';
    if (theme.startsWith('twilight')) return '/logo-twilight.png';
    if (theme.startsWith('efutura')) return '/logo-efutura.png';
    return theme.includes('light') ? '/logo-setx-blue.png' : '/logo-setx-transparent.png';
  };

  useEffect(() => {
    if (masterSearchQuery) {
      setQuery(masterSearchQuery);
      handleSearchSubmit(undefined, masterSearchQuery);
      setMasterSearchQuery(''); // Clear it so it doesn't fire repeatedly
    }
  }, [masterSearchQuery]);

  const handleSearchSubmit = async (e?: React.FormEvent, forceQuery?: string) => {
    if (e) e.preventDefault();
    const activeQuery = forceQuery !== undefined ? forceQuery : query;
    if (!activeQuery.trim()) {
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
          query: activeQuery,
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

  const handleWikiClick = async (item: any) => {
    setSelectedWikiItem(item);
    setWikiDetails(null);
    setIsWikiLoading(true);
    try {
      const { data, error } = await supabase
        .from('wiki_articles')
        .select('*')
        .eq('id', item.id)
        .single();
      
      if (error) throw error;
      setWikiDetails(data);
    } catch (err) {
      console.error('Failed to fetch wiki details:', err);
    } finally {
      setIsWikiLoading(false);
    }
  };

  const handleResultClick = (type: string, item: any) => {
    if (type === 'wiki' && (item.type === 'wiki_profile' || item.type === 'wiki_event' || item.type === 'wiki_article')) {
      handleWikiClick(item);
      return;
    }

    switch (type) {
      case 'profiles':
        onNavigate('social', 2, { userId: item.id });
        break;
      case 'groups':
        onNavigate('social', 3, { groupId: item.id });
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
      <div className="search-results-layout" style={{ position: 'relative' }}>
        <button 
          onClick={toggleTheme}
          style={{ position: 'absolute', top: '20px', right: '20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 1000, color: 'var(--text)' }}
        >
          {theme.includes('dark') ? <Sun size={20} /> : <Moon size={20} />}
        </button>
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
            <button className={`search-tab-btn ${activeTab === 'web' ? 'active' : ''}`} onClick={() => setActiveTab('web')}>Web</button>
            <button className={`search-tab-btn ${activeTab === 'posts' ? 'active' : ''}`} onClick={() => setActiveTab('posts')}>Posts</button>
            <button className={`search-tab-btn ${activeTab === 'images' ? 'active' : ''}`} onClick={() => setActiveTab('images')}>Images</button>
            <button className={`search-tab-btn ${activeTab === 'videos' ? 'active' : ''}`} onClick={() => setActiveTab('videos')}>Videos</button>
            <button className={`search-tab-btn ${activeTab === 'wiki' ? 'active' : ''}`} onClick={() => setActiveTab('wiki')}>Wiki</button>
            <button className={`search-tab-btn ${activeTab === 'profiles' ? 'active' : ''}`} onClick={() => setActiveTab('profiles')}>People</button>
            <button className={`search-tab-btn ${activeTab === 'stores' ? 'active' : ''}`} onClick={() => setActiveTab('stores')}>Places</button>
            <button className={`search-tab-btn ${activeTab === 'groups' ? 'active' : ''}`} onClick={() => setActiveTab('groups')}>Groups</button>
            <button className={`search-tab-btn ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>Products</button>
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
              {/* Knowledge Panel (Wiki Match) */}
              {activeTab === 'all' && results.wiki?.find((w: any) => !w.url) && (() => {
                const topWiki = results.wiki.find((w: any) => !w.url);
                return (
                  <div className="search-result-card knowledge-panel-card" onClick={() => handleResultClick('wiki', topWiki)}>
                    {topWiki.image_url && (
                      <img src={topWiki.image_url} alt={topWiki.title} className="knowledge-panel-image" />
                    )}
                    <div className="knowledge-panel-content">
                      <div className="knowledge-panel-header">
                        <h2 className="knowledge-panel-title">{topWiki.title}</h2>
                        <span className="knowledge-panel-badge">Knowledge Panel</span>
                      </div>
                      <p className="knowledge-panel-desc">{topWiki.description?.substring(0, 300)}...</p>
                      <button className="knowledge-panel-btn">
                        <Globe size={16} /> Explore Full Wiki
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* People */}
              {(activeTab === 'all' || activeTab === 'profiles') && results.profiles?.length > 0 && (
                <div className="results-section-block">
                  <h3 className="results-section-title"><User size={18} /> People</h3>
                  {results.profiles.map((p: any) => (
                    <div key={p.id} className="search-result-card" onClick={() => handleResultClick('profiles', p)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Avatar url={p.avatar_url} name={p.name} size={40} />
                        <div>
                          <h3>{p.name}</h3>
                          <p>{p.role?.replace('_', ' ') || 'Member'} • {p.community || p.county}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Stores */}
              {(activeTab === 'all' || activeTab === 'stores') && results.stores?.length > 0 && (
                <div className="results-section-block">
                  <h3 className="results-section-title"><Store size={18} /> Places</h3>
                  {results.stores.map((s: any) => (
                    <div key={s.id} className="search-result-card" onClick={() => handleResultClick('stores', s)}>
                      <h3>{s.name}</h3>
                      <p style={{ color: 'var(--text)', marginBottom: 'var(--sp-2)' }}>{s.category || 'Local Business'}</p>
                      <p>{s.description?.substring(0, 150)}...</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Groups */}
              {(activeTab === 'all' || activeTab === 'groups') && results.groups?.length > 0 && (
                <div className="results-section-block">
                  <h3 className="results-section-title"><Users size={18} /> Groups</h3>
                  {results.groups.map((g: any) => (
                    <div key={g.id} className="search-result-card" onClick={() => handleResultClick('groups', g)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
                        <Avatar url={g.avatar_url || g.image_url} name={g.name} size={40} />
                        <div>
                          <h3>{g.name}</h3>
                          <p>{(g.description || g.content)?.substring(0, 100)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Posts */}
              {(activeTab === 'all' || activeTab === 'posts') && results.posts?.length > 0 && (
                <div className="results-section-block">
                  <h3 className="results-section-title"><MessageSquare size={18} /> Posts</h3>
                  {results.posts.map((post: any) => (
                    <div key={post.id} className="search-result-card" onClick={() => handleResultClick('posts', post)}>
                      <p style={{ color: 'var(--text)', marginBottom: 'var(--sp-2)' }}>{post.content}</p>
                      <p>{new Date(post.created_at).toLocaleDateString()} • {post.type}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Products */}
              {(activeTab === 'all' || activeTab === 'products') && results.products?.length > 0 && (
                <div className="results-section-block">
                  <h3 className="results-section-title"><ShoppingBag size={18} /> Products</h3>
                  {results.products.map((pd: any) => (
                    <div key={pd.id} className="search-result-card" onClick={() => handleResultClick('products', pd)}>
                      <h3>{pd.name}</h3>
                      <p style={{ color: 'var(--text)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--sp-2)' }}>${pd.price}</p>
                      <p>{pd.description?.substring(0, 100)}</p>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Web */}
              {(activeTab === 'all' || activeTab === 'web') && results.wiki?.filter((w: any) => !!w.url)?.length > 0 && (
                <div className="results-section-block">
                  <h3 className="results-section-title"><ExternalLink size={18} /> Web</h3>
                  {results.wiki.filter((w: any) => !!w.url).map((w: any) => (
                    <a
                      key={w.id}
                      href={w.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="search-result-card"
                      style={{ display: 'block', textDecoration: 'none' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', marginBottom: 'var(--sp-1)' }}>
                        <h3 style={{ color: '#3b82f6', margin: 0, textDecoration: 'underline' }}>{w.title}</h3>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--sp-1)', fontSize: 'var(--text-2xs)', fontWeight: 600, background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: 'var(--sp-0-5) var(--sp-1-5)', borderRadius: 'var(--radius-xs)', textTransform: 'uppercase' }}>
                          <ExternalLink size={10} /> External
                        </span>
                      </div>
                      <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', marginBottom: 'var(--sp-2)' }}>{w.url}</p>
                      <p style={{ color: 'var(--text)', textDecoration: 'none' }}>{w.description?.substring(0, 150)}...</p>
                    </a>
                  ))}
                </div>
              )}

              {/* Wiki */}
              {(activeTab === 'all' || activeTab === 'wiki') && results.wiki?.filter((w: any) => !w.url).length > 0 && (() => {
                const wikiResults = results.wiki.filter((w: any) => !w.url);
                const filteredWiki = activeTab === 'all' ? wikiResults.slice(1) : wikiResults; // Skip top wiki in "All" tab since it's the Knowledge Panel
                
                if (filteredWiki.length === 0) return null;
                
                return (
                  <div className="results-section-block">
                    <h3 className="results-section-title"><Globe size={18} /> Wiki</h3>
                    {filteredWiki.map((w: any) => (
                      <div 
                        key={w.id} 
                        className="search-result-card" 
                        onClick={() => handleResultClick('wiki', w)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <h3 style={{ color: '#3b82f6', margin: 0 }}>{w.title}</h3>
                        </div>
                        <p style={{ color: 'var(--text)', textDecoration: 'none' }}>{w.description?.substring(0, 150)}...</p>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Images */}
              {(activeTab === 'images') && (
                <div className="results-section-block">
                  <h3 className="results-section-title"><ImageIcon size={18} /> Images</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px' }}>
                    {/* Gather images from profiles, stores, events, and wiki */}
                    {[
                      ...(results.profiles || []).map((p: any) => ({ ...p, _type: 'profiles', _img: p.avatar_url })),
                      ...(results.stores || []).map((s: any) => ({ ...s, _type: 'stores', _img: s.image_url || s.logo_url })),
                      ...(results.events || []).map((e: any) => ({ ...e, _type: 'events', _img: e.image_url })),
                      ...(results.wiki || []).map((w: any) => ({ ...w, _type: 'wiki', _img: w.url?.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? w.url : w.image_url }))
                    ].filter(i => !!i._img).map((item, idx) => (
                      <div key={`img-${idx}`} className="search-result-card" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }} onClick={() => handleResultClick(item._type, item)}>
                        <img src={item._img} alt={item.title || item.name} style={{ width: '100%', height: '150px', objectFit: 'cover', display: 'block' }} />
                        <div style={{ padding: '8px', fontSize: '0.8rem', background: 'var(--bg-card)' }}>
                          <p style={{ margin: 0, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title || item.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Videos */}
              {(activeTab === 'videos') && (
                <div className="results-section-block">
                  <h3 className="results-section-title"><Video size={18} /> Videos</h3>
                  {/* Gather videos from wiki and posts (if they contain video links) */}
                  {[
                    ...(results.wiki || []).filter((w: any) => w.url?.match(/(youtube\.com|youtu\.be|vimeo\.com|\.(mp4|webm|mov))/i)).map((w: any) => ({ ...w, _type: 'wiki' })),
                    ...(results.posts || []).filter((p: any) => p.content?.match(/(youtube\.com|youtu\.be|vimeo\.com|\.(mp4|webm|mov))/i)).map((p: any) => ({ ...p, _type: 'posts' }))
                  ].map((v, idx) => (
                    <div key={`vid-${idx}`} className="search-result-card" onClick={() => handleResultClick(v._type, v)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <Play size={16} color="#ef4444" />
                        <h3 style={{ margin: 0 }}>{v.title || 'Video Post'}</h3>
                      </div>
                      {v.url && <p style={{ color: '#3b82f6', fontSize: '0.8rem', marginBottom: '8px' }}>{v.url}</p>}
                      <p>{(v.description || v.content)?.substring(0, 150)}...</p>
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
    <div className="search-view-container" style={{ position: 'relative' }}>
      <button 
        onClick={toggleTheme}
        style={{ position: 'absolute', top: '20px', right: '20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 1000, color: 'var(--text)' }}
      >
        {theme.includes('dark') ? <Sun size={20} /> : <Moon size={20} />}
      </button>
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

      {/* Wiki Details Modal */}
      <AnimatePresence>
        {selectedWikiItem && (
          <div className="wiki-detail-modal-backdrop" onClick={(e) => { e.stopPropagation(); setSelectedWikiItem(null); }} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 16 }}>
            <motion.div 
              className="wiki-detail-modal-container glass"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              style={{ width: '100%', maxWidth: '1100px', height: '90vh', overflowY: 'auto', background: 'var(--bg-soft)', borderRadius: 20, border: '1px solid var(--border)', position: 'relative', padding: 24 }}
            >
              <button className="wiki-detail-close" onClick={() => setSelectedWikiItem(null)} style={{ position: 'absolute', top: 20, right: 20, zIndex: 10, background: 'transparent', border: 'none', color: 'var(--text)', cursor: 'pointer' }}>
                <X size={20} />
              </button>

              {isWikiLoading ? (
                <div className="wiki-detail-loader" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <Loader2 className="animate-spin" size={32} />
                  <p style={{ marginTop: 12 }}>Loading historical records...</p>
                </div>
              ) : wikiDetails ? (
                <div className="wiki-detail-content" style={{ marginTop: 20 }}>
                  <WikiArticleView
                    article={wikiDetails}
                    user={user}
                    onBack={() => setSelectedWikiItem(null)}
                    onEdit={(art) => {
                      setArticleToEdit(art);
                      setIsEditModalOpen(true);
                    }}
                  />
                </div>
              ) : (
                <div className="wiki-detail-error" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <p>Failed to retrieve records. Please try again.</p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {isEditModalOpen && (
        <WikiEditModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setArticleToEdit(null);
            if (selectedWikiItem) {
              handleWikiClick(selectedWikiItem); // refresh detail view
            }
          }}
          article={articleToEdit}
          user={user}
        />
      )}
    </div>
  );
};
