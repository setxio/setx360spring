import React, { useState, Suspense } from 'react';
import { 
  Menu,
  X,
  Search as SearchIcon,
  Bell,
  LogOut,
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
  Bot
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp, type Env } from '../context/AppContext';
import { Avatar } from './Avatar';
import { SignUpFlow } from './SignUpFlow';
import { TevisChat } from './TevisChat';
import { GlobalChatBubbles } from './GlobalChatBubbles';

interface MinimalLayoutProps {
  renderView: () => React.ReactNode;
  SearchOverlay: React.ComponentType<any>;
  setActivePostId: (id: string | null) => void;
  setActiveStoreId: (id: string | null) => void;
  setActiveProfileId: (id: string | null) => void;
  setActiveCommentId: (id: string | null) => void;
  updateAvailable: boolean;
  onUpdate: () => void;
}

export const MinimalLayout: React.FC<MinimalLayoutProps> = ({ 
  renderView, 
  SearchOverlay,
  setActivePostId,
  setActiveStoreId,
  setActiveProfileId,
  setActiveCommentId,
  updateAvailable,
  onUpdate
}) => {
  const { 
    user, env, theme, activeTab, unreadCount, isSearchOpen,
    setEnv, setActiveTab, setIsSearchOpen, toggleTheme, logout, isSetxIO
  } = useApp();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isTevisOpen, setIsTevisOpen] = useState(false);

  const navigation = [
    { 
      id: 'me', label: 'Verify Me', icon: <UserCircle size={20} />,
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
        { icon: <Bot size={16} color="var(--primary)" />, label: 'Tevis' },
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
      id: 'media', label: 'Media', icon: <Film size={20} />,
      submenus: [
        { icon: <Film size={16} />, label: 'Shorts' },
        { icon: <Play size={16} />, label: 'Videos' },
        { icon: <Music size={16} />, label: 'Music' },
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
      {!isSetxIO && (
        <header style={{
          height: '64px',
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid var(--glass-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text)', cursor: 'pointer' }}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: theme.includes('light') ? '#000' : '#fff' }}>
              SETX <span style={{ 
                color: theme.startsWith('io-') ? '#7000f4' : (
                  env === 'discover' ? '#06b6d4' : 
                  env === 'social'   ? '#3b82f6' : 
                  env === 'events'   ? '#facc15' : 
                  env === 'news'     ? '#1e40af' : 
                  env === 'faith'    ? '#8b5cf6' : 
                  env === 'market'   ? '#10b981' : 
                  env === 'eats'     ? '#f97316' : 
                  env === 'services' ? '#334155' : 
                  env === 'jobs'     ? '#172554' : 
                  'var(--primary)'
                ),
                transition: 'color 0.3s ease'
              }}>360</span>
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button 
              onClick={() => setIsSearchOpen(true)}
              style={{ background: 'var(--glass-bg-strong)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)', cursor: 'pointer' }}
            >
              <SearchIcon size={20} />
            </button>
            
            {user && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ position: 'relative' }}>
                  <Bell size={22} color="var(--text-muted)" />
                  {unreadCount > 0 && <span style={{ position: 'absolute', top: -2, right: -2, background: 'red', color: 'white', fontSize: '10px', borderRadius: '50%', width: '14px', height: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{unreadCount}</span>}
                </div>
                <Avatar url={user.avatar_url} name={user.name} size={36} />
              </div>
            )}
          </div>
        </header>
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
              zIndex: 99,
              padding: '24px',
              boxShadow: '10px 0 30px rgba(0,0,0,0.3)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              overflowY: 'auto'
            }}
          >
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Navigation</p>
              {fullNavigation.map(item => (
                <div key={item.id} style={{ marginBottom: '4px' }}>
                  <button
                    onClick={() => handleNavClick(item.id as Env)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: 'none',
                      background: env === item.id ? 'var(--primary-light, rgba(112,0,244,0.15))' : 'transparent',
                      color: env === item.id ? 'var(--primary)' : 'var(--text)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {item.icon}
                    <span style={{ flex: 1 }}>{item.label}</span>
                  </button>
                  
                  {/* Submenus — expanded when env === item.id */}
                  <AnimatePresence>
                    {env === item.id && item.submenus && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px',
                          paddingLeft: '28px',
                          marginTop: '4px',
                          overflow: 'hidden'
                        }}
                      >
                        {item.submenus.map((sub, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setActiveTab(idx);
                              setIsMenuOpen(false);
                            }}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              border: 'none',
                              background: activeTab === idx ? 'var(--primary)' : 'transparent',
                              color: activeTab === idx ? '#fff' : 'var(--text-muted)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              fontSize: '0.85rem',
                              fontWeight: activeTab === idx ? 700 : 500,
                              cursor: 'pointer',
                              textAlign: 'left',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            {sub.icon}
                            <span>{sub.label}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
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
      <main style={{ flex: 1, padding: '20px' }}>
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

      <Suspense fallback={null}>
        <SearchOverlay 
          isOpen={isSearchOpen} 
          onClose={() => setIsSearchOpen(false)}
          onNavigate={(newEnv: string, newTab: number, params?: Record<string, string>) => {
            setEnv(newEnv as any);
            setActiveTab(newTab);
            if (params?.userId) setActiveProfileId(params.userId);
            if (params?.storeId) setActiveStoreId(params.storeId);
            if (params?.postId) { setActivePostId(params.postId); setActiveCommentId(null); }
          }}
          user={user}
        />
      </Suspense>

      <AnimatePresence>
        {updateAvailable && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="update-toast glass" style={{ position: 'fixed', bottom: '100px', left: '20px', right: '20px', zIndex: 2000, padding: '16px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(112, 0, 244, 0.95)', color: 'white', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Sparkles size={20} />
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>A new version of SETX 360 is ready!</span>
            </div>
            <button onClick={onUpdate} style={{ background: 'white', color: '#7000f4', border: 'none', padding: '8px 16px', borderRadius: '12px', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}>Update Now</button>
          </motion.div>
        )}
      </AnimatePresence>

      <TevisChat user={user} isOpen={isTevisOpen} onClose={() => setIsTevisOpen(false)} />
      <GlobalChatBubbles user={user} />
      
      {/* Floating Action Button for Tevis */}
      {!isSetxIO && user && (
        <button 
          onClick={() => setIsTevisOpen(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'var(--primary)',
            color: 'white',
            border: 'none',
            boxShadow: '0 8px 24px rgba(var(--primary-rgb), 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 1000
          }}
        >
          <Avatar url="/logo-neo.png" size={40} />
        </button>
      )}
    </div>
  );
};
