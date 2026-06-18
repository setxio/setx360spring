import React, { useState, useEffect, useRef, Suspense } from 'react';
import { 
  Menu,
  X,
  Search as SearchIcon,
  Bell,
  LogOut,
  Power,
  Moon,
  Sun,
  Loader2,
  Sparkles,
  Users, 
  Rss, 
  MessageSquare, 
  Bookmark, 
  User, 
  ShoppingBag, 
  Store, 
  ShoppingCart, 
  Heart, 
  UserCircle,
  LayoutGrid,
  Compass,
  TrendingUp,
  Zap,
  ShieldCheck,
  BarChart3,
  Settings,
  CheckCircle,
  Clock,
  Home,
  Monitor,
  Package,
  DollarSign,
  Map,
  MapPin,
  Utensils,
  Car,
  Calendar,
  Wrench,
  Briefcase,
  Ticket,
  QrCode,
  Wallet as WalletIcon,
  ArrowRightLeft,
  CreditCard,
  HeartPulse,
  History as HistoryIcon,
  Building,
  CarFront,
  Landmark,
  Plane,
  FileText,
  MessageCircle,
  Play,
  Film,
  Music,
  Palette,
  Church,
  Trophy,
  Activity,
  CloudSun,
  Newspaper,
  AlertTriangle,
  Megaphone,
  Bot,
  Smartphone,
  Beaker,
  Pause,
  SkipForward,
  SkipBack,
  Plus,
  Library,
  Bug
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { VerificationModal } from './VerificationModal';
import { BugReportModal } from './BugReportModal';
import { useApp, type Env } from '../context/AppContext';
import { ThemeTopBar } from './ThemeTopBar';
import { Avatar } from './Avatar';
import { SignUpFlow } from './SignUpFlow';
import { GlobalChatBubbles } from './GlobalChatBubbles';
import { CreatePostModal } from './CreatePostModal';
import { isVerified } from '../utils/roles';

interface MinimalLayoutProps {
  renderView: () => React.ReactNode;
  setActivePostId: (id: string | null) => void;
  setActiveStoreId: (id: string | null) => void;
  setActiveProfileId: (id: string | null) => void;
  setActiveCommentId: (id: string | null) => void;
  updateAvailable: boolean;
  onUpdate: () => void;
}

export const MinimalLayout: React.FC<MinimalLayoutProps> = ({ 
  renderView, 
  setActivePostId,
  setActiveStoreId,
  setActiveProfileId,
  setActiveCommentId,
  updateAvailable,
  onUpdate
}) => {
  const { 
    user, 
    env, 
    theme, 
    unreadCount, 
    activeTab,
    setActiveTab,
    localSearchQuery,
    setLocalSearchQuery,
    masterSearchQuery,
    setMasterSearchQuery,
    setEnv, 
    toggleTheme, 
    logout, 
    isSetxIO,
    userPages,
    activeContext,
    setActiveContext
  } = useApp();
  const { currentSong, isPlaying, togglePlay, setIsPlaying } = useApp();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isBugReportOpen, setIsBugReportOpen] = useState(false);
  const [isLocalSearchExpanded, setIsLocalSearchExpanded] = useState(false);
  const [isContextDropdownOpen, setIsContextDropdownOpen] = useState(false);
  


  const navigation = [
    { 
      id: 'home', label: 'Home', icon: <Home size={20} />,
      submenus: [
        { icon: <LayoutGrid size={16} />, label: 'Apps' }
      ]
    },
    { 
      id: 'me', label: 'Me', icon: <UserCircle size={20} />,
      submenus: [
        { icon: <LayoutGrid size={16} />, label: 'One' },
        { icon: <BarChart3 size={16} />, label: 'Stats' },
        { icon: <Package size={16} />, label: 'Orders' },
        { icon: <WalletIcon size={16} />, label: 'Wallet' },
        { icon: <Bookmark size={16} />, label: 'Saved' },
        { icon: <Bell size={16} />, label: 'Alerts' },
        { icon: <Settings size={16} />, label: 'System' },
      ]
    },
    { 
      id: 'discover', label: 'Discover', icon: <Compass size={20} />,
      submenus: [
        { icon: <Compass size={16} />, label: 'Discover' },
        { icon: <TrendingUp size={16} />, label: 'Trending' },
        { icon: <Zap size={16} />, label: 'Hot Deals' },
        { icon: <Sparkles size={16} />, label: 'New' },
        { icon: <Map size={16} />, label: 'Radar' },
        { icon: <User size={16} />, label: 'My Vibes' },
      ]
    },
    { 
      id: 'search', label: 'Search', icon: <SearchIcon size={20} />,
      submenus: [
        { icon: <SearchIcon size={16} />, label: 'All' },
        { icon: <Users size={16} />, label: 'People' },
        { icon: <Building size={16} />, label: 'Places' },
      ]
    },
    { 
      id: 'social', label: 'Social', icon: <Users size={20} />,
      submenus: [
        { icon: <Rss size={16} />, label: 'Feed' },
        { icon: <ShoppingBag size={16} />, label: 'Classifieds' },
        { icon: <Users size={16} />, label: 'Directory' },
        { icon: <LayoutGrid size={16} />, label: 'Groups' },
        { icon: <MessageSquare size={16} />, label: 'Messages' },
        { icon: <Bookmark size={16} />, label: 'Saved' },
        { icon: <Bell size={16} />, label: 'Alerts' },
        { icon: <User size={16} />, label: 'Profile' },
      ]
    },
    { 
      id: 'market', label: 'Market', icon: <Store size={20} />,
      submenus: [
        { icon: <Store size={16} />, label: 'Home' },
        { icon: <SearchIcon size={16} />, label: 'Search' },
        { icon: <LayoutGrid size={16} />, label: 'Stores' },
        { icon: <ShoppingCart size={16} />, label: 'Cart' },
        { icon: <Heart size={16} />, label: 'Wishlist' },
        { icon: <UserCircle size={16} />, label: 'Account' },
      ]
    },
    { 
      id: 'eats', label: 'Eats', icon: <Utensils size={20} />,
      submenus: [
        { icon: <Utensils size={16} />, label: 'Home' },
        { icon: <SearchIcon size={16} />, label: 'Explore' },
        { icon: <ShoppingBag size={16} />, label: 'Orders' },
        { icon: <Clock size={16} />, label: 'History' },
        { icon: <User size={16} />, label: 'Account' },
      ]
    },
    { 
      id: 'rides', label: 'Rides', icon: <Car size={20} />,
      submenus: [
        { icon: <Car size={16} />, label: 'Rides' },
        { icon: <MapPin size={16} />, label: 'Pickup' },
        { icon: <Calendar size={16} />, label: 'Reserve' },
        { icon: <Clock size={16} />, label: 'Activity' },
        { icon: <User size={16} />, label: 'Account' },
      ]
    },
    { 
      id: 'services', label: 'Services', icon: <Wrench size={20} />,
      submenus: [
        { icon: <Wrench size={16} />, label: 'Home' },
        { icon: <Briefcase size={16} />, label: 'Pros' },
        { icon: <Calendar size={16} />, label: 'Schedule' },
        { icon: <Clock size={16} />, label: 'Bookings' },
        { icon: <User size={16} />, label: 'Account' },
      ]
    },
    { 
      id: 'events', label: 'Events', icon: <Ticket size={20} />,
      submenus: [
        { icon: <Ticket size={16} />, label: 'Home' },
        { icon: <SearchIcon size={16} />, label: 'Explore' },
        { icon: <QrCode size={16} />, label: 'Passes' },
        { icon: <Calendar size={16} />, label: 'Calendar' },
        { icon: <User size={16} />, label: 'Account' },
      ]
    },
    { 
      id: 'wallet', label: 'Wallet', icon: <WalletIcon size={20} />,
      submenus: [
        { icon: <WalletIcon size={16} />, label: 'Home' },
        { icon: <ArrowRightLeft size={16} />, label: 'Pay' },
        { icon: <Sparkles size={16} />, label: 'Rewards' },
        { icon: <CreditCard size={16} />, label: 'Cards' },
        { icon: <User size={16} />, label: 'Account' },
      ]
    },
    { 
      id: 'care', label: 'Care', icon: <HeartPulse size={20} />,
      submenus: [
        { icon: <HeartPulse size={16} />, label: 'Home' },
        { icon: <Bell size={16} />, label: 'Alerts' },
        { icon: <Map size={16} />, label: 'Hotspot' },
        { icon: <HistoryIcon size={16} />, label: 'Log' },
        { icon: <User size={16} />, label: 'Account' },
      ]
    },
    { 
      id: 'homes', label: 'Homes', icon: <Building size={20} />,
      submenus: [
        { icon: <Building size={16} />, label: 'Home' },
        { icon: <SearchIcon size={16} />, label: 'Search' },
        { icon: <Heart size={16} />, label: 'Saved' },
        { icon: <DollarSign size={16} />, label: 'Finance' },
        { icon: <User size={16} />, label: 'Agent' },
      ]
    },
    { 
      id: 'auto', label: 'Auto', icon: <CarFront size={20} />,
      submenus: [
        { icon: <CarFront size={16} />, label: 'Home' },
        { icon: <LayoutGrid size={16} />, label: 'Stock' },
        { icon: <Landmark size={16} />, label: 'Finance' },
        { icon: <Wrench size={16} />, label: 'Service' },
        { icon: <User size={16} />, label: 'Account' },
      ]
    },
    { 
      id: 'travel', label: 'Travel', icon: <Plane size={20} />,
      submenus: [
        { icon: <Plane size={16} />, label: 'Home' },
        { icon: <Compass size={16} />, label: 'Explore' },
        { icon: <ShoppingBag size={16} />, label: 'Bookings' },
        { icon: <Map size={16} />, label: 'Guide' },
        { icon: <User size={16} />, label: 'Account' },
      ]
    },
    { 
      id: 'jobs', label: 'Jobs', icon: <Briefcase size={20} />,
      submenus: [
        { icon: <Briefcase size={16} />, label: 'Jobs' },
        { icon: <SearchIcon size={16} />, label: 'Search' },
        { icon: <FileText size={16} />, label: 'Applied' },
        { icon: <MessageCircle size={16} />, label: 'Messages' },
        { icon: <User size={16} />, label: 'Profile' },
      ]
    },
    { 
      id: 'gigs', label: 'Gigs', icon: <Zap size={20} />,
      submenus: [
        { icon: <Zap size={16} />, label: 'Gigs' },
        { icon: <Briefcase size={16} />, label: 'My Posts' },
        { icon: <FileText size={16} />, label: 'My Tasks' },
        { icon: <DollarSign size={16} />, label: 'Earnings' },
        { icon: <User size={16} />, label: 'Profile' },
      ]
    },
    { 
      id: 'videos', label: 'Videos', icon: <Film size={20} />,
      submenus: [
        { icon: <Film size={16} />, label: 'Shorts' },
        { icon: <Play size={16} />, label: 'Videos' },
      ]
    },
    { 
      id: 'classifieds', label: 'Classifieds', icon: <LayoutGrid size={20} />,
      submenus: []
    },
    { 
      id: 'music', label: 'Music', icon: <Music size={20} />,
      submenus: [
        { icon: <Music size={16} />, label: 'Listen' },
        { icon: <SearchIcon size={16} />, label: 'Discover' },
        { icon: <Library size={16} />, label: 'Library' },
      ]
    },
    { 
      id: 'art', label: 'Art', icon: <Palette size={20} />,
      submenus: [
        { icon: <LayoutGrid size={16} />, label: 'Gallery' },
        { icon: <SearchIcon size={16} />, label: 'Explore' },
        { icon: <Palette size={16} />, label: 'Artists' },
        { icon: <Calendar size={16} />, label: 'Exhibitions' },
        { icon: <User size={16} />, label: 'Account' },
      ]
    },
    { 
      id: 'faith', label: 'Faith', icon: <Church size={20} />,
      submenus: [
        { icon: <Home size={16} />, label: 'Sanctuary' },
        { icon: <Users size={16} />, label: 'Fellowship' },
        { icon: <Sparkles size={16} />, label: 'Daily Word' },
        { icon: <Calendar size={16} />, label: 'Services' },
        { icon: <User size={16} />, label: 'Account' },
      ]
    },
    { 
      id: 'sports', label: 'Sports', icon: <Trophy size={20} />,
      submenus: [
        { icon: <Trophy size={16} />, label: 'Scores' },
        { icon: <Activity size={16} />, label: 'Leagues' },
        { icon: <Calendar size={16} />, label: 'Schedule' },
        { icon: <Users size={16} />, label: 'Teams' },
        { icon: <User size={16} />, label: 'Account' },
      ]
    },
    { 
      id: 'news', label: 'News', icon: <Newspaper size={20} />,
      submenus: [
        { icon: <CloudSun size={16} />, label: 'Weather' },
        { icon: <Newspaper size={16} />, label: 'News' },
        { icon: <Zap size={16} />, label: 'Alerts' },
        { icon: <Map size={16} />, label: 'Radar' },
        { icon: <User size={16} />, label: 'Account' },
      ]
    },
    { 
      id: 'civics', label: 'Civics', icon: <Landmark size={20} />,
      submenus: [
        { icon: <Landmark size={16} />, label: 'Home' },
        { icon: <AlertTriangle size={16} />, label: 'Report 311' },
        { icon: <HistoryIcon size={16} />, label: 'My Reports' },
        { icon: <WalletIcon size={16} />, label: 'Utilities' },
        { icon: <User size={16} />, label: 'Account' },
      ]
    },
    { 
      id: 'apps', label: 'Apps', icon: <Smartphone size={20} />,
      submenus: [
        { icon: <LayoutGrid size={16} />, label: 'Home' },
        { icon: <Briefcase size={16} />, label: 'Pro' },
        { icon: <Beaker size={16} />, label: 'Incubator' },
        { icon: <SearchIcon size={16} />, label: 'Search' },
        { icon: <User size={16} />, label: 'Account' },
      ]
    },
  ];

  // Add dashboard if user has role
  const isAdmin = user?.role === 'admin';
  const hasDashboardRole = user?.role && ['business', 'official', 'chamber', 'media', 'artist', 'venue', 'non_profit', 'church'].includes(user.role);

  const getDashboardSubmenus = () => {
    const role = user?.role || '';
    const hasClearance = (type: string) => user?.clearances?.some((c: any) => c.entity_type === type);
    if (['official', 'chamber'].includes(role) || hasClearance('civic')) {
      return [
        { icon: <Users size={16} />, label: 'Directory' },
        { icon: <AlertTriangle size={16} />, label: 'Alerts' },
        { icon: <Megaphone size={16} />, label: 'Sponsorships' },
        { icon: <Settings size={16} />, label: 'Settings' },
        { icon: <Monitor size={16} />, label: 'Overview' },
        { icon: <HistoryIcon size={16} />, label: 'Tickets' },
        { icon: <WalletIcon size={16} />, label: 'Utilities' },
        { icon: <Users size={16} />, label: 'Team' },
      ];
    }
    return [
      { icon: <Package size={16} />, label: 'Products' },
      { icon: <ShoppingBag size={16} />, label: 'Orders' },
      { icon: <DollarSign size={16} />, label: 'Finance' },
      { icon: <Settings size={16} />, label: 'Settings' },
      { icon: <Monitor size={16} />, label: 'Overview' },
      { icon: <Megaphone size={16} />, label: 'Ads' },
      { icon: <Store size={16} />, label: 'Store Front' },
      { icon: <Users size={16} />, label: 'Team' },
    ];
  };

  const fullNavigation = [...navigation];
  if (hasDashboardRole && !isAdmin) {
    fullNavigation.push({
      id: 'dashboard', label: 'Dashboard', icon: <Monitor size={20} />,
      submenus: getDashboardSubmenus()
    });
  }
  if (isAdmin) {
    fullNavigation.push({
      id: 'admin', label: 'Admin', icon: <ShieldCheck size={20} />,
      submenus: [
        { icon: <Users size={16} />, label: 'Verify' },
        { icon: <BarChart3 size={16} />, label: 'Stats' },
        { icon: <Settings size={16} />, label: 'Config' },
        { icon: <ShieldCheck size={16} />, label: 'Dash' },
      ]
    });
  }

  // Removed activeNavIndex reordering logic as it's no longer needed for platform-specific menus

  const getHeaderLogo = () => {
    if (theme.startsWith('io-')) return '/logo-io.png';
    if (theme.startsWith('neo')) return '/logo-neo.png';
    if (theme.startsWith('twilight')) return '/logo-twilight.png';
    if (theme.startsWith('efutura')) return '/logo-efutura.png';
    return theme.includes('light') ? '/logo-setx-blue.png' : '/logo-setx-transparent.png';
  };

  const handleNavClick = (id: Env) => {
    setEnv(id);
    setActiveTab(0);
    setIsMenuOpen(false);
    setActivePostId(null);
    setActiveStoreId(null);
    setActiveProfileId(null);
    setActiveCommentId(null);
  };

  return (
    <div className="minimal-layout" style={{ 
      minHeight: '100vh', 
      background: 'var(--bg-main)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Top Header */}
      {!isSetxIO && env !== 'home' && (
        <div style={{ position: 'sticky', top: 0, zIndex: 100 }}>
          <ThemeTopBar key={env + '-' + theme} />
          <header style={{
            height: '64px',
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid var(--glass-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text)', cursor: 'pointer', padding: 0 }}
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <h1 onClick={() => { setEnv('discover'); setActiveTab(0); }} style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: theme.includes('light') ? '#000' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                SETX <span style={{ 
                  color: 'var(--primary)',
                  transition: 'color 0.3s ease'
                }}>360</span>
              </h1>
            </div>

            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div 
                onClick={() => { setEnv('home'); setActiveTab(0); }}
                style={{ position: 'relative', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', cursor: 'pointer', boxShadow: theme.endsWith('-dark') ? `0 0 25px 2px var(--primary)` : 'none' }}
              >
                <img src={getHeaderLogo()} alt="Logo" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'contain', zIndex: 1 }} />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, justifyContent: 'flex-end' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <AnimatePresence>
                {isLocalSearchExpanded && (
                  <motion.input
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 200, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="master-search-input"
                    type="text"
                    value={masterSearchQuery}
                    onChange={(e) => setMasterSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && masterSearchQuery.trim()) {
                        setEnv('search');
                        setActiveTab(0);
                        setIsLocalSearchExpanded(false);
                      }
                    }}
                    placeholder={`Master Search SETX...`}
                    style={{
                      position: 'absolute',
                      right: '48px',
                      height: '40px',
                      background: 'var(--glass-bg-strong)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '20px',
                      padding: '0 16px',
                      color: 'var(--text)',
                      outline: 'none',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                    autoFocus
                  />
                )}
              </AnimatePresence>
              <button 
                onClick={() => setIsLocalSearchExpanded(!isLocalSearchExpanded)}
                style={{ background: isLocalSearchExpanded ? 'var(--primary)' : 'var(--glass-bg-strong)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isLocalSearchExpanded ? '#fff' : 'var(--text)', cursor: 'pointer', transition: 'all 0.3s ease', zIndex: 2 }}
              >
                <SearchIcon size={20} />
              </button>
            </div>
            
            {user?.role === 'admin' && (
              <button
                onClick={() => setEnv('admin')}
                style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Admin Dashboard"
              >
                <ShieldCheck size={22} />
              </button>
            )}

            <button
              onClick={toggleTheme}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Toggle Light/Dark Mode"
            >
              {theme.includes('light') ? <Moon size={22} /> : <Sun size={22} />}
            </button>

            {user && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ position: 'relative', cursor: 'pointer' }}>
                  <Bell size={22} color="var(--text-muted)" />
                  {unreadCount > 0 && <span style={{ position: 'absolute', top: -2, right: -2, background: 'red', color: 'white', fontSize: '10px', borderRadius: '50%', width: '14px', height: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{unreadCount}</span>}
                </div>

                {/* Context Switcher */}
                <div style={{ position: 'relative' }}>
                  <div 
                    onClick={() => setIsContextDropdownOpen(!isContextDropdownOpen)}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '4px 8px', borderRadius: '24px', background: 'var(--glass-bg-strong)', border: '1px solid var(--border)', transition: 'all 0.2s' }}
                  >
                    <Avatar 
                      url={activeContext ? activeContext.avatar_url : user.avatar_url} 
                      name={activeContext ? activeContext.name : user.name} 
                      size={32} 
                    />
                  </div>

                  <AnimatePresence>
                    {isContextDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        style={{
                          position: 'absolute',
                          top: 'calc(100% + 8px)',
                          right: 0,
                          width: '240px',
                          background: 'var(--bg)',
                          border: '1px solid var(--border)',
                          borderRadius: '16px',
                          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                          overflow: 'hidden',
                          zIndex: 1000
                        }}
                      >
                        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Interacting As</span>
                        </div>

                        {/* Personal Account */}
                        <div 
                          onClick={() => { setActiveContext(null); setIsContextDropdownOpen(false); }}
                          style={{
                            padding: '12px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            cursor: 'pointer',
                            background: activeContext === null ? 'var(--primary-light, rgba(112,0,244,0.1))' : 'transparent',
                            transition: 'background 0.2s'
                          }}
                        >
                          <Avatar url={user.avatar_url} name={user.name} size={32} />
                          <div style={{ flex: 1, overflow: 'hidden' }}>
                            <div style={{ fontWeight: activeContext === null ? 700 : 500, fontSize: '0.9rem', color: activeContext === null ? 'var(--primary)' : 'var(--text)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Personal Account</div>
                          </div>
                          {activeContext === null && <CheckCircle size={16} color="var(--primary)" />}
                        </div>

                        {/* User Pages */}
                        {userPages && userPages.length > 0 && (
                          <div style={{ borderTop: '1px solid var(--border)' }}>
                            <div style={{ padding: '8px 16px', background: 'var(--bg-muted)' }}>
                              <span style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Your Pages</span>
                            </div>
                            {userPages.map(page => (
                              <div 
                                key={page.id}
                                onClick={() => { setActiveContext(page); setIsContextDropdownOpen(false); }}
                                style={{
                                  padding: '12px 16px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '12px',
                                  cursor: 'pointer',
                                  background: activeContext?.id === page.id ? 'var(--primary-light, rgba(112,0,244,0.1))' : 'transparent',
                                  transition: 'background 0.2s'
                                }}
                              >
                                <Avatar url={page.avatar_url} name={page.name} size={32} />
                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                  <div style={{ fontWeight: activeContext?.id === page.id ? 700 : 500, fontSize: '0.9rem', color: activeContext?.id === page.id ? 'var(--primary)' : 'var(--text)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{page.name}</div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{page.page_type.replace('_', ' ')}</div>
                                </div>
                                {activeContext?.id === page.id && <CheckCircle size={16} color="var(--primary)" />}
                              </div>
                            ))}
                          </div>
                        )}

                        <div style={{ padding: '8px', borderTop: '1px solid var(--border)' }}>
                          <button 
                            onClick={() => { setEnv('page_creator'); setActiveTab(0); setIsContextDropdownOpen(false); }}
                            style={{
                              width: '100%',
                              padding: '10px',
                              borderRadius: '8px',
                              border: 'none',
                              background: 'var(--bg-muted)',
                              color: 'var(--text)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                          >
                            <Plus size={16} /> Create New Page
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>
        </header>
        </div>
      )}

      {/* Mobile/Side Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            style={{
              position: 'fixed',
              top: '64px',
              left: 0,
              bottom: 0,
              width: '280px',
              background: 'var(--bg)',
              zIndex: 9999,
              padding: '24px',
              boxShadow: '10px 0 30px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              overflowY: 'auto'
            }}
          >
            <div style={{ marginBottom: '20px' }}>
              <button
                onClick={() => handleNavClick('home' as Env)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'var(--primary-light, rgba(112,0,244,0.15))',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  marginBottom: '24px'
                }}
              >
                <Home size={20} />
                <span style={{ flex: 1 }}>Home Screen</span>
              </button>

              {(() => {
                const currentNavItem = fullNavigation.find(item => item.id === env);
                if (!currentNavItem) return null;

                return (
                  <div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
                      {currentNavItem.label} Menu
                    </p>
                    
                    {env === 'me' && user && !isVerified(user.role) && (
                      <button
                        onClick={() => {
                          setActiveTab(-1);
                          setIsVerifying(true);
                          setIsMenuOpen(false);
                        }}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          borderRadius: '12px',
                          border: 'none',
                          background: activeTab === -1 ? 'var(--primary)' : 'transparent',
                          color: activeTab === -1 ? '#fff' : 'var(--text)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          fontWeight: activeTab === -1 ? 700 : 500,
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.2s ease',
                          marginBottom: '4px'
                        }}
                      >
                        <ShieldCheck size={20} color={activeTab === -1 ? '#fff' : 'var(--primary)'} />
                        <span>Verify Me</span>
                      </button>
                    )}

                    {currentNavItem.submenus?.map((sub, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setActiveTab(idx);
                          setIsMenuOpen(false);
                        }}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          borderRadius: '12px',
                          border: 'none',
                          background: activeTab === idx ? 'var(--primary)' : 'transparent',
                          color: activeTab === idx ? '#fff' : 'var(--text)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          fontWeight: activeTab === idx ? 700 : 500,
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.2s ease',
                          marginBottom: '4px'
                        }}
                      >
                        {React.cloneElement(sub.icon as React.ReactElement<any>, { size: 20 })}
                        <span>{sub.label}</span>
                      </button>
                    ))}
                    
                      {env === 'classifieds' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <button
                            onClick={() => {
                              window.dispatchEvent(new CustomEvent('changeClassifiedsTab', { detail: 'items' }));
                              setIsMenuOpen(false);
                            }}
                            style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: 'none', background: 'transparent', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 500, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease' }}
                          >
                            <span style={{ flex: 1 }}>Classified Items</span>
                          </button>
                          <button
                            onClick={() => {
                              window.dispatchEvent(new CustomEvent('changeClassifiedsTab', { detail: 'vehicles' }));
                              setIsMenuOpen(false);
                            }}
                            style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: 'none', background: 'transparent', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 500, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease' }}
                          >
                            <span style={{ flex: 1 }}>Vehicles</span>
                          </button>
                          <button
                            onClick={() => {
                              window.dispatchEvent(new CustomEvent('changeClassifiedsTab', { detail: 'real_estate' }));
                              setIsMenuOpen(false);
                            }}
                            style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: 'none', background: 'transparent', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 500, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease' }}
                          >
                            <span style={{ flex: 1 }}>Real Estate</span>
                          </button>
                          <button
                            onClick={() => {
                              window.dispatchEvent(new CustomEvent('changeClassifiedsTab', { detail: 'map' }));
                              setIsMenuOpen(false);
                            }}
                            style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: 'none', background: 'transparent', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 500, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease' }}
                          >
                            <span style={{ flex: 1 }}>Map</span>
                          </button>
                          <button
                            onClick={() => {
                              window.dispatchEvent(new CustomEvent('changeClassifiedsTab', { detail: 'my_stuff' }));
                              setIsMenuOpen(false);
                            }}
                            style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: 'none', background: 'transparent', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 500, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease' }}
                          >
                            <span style={{ flex: 1 }}>My Stuff</span>
                          </button>
                          <button
                            onClick={() => {
                              window.dispatchEvent(new CustomEvent('changeClassifiedsTab', { detail: 'saved' }));
                              setIsMenuOpen(false);
                            }}
                            style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: 'none', background: 'transparent', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 500, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease' }}
                          >
                            <span style={{ flex: 1 }}>Saved</span>
                          </button>
                        </div>
                      )}
                  </div>
                );
              })()}

              <div style={{ marginTop: '16px' }}>
                <button
                  onClick={() => {
                    setIsBugReportOpen(true);
                    setIsMenuOpen(false);
                  }}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.05)', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 600, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease' }}
                >
                  <Bug size={20} />
                  <span>Report a Bug</span>
                </button>
              </div>
            </div>

            <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
              <button 
                onClick={toggleTheme}
                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: 'none', background: 'var(--glass-bg-strong)', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', cursor: 'pointer' }}
              >
                {theme.includes('light') ? <Moon size={20} /> : <Sun size={20} />}
                {theme.includes('light') ? 'Dark Mode' : 'Light Mode'}
              </button>
              <button 
                onClick={logout}
                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: 'none', background: 'transparent', color: '#ff4444', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
              >
                <LogOut size={20} />
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main style={{ 
        flex: 1, 
        padding: '20px',
        transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), border-radius 0.4s ease, opacity 0.4s ease',
        transform: isMenuOpen ? 'scale(0.95) translateX(140px)' : 'scale(1) translateX(0)',
        borderRadius: isMenuOpen ? '24px' : '0',
        overflow: isMenuOpen ? 'hidden' : 'visible',
        opacity: isMenuOpen ? 0.7 : 1,
        pointerEvents: isMenuOpen ? 'none' : 'auto',
        position: 'relative',
        zIndex: 1
      }}>
        {(user || isSetxIO || env === 'labs') ? (
          <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}><Loader2 className="animate-spin" size={32} color="var(--primary)" /></div>}>
            {renderView()}
          </Suspense>
        ) : (
          <SignUpFlow />
        )}
      </main>



      {/* Overlay to close menu */}
      {isMenuOpen && <div onClick={() => setIsMenuOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 98, top: '64px' }} />}

      <AnimatePresence>
        {updateAvailable && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="update-toast glass" style={{ position: 'fixed', bottom: '100px', left: '20px', right: '20px', zIndex: 2000, padding: '16px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(112, 0, 244, 0.9)', color: 'white', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Sparkles size={20} />
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>A new version of SETX 360 is ready!</span>
            </div>
            <button onClick={onUpdate} style={{ background: 'white', color: '#7000f4', border: 'none', padding: '8px 16px', borderRadius: '12px', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}>Update Now</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button for Posting */}
      {!isSetxIO && user && env === 'social' && (
        <button 
          className="create-post-fab-minimal fade-in"
          onClick={() => setIsCreatePostOpen(true)}
        >
          <Plus size={28} />
        </button>
      )}

      {isVerifying && (
        <VerificationModal onClose={() => setIsVerifying(false)} user={user} />
      )}

      {isBugReportOpen && (
        <BugReportModal onClose={() => setIsBugReportOpen(false)} user={user} platform={env} />
      )}

      {isCreatePostOpen && (
        <CreatePostModal onClose={() => setIsCreatePostOpen(false)} user={user} currentScope={'national'} />
      )}
    </div>
  );
};
