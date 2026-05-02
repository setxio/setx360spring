import React, { useState, useEffect, lazy, Suspense } from 'react';
import { 
  Users, 
  Rss, 
  MessageSquare, 
  Bell, 
  Bookmark, 
  User, 
  ShoppingBag, 
  Search, 
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
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

// Always-needed lightweight components (static imports)
import { ThemeTopBar } from './components/ThemeTopBar';
import { Avatar } from './components/Avatar';
import { SignUpFlow } from './components/SignUpFlow';
import { VerificationModal } from './components/VerificationModal';
import { TevisChat } from './components/TevisChat';
import { GlobalChatBubbles } from './components/GlobalChatBubbles';
import { OnboardingOverlay, shouldShowOnboarding } from './components/OnboardingOverlay';

// Heavy page-level components (lazy loaded on demand)
const SearchOverlay    = lazy(() => import('./components/SearchOverlay').then(m => ({ default: m.SearchOverlay })));
const RadarMapView     = lazy(() => import('./components/RadarMapView').then(m => ({ default: m.RadarMapView })));
const SocialFeed       = lazy(() => import('./components/SocialFeed').then(m => ({ default: m.SocialFeed })));
const MarketHome       = lazy(() => import('./components/MarketHome').then(m => ({ default: m.MarketHome })));
const DiscoverView     = lazy(() => import('./components/DiscoverView').then(m => ({ default: m.DiscoverView })));
const StoresDirectory  = lazy(() => import('./components/StoresDirectory').then(m => ({ default: m.StoresDirectory })));
const ProductSearch    = lazy(() => import('./components/ProductSearch').then(m => ({ default: m.ProductSearch })));
const UserDirectory    = lazy(() => import('./components/SocialDirectories').then(m => ({ default: m.UserDirectory })));
const GroupDirectory   = lazy(() => import('./components/SocialDirectories').then(m => ({ default: m.GroupDirectory })));
const CartView         = lazy(() => import('./components/CartWishlistView').then(m => ({ default: m.CartView })));
const WishlistView     = lazy(() => import('./components/CartWishlistView').then(m => ({ default: m.WishlistView })));
const ComingSoon       = lazy(() => import('./components/ComingSoon').then(m => ({ default: m.ComingSoon })));
const JobsView         = lazy(() => import('./components/JobsView').then(m => ({ default: m.JobsView })));
const RidesView        = lazy(() => import('./components/RidesView').then(m => ({ default: m.RidesView })));
const ClassifiedsView  = lazy(() => import('./components/ClassifiedsView').then(m => ({ default: m.ClassifiedsView })));
const SavedView        = lazy(() => import('./components/SavedView').then(m => ({ default: m.SavedView })));
const ProfilePage      = lazy(() => import('./components/ProfilePage').then(m => ({ default: m.ProfilePage })));
const SettingsPage     = lazy(() => import('./components/SettingsPage').then(m => ({ default: m.SettingsPage })));
const EditProfilePage  = lazy(() => import('./components/EditProfilePage').then(m => ({ default: m.EditProfilePage })));
const MessagesView     = lazy(() => import('./components/MessagesView').then(m => ({ default: m.MessagesView })));
const AdminDashboard   = lazy(() => import('./components/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const VendorDashboard  = lazy(() => import('./components/VendorDashboard').then(m => ({ default: m.VendorDashboard })));
const CreatorDashboard = lazy(() => import('./components/CreatorDashboard').then(m => ({ default: m.CreatorDashboard })));
const CivicDashboard   = lazy(() => import('./components/CivicDashboard').then(m => ({ default: m.CivicDashboard })));
const MinistryDashboard= lazy(() => import('./components/MinistryDashboard').then(m => ({ default: m.MinistryDashboard })));
const StoreFrontView   = lazy(() => import('./components/StoreFrontView').then(m => ({ default: m.StoreFrontView })));
const NotificationsView= lazy(() => import('./components/NotificationsView').then(m => ({ default: m.NotificationsView })));
const MarketAccount    = lazy(() => import('./components/MarketAccount').then(m => ({ default: m.MarketAccount })));
const TrendingView     = lazy(() => import('./components/TrendingView').then(m => ({ default: m.TrendingView })));
const HotDealsView     = lazy(() => import('./components/HotDealsView').then(m => ({ default: m.HotDealsView })));
const NewArrivalsView  = lazy(() => import('./components/NewArrivalsView').then(m => ({ default: m.NewArrivalsView })));
const VibesView        = lazy(() => import('./components/VibesView').then(m => ({ default: m.VibesView })));
const GroupDetailView  = lazy(() => import('./components/GroupDetailView').then(m => ({ default: m.GroupDetailView })));
const TevisDiscoverView = lazy(() => import('./components/TevisDiscoverView').then(m => ({ default: m.TevisDiscoverView })));
const PostDetailView   = lazy(() => import('./components/PostDetailView').then(m => ({ default: m.PostDetailView })));
const EatsView         = lazy(() => import('./components/EatsView').then(m => ({ default: m.EatsView })));
const HomesView        = lazy(() => import('./components/HomesView').then(m => ({ default: m.HomesView })));
const AutoView         = lazy(() => import('./components/AutoView').then(m => ({ default: m.AutoView })));
const TravelView       = lazy(() => import('./components/TravelView').then(m => ({ default: m.TravelView })));
const CareView         = lazy(() => import('./components/CareView').then(m => ({ default: m.CareView })));
const WalletView       = lazy(() => import('./components/WalletView').then(m => ({ default: m.WalletView })));
const EventsView       = lazy(() => import('./components/EventsView').then(m => ({ default: m.EventsView })));
const ServicesView     = lazy(() => import('./components/ServicesView').then(m => ({ default: m.ServicesView })));
const MediaView        = lazy(() => import('./components/MediaView').then(m => ({ default: m.MediaView })));
const ArtGalleryView   = lazy(() => import('./components/ArtGalleryView').then(m => ({ default: m.ArtGalleryView })));
const FaithView        = lazy(() => import('./components/FaithView').then(m => ({ default: m.FaithView })));
const SportsView       = lazy(() => import('./components/SportsView').then(m => ({ default: m.SportsView })));
const WeatherNewsView  = lazy(() => import('./components/WeatherNewsView').then(m => ({ default: m.WeatherNewsView })));
const CivicsView       = lazy(() => import('./components/CivicsView').then(m => ({ default: m.CivicsView })));

import { useApp, type Env } from './context/AppContext';

const App: React.FC = () => {
  const { 
    user, env, theme, scope, activeTab, unreadCount, isLoading, isSearchOpen, isSetxDomain,
    setEnv, setTheme, setScope, setActiveTab, setIsSearchOpen, toggleTheme, refreshUser, updateUser
  } = useApp();

  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setUpdateAvailable(true);
              }
            });
          }
        });
      });
    }
  }, []);

  useEffect(() => {
    // Show onboarding for first-time authenticated users
    if (user && shouldShowOnboarding()) {
      setShowOnboarding(true);
    }
  }, [user]);

  const handleUpdate = () => {
    window.location.reload();
  };

  const envSwitcherRef = React.useRef<HTMLDivElement>(null);
  const isInternalScroll = React.useRef(false);
  const isInitialized = React.useRef(false);
  const scrollTimeout = React.useRef<any>(null);

  // Desktop Drag to scroll logic for switcher
  const isDragging = React.useRef(false);
  const startX = React.useRef(0);
  const scrollLeft = React.useRef(0);

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

  const [isVerifying, setIsVerifying] = useState(false);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [activeStoreId, setActiveStoreId] = useState<string | null>(null);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [isTevisOpen, setIsTevisOpen] = useState(false);

  // Clear store/post detail views whenever the user navigates away
  useEffect(() => {
    setActiveStoreId(null);
    setActivePostId(null);
    setActiveCommentId(null);
    setActiveProfileId(null);
    setActiveGroupId(null);
  }, [env, activeTab]);

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
    
    // Check vertical touch end to prevent interference with vertical scroll
    const touchYEnd = e.changedTouches[0].clientY;
    const xDiff = touchStart - touchEnd;
    const yDiff = touchYStart - touchYEnd;
    
    const minSwipeDistance = 70;
    const isHorizontal = Math.abs(xDiff) > Math.abs(yDiff);
    const isSETX = theme.startsWith('setx-');

    if (isHorizontal && Math.abs(xDiff) > minSwipeDistance && !isSETX) {
    const currentIndex = (scopes as any[]).indexOf(scope);
    if (xDiff > 0) {
      // Swipe Left -> More Local
      if (currentIndex < scopes.length - 1) setScope(scopes[currentIndex + 1] as any);
    } else {
      // Swipe Right -> More National
      if (currentIndex > 0) setScope(scopes[currentIndex - 1] as any);
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
          
          // Re-verify after a short delay to fight browser scroll restoration
          setTimeout(() => {
            container.scrollLeft = targetScroll;
            isInitialized.current = true;
            isInternalScroll.current = false;
          }, 100);
        }
      };

      // Initial run
      performCentering();
      
      // Secondary run to catch layout shifts
      const timeout = setTimeout(performCentering, 300);
      return () => clearTimeout(timeout);
    }
  }, [env]);



  const handleSwitcherScroll = () => {
    if (!isInitialized.current) return;
    if (envSwitcherRef.current) {
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
      
      // If we are doing a manual scroll (click), don't trigger detection
      if (isInternalScroll.current) {
        scrollTimeout.current = setTimeout(() => {
          isInternalScroll.current = false;
        }, 300); // Increased timeout for stability
        return;
      }

      const container = envSwitcherRef.current;
      const containerCenter = container.scrollLeft + container.offsetWidth / 2;
      // Get only sw-btn that are NOT spacers
      const children = Array.from(container.children) as HTMLElement[];
      const validChildren = children.filter(c => !c.classList.contains('spacer'));
      
      let closestEnv: Env | null = null;
      let minDistance = Infinity;

      const isAdmin = user?.role === 'admin';
      const envs: Env[] = ['discover', 'social', 'market', 'events', 'news', 'faith'];

      const hasDashboardRole = user?.role && ['business', 'official', 'chamber', 'media', 'artist', 'venue', 'non_profit', 'church'].includes(user.role);
      if (hasDashboardRole && !isAdmin) envs.push('dashboard');

      validChildren.forEach((child, i) => {
        const childCenter = child.offsetLeft + child.offsetWidth / 2;
        const distance = Math.abs(containerCenter - childCenter);
        if (distance < minDistance) {
          minDistance = distance;
          closestEnv = envs[i];
        }
      });

      if (closestEnv && closestEnv !== env) {
        // Tightened threshold for cleaner activation
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // '/' to search, but not if typing in an input
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsSearchOpen]);

  const getBadgeIcon = (role: string) => {
    if (role?.startsWith('v_')) return <CheckCircle size={14} color="var(--primary)" />;
    if (role === 'admin') return <ShieldCheck size={14} color="var(--admin-gold)" />;
    return <Clock size={14} style={{ opacity: 0.5 }} />;
  };

  // Navigation Items
  const discoverNav = [
    { icon: <Compass size={24} />, label: 'Discover' },
    { icon: <TrendingUp size={24} />, label: 'Trending' },
    { icon: <Zap size={24} />, label: 'Hot Deals' },
    { icon: <Sparkles size={24} />, label: 'New' },
    { icon: <Map size={24} />, label: 'Radar' },
    { icon: <User size={24} />, label: 'My Vibes' },
    { icon: <Bot size={24} color="var(--primary)" />, label: 'Tevis' },
  ];

  const socialNav = [
    { icon: <Rss size={24} />, label: 'Feed' },
    { icon: <ShoppingBag size={24} />, label: 'Classifieds' },
    { icon: <Users size={24} />, label: 'Directory' },
    { icon: <LayoutGrid size={24} />, label: 'Groups' },
    { icon: <MessageSquare size={24} />, label: 'Messages' },
    { icon: <Bookmark size={24} />, label: 'Saved' },
    { icon: <Bell size={24} />, label: 'Alerts' },
    { icon: <User size={24} />, label: 'Profile' },
    { icon: <Settings size={24} />, label: 'System' },
  ];

  const marketNav = [
    { icon: <Store size={24} />, label: 'Home' },
    { icon: <Search size={24} />, label: 'Search' },
    { icon: <LayoutGrid size={24} />, label: 'Stores' },
    { icon: <ShoppingCart size={24} />, label: 'Cart' },
    { icon: <Heart size={24} />, label: 'Wishlist' },
    { icon: <UserCircle size={24} />, label: 'Account' },
  ];

  const eatsNav = [
    { icon: <Utensils size={24} />, label: 'Home' },
    { icon: <Search size={24} />, label: 'Explore' },
    { icon: <ShoppingBag size={24} />, label: 'Orders' },
    { icon: <Clock size={24} />, label: 'History' },
    { icon: <User size={24} />, label: 'Account' },
  ];

  const ridesNav = [
    { icon: <Car size={24} />, label: 'Rides' },
    { icon: <MapPin size={24} />, label: 'Pickup' },
    { icon: <Calendar size={24} />, label: 'Reserve' },
    { icon: <Clock size={24} />, label: 'Activity' },
    { icon: <User size={24} />, label: 'Account' },
  ];

  const servicesNav = [
    { icon: <Wrench size={24} />, label: 'Home' },
    { icon: <Briefcase size={24} />, label: 'Pros' },
    { icon: <Calendar size={24} />, label: 'Schedule' },
    { icon: <Clock size={24} />, label: 'Bookings' },
    { icon: <User size={24} />, label: 'Account' },
  ];

  const eventsNav = [
    { icon: <Ticket size={24} />, label: 'Home' },
    { icon: <Search size={24} />, label: 'Explore' },
    { icon: <QrCode size={24} />, label: 'Passes' },
    { icon: <Calendar size={24} />, label: 'Calendar' },
    { icon: <User size={24} />, label: 'Account' },
  ];

  const walletNav = [
    { icon: <WalletIcon size={24} />, label: 'Home' },
    { icon: <ArrowRightLeft size={24} />, label: 'Pay' },
    { icon: <Sparkles size={24} />, label: 'Rewards' },
    { icon: <CreditCard size={24} />, label: 'Cards' },
    { icon: <User size={24} />, label: 'Account' },
  ];

  const careNav = [
    { icon: <HeartPulse size={24} />, label: 'Home' },
    { icon: <Bell size={24} />, label: 'Alerts' },
    { icon: <Map size={24} />, label: 'Hotspot' },
    { icon: <HistoryIcon size={24} />, label: 'Log' },
    { icon: <User size={24} />, label: 'Account' },
  ];

  const homesNav = [
    { icon: <Building size={24} />, label: 'Home' },
    { icon: <SearchIcon size={24} />, label: 'Search' },
    { icon: <Heart size={24} />, label: 'Saved' },
    { icon: <DollarSign size={24} />, label: 'Finance' },
    { icon: <User size={24} />, label: 'Agent' },
  ];

  const autoNav = [
    { icon: <CarFront size={24} />, label: 'Home' },
    { icon: <LayoutGrid size={24} />, label: 'Stock' },
    { icon: <Landmark size={24} />, label: 'Finance' },
    { icon: <Wrench size={24} />, label: 'Service' },
    { icon: <User size={24} />, label: 'Account' },
  ];

  const travelNav = [
    { icon: <Plane size={24} />, label: 'Home' },
    { icon: <Compass size={24} />, label: 'Explore' },
    { icon: <ShoppingBag size={24} />, label: 'Bookings' },
    { icon: <Map size={24} />, label: 'Guide' },
    { icon: <User size={24} />, label: 'Account' },
  ];

  const jobsNav = [
    { icon: <Briefcase size={24} />, label: 'Jobs' },
    { icon: <SearchIcon size={24} />, label: 'Search' },
    { icon: <FileText size={24} />, label: 'Applied' },
    { icon: <MessageCircle size={24} />, label: 'Messages' },
    { icon: <User size={24} />, label: 'Profile' },
  ];

  const mediaNav = [
    { icon: <Film size={24} />, label: 'Shorts' },
    { icon: <Play size={24} />, label: 'Videos' },
    { icon: <Music size={24} />, label: 'Music' },
  ];

  const artNav = [
    { icon: <LayoutGrid size={24} />, label: 'Gallery' },
    { icon: <SearchIcon size={24} />, label: 'Explore' },
    { icon: <Palette size={24} />, label: 'Artists' },
    { icon: <Calendar size={24} />, label: 'Exhibitions' },
    { icon: <User size={24} />, label: 'Account' },
  ];

  const faithNav = [
    { icon: <Home size={24} />, label: 'Sanctuary' },
    { icon: <Users size={24} />, label: 'Fellowship' },
    { icon: <Sparkles size={24} />, label: 'Daily Word' },
    { icon: <Calendar size={24} />, label: 'Services' },
    { icon: <User size={24} />, label: 'Account' },
  ];

  const sportsNav = [
    { icon: <Trophy size={24} />, label: 'Scores' },
    { icon: <Activity size={24} />, label: 'Leagues' },
    { icon: <Calendar size={24} />, label: 'Schedule' },
    { icon: <Users size={24} />, label: 'Teams' },
    { icon: <User size={24} />, label: 'Account' },
  ];

  const newsNav = [
    { icon: <CloudSun size={24} />, label: 'Weather' },
    { icon: <Newspaper size={24} />, label: 'News' },
    { icon: <Zap size={24} />, label: 'Alerts' },
    { icon: <Map size={24} />, label: 'Radar' },
    { icon: <User size={24} />, label: 'Account' },
  ];

  const civicsNav = [
    { icon: <Landmark size={24} />, label: 'Home' },
    { icon: <AlertTriangle size={24} />, label: 'Report 311' },
    { icon: <HistoryIcon size={24} />, label: 'My Reports' },
    { icon: <WalletIcon size={24} />, label: 'Utilities' },
    { icon: <User size={24} />, label: 'Account' },
  ];

  const vendorNav = [
    { icon: <Package size={24} />, label: 'Products' },
    { icon: <ShoppingBag size={24} />, label: 'Orders' },
    { icon: <DollarSign size={24} />, label: 'Finance' },
    { icon: <Settings size={24} />, label: 'Settings' },
    { icon: <Monitor size={24} />, label: 'Overview' },
    { icon: <Megaphone size={24} />, label: 'Ads' },
    { icon: <Store size={24} />, label: 'Store Front' },
    { icon: <Users size={24} />, label: 'Team' },
  ];

  const civicNav = [
    { icon: <Users size={24} />, label: 'Directory' },
    { icon: <AlertTriangle size={24} />, label: 'Alerts' },
    { icon: <Megaphone size={24} />, label: 'Sponsorships' },
    { icon: <Settings size={24} />, label: 'Settings' },
    { icon: <Monitor size={24} />, label: 'Overview' },
    { icon: <HistoryIcon size={24} />, label: 'Tickets' },
    { icon: <WalletIcon size={24} />, label: 'Utilities' },
    { icon: <Users size={24} />, label: 'Team' },
  ];

  const adminNav = [
    { icon: <Users size={24} />, label: 'Verify' },
    { icon: <BarChart3 size={24} />, label: 'Stats' },
    { icon: <Settings size={24} />, label: 'Config' },
    { icon: <ShieldCheck size={24} />, label: 'Dash' },
  ];

  const getNavItems = () => {
    if (env === 'discover') return discoverNav;
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

  const renderView = () => {
    // Store detail view — only in market or dashboard envs
    if (activeStoreId && (env === 'market' || env === 'dashboard')) {
      return (
        <StoreFrontView 
          storeId={activeStoreId} 
          currentUser={user} 
          onBack={() => setActiveStoreId(null)} 
        />
      );
    }

    // Post detail view — only in social or discover envs
    if (activePostId && (env === 'social' || env === 'discover')) {
      return (
        <PostDetailView 
          postId={activePostId} 
          highlightCommentId={activeCommentId || undefined}
          user={user} 
          onBack={() => { setActivePostId(null); setActiveCommentId(null); }} 
          onNavigateToProfile={setActiveProfileId}
        />
      );
    }
    
    // Member Profile View
    if (activeProfileId && (env === 'social' || env === 'discover')) {
      return (
        <ProfilePage 
          user={user} 
          profileId={activeProfileId}
          onNavigate={(index) => {
            setActiveProfileId(null);
            setActiveTab(index);
          }} 
          onNavigateToPost={(pid, cid) => { setActivePostId(pid); setActiveCommentId(cid || null); }}
          onNavigateToProfile={setActiveProfileId}
        />
      );
    }


    
    // Group detail view
    if (activeGroupId && (env === 'social' || env === 'discover')) {
      return (
        <GroupDetailView 
          groupId={activeGroupId}
          user={user}
          onBack={() => setActiveGroupId(null)}
          onNavigateToPost={(pid, cid) => { setActivePostId(pid); setActiveCommentId(cid || null); }}
          onNavigateToProfile={setActiveProfileId}
        />
      );
    }


    if (env === 'discover') {
      switch (activeTab) {
        case 0: return <DiscoverView user={user} scope={scope} />;
        case 1: return <TrendingView scope={scope} user={user} />;
        case 2: return <HotDealsView scope={scope} user={user} />;
        case 3: return <NewArrivalsView scope={scope} user={user} />;
        case 4: return <RadarMapView scope={scope} user={user} />;
        case 5: return <VibesView user={user} />;
        case 6: return <TevisDiscoverView user={user} />;
        default: return <ComingSoon title={discoverNav[activeTab]?.label} />;
      }
    }
    
    if (env === 'social') {
      switch (activeTab) {
        case 0: return <SocialFeed 
          user={user} 
          scope={scope} 
          onNavigateToPost={(pid, cid) => { setActivePostId(pid); setActiveCommentId(cid || null); }} 
          onNavigateToProfile={setActiveProfileId}
        />;
        case 1: return <ClassifiedsView />;
        case 2: return <UserDirectory scope={scope} />;
        case 3: return <GroupDirectory scope={scope} onNavigateToGroup={setActiveGroupId} />;
        case 4: return <MessagesView user={user} />;
        case 5: return <SavedView />;
        case 6: return <NotificationsView user={user} />;
        case 7: return <ProfilePage 
          user={user} 
          onNavigate={(index) => setActiveTab(index)} 
          onNavigateToPost={(pid, cid) => { setActivePostId(pid); setActiveCommentId(cid || null); }}
          onNavigateToProfile={setActiveProfileId}
        />;
        case 8: return <SettingsPage user={user} theme={theme} toggleTheme={toggleTheme} setTheme={setTheme} />;
        case 9: return <EditProfilePage user={user} onUpdate={(data) => updateUser(data)} />;
        default: return <ComingSoon title={socialNav[activeTab]?.label || 'Social'} />;
      }
    }
    
    if (env === 'market') {
      switch (activeTab) {
        case 0: return <MarketHome user={user} scope={scope} onNavigateToStore={setActiveStoreId} />;
        case 1: return <ProductSearch user={user} scope={scope} onNavigateToStore={setActiveStoreId} />;
        case 2: return <StoresDirectory user={user} scope={scope} onNavigateToStore={setActiveStoreId} />;
        case 3: return <CartView />;
        case 4: return <WishlistView />;
        case 5: return <MarketAccount user={user} />;
        default: return <ComingSoon title={marketNav[activeTab]?.label || 'Market'} />;
      }
    }

    if (env === 'eats') {
      return <EatsView activeTab={activeTab} user={user} scope={scope} />;
    }

    if (env === 'rides') {
      return <RidesView activeTab={activeTab} user={user} scope={scope} />;
    }

    if (env === 'services') {
      return <ServicesView activeTab={activeTab} user={user} scope={scope} />;
    }

    if (env === 'events') {
      return <EventsView activeTab={activeTab} user={user} scope={scope} />;
    }

    if (env === 'wallet') {
      return <WalletView activeTab={activeTab} user={user} scope={scope} />;
    }

    if (env === 'care') {
      return <CareView activeTab={activeTab} user={user} scope={scope} />;
    }

    if (env === 'homes') {
      return <HomesView activeTab={activeTab} user={user} scope={scope} />;
    }

    if (env === 'auto') {
      return <AutoView activeTab={activeTab} user={user} scope={scope} />;
    }

    if (env === 'travel') {
      return <TravelView activeTab={activeTab} user={user} scope={scope} />;
    }

    if (env === 'jobs') {
      return <JobsView activeTab={activeTab} user={user} scope={scope} />;
    }

    if (env === 'media') {
      return <MediaView activeTab={activeTab} user={user} scope={scope} />;
    }

    if (env === 'art') {
      return <ArtGalleryView user={user} scope={scope} />;
    }

    if (env === 'faith') {
      return <FaithView user={user} scope={scope} />;
    }

    if (env === 'sports') {
      return <SportsView activeTab={activeTab} user={user} scope={scope} />;
    }

    if (env === 'news') {
      return <WeatherNewsView activeTab={activeTab} user={user} scope={scope} />;
    }

    if (env === 'civics') {
      if (user?.role !== 'admin') {
        setEnv('discover');
        return null;
      }
      return <CivicsView activeTab={activeTab} user={user} scope={scope} />;
    }
    
    if (env === 'dashboard') {
      const role = user?.role || '';
      const hasClearance = (type: string) => user?.clearances?.some((c: any) => c.entity_type === type);

      if (['official', 'chamber', 'city_worker', 'city_manager'].includes(role) || hasClearance('civic')) {
        return <CivicDashboard user={user} activeTab={activeTab} />;
      }
      if (['church', 'non_profit'].includes(role) || hasClearance('ministry')) {
        return <MinistryDashboard user={user} activeTab={activeTab} />;
      }
      if (['artist', 'media', 'venue'].includes(role) || hasClearance('creator')) {
        return <CreatorDashboard user={user} activeTab={activeTab} />;
      }
      return <VendorDashboard user={user} activeTab={activeTab} onNavigateToStore={setActiveStoreId} />;
    }
    
    if (env === 'admin') {
      return <AdminDashboard activeTab={activeTab} />;
    }
    
    return <ComingSoon title="Unknown View" />;
  };

  if (isLoading) {
    return (
      <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="animate-spin" size={48} color="var(--primary)" />
      </div>
    );
  }


  return (
    <div 
      className="app-container"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="sticky-header-group glass">
        <ThemeTopBar />

        {/* Brand Row: Logo Text | Theme Logo | User Actions */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 16px 0',
          minHeight: '52px'
        }}>
          {/* Left: Logo Text */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
            <h1 className="logo-text" onClick={() => { setEnv('discover'); setActiveTab(0); }} style={{ 
              cursor: 'pointer', 
              margin: 0, 
              display: 'flex',
              alignItems: 'baseline',
              gap: '2px',
              color: theme.includes('light') ? '#000' : '#fff'
            }}>
              {scope === 'city' ? (user?.community || 'City') : 'SETX'}
              <span style={{ 
                fontSize: '1.2rem', 
                fontWeight: 700, 
                color: env === 'discover' ? '#c084fc' : 
                       env === 'news' ? '#f87171' :
                       env === 'social' ? '#3b82f6' : 
                       env === 'faith' ? '#8b5cf6' :
                       env === 'events' ? '#f43f5e' :
                       env === 'market' ? '#22c55e' : 'var(--primary)',
                transition: 'color 0.3s ease',
                lineHeight: 1
              }}>
                {' 360'}
              </span>
            </h1>
          </div>

          {/* Center: Theme Logo with Restored Dynamic Ring */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div 
              onClick={() => setIsTevisOpen(!isTevisOpen)}
              style={{ 
              position: 'relative', 
              width: 56, 
              height: 56, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              borderRadius: '50%',
              cursor: 'pointer',
              // The Dynamic Soft Glow (The Ring)
              boxShadow: isTevisOpen ? `0 0 35px 5px var(--primary)` : (theme.endsWith('-dark') ? `0 0 25px 2px var(--primary)` : 'none'),
              transform: isTevisOpen ? 'scale(1.1)' : 'scale(1)',
              transition: 'all 0.4s ease'
            }}>
              <img
                src={
                  isSetxDomain ? (theme.includes('light') ? "/logo-setx-blue.png" : "/logo-setx-transparent.png") : "/logo-neo.png"
                }
                alt="Logo"
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  objectFit: 'contain',
                  zIndex: 1
                }}
              />
            </div>
          </div>

          {/* Right: User Badge + Theme Toggle */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: '8px', alignItems: 'center' }}>
            {user ? (
              <div 
                className="user-profile-badge" 
                onClick={() => !user.role.startsWith('v_') && setIsVerifying(true)}
                style={{ 
                  display: 'flex', 
                  gap: '8px',
                  alignItems: 'center', 
                  cursor: user.role.startsWith('v_') ? 'default' : 'pointer',
                  padding: '4px',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.05)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {getBadgeIcon(user.role)}
                </div>
                <Avatar url={user.avatar_url} name={user.name} size={32} />
              </div>
            ) : (
              <button 
                onClick={toggleTheme}
                className="theme-toggle"
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text)', padding: '8px' }}
              >
                {theme.includes('light') ? <Moon size={20} /> : <Sun size={20} />}
              </button>
            )}
          </div>
        </div>
        

        {user && (
          <div className="top-switch-container" style={{ padding: '4px 0 8px' }}>
            <div className="two-notches">
              <div 
                className={`notch notch-2 ${scope === 'county' ? 'active' : ''}`} 
                onClick={() => setScope('county')}
                style={{ cursor: 'pointer' }}
                title={`${user?.county || 'Regional'} (County)`}
              />
              <div 
                className={`notch notch-3 ${scope === 'city' ? 'active' : ''}`} 
                onClick={() => setScope('city')}
                style={{ cursor: 'pointer' }}
                title={`${user?.community || 'Local'} (City)`}
              />
            </div>
          </div>
        )}

        {/* Search Bar Header */}
        {user && (
          <header className="main-header" style={{ padding: '0 16px 8px' }}>
            <div className="header-content" style={{ display: 'block' }}>
              <button 
                className="header-action-btn search-trigger" 
                onClick={() => setIsSearchOpen(true)}
                style={{ 
                  width: '100%',
                  background: theme.endsWith('-dark') ? 'rgba(255,255,255,0.08)' : '#fff', 
                  border: theme === 'setx-light' ? '2px solid var(--primary)' : theme.endsWith('-light') ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.1)', 
                  color: 'var(--text-muted)', 
                  padding: '12px 20px', 
                  borderRadius: '30px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '14px',
                  justifyContent: 'flex-start',
                  boxShadow: theme.endsWith('-light') ? '0 4px 15px rgba(0,0,0,0.08)' : '0 4px 20px rgba(0,0,0,0.2)',
                  transition: 'all 0.2s ease'
                }}
              >
                <SearchIcon size={20} className="search-icon-anim" style={{ color: 'var(--primary)' }} />
                <span style={{ fontSize: '0.95rem', fontWeight: 500, opacity: 0.8 }}>Search {scope}...</span>
              </button>
            </div>
          </header>
        )}
    </div>

      <Suspense fallback={null}>
        <SearchOverlay 
          isOpen={isSearchOpen} 
          onClose={() => setIsSearchOpen(false)}
          onNavigate={(newEnv, newTab, params) => {
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

      {/* Update Notification Toast */}
      <AnimatePresence>
        {updateAvailable && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="update-toast glass"
            style={{
              position: 'fixed',
              bottom: '160px',
              left: '20px',
              right: '20px',
              zIndex: 2000,
              padding: '16px',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(112, 0, 244, 0.9)',
              color: 'white',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Sparkles size={20} />
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
              A new version of SETX 360 is ready!
              </span>
            </div>
            <button 
              onClick={handleUpdate}
              style={{
                background: 'white',
                color: '#7000f4',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              Update Now
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {isVerifying && (
        <VerificationModal 
          user={user} 
          onClose={() => {
            setIsVerifying(false);
            refreshUser();
          }} 
        />
      )}

      {/* Main Content Area */}
      <main className="content-area" style={{ paddingTop: !user ? '40px' : '0' }}>
        {!user ? (
          <SignUpFlow />
        ) : (
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
        )}
      </main>

      {/* Environment Switcher Footer */}
      {user && (
        <div className="env-switcher-footer">
          <div className="switcher-wrapper glass">
            <button className="desktop-scroll-btn left" onClick={() => scrollSwitcher('left')}>
              <ChevronLeft size={20} />
            </button>
            
            <div 
              className="switcher-scroll" 
              ref={envSwitcherRef} 
              onMouseDown={handleMouseDown}
              onMouseLeave={handleMouseLeave}
              onMouseUp={handleMouseUp}
              onMouseMove={handleMouseMove}
              onScroll={() => {
                handleSwitcherScroll();
                // Verify scroll completion to update state if needed
                if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
                scrollTimeout.current = setTimeout(() => {
                  isInternalScroll.current = false;
                }, 100);
              }}
            >
              {/* Invisible Spacer */}
              <div className="sw-btn spacer" aria-hidden="true" />
              
              {['discover', 'social', 'market', 'events', 'news', 'faith'].map(id => {
                const item = id === 'discover' ? { id: 'discover', icon: <Compass size={18} />, label: 'Discover' } :
                             id === 'social'   ? { id: 'social',   icon: <Rss size={18} />, label: 'Social' } :
                             id === 'market'   ? { id: 'market',   icon: <Store size={18} />, label: 'Market' } :
                             id === 'events'   ? { id: 'events',   icon: <Calendar size={18} />, label: 'Events' } :
                             id === 'news'     ? { id: 'news',     icon: <Newspaper size={18} />, label: 'News' } :
                             { id: 'faith',    icon: <Church size={18} />, label: 'Faith' };
                return (
                  <button 
                    key={item.id}
                    className={`sw-btn ${item.id} ${env === item.id ? 'active' : ''}`} 
                    onClick={() => handleEnvClick(item.id as Env)}
                  >
                    {item.icon} {item.label}
                  </button>
                );
              })}

              {( (user?.role && ['business', 'official', 'chamber', 'media', 'artist', 'venue', 'non_profit', 'church'].includes(user.role)) || (user?.clearances && user.clearances.length > 0) ) && user.role !== 'admin' && (
                <button className={`sw-btn dashboard ${env === 'dashboard' ? 'active' : ''}`} onClick={() => handleEnvClick('dashboard')}>
                  <Store size={18} /> Dashboard
                </button>
              )}

              {user?.role === 'admin' && (
                <button className={`sw-btn admin ${env === 'admin' ? 'active' : ''}`} onClick={() => handleEnvClick('admin')}>
                  <ShieldCheck size={18} /> Admin Control
                </button>
              )}


              {/* Spacer for centering last item */}
              <div className="sw-btn spacer" aria-hidden="true" />
            </div>

            <button className="desktop-scroll-btn right" onClick={() => scrollSwitcher('right')}>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}

      {/* FOOTER: Bottom Navigation */}
      {user && (
        <nav className="bottom-nav glass">
          <div className="nav-items-scroll">
            {currentNav.map((item, index) => (
              <button
                key={item.label}
                className={`nav-btn ${activeTab === index ? 'active' : ''}`}
                onClick={() => setActiveTab(index)}
              >
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

      {showOnboarding && (
        <OnboardingOverlay onComplete={() => setShowOnboarding(false)} />
      )}
    </div>
  );
};

export default App;
