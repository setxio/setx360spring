import React, { useState, useEffect, lazy } from 'react';
import { 
  Loader2
} from 'lucide-react';
import './App.css';

// Always-needed lightweight components (static imports)
import { ClassicLayout } from './components/ClassicLayout';
import { MinimalLayout } from './components/MinimalLayout';

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

import { useApp } from './context/AppContext';

const App: React.FC = () => {
  const { 
    user, env, theme, scope, activeTab, isLoading,
    setEnv, setTheme, setActiveTab, setIsSearchOpen, toggleTheme, updateUser
  } = useApp();

  const [updateAvailable, setUpdateAvailable] = useState(false);
  
  // Auto-hide scroll logic is handled inside each layout component (ClassicLayout, MinimalLayout)
  // to avoid duplicate handlers fighting over the same DOM classes.
  
  // Notch discovery pulse — shows for first 3 sessions, stops after first interaction
  const NOTCH_KEY = 'setx360_notch_sessions';
  const notchSessions = parseInt(localStorage.getItem(NOTCH_KEY) || '0', 10);
  const notchHasInteracted = localStorage.getItem('setx360_notch_interacted') === 'true';

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
    // Increment session count for notch discovery pulse (max 3)
    if (user && !notchHasInteracted && notchSessions < 3) {
      localStorage.setItem(NOTCH_KEY, String(notchSessions + 1));
    }
  }, [user, notchHasInteracted, notchSessions]);

  const handleUpdate = () => {
    window.location.reload();
  };


  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [activeStoreId, setActiveStoreId] = useState<string | null>(null);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);

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

  const { layout } = useApp();

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
        default: return <ComingSoon title="View" />;
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
        default: return <ComingSoon title="Social" />;
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
        default: return <ComingSoon title="Market" />;
      }
    }

    if (env === 'eats') return <EatsView activeTab={activeTab} user={user} scope={scope} />;
    if (env === 'rides') return <RidesView activeTab={activeTab} user={user} scope={scope} />;
    if (env === 'services') return <ServicesView activeTab={activeTab} user={user} scope={scope} />;
    if (env === 'events') return <EventsView activeTab={activeTab} user={user} scope={scope} />;
    if (env === 'wallet') return <WalletView activeTab={activeTab} user={user} scope={scope} />;
    if (env === 'care') return <CareView activeTab={activeTab} user={user} scope={scope} />;
    if (env === 'homes') return <HomesView activeTab={activeTab} user={user} scope={scope} />;
    if (env === 'auto') return <AutoView activeTab={activeTab} user={user} scope={scope} />;
    if (env === 'travel') return <TravelView activeTab={activeTab} user={user} scope={scope} />;
    if (env === 'jobs') return <JobsView activeTab={activeTab} user={user} scope={scope} />;
    if (env === 'media') return <MediaView activeTab={activeTab} user={user} scope={scope} />;
    if (env === 'art') return <ArtGalleryView user={user} scope={scope} />;
    if (env === 'faith') return <FaithView user={user} scope={scope} />;
    if (env === 'sports') return <SportsView activeTab={activeTab} user={user} scope={scope} />;
    if (env === 'news') return <WeatherNewsView activeTab={activeTab} user={user} scope={scope} />;

    if (env === 'civics') {
      if (user?.role !== 'admin') { setEnv('discover'); return null; }
      return <CivicsView activeTab={activeTab} user={user} scope={scope} />;
    }
    
    if (env === 'dashboard') {
      const role = user?.role || '';
      const hasClearance = (type: string) => user?.clearances?.some((c: any) => c.entity_type === type);
      if (['official', 'chamber', 'city_worker', 'city_manager'].includes(role) || hasClearance('civic')) return <CivicDashboard user={user} activeTab={activeTab} />;
      if (['church', 'non_profit'].includes(role) || hasClearance('ministry')) return <MinistryDashboard user={user} activeTab={activeTab} />;
      if (['artist', 'media', 'venue'].includes(role) || hasClearance('creator')) return <CreatorDashboard user={user} activeTab={activeTab} />;
      return <VendorDashboard user={user} activeTab={activeTab} onNavigateToStore={setActiveStoreId} />;
    }
    
    if (env === 'admin') return <AdminDashboard activeTab={activeTab} />;
    
    return <ComingSoon title="Unknown View" />;
  };

  if (isLoading) {
    return (
      <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="animate-spin" size={48} color="var(--primary)" />
      </div>
    );
  }

  // Import Layouts inside the component or at top level.
  // We already defined them. Let's make sure they are imported.
  
  if (layout === 'minimal') {
    return (
      <MinimalLayout 
        renderView={renderView}
        SearchOverlay={SearchOverlay}
        setActivePostId={setActivePostId}
        setActiveStoreId={setActiveStoreId}
        setActiveProfileId={setActiveProfileId}
        setActiveCommentId={setActiveCommentId}
        updateAvailable={updateAvailable}
        onUpdate={handleUpdate}
      />
    );
  }

  return (
    <ClassicLayout 
      renderView={renderView}
      SearchOverlay={SearchOverlay}
      activePostId={activePostId}
      setActivePostId={setActivePostId}
      activeStoreId={activeStoreId}
      setActiveStoreId={setActiveStoreId}
      activeProfileId={activeProfileId}
      setActiveProfileId={setActiveProfileId}
      activeGroupId={activeGroupId}
      setActiveGroupId={setActiveGroupId}
      activeCommentId={activeCommentId}
      setActiveCommentId={setActiveCommentId}
      updateAvailable={updateAvailable}
      onUpdate={handleUpdate}
    />
  );
};

export default App;
