import React, { useState, useEffect, useRef, Suspense } from 'react';
import { 
  Users, 
  Rss, 
  MessageSquare, 
  Bell, 
  Bookmark, 
  User, 
  ShoppingBag, 
  Search as SearchIcon, 
  Store, 
  ShoppingCart, 
  Heart, 
  UserCircle,
  LayoutGrid,
  Moon,
  Sun,
  Compass,
  TrendingUp,
  Zap,
  Sparkles,
  ShieldCheck,
  Settings,
  Loader2,
  CheckCircle,
  Clock,
  Map,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp, type Env, type Scope } from '../context/AppContext';
import { ThemeTopBar } from './ThemeTopBar';
import { Avatar } from './Avatar';
import { VerificationModal } from './VerificationModal';
import { TevisChat } from './TevisChat';
import { GlobalChatBubbles } from './GlobalChatBubbles';

interface SETXV1LayoutProps {
  renderView: () => React.ReactNode;
  SearchOverlay: React.ComponentType<any>;
  activePostId: string | null;
  setActivePostId: (id: string | null) => void;
  activeStoreId: string | null;
  setActiveStoreId: (id: string | null) => void;
  activeProfileId: string | null;
  setActiveProfileId: (id: string | null) => void;
  activeGroupId: string | null;
  setActiveGroupId: (id: string | null) => void;
  activeCommentId: string | null;
  setActiveCommentId: (id: string | null) => void;
  updateAvailable: boolean;
  onUpdate: () => void;
}

export const SETXV1Layout: React.FC<SETXV1LayoutProps> = ({ 
  renderView, 
  SearchOverlay,
  activePostId: _activePostId,
  setActivePostId,
  activeStoreId: _activeStoreId,
  setActiveStoreId,
  activeProfileId: _activeProfileId,
  setActiveProfileId,
  activeGroupId: _activeGroupId,
  setActiveGroupId,
  activeCommentId: _activeCommentId,
  setActiveCommentId,
  updateAvailable,
  onUpdate
}) => {
  const { 
    user, env, theme, scope, activeTab, unreadCount, isSearchOpen,
    setEnv, setScope, setActiveTab, setIsSearchOpen, toggleTheme, refreshUser
  } = useApp();

  const [isVerifying, setIsVerifying] = useState(false);
  const [isTevisOpen, setIsTevisOpen] = useState(false);
  const envSwitcherRef = useRef<HTMLDivElement>(null);
  const isInternalScroll = useRef(false);
  const isInitialized = useRef(false);
  const scrollTimeout = useRef<any>(null);

  // Clear store/post detail views whenever the user navigates away
  useEffect(() => {
    setActiveStoreId(null);
    setActivePostId(null);
    setActiveCommentId(null);
    setActiveProfileId(null);
    setActiveGroupId(null);
  }, [env, activeTab]);

  // ── Auto-hide search bar + footers on scroll ──
  useEffect(() => {
    let lastY = window.scrollY;
    let idleTimer: ReturnType<typeof setTimeout> | null = null;
    let ticking = false;
    let hidden = false;

    const setHiddenState = (hide: boolean) => {
      if (hidden === hide) return;
      hidden = hide;
      document.querySelectorAll('.auto-hide-target').forEach(el => {
        const isHeader = el.classList.contains('main-header') || el.classList.contains('top-switch-container');
        if (hide) {
          el.classList.add(isHeader ? 'header-hidden' : 'nav-hidden');
        } else {
          el.classList.remove('header-hidden', 'nav-hidden');
        }
      });
    };

    const resetIdleTimer = () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        if (window.scrollY > 60) setHiddenState(true);
      }, 2000);
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const delta = currentY - lastY;

        if (idleTimer) clearTimeout(idleTimer);

        if (currentY < 20) {
          setHiddenState(false);
        } else if (delta > 5 && currentY > 60) {
          setHiddenState(true);
        } else if (delta < -5) {
          setHiddenState(false);
          resetIdleTimer();
        } else {
          resetIdleTimer();
        }

        lastY = currentY;
        ticking = false;
      });
    };

    const onInteraction = () => {
      setHiddenState(false);
      resetIdleTimer();
    };

    setHiddenState(false);

    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('touchstart', onInteraction, { passive: true });
    document.addEventListener('mousemove', onInteraction, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('touchstart', onInteraction);
      document.removeEventListener('mousemove', onInteraction);
      if (idleTimer) clearTimeout(idleTimer);
    };
  }, []);

  // Notch Swipe Logic (4 Notches for v1)
  const allScopes: Scope[] = ['national', 'state', 'county', 'city'];
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [touchYStart, setTouchYStart] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
    setTouchYStart(e.targetTouches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart || !touchEnd || !touchYStart) return;
    const touchYEnd = e.changedTouches[0].clientY;
    const xDiff = touchStart - touchEnd;
    const yDiff = touchYStart - touchYEnd;
    const minSwipeDistance = 70;
    const isHorizontal = Math.abs(xDiff) > Math.abs(yDiff);

    if (isHorizontal && Math.abs(xDiff) > minSwipeDistance) {
      const currentIndex = allScopes.indexOf(scope);
      if (xDiff > 0) {
        if (currentIndex < allScopes.length - 1) setScope(allScopes[currentIndex + 1]);
      } else {
        if (currentIndex > 0) setScope(allScopes[currentIndex - 1]);
      }
    }
    setTouchStart(null);
    setTouchEnd(null);
    setTouchYStart(null);
  };

  // Center Active Environment Pill
  useEffect(() => {
    if (envSwitcherRef.current) {
      const container = envSwitcherRef.current;
      const performCentering = () => {
        const activeBtn = container.querySelector('.sw-btn.active') as HTMLElement;
        if (activeBtn) {
          isInternalScroll.current = true;
          const targetScroll = activeBtn.offsetLeft - (container.offsetWidth / 3);
          container.scrollLeft = targetScroll;
          setTimeout(() => {
            container.scrollLeft = targetScroll;
            isInitialized.current = true;
            isInternalScroll.current = false;
          }, 100);
        }
      };
      performCentering();
      const timeout = setTimeout(performCentering, 300);
      return () => clearTimeout(timeout);
    }
  }, [env]);

  const handleSwitcherScroll = () => {
    if (!isInitialized.current) return;
    if (envSwitcherRef.current) {
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
      if (isInternalScroll.current) {
        scrollTimeout.current = setTimeout(() => { isInternalScroll.current = false; }, 300);
        return;
      }
      const container = envSwitcherRef.current;
      const containerCenter = container.scrollLeft + container.offsetWidth / 2;
      const children = Array.from(container.children) as HTMLElement[];
      const validChildren = children.filter(c => !c.classList.contains('spacer'));
      
      let closestEnv: Env | null = null;
      let minDistance = Infinity;

      const envList: Env[] = ['discover', 'social', 'market', 'eats', 'rides', 'services', 'events', 'wallet', 'care', 'homes', 'auto', 'travel', 'jobs', 'media', 'art', 'faith', 'sports', 'news'];
      if (user?.role === 'admin') envList.push('civics', 'admin', 'dashboard');
      else if (user?.role && ['business', 'official', 'chamber', 'media', 'artist', 'venue', 'non_profit', 'church'].includes(user.role)) envList.push('dashboard');

      validChildren.forEach((child, i) => {
        const childCenter = child.offsetLeft + child.offsetWidth / 2;
        const distance = Math.abs(containerCenter - childCenter);
        if (distance < minDistance) {
          minDistance = distance;
          closestEnv = envList[i];
        }
      });

      if (closestEnv && closestEnv !== env) {
        const itemWidth = container.offsetWidth / 3;
        if (minDistance < itemWidth * 0.15) {
          setActiveStoreId(null);
          setActivePostId(null);
          setEnv(closestEnv);
          setActiveTab(0);
        }
      }
    }
  };

  const handleEnvClick = (newEnv: Env) => {
    isInternalScroll.current = true;
    setActiveStoreId(null);
    setActivePostId(null);
    setEnv(newEnv);
    setActiveTab(0);
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => { isInternalScroll.current = false; }, 1000);
  };

  const scrollSwitcher = (direction: 'left' | 'right') => {
    if (envSwitcherRef.current) {
      const container = envSwitcherRef.current;
      const scrollAmount = container.offsetWidth / 2;
      container.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  const getBadgeIcon = (role: string) => {
    if (role?.startsWith('v_')) return <CheckCircle size={14} color="var(--primary)" />;
    if (role === 'admin') return <ShieldCheck size={14} color="var(--admin-gold)" />;
    return <Clock size={14} style={{ opacity: 0.5 }} />;
  };

  // Nav Items Definitions
  const discoverNav = [{ icon: <Compass size={24} />, label: 'Discover' }, { icon: <TrendingUp size={24} />, label: 'Trending' }, { icon: <Zap size={24} />, label: 'Hot Deals' }, { icon: <Sparkles size={24} />, label: 'New' }, { icon: <Map size={24} />, label: 'Radar' }, { icon: <User size={24} />, label: 'My Vibes' }];
  const socialNav = [{ icon: <Rss size={24} />, label: 'Feed' }, { icon: <ShoppingBag size={24} />, label: 'Classifieds' }, { icon: <Users size={24} />, label: 'Directory' }, { icon: <LayoutGrid size={24} />, label: 'Groups' }, { icon: <MessageSquare size={24} />, label: 'Messages' }, { icon: <Bookmark size={24} />, label: 'Saved' }, { icon: <Bell size={24} />, label: 'Alerts' }, { icon: <User size={24} />, label: 'Profile' }, { icon: <Settings size={24} />, label: 'System' }];
  const marketNav = [{ icon: <Store size={24} />, label: 'Home' }, { icon: <SearchIcon size={24} />, label: 'Search' }, { icon: <LayoutGrid size={24} />, label: 'Stores' }, { icon: <ShoppingCart size={24} />, label: 'Cart' }, { icon: <Heart size={24} />, label: 'Wishlist' }, { icon: <UserCircle size={24} />, label: 'Account' }];

  const getNavItems = () => {
    if (env === 'discover') return discoverNav;
    if (env === 'social') return socialNav;
    if (env === 'market') return marketNav;
    // ... add more as needed to match the social market's App.tsx
    return socialNav;
  };

  const currentNav = getNavItems();

  return (
    <div 
      className="app-container setx-v1-layout"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="sticky-header-group glass">
        <ThemeTopBar />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px 0', minHeight: '52px' }}>
          <div style={{ flex: 1 }}>
            <h1 className="logo-text" onClick={() => { setEnv('discover'); setActiveTab(0); }} style={{ cursor: 'pointer', margin: 0, display: 'flex', alignItems: 'baseline', gap: '2px' }}>
              {scope === 'national' ? 'E' : scope === 'state' ? (user?.state_abbr || 'TX') : scope === 'city' ? (user?.community || 'Local') : (user?.county || 'SETX')}
              <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)', transition: 'color 0.3s ease', lineHeight: 1 }}>
                {scope === 'national' ? 'futura' : scope === 'state' ? ' Nexus' : scope === 'city' ? ' City' : ' 360'}
              </span>
            </h1>
          </div>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
             <div onClick={() => setIsTevisOpen(!isTevisOpen)} style={{ position: 'relative', width: 56, height: 56, borderRadius: '50%', cursor: 'pointer', boxShadow: isTevisOpen ? `0 0 35px 5px var(--primary)` : (theme.endsWith('-dark') ? `0 0 25px 2px var(--primary)` : 'none'), transition: 'all 0.4s ease', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src="/logo-neo.png" alt="Logo" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'contain' }} />
             </div>
          </div>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: '8px', alignItems: 'center' }}>
            <button onClick={toggleTheme} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '10px', padding: '6px 8px', cursor: 'pointer', color: 'var(--text)' }}>
              {theme.includes('light') ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            {user && (
              <div className="user-profile-badge" onClick={() => !user.role.startsWith('v_') && setIsVerifying(true)} style={{ display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer', padding: '4px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)' }}>
                {getBadgeIcon(user.role)}
                <Avatar url={user.avatar_url} name={user.name} size={32} />
              </div>
            )}
          </div>
        </div>

        <div className="top-switch-container" style={{ padding: '4px 0 8px' }}>
          <div className="four-notches">
            {allScopes.map(s => (
              <div 
                key={s}
                className={`notch notch-${allScopes.indexOf(s)} ${scope === s ? 'active' : ''}`} 
                onClick={() => setScope(s)}
                style={{ cursor: 'pointer' }}
                title={`${s} view`}
              />
            ))}
          </div>
        </div>

        <header className="main-header auto-hide-target" style={{ padding: '0 16px 8px' }}>
          <button className="header-action-btn search-trigger" onClick={() => setIsSearchOpen(true)} style={{ width: '100%', background: theme.endsWith('-dark') ? 'rgba(255,255,255,0.08)' : '#fff', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)', padding: '12px 20px', borderRadius: '30px', display: 'flex', alignItems: 'center', gap: '14px', justifyContent: 'flex-start', boxShadow: '0 4px 15px rgba(0,0,0,0.08)' }}>
            <SearchIcon size={20} style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: '0.95rem', fontWeight: 500, opacity: 0.8 }}>Search {scope}...</span>
          </button>
        </header>
      </div>

      <main className="content-area">
        <AnimatePresence mode="wait">
          <motion.div key={env + activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="view-container">
            <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}><Loader2 className="animate-spin" size={32} color="var(--primary)" /></div>}>
              {renderView()}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>

      <div className="env-switcher-footer auto-hide-target">
        <div className="switcher-wrapper glass">
          <button className="desktop-scroll-btn left" onClick={() => scrollSwitcher('left')}><ChevronLeft size={20} /></button>
          <div className="switcher-scroll" ref={envSwitcherRef} onScroll={() => { handleSwitcherScroll(); if (scrollTimeout.current) clearTimeout(scrollTimeout.current); scrollTimeout.current = setTimeout(() => { isInternalScroll.current = false; }, 100); }}>
            <div className="sw-btn spacer" aria-hidden="true" />
            {['discover', 'social', 'market', 'eats', 'rides', 'services', 'events', 'wallet', 'care', 'homes', 'auto', 'travel', 'jobs', 'media', 'art', 'faith', 'sports', 'news'].map(id => (
              <button key={id} className={`sw-btn ${id} ${env === id ? 'active' : ''}`} onClick={() => handleEnvClick(id as Env)}>
                {id.charAt(0).toUpperCase() + id.slice(1)}
              </button>
            ))}
            {['dashboard', 'admin'].map(id => (
              (user?.role === 'admin' || (id === 'dashboard' && user?.role)) && 
              <button key={id} className={`sw-btn ${id} ${env === id ? 'active' : ''}`} onClick={() => handleEnvClick(id as Env)}>{id.charAt(0).toUpperCase() + id.slice(1)}</button>
            ))}
            <div className="sw-btn spacer" aria-hidden="true" />
          </div>
          <button className="desktop-scroll-btn right" onClick={() => scrollSwitcher('right')}><ChevronRight size={20} /></button>
        </div>
      </div>

      <nav className="bottom-nav glass auto-hide-target">
        <div className="nav-items-scroll">
          {currentNav.map((item, index) => (
            <button key={item.label} className={`nav-btn ${activeTab === index ? 'active' : ''}`} onClick={() => setActiveTab(index)}>
              <div className="icon-wrapper">
                {item.icon}
                {item.label === 'Alerts' && unreadCount > 0 && <span className="badge">{unreadCount}</span>}
              </div>
              <span className="label">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <AnimatePresence>
        {updateAvailable && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="update-toast glass" style={{ position: 'fixed', bottom: '160px', left: '20px', right: '20px', zIndex: 2000, padding: '16px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(112, 0, 244, 0.9)', color: 'white', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Sparkles size={20} />
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>A new version of SETX 360 is ready!</span>
            </div>
            <button onClick={onUpdate} style={{ background: 'white', color: '#7000f4', border: 'none', padding: '8px 16px', borderRadius: '12px', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}>Update Now</button>
          </motion.div>
        )}
      </AnimatePresence>

      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} onNavigate={(newEnv: Env, newTab: number) => { setEnv(newEnv as any); setActiveTab(newTab); }} scope={scope} user={user} />
      <TevisChat user={user} isOpen={isTevisOpen} onClose={() => setIsTevisOpen(false)} />
      <GlobalChatBubbles user={user} />
      {isVerifying && <VerificationModal user={user} onClose={() => { setIsVerifying(false); refreshUser(); }} />}
    </div>
  );
};
