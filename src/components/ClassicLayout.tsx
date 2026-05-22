import React, { useState, useEffect, Suspense } from 'react';
import { 
  Users, 
  Rss, 
  MessageSquare, 
  Bell, 
  Bookmark, 
  User, 
  ShoppingBag, 
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
  BarChart3,
  Settings,
  Loader2,
  CheckCircle,
  Clock,
  Home,
  Monitor,
  Package,
  DollarSign,
  Map,
  MapPin,
  Search as SearchIcon,
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
  ChevronLeft,
  ChevronRight,
  Plus,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp, type Env } from '../context/AppContext';
import { ThemeTopBar } from './ThemeTopBar';
import { Avatar } from './Avatar';
import { SignUpFlow } from './SignUpFlow';
import { VerificationModal } from './VerificationModal';
import { TevisChat } from './TevisChat';
import { GlobalChatBubbles } from './GlobalChatBubbles';
import { OnboardingOverlay } from './OnboardingOverlay';
import {
  meNav, discoverNav, searchNav, socialNav, marketNav, eatsNav, ridesNav,
  servicesNav, eventsNav, walletNav, careNav, homesNav, autoNav,
  travelNav, jobsNav, mediaNav, artNav, faithNav, sportsNav,
  newsNav, civicsNav, vendorNav, civicNav, adminNav, switcherItems
} from '../config/navConfig';

// Props for the layout
interface ClassicLayoutProps {
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

export const ClassicLayout: React.FC<ClassicLayoutProps> = ({ 
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
    setEnv, setScope, setActiveTab, setIsSearchOpen, toggleTheme, refreshUser,
    isSetxIO
  } = useApp();

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isTevisOpen, setIsTevisOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const envSwitcherRef = React.useRef<HTMLDivElement>(null);
  const isInternalScroll = React.useRef(false);
  const isInitialized = React.useRef(false);
  const scrollTimeout = React.useRef<any>(null);

  // Desktop Drag to scroll logic for switcher
  const isDragging = React.useRef(false);
  const startX = React.useRef(0);
  const scrollLeft = React.useRef(0);

  // ── Auto-hide search bar + footers on scroll ──
  // Uses rAF-throttled scroll + delta threshold to avoid the reflow-triggered
  // scroll → hide → reflow → scroll infinite loop that causes flickering.
  useEffect(() => {
    let lastY = window.scrollY;
    let idleTimer: ReturnType<typeof setTimeout> | null = null;
    let ticking = false;
    let hidden = false;

    const setHidden = (hide: boolean) => {
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
        if (window.scrollY > 60) setHidden(true);
      }, 2000);
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const delta = currentY - lastY;

        if (idleTimer) clearTimeout(idleTimer);

        // Near the top — always show
        if (currentY < 20) {
          setHidden(false);
        }
        // Scrolling down by at least 5px and past the initial zone
        else if (delta > 5 && currentY > 60) {
          setHidden(true);
        }
        // Scrolling up by at least 5px
        else if (delta < -5) {
          setHidden(false);
          resetIdleTimer();
        }
        // Small/zero delta — don't toggle, but restart idle timer
        else {
          resetIdleTimer();
        }

        lastY = currentY;
        ticking = false;
      });
    };

    // Touch/mouse activity → show bars, then arm idle timer
    const onInteraction = () => {
      setHidden(false);
      resetIdleTimer();
    };

    setHidden(false);

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

  const NOTCH_KEY = 'setx360_notch_sessions';
  const notchSessions = parseInt(localStorage.getItem(NOTCH_KEY) || '0', 10);
  const notchHasInteracted = localStorage.getItem('setx360_notch_interacted') === 'true';
  const [showNotchPulse, setShowNotchPulse] = useState(!notchHasInteracted && notchSessions < 3);

  const handleNotchInteraction = (newScope: 'county' | 'city') => {
    setScope(newScope);
    if (showNotchPulse) {
      setShowNotchPulse(false);
      localStorage.setItem('setx360_notch_interacted', 'true');
    }
  };


  const handleMouseDown = (e: React.MouseEvent) => {
    if (!envSwitcherRef.current) return;
    isDragging.current = true;
    startX.current = e.pageX - envSwitcherRef.current.offsetLeft;
    scrollLeft.current = envSwitcherRef.current.scrollLeft;
  };

  const handleMouseLeave = () => {
    isDragging.current = false;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !envSwitcherRef.current) return;
    e.preventDefault();
    const x = e.pageX - envSwitcherRef.current.offsetLeft;
    const walk = (x - startX.current) * 2;
    envSwitcherRef.current.scrollLeft = scrollLeft.current - walk;
  };

  const scrollSwitcher = (dir: 'left' | 'right') => {
    if (!envSwitcherRef.current) return;
    const amount = window.innerWidth > 600 ? 300 : 200;
    envSwitcherRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  // Notch Swipe Logic
  const scopes: Array<'county' | 'city'> = ['county', 'city'];
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
    const isSETX = theme.startsWith('setx-');

    if (isHorizontal && Math.abs(xDiff) > minSwipeDistance && !isSETX) {
      const currentIndex = (scopes as any[]).indexOf(scope);
      if (xDiff > 0) {
        if (currentIndex < scopes.length - 1) setScope(scopes[currentIndex + 1] as any);
      } else {
        if (currentIndex > 0) setScope(scopes[currentIndex - 1] as any);
      }
    }
    setTouchStart(null);
    setTouchEnd(null);
    setTouchYStart(null);
  };

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
        scrollTimeout.current = setTimeout(() => {
          isInternalScroll.current = false;
        }, 300);
        return;
      }
      const container = envSwitcherRef.current;
      const containerCenter = container.scrollLeft + container.offsetWidth / 2;
      const children = Array.from(container.children) as HTMLElement[];
      const validChildren = children.filter(c => !c.classList.contains('spacer'));
      let closestEnv: Env | null = null;
      let minDistance = Infinity;
      const isAdmin = user?.role === 'admin';
      const envs: Env[] = [];
      if (isAdmin) envs.push('admin');
      envs.push('me', 'search', 'discover', 'social', 'events', 'news', 'faith', 'market', 'eats', 'services', 'jobs');
      const hasDashboardRole = user?.role && ['business', 'official', 'chamber', 'media', 'artist', 'venue', 'non_profit', 'church'].includes(user.role);
      const hasClearances = user?.clearances && user.clearances.length > 0;
      if ((hasDashboardRole || hasClearances) && !isAdmin) envs.push('dashboard');
      validChildren.forEach((child, i) => {
        const childCenter = child.offsetLeft + child.offsetWidth / 2;
        const distance = Math.abs(containerCenter - childCenter);
        if (distance < minDistance) {
          minDistance = distance;
          closestEnv = envs[i];
        }
      });
      if (closestEnv && closestEnv !== env) {
        const itemWidth = container.offsetWidth / 3;
        if (minDistance < itemWidth * 0.15) {
          setActiveStoreId(null);
          setActivePostId(null);
          setActiveGroupId(null);
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
    setActiveGroupId(null);
    setEnv(newEnv);
    setActiveTab(0);
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      isInternalScroll.current = false;
    }, 1000);
  };

  const getBadgeIcon = (role: string) => {
    if (role?.startsWith('v_')) return <CheckCircle size={14} color="var(--primary)" />;
    if (role === 'admin') return <ShieldCheck size={14} color="var(--admin-gold)" />;
    return <Clock size={14} style={{ opacity: 0.5 }} />;
  };


  const getNavItems = () => {
    if (env === 'me') return meNav;
    if (env === 'discover') return discoverNav;
    if (env === 'search') return searchNav;
    if (env === 'social') return socialNav;
    if (env === 'market') return marketNav;
    if (env === 'eats') return eatsNav;
    if (env === 'rides') return ridesNav;
    if (env === 'services') return servicesNav;
    if (env === 'events') return eventsNav;
    if (env === 'wallet') return walletNav;
    if (env === 'care') return careNav;
    if (env === 'homes') return homesNav;
    if (env === 'auto') return autoNav;
    if (env === 'travel') return travelNav;
    if (env === 'jobs') return jobsNav;
    if (env === 'media') return mediaNav;
    if (env === 'art') return artNav;
    if (env === 'faith') return faithNav;
    if (env === 'sports') return sportsNav;
    if (env === 'news') return newsNav;
    if (env === 'civics') return civicsNav;
    if (env === 'dashboard') {
      const role = user?.role || '';
      const hasClearance = (type: string) => user?.clearances?.some((c: any) => c.entity_type === type);
      if (['official', 'chamber'].includes(role) || hasClearance('civic')) return civicNav;
      return vendorNav;
    }
    return adminNav;
  };

  const currentNav = getNavItems();

  const getHeaderLogo = () => {
    if (theme.startsWith('io-')) return '/logo-io.png';
    if (theme.startsWith('neo')) return '/logo-neo.png';
    if (theme.startsWith('twilight')) return '/logo-twilight.png';
    if (theme.startsWith('efutura')) return '/logo-efutura.png';
    return theme.includes('light') ? '/logo-setx-blue.png' : '/logo-setx-transparent.png';
  };

  return (
    <div 
      className="app-container"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {!isSetxIO && (
        <div className="sticky-header-group glass">
          <ThemeTopBar key={env + '-' + theme} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px 0', minHeight: '52px' }}>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
              <h1 className="logo-text" onClick={() => { setEnv('discover'); setActiveTab(0); }} style={{ cursor: 'pointer', margin: 0, display: 'flex', alignItems: 'baseline', gap: '2px', color: theme.includes('light') ? '#000' : '#fff' }}>
                {env === 'me' ? 'Verify Me' : (scope === 'city' ? (user?.community || 'City') : 'SETX')}
                <span style={{ 
                  fontSize: '1.2rem', 
                  fontWeight: 700, 
                  color: 'var(--primary)', 
                  transition: 'color 0.3s ease', 
                  lineHeight: 1 
                }}> 360</span>
              </h1>
            </div>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div onClick={() => setIsTevisOpen(!isTevisOpen)} style={{ position: 'relative', width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', cursor: 'pointer', boxShadow: isTevisOpen ? `0 0 35px 5px var(--primary)` : (theme.endsWith('-dark') ? `0 0 25px 2px var(--primary)` : 'none'), transform: isTevisOpen ? 'scale(1.1)' : 'scale(1)', transition: 'all 0.4s ease' }}>
                <img src={getHeaderLogo()} alt="Logo" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'contain', zIndex: 1 }} />
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: '8px', alignItems: 'center' }}>
              {user ? (
                <>
                  <button onClick={toggleTheme} title="Toggle theme" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '6px 8px', cursor: 'pointer', color: 'var(--text)', display: 'flex', alignItems: 'center' }}>
                    {theme.includes('light') ? <Moon size={18} /> : <Sun size={18} />}
                  </button>
                  <div className="user-profile-badge" onClick={() => !user.role.startsWith('v_') && setIsVerifying(true)} style={{ display: 'flex', gap: '8px', alignItems: 'center', cursor: user.role.startsWith('v_') ? 'default' : 'pointer', padding: '4px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>{getBadgeIcon(user.role)}</div>
                    <Avatar url={user.avatar_url} name={user.name} size={32} />
                  </div>
                </>
              ) : (
                <button onClick={toggleTheme} className="theme-toggle" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text)', padding: '8px' }}>
                  {theme.includes('light') ? <Moon size={20} /> : <Sun size={20} />}
                </button>
              )}
            </div>
          </div>
          {user && (
            <div className="top-switch-container auto-hide-target" style={{ padding: '4px 0 8px' }}>
              <div className="two-notches">
                <div className={`notch notch-2 ${scope === 'county' ? 'active' : ''} ${showNotchPulse && scope === 'city' ? 'pulse' : ''}`} onClick={() => handleNotchInteraction('county')} style={{ cursor: 'pointer' }} title={`${user?.county || 'Regional'} (County)`} />
                {/* City notch hidden per focus request */}
                {/* <div className={`notch notch-3 ${scope === 'city' ? 'active' : ''} ${showNotchPulse && scope === 'county' ? 'pulse' : ''}`} onClick={() => handleNotchInteraction('city')} style={{ cursor: 'pointer' }} title={`${user?.community || 'Local'} (City)`} /> */}
              </div>
            </div>
          )}
          {user && (
            <header className="main-header auto-hide-target" style={{ padding: '0 16px 8px' }}>
              <div className="header-content" style={{ display: 'block' }}>
                <button className="header-action-btn search-trigger" onClick={() => setIsSearchOpen(true)} style={{ width: '100%', background: theme.endsWith('-dark') ? 'rgba(255,255,255,0.08)' : '#fff', border: theme === 'setx-light' ? '2px solid var(--primary)' : theme.endsWith('-light') ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)', padding: '12px 20px', borderRadius: '30px', display: 'flex', alignItems: 'center', gap: '14px', justifyContent: 'flex-start', boxShadow: theme.endsWith('-light') ? '0 4px 15px rgba(0,0,0,0.08)' : '0 4px 20px rgba(0,0,0,0.2)', transition: 'all 0.2s ease' }}>
                  <SearchIcon size={20} className="search-icon-anim" style={{ color: 'var(--primary)' }} />
                  <span style={{ fontSize: '0.95rem', fontWeight: 500, opacity: 0.8 }}>Search {scope}...</span>
                </button>
              </div>
            </header>
          )}
        </div>
      )}

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
          scope={scope}
          user={user}
        />
      </Suspense>

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

      {isVerifying && (
        <VerificationModal user={user} onClose={() => { setIsVerifying(false); refreshUser(); }} />
      )}

      <main className="content-area" style={{ paddingTop: (!user && !isSetxIO && env !== 'labs') ? '40px' : '0' }}>
        {(user || isSetxIO || env === 'labs') ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={env + activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="view-container"
            >
              <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}><Loader2 className="animate-spin" size={32} color="var(--primary)" /></div>}>
                {renderView()}
              </Suspense>
            </motion.div>
          </AnimatePresence>
        ) : (
          <SignUpFlow />
        )}
      </main>

      {!isSetxIO && user && (
        <div className="env-switcher-footer auto-hide-target">
          <div className="switcher-wrapper glass">
            {user?.role === 'admin' && (
              <button
                className={`sw-btn admin ${env === 'admin' ? 'active' : ''}`}
                onClick={() => handleEnvClick('admin')}
                style={{ minWidth: '110px', width: '110px', borderRight: '1px solid var(--border)', borderRadius: '30px 0 0 30px', flexShrink: 0 }}
              >
                <ShieldCheck size={18} /> Admin Control
              </button>
            )}
            <button className="desktop-scroll-btn left" onClick={() => scrollSwitcher('left')}><ChevronLeft size={20} /></button>
            <div className="switcher-scroll" ref={envSwitcherRef} onMouseDown={handleMouseDown} onMouseLeave={handleMouseLeave} onMouseUp={handleMouseUp} onMouseMove={handleMouseMove} onScroll={() => { handleSwitcherScroll(); if (scrollTimeout.current) clearTimeout(scrollTimeout.current); scrollTimeout.current = setTimeout(() => { isInternalScroll.current = false; }, 100); }}>
              <div className="sw-btn spacer" aria-hidden="true" />
              {switcherItems.map(item => (
                <button key={item.id} className={`sw-btn ${item.id} ${env === item.id ? 'active' : ''}`} onClick={() => handleEnvClick(item.id as Env)}>
                  {item.icon} {item.label}
                </button>
              ))}
              {((user?.role && ['business', 'official', 'chamber', 'media', 'artist', 'venue', 'non_profit', 'church'].includes(user.role)) || (user?.clearances && user.clearances.length > 0)) && user.role !== 'admin' && (
                <button className={`sw-btn dashboard ${env === 'dashboard' ? 'active' : ''}`} onClick={() => handleEnvClick('dashboard')}><Store size={18} /> Dashboard</button>
              )}
              <div className="sw-btn spacer" aria-hidden="true" />
            </div>
            <button className="desktop-scroll-btn right" onClick={() => scrollSwitcher('right')}><ChevronRight size={20} /></button>
          </div>
        </div>
      )}

      {!isSetxIO && user && (
        <nav className="bottom-nav glass auto-hide-target">
          <div className="nav-items-scroll">
            {currentNav.map((item, index) => (
              <button key={item.label} className={`nav-btn ${activeTab === index ? 'active' : ''}`} onClick={() => setActiveTab(index)}>
                <div className="icon-wrapper">
                  {item.icon}
                  {item.label === 'Alerts' && unreadCount > 0 && <span className="badge">{unreadCount}</span>}
                  {item.label === 'Cart' && <span className="badge">1</span>}
                </div>
                <span className="label">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>
      )}

      <TevisChat user={user} isOpen={isTevisOpen} onClose={() => setIsTevisOpen(false)} />
      <GlobalChatBubbles user={user} />
      {showOnboarding && <OnboardingOverlay onComplete={() => setShowOnboarding(false)} />}
    </div>
  );
};
