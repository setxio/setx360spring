import React, { useState, useEffect, useRef } from 'react';
import { Search, Moon, Sun, Users, Store, Compass, Calendar, Zap, Car, Wrench, Wallet, Heart, Building, Plane, Briefcase, Tv, Palette, Book, Activity, Newspaper, Globe, Loader2, User, MessageSquare, ShoppingBag, ExternalLink, Image as ImageIcon, Video, Play, X, Phone, LayoutGrid, CloudSun, Music, Droplets, Wind, Thermometer, SkipBack, SkipForward, Pause, ChevronDown, MessageCircle, AlertTriangle, Bell, Shield, Settings, LogOut, Power, HeartHandshake, HandHeart, Home, Landmark, Map, Utensils, Contact, Star, Trophy } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { Avatar } from './Avatar';
import { WikiArticleView } from './wiki/WikiArticleView';
import { WikiEditModal } from './wiki/WikiEditModal';
import { getPreviewWeather } from '../lib/weatherService';
import { WeatherForecastModal } from './WeatherForecastModal';


import './HomeView.css';
import './SearchView.css';

interface HomeViewProps {
  user: any;
  scope: string;
  onNavigate: (env: string, tab?: number, params?: any) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ user, scope, onNavigate }) => {
  const { theme, toggleTheme, logout } = useApp();
  const [query, setQuery] = useState('');
  const [isWeatherModalOpen, setIsWeatherModalOpen] = useState(false);
  // Search state
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  
  // Wiki state
  const [selectedWikiItem, setSelectedWikiItem] = useState<any>(null);
  const [wikiDetails, setWikiDetails] = useState<any>(null);
  const [isWikiLoading, setIsWikiLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [articleToEdit, setArticleToEdit] = useState<any>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // New states for Mobile Redesign
  const [weather, setWeather] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);

  const [showAlertWidget, setShowAlertWidget] = useState(false);
  const [showLiveWidget, setShowLiveWidget] = useState(false);
  const [adminBroadcasts, setAdminBroadcasts] = useState<any[]>([]);
  const [showDemoModal, setShowDemoModal] = useState(false);

  const { currentSong, isPlaying, togglePlay, setIsQueueModalOpen } = useApp();



  // Folders definition
  const folderConfig = [
    { id: 'social_comms', label: 'Social & Comms', items: ['social', 'discover', 'contacts', 'messages', 'phone', 'proplus'] },
    { id: 'market_shops', label: 'Market & Shops', items: ['market', 'wallet', 'classifieds', 'jobs', 'gigs'] },
    { id: 'media_events', label: 'Media & Events', items: ['stadium', 'videos', 'music', 'events', 'eats', 'art', 'faith', 'sports'] },
    { id: 'tools_services', label: 'Tools & Services', items: ['services', 'page_creator', 'page_manager', 'care', 'crowdfund', 'charity', 'homes', 'auto', 'travel', 'news', 'civics', 'settings', 'logout'] }
  ];
  // Swipe logic
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchEndY, setTouchEndY] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEndX(null); // otherwise the swipe is fired even with usual touch events
    setTouchEndY(null);
    setTouchStartX(e.targetTouches[0].clientX);
    setTouchStartY(e.targetTouches[0].clientY);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
    setTouchEndY(e.targetTouches[0].clientY);
  };

  const onTouchEnd = () => {
    if (!touchStartX || !touchEndX || !touchStartY || !touchEndY) return;
    const distanceX = touchStartX - touchEndX;
    const distanceY = touchStartY - touchEndY;
    
    // Check if it's primarily a vertical or horizontal swipe
    if (Math.abs(distanceX) > Math.abs(distanceY)) {
      const isRightSwipe = distanceX < -minSwipeDistance;
      if (isRightSwipe) {
        onNavigate('discover');
      }
    } else {
      const isUpSwipe = distanceY > minSwipeDistance;
      const isDownSwipe = distanceY < -minSwipeDistance;

      if (isDrawerOpen && isDownSwipe) {
        setIsDrawerOpen(false);
      } else if (!isDrawerOpen && isUpSwipe) {
        setIsDrawerOpen(true);
      }
    }
  };

  const getHeaderLogo = () => {
    if (theme.startsWith('io-')) return '/logo-io.png';
    if (theme.startsWith('neo')) return '/logo-neo.png';
    if (theme.startsWith('twilight')) return '/logo-twilight.png';
    if (theme.startsWith('efutura')) return '/logo-efutura.png';
    return theme.includes('light') ? '/logo-setx-blue.png' : '/logo-setx-transparent.png';
  };

  const defaultPlatforms = [
    { id: 'social', label: 'Social', icon: <Users size={32} strokeWidth={1.5} />, gradient: 'linear-gradient(135deg, #8b5cf6, #3b82f6)' },
    { id: 'market', label: 'Market', icon: <Store size={32} strokeWidth={1.5} />, gradient: 'linear-gradient(135deg, #3b82f6, #0ea5e9)' },
    { id: 'discover', label: 'Discover', icon: <Compass size={32} strokeWidth={1.5} />, gradient: 'linear-gradient(135deg, #0ea5e9, #a855f7)' },
    { id: 'events', label: 'Events', icon: <Calendar size={32} strokeWidth={1.5} />, gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)' },
    { id: 'eats', label: 'Eats', icon: <Utensils size={32} strokeWidth={1.5} />, gradient: 'linear-gradient(135deg, #f97316, #facc15)' },
    { id: 'rides', label: 'Rides', icon: <Map size={32} strokeWidth={1.5} />, gradient: 'linear-gradient(135deg, #eab308, #f59e0b)' },
    { id: 'services', label: 'Services', icon: <Wrench size={32} strokeWidth={1.5} />, gradient: 'linear-gradient(135deg, #64748b, #334155)' },
    { id: 'wallet', label: 'Wallet', icon: <Wallet size={32} strokeWidth={1.5} />, gradient: 'linear-gradient(135deg, #22d3ee, #0284c7)' },
    { id: 'classifieds', label: 'Classifieds', icon: <ShoppingBag size={32} strokeWidth={1.5} />, gradient: 'linear-gradient(135deg, #8b5cf6, #ec4899)' },
    { id: 'care', label: 'Care', icon: <Heart size={32} strokeWidth={1.5} />, gradient: 'linear-gradient(135deg, #f43f5e, #be123c)' },
    { id: 'homes', label: 'Homes', icon: <Home size={32} strokeWidth={1.5} />, gradient: 'linear-gradient(135deg, #2dd4bf, #0f766e)' },
    { id: 'auto', label: 'Auto', icon: <Car size={32} strokeWidth={1.5} />, gradient: 'linear-gradient(135deg, #94a3b8, #475569)' },
    { id: 'travel', label: 'Travel', icon: <Plane size={32} strokeWidth={1.5} />, gradient: 'linear-gradient(135deg, #84cc16, #4d7c0f)' },
    { id: 'jobs', label: 'Jobs', icon: <Briefcase size={32} strokeWidth={1.5} />, gradient: 'linear-gradient(135deg, #3b82f6, #1e3a8a)' },
    { id: 'gigs', label: 'Gigs', icon: <Zap size={32} strokeWidth={1.5} />, gradient: 'linear-gradient(135deg, #fbbf24, #d97706)' },
    { id: 'videos', label: 'Videos', icon: <Tv size={32} strokeWidth={1.5} />, gradient: 'linear-gradient(135deg, #ef4444, #b91c1c)' },
    { id: 'music', label: 'Music', icon: <Music size={32} strokeWidth={1.5} />, gradient: 'linear-gradient(135deg, #8b5cf6, #5b21b6)' },
    { id: 'art', label: 'Art', icon: <Palette size={32} strokeWidth={1.5} />, gradient: 'linear-gradient(135deg, #d946ef, #a21caf)' },
    { id: 'faith', label: 'Faith', icon: <Book size={32} strokeWidth={1.5} />, gradient: 'linear-gradient(135deg, #a855f7, #6d28d9)' },
    { id: 'sports', label: 'Sports', icon: <Trophy size={32} strokeWidth={1.5} />, gradient: 'linear-gradient(135deg, #ea580c, #9a3412)' },
    { id: 'news', label: 'News', icon: <Newspaper size={32} strokeWidth={1.5} />, gradient: 'linear-gradient(135deg, #60a5fa, #1d4ed8)' },
    { id: 'civics', label: 'Civics', icon: <Landmark size={32} strokeWidth={1.5} />, gradient: 'linear-gradient(135deg, #cbd5e1, #64748b)' },
    { id: 'phone', label: 'Phone', icon: <Phone size={32} strokeWidth={1.5} />, gradient: 'linear-gradient(135deg, #22c55e, #16a34a)' },
    { id: 'contacts', label: 'Contacts', icon: <Contact size={32} strokeWidth={1.5} />, gradient: 'linear-gradient(135deg, #fb923c, #c2410c)' },
    { id: 'messages', label: 'Messages', icon: <MessageCircle size={32} strokeWidth={1.5} />, gradient: 'linear-gradient(135deg, #f472b6, #db2777)' },
    { id: 'proplus', label: 'Connect', icon: <Star size={32} strokeWidth={1.5} />, gradient: 'linear-gradient(135deg, #0284c7, #0ea5e9)' },
    { id: 'page_creator', label: 'Create Page', icon: <LayoutGrid size={32} strokeWidth={1.5} />, gradient: 'linear-gradient(135deg, #10b981, #059669)' },
    { id: 'page_manager', label: 'Page Manager', icon: <Briefcase size={32} strokeWidth={1.5} />, gradient: 'linear-gradient(135deg, #6366f1, #4338ca)' },
    { id: 'admin_messages', label: 'Admin Msgs', icon: <MessageSquare size={32} strokeWidth={1.5} />, gradient: 'linear-gradient(135deg, #f43f5e, #be123c)' },
    { id: 'crowdfund', label: 'CrowdFund', icon: <HeartHandshake size={32} strokeWidth={1.5} />, gradient: 'linear-gradient(135deg, #10b981, #047857)' },
    { id: 'charity', label: 'Charities', icon: <HandHeart size={32} strokeWidth={1.5} />, gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' },
    { id: 'me', label: 'Me Portal', icon: <User size={32} strokeWidth={1.5} />, gradient: 'linear-gradient(135deg, #a855f7, #ec4899)' },
    { id: 'settings', label: 'Settings', icon: <Settings size={32} strokeWidth={1.5} />, gradient: 'linear-gradient(135deg, #64748b, #475569)' },
    { id: 'stadium', label: 'Stadium', icon: <Globe size={32} strokeWidth={1.5} />, gradient: 'linear-gradient(135deg, #10b981, #3b82f6)' },
    { id: 'logout', label: 'Sign Out', icon: <Power size={32} strokeWidth={1.5} color="#ef4444" />, gradient: 'linear-gradient(135deg, #1f2937, #000000)' }
  ].sort((a, b) => a.label.localeCompare(b.label));

  const [sortedPlatforms, setSortedPlatforms] = useState(defaultPlatforms);

  useEffect(() => {
    // Demo Modal
    if (!localStorage.getItem('setx_demo_seen')) {
      setShowDemoModal(true);
    }

    // Load app usage stats to sort platforms
    const usageStr = localStorage.getItem('setx_app_usage');
    if (usageStr) {
      try {
        const usage = JSON.parse(usageStr);
        const sorted = [...defaultPlatforms].sort((a, b) => {
          const aCount = usage[a.id] || 0;
          const bCount = usage[b.id] || 0;
          if (bCount !== aCount) {
            return bCount - aCount;
          }
          return a.label.localeCompare(b.label);
        });
        setSortedPlatforms(sorted);
      } catch (err) {
        console.error('Failed to parse app usage', err);
      }
    }

    // Fetch Admin Broadcasts
    const fetchBroadcasts = async () => {
      const { data } = await supabase.from('admin_broadcasts').select('*').eq('active', true).order('created_at', { ascending: false });
      if (data && data.length > 0) {
        setAdminBroadcasts(data);
        setShowAlertWidget(data.some(b => b.type === 'alert'));
        setShowLiveWidget(data.some(b => b.type === 'info'));
      }
    };
    fetchBroadcasts();

    // Fetch Weather
    const loadWeather = async () => {
      try {
        const w = await getPreviewWeather();
        setWeather(w);
      } catch (e) {
        console.error("Failed to load weather", e);
      }
    };
    loadWeather();
  }, [theme]);

  const handleAppClick = (id: string) => {
    // Increment usage
    const usageStr = localStorage.getItem('setx_app_usage');
    let usage: Record<string, number> = {};
    if (usageStr) {
      try {
        usage = JSON.parse(usageStr);
      } catch (e) {}
    }
    usage[id] = (usage[id] || 0) + 1;
    localStorage.setItem('setx_app_usage', JSON.stringify(usage));
    
    // Navigate
    if (id === 'logout') {
      // logout is already imported via useApp() at the top of the component
      logout();
      return;
    }

    if (id === 'settings') {
      onNavigate('me', 6);
    } else {
      onNavigate(id);
    }
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

              {/* Groups */}
              {(activeTab === 'all' || activeTab === 'groups') && results.groups?.length > 0 && (
                <div className="results-section-block" style={{ marginTop: '32px' }}>
                  <h3 style={{ fontSize: '1.2rem', margin: '0 0 16px', color: 'var(--text)' }}><Users size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> Groups</h3>
                  {results.groups.map((g: any) => (
                    <div key={g.id} className="search-result-card" onClick={() => handleResultClick('groups', g)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Avatar url={g.avatar_url || g.image_url} name={g.name} size={40} />
                        <div>
                          <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem', color: 'var(--primary)' }}>{g.name}</h3>
                          <p>{(g.description || g.content)?.substring(0, 100)}</p>
                        </div>
                      </div>
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
                  <h3 style={{ fontSize: '1.2rem', margin: '0 0 16px', color: 'var(--text)' }}><ShoppingBag size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> Products</h3>
                  {results.products.map((pd: any) => (
                    <div key={pd.id} className="search-result-card" onClick={() => handleResultClick('products', pd)}>
                      <h3>{pd.name}</h3>
                      <p style={{ color: 'var(--text)', fontWeight: 'bold', marginBottom: '8px' }}>${pd.price}</p>
                      <p>{pd.description?.substring(0, 100)}</p>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Web */}
              {(activeTab === 'all' || activeTab === 'web') && results.wiki?.filter((w: any) => !!w.url)?.length > 0 && (
                <div className="results-section-block" style={{ marginTop: '32px' }}>
                  <h3 style={{ fontSize: '1.2rem', margin: '0 0 16px', color: 'var(--text)' }}><ExternalLink size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> Web</h3>
                  {results.wiki.filter((w: any) => !!w.url).map((w: any) => (
                    <a 
                      key={w.id} 
                      href={w.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="search-result-card" 
                      style={{ display: 'block', textDecoration: 'none' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <h3 style={{ color: '#3b82f6', margin: 0, textDecoration: 'underline' }}>{w.title}</h3>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', fontWeight: 600, background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
                          <ExternalLink size={10} /> External
                        </span>
                      </div>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '8px' }}>{w.url}</p>
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
                  <div className="results-section-block" style={{ marginTop: '32px' }}>
                    <h3 style={{ fontSize: '1.2rem', margin: '0 0 16px', color: 'var(--text)' }}><Globe size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> Wiki</h3>
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
                <div className="results-section-block" style={{ marginTop: '32px' }}>
                  <h3 style={{ fontSize: '1.2rem', margin: '0 0 16px', color: 'var(--text)' }}><ImageIcon size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> Images</h3>
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
                <div className="results-section-block" style={{ marginTop: '32px' }}>
                  <h3 style={{ fontSize: '1.2rem', margin: '0 0 16px', color: 'var(--text)' }}><Video size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> Videos</h3>
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
  

  return (
    <div 
      className="home-view-container"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >

      {/* Demo Mode Modal */}
      {showDemoModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}>
          <div style={{ background: 'var(--bg-card)', padding: '40px', borderRadius: '24px', maxWidth: '400px', width: '90%', textAlign: 'center', border: '1px solid var(--border)' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Compass size={32} color="var(--primary)" />
            </div>
            <h2 style={{ margin: '0 0 16px', fontSize: '1.5rem', fontWeight: 900 }}>Welcome to SETX 360</h2>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '32px' }}>
              This environment is for <strong>demo purposes only</strong>. Currently, <strong style={{ color: 'var(--text)' }}>Social</strong> and <strong style={{ color: 'var(--text)' }}>Classifieds</strong> are the only two apps that fully work.
            </p>
            <button 
              className="primary-btn" 
              onClick={() => {
                localStorage.setItem('setx_demo_seen', 'true');
                setShowDemoModal(false);
              }}
              style={{ width: '100%', padding: '16px' }}
            >
              Got it, let's explore!
            </button>
          </div>
        </div>
      )}

      <div className="home-top-bar-strobe"></div>
      <motion.div 
        className="home-view-content"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="home-header">
          <div style={{ flex: 1 }} /> {/* Flexible spacer to balance the right controls */}
          
          <div className="home-logo-wrapper" style={{ flex: 'none' }}>
            <div style={{ position: 'relative', width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', boxShadow: theme.endsWith('-dark') ? `0 0 25px 2px var(--primary)` : 'none' }}>
              <img src={getHeaderLogo()} alt="SETX 360 Logo" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'contain', zIndex: 1 }} />
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', gap: '8px', zIndex: 10, justifyContent: 'flex-end' }}>
            {user?.role === 'admin' && (
              <button 
                onClick={() => onNavigate('admin')}
                className="home-theme-toggle"
                title="Admin Dashboard"
              >
                <Shield size={20} color="#ef4444" />
              </button>
            )}
            
            <button 
              onClick={() => onNavigate('notifications')}
              className="home-theme-toggle"
              title="Notifications"
            >
              <Bell size={20} />
            </button>

            <button 
              onClick={toggleTheme}
              className="home-theme-toggle"
              title="Toggle Theme"
            >
              {theme.includes('dark') ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>
        {/* Dynamic Greeting */}
        <div style={{ padding: '0 24px', marginTop: '16px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {new Date().getHours() < 12 ? <Sun size={24} color="#f59e0b" /> : new Date().getHours() < 18 ? <CloudSun size={24} color="#f97316" /> : <Moon size={24} color="#6366f1" />}
          <h2 style={{ fontSize: '1.5rem', margin: 0, fontWeight: 700, color: 'var(--text)' }}>
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, {user?.name?.split(' ')[0] || 'James'}
          </h2>
        </div>

        <form className="home-input-wrapper" onSubmit={handleSearchSubmit}>
          <Search className="home-input-icon" />
          <input 
            type="text" 
            className="home-main-input" 
            placeholder={`Search ${scope === 'city' ? user?.community || 'Local' : 'SETX'}...`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>

        {/* WIDGETS */}
        <div className="home-widgets-container">
          <div 
            className="weather-widget" 
            onClick={() => setIsWeatherModalOpen(true)}
            style={{ cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px', fontWeight: 600 }}>
                  {weather?.locationName || 'Local Area'}
                </span>
                <h3 style={{ margin: '0 0 4px', fontSize: '1.2rem', color: 'var(--text)' }}>{weather?.current?.temp || 76}°</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{weather?.current?.condition || 'Mostly Sunny'}</span>
              </div>
              <CloudSun size={24} color="var(--primary)" />
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '12px' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Thermometer size={12}/> H:{weather?.current?.high || 82}° L:{weather?.current?.low || 68}°</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Droplets size={12}/> {weather?.current?.humidity || 45}%</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Wind size={12}/> {weather?.current?.wind || 12} mph</span>
              </div>
            </div>
          </div>

          <div className="music-widget">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Music size={16} color="var(--primary)" />
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)' }}>SETX Radio</span>
              </div>
            </div>
            <div 
              style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}
              onClick={() => setIsQueueModalOpen(true)}
            >
              <div style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: 'var(--bg-secondary)', backgroundImage: `url(${currentSong?.cover || 'https://images.unsplash.com/photo-1459749411177-042180ce673c?auto=format&fit=crop&q=80&w=300'})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ margin: '0 0 4px', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 600 }}>{currentSong?.title || 'Neon Dreams'}</p>
                <p style={{ margin: 0, fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentSong?.artist || 'Local Synthwave'}</p>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px' }}>
              <Heart size={20} color="var(--text-muted)" style={{ cursor: 'pointer' }} />
              <SkipBack size={20} color="var(--text)" style={{ cursor: 'pointer' }} />
              <div 
                style={{ background: 'var(--primary)', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                onClick={togglePlay}
              >
                {isPlaying ? <Pause size={18} color="#fff" /> : <Play size={18} color="#fff" style={{ marginLeft: '2px' }} />}
              </div>
              <SkipForward size={20} color="var(--text)" style={{ cursor: 'pointer' }} />
            </div>
          </div>
        </div>

        {/* SECRET WIDGETS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: (showAlertWidget || showLiveWidget) ? '24px' : '0' }}>
          {adminBroadcasts.filter(b => b.type === 'alert').map((b, idx) => (
            <motion.div
              key={b.id || idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="secret-widget alert-widget"
              style={{ position: 'relative', overflow: 'hidden', padding: '24px', borderRadius: '24px', background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.05))', border: '1px solid rgba(239, 68, 68, 0.2)', boxShadow: '0 8px 32px rgba(239,68,68,0.1)' }}
            >
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <AlertTriangle size={24} color="#ef4444" />
                </div>
                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem', color: '#fca5a5', fontWeight: 800 }}>System Alert</h3>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text)', opacity: 0.9, lineHeight: 1.5 }}>
                    {b.message}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}

          {adminBroadcasts.filter(b => b.type === 'info').map((b, idx) => (
            <motion.div
              key={b.id || idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="secret-widget live-widget"
              style={{ position: 'relative', overflow: 'hidden', padding: '24px', borderRadius: '24px', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(37, 99, 235, 0.05))', border: '1px solid rgba(59, 130, 246, 0.2)', boxShadow: '0 8px 32px rgba(59,130,246,0.1)' }}
            >
              <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 8px', background: 'rgba(59, 130, 246, 0.2)', borderRadius: '12px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#60a5fa', boxShadow: '0 0 10px #60a5fa', animation: 'pulse 2s infinite' }} />
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '1px' }}>Broadcast</span>
              </div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(59, 130, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Bell size={24} color="#60a5fa" />
                </div>
                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem', color: '#93c5fd', fontWeight: 800, paddingRight: '60px' }}>Notice</h3>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text)', opacity: 0.9, lineHeight: 1.5 }}>
                    {b.message}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* FOLDERS */}
        <div className={`folder-grid ${(showAlertWidget || showLiveWidget) ? 'hide-folder-labels' : ''}`} style={{ marginTop: '32px' }}>
          {folderConfig.map(folder => {
            const folderPlatforms = folder.items.map(id => defaultPlatforms.find(p => p.id === id)).filter(Boolean);
            const previewApps = folderPlatforms.slice(0, 4); // First 4 for the 2x2 grid
            return (
              <div key={folder.id} className="app-folder" onClick={() => setActiveFolder(folder.id)}>
                <div className="folder-icon-wrapper">
                  {previewApps.map((p: any, i) => (
                    <div key={i} className="folder-mini-icon" style={{ background: p.gradient }}>
                      {React.cloneElement(p.icon, { size: 12, color: '#fff' })}
                    </div>
                  ))}
                  {/* Fill empty spots if less than 4 */}
                  {Array.from({ length: Math.max(0, 4 - previewApps.length) }).map((_, i) => (
                    <div key={`empty-${i}`} className="folder-mini-icon" style={{ background: 'rgba(255,255,255,0.1)' }} />
                  ))}
                </div>
                <span className="folder-label">{folder.label}</span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Folder Modal */}
      <AnimatePresence>
        {activeFolder && (
          <motion.div 
            className="folder-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveFolder(null)}
          >
            <motion.div 
              className="folder-modal-content"
              initial={{ scale: 0.8, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 40 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="folder-modal-title">
                {folderConfig.find(f => f.id === activeFolder)?.label}
              </h3>
              <div className="folder-modal-grid">
                {folderConfig.find(f => f.id === activeFolder)?.items.map(id => {
                  const platform = defaultPlatforms.find(p => p.id === id);
                  if (!platform) return null;
                  return (
                    <div 
                      key={platform.id} 
                      className="home-app-item"
                      onClick={() => {
                        setActiveFolder(null);
                        handleAppClick(platform.id);
                      }}
                    >
                      <div className="home-app-icon-wrapper" style={{ background: platform.gradient }}>
                        {React.cloneElement(platform.icon as React.ReactElement<any>, { color: '#ffffff' })}
                      </div>
                      <span className="home-app-label">{platform.label}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* App Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <motion.div 
            className="app-drawer-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsDrawerOpen(false)}
          >
            <motion.div 
              className="app-drawer-content"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="drawer-handle" onClick={() => setIsDrawerOpen(false)} />
              <div 
                onClick={() => setIsDrawerOpen(false)} 
                style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', cursor: 'pointer' }}
              >
                <ChevronDown size={32} color="var(--text-muted)" />
              </div>
              
              <h3 className="drawer-section-title">Recent</h3>
              <div className="drawer-grid" style={{ marginBottom: '32px' }}>
                {sortedPlatforms.slice(0, 4).map(platform => (
                  <div key={`recent-${platform.id}`} className="home-app-item" onClick={() => handleAppClick(platform.id)}>
                    <div className="home-app-icon-wrapper" style={{ background: platform.gradient }}>
                      {React.cloneElement(platform.icon as React.ReactElement<any>, { color: '#ffffff' })}
                    </div>
                    <span className="home-app-label">{platform.label}</span>
                  </div>
                ))}
              </div>

              <h3 className="drawer-section-title">All Apps</h3>
              <div className="drawer-grid">
                {[...defaultPlatforms].sort((a, b) => a.label.localeCompare(b.label)).map(platform => (
                  <div key={`all-${platform.id}`} className="home-app-item" onClick={() => handleAppClick(platform.id)}>
                    <div className="home-app-icon-wrapper" style={{ background: platform.gradient }}>
                      {React.cloneElement(platform.icon as React.ReactElement<any>, { color: '#ffffff' })}
                    </div>
                    <span className="home-app-label">{platform.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bottom-dock">
        <div className="dock-item" onClick={() => onNavigate('contacts')}>
          <div className="dock-icon-wrapper" style={{ background: '#22c55e' }}>
            <Users size={24} color="#fff" />
          </div>
        </div>
        <div className="dock-item" onClick={() => onNavigate('messages')}>
          <div className="dock-icon-wrapper" style={{ background: '#3b82f6' }}>
            <MessageSquare size={24} color="#fff" />
          </div>
        </div>
        <div className="dock-item" onClick={() => setIsDrawerOpen(true)}>
          <div className="dock-icon-wrapper" style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)' }}>
            <LayoutGrid size={24} color="#fff" />
          </div>
        </div>
        {sortedPlatforms.length > 0 && (
          <div className="dock-item" onClick={() => handleAppClick(sortedPlatforms[0].id)}>
            <div className="dock-icon-wrapper" style={{ background: sortedPlatforms[0].gradient }}>
              {React.cloneElement(sortedPlatforms[0].icon as React.ReactElement<any>, { size: 24, color: '#fff' })}
            </div>
          </div>
        )}
      </div>

      {/* Weather Modal */}
      <WeatherForecastModal 
        isOpen={isWeatherModalOpen} 
        onClose={() => setIsWeatherModalOpen(false)}
        onWeatherLoaded={(w) => setWeather(w.current)}
      />
    </div>
  );
};
