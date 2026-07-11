import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Search, Star, Gamepad2, Layers, CloudSun, Users, Store, Compass, Calendar, 
  CalendarDays, Zap, Car, Wrench, Wallet, Heart, Building, Plane, Briefcase, Tv, Palette, 
  Book, Activity, Newspaper, Globe, MessageSquare, ShoppingBag, Phone, LayoutGrid, Music, 
  Droplets, Wind, Thermometer, Map, Utensils, Contact, Trophy, Power, HeartHandshake, 
  HandHeart, Home, Landmark, MessageCircle, Settings, User
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';

// Individual Game Imports (from legacy games module)
import { SlingoGame } from '../games/SlingoGame';
import { GatorChaseGame } from '../games/gator-chase/GatorChaseGame';
import { PecanCatchGame } from '../games/pecan-catch/PecanCatchGame';
import { PortArthurGame } from '../games/port-arthur/PortArthurGame';
import { BeaumontGame } from '../games/beaumont/BeaumontGame';
import { NederlandGame } from '../games/nederland/NederlandGame';
import { PortNechesGame } from '../games/port-neches/PortNechesGame';
import { CityLeaderboard } from '../games/CityLeaderboard';
import { ArcadeShop } from '../games/ArcadeShop';

import './AppsStoreView.css';

interface AppItem {
  id: string;
  label: string;
  icon: React.ReactElement;
  customImage?: string;
  imageBg?: string;
  imageBorder?: string;
  imageStyle?: React.CSSProperties;
  gradient: string;
  category: string;
  description: string;
  fullDescription?: React.ReactNode;
  isMiniApp?: boolean;
  rating?: string;
  reviews?: string;
  downloads?: string;
}

export const APPS_REGISTRY: AppItem[] = [
  // --- MINI GAMES ---
  { 
    id: 'slingo', label: 'SETX Slingo', icon: <Gamepad2 size={32} />, 
    customImage: '/slingo-icon.png', 
    gradient: 'linear-gradient(135deg, #10b981, #059669)', category: 'Games', 
    description: 'Casino • Multiplayer', fullDescription: 'Match the numbers on your 5x5 grid with the numbers that spin below in this fast-paced hybrid of slots and bingo!\n\nWatch out for the Gator who wants to steal your points, and hope the Pelican comes to save the day! Strike oil with the Golden Derrick, or use the Crawfish Joker to mark any number you need.\n\nFeatures a live chatroom so you can talk trash with other SETX locals while you play.',
    isMiniApp: true, rating: '4.8', reviews: '2K reviews', downloads: '10K+'
  },
  { 
    id: 'gator_chase', label: 'Gator Chase', icon: <Gamepad2 size={32} />, 
    customImage: '/images/gator-chase/cyan_gator.png', imageBg: '#000a14', imageBorder: '#1e3a8a', imageStyle: { transform: 'scale(1.5)', marginTop: '12px' },
    gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', category: 'Games', 
    description: 'Arcade • Action', fullDescription: 'Run through the SETX swamp in this fast-paced arcade classic!\n\nCollect all the SETX Coins while avoiding the dangerous alligators. Grab a Crawfish to turn the tables and chomp on those gators for massive points.\n\nCan you survive all 20 rounds?',
    isMiniApp: true, rating: '5.0', reviews: '150 reviews', downloads: '500+'
  },
  { 
    id: 'pecan_catch', label: 'Groves Pecan Catch', icon: <Gamepad2 size={32} />, 
    customImage: '/images/pecan-catch/pecan.png', imageBg: '#87CEEB', imageBorder: '#38bdf8', imageStyle: { transform: 'scale(1.2)', marginTop: '8px' },
    gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', category: 'Games', 
    description: 'Arcade • Casual', fullDescription: 'A classic catch game with a regional twist paying homage to the city of Groves!\n\nControl your avatar and try to catch as many falling pecans as you can before they hit the ground. The squirrel above gets faster and faster as your score climbs!',
    isMiniApp: true, rating: '4.9', reviews: '100 reviews', downloads: '300+'
  },
  { 
    id: 'port_arthur', label: 'Gulf Coast Skipper', icon: <Building size={32} />, 
    customImage: '/images/port-arthur/boat.png', imageBg: '#1e3a8a', imageBorder: '#3b82f6', imageStyle: { transform: 'scale(1.2)', marginTop: '8px' },
    gradient: 'linear-gradient(135deg, #ef4444, #b91c1c)', category: 'Games', 
    description: 'Arcade • Action', fullDescription: 'Steer your boat through the Port Arthur channel! Dodge buoys and sandbars in this 2.5D endless runner.',
    isMiniApp: true, rating: '4.9', reviews: '120 reviews', downloads: '400+'
  },
  { 
    id: 'beaumont', label: 'Spindletop Striker', icon: <Building size={32} />, 
    customImage: '/images/beaumont/bg.png', imageBg: '#0f172a', imageBorder: '#fff', imageStyle: { width: '100%', height: '100%', objectFit: 'cover' },
    gradient: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', category: 'Games', 
    description: 'Arcade • Rhythm', fullDescription: 'Beaumont, 1901! Experience the Spindletop oil boom in this rhythm/timing game. Tap the STRIKE button right as the oil drop hits the crosshair.',
    isMiniApp: true, rating: '4.7', reviews: '90 reviews', downloads: '250+'
  },
  { 
    id: 'nederland', label: 'Windmill Defender', icon: <Building size={32} />, 
    customImage: '/images/nederland/bg.png', imageBg: '#22c55e', imageBorder: '#16a34a', imageStyle: { width: '100%', height: '100%', objectFit: 'cover' },
    gradient: 'linear-gradient(135deg, #f97316, #c2410c)', category: 'Games', 
    description: 'Arcade • Tap', fullDescription: 'Nederland, Texas! Defend the classic Dutch windmill from flying debris. Tap the rocks and branches before they hit the center.',
    isMiniApp: true, rating: '4.8', reviews: '110 reviews', downloads: '350+'
  },
  { 
    id: 'port_neches', label: 'Riverfront Runner', icon: <Building size={32} />, 
    customImage: '/images/port-neches/tugboat.png', imageBg: '#38bdf8', imageBorder: '#0284c7', imageStyle: { transform: 'scale(1.2)', marginTop: '8px' },
    gradient: 'linear-gradient(135deg, #0ea5e9, #0369a1)', category: 'Games', 
    description: 'Arcade • Action', fullDescription: 'Run through the beautiful Neches Riverfront park! Tap to jump over park benches and splashing tugboats in this endless runner.',
    isMiniApp: true, rating: '4.9', reviews: '130 reviews', downloads: '450+'
  },
  { id: 'city_leaderboard', label: 'Leaderboard', icon: <Trophy size={32} />, gradient: 'linear-gradient(135deg, #eab308, #ca8a04)', category: 'Games', description: 'Top local high scores.', isMiniApp: true },
  { id: 'arcade_shop', label: 'Arcade Shop', icon: <Store size={32} />, gradient: 'linear-gradient(135deg, #ec4899, #be185d)', category: 'Games', description: 'Redeem your tickets.', isMiniApp: true },

  // --- PLATFORM APPS ---
  { id: 'weather', label: 'Weather', icon: <CloudSun size={32} />, gradient: 'linear-gradient(135deg, #38bdf8, #0284c7)', category: 'Essentials', description: 'Live regional conditions.', rating: '4.9', reviews: '15K reviews', downloads: '50K+' },
  { id: 'social', label: 'Social', icon: <Users size={32} />, gradient: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', category: 'Social & Comms', description: 'Connect with neighbors.', rating: '4.8', reviews: '22K reviews', downloads: '60K+' },
  { id: 'market', label: 'Market', icon: <Store size={32} />, gradient: 'linear-gradient(135deg, #3b82f6, #0ea5e9)', category: 'Market & Shops', description: 'Local goods and shops.', rating: '4.7', reviews: '8K reviews', downloads: '30K+' },
  { id: 'discover', label: 'Discover', icon: <Compass size={32} />, gradient: 'linear-gradient(135deg, #0ea5e9, #a855f7)', category: 'Essentials', description: 'Explore SETX.', rating: '4.9', reviews: '12K reviews', downloads: '40K+' },
  { id: 'events', label: 'Events', icon: <Calendar size={32} />, gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)', category: 'Media & Events', description: 'Upcoming happenings.', rating: '4.8', reviews: '9K reviews', downloads: '35K+' },
  { id: 'calendar', label: 'Calendar', icon: <CalendarDays size={32} />, gradient: 'linear-gradient(135deg, #14b8a6, #0f766e)', category: 'Tools & Services', description: 'Unified event tracking.', rating: '4.7', reviews: '5K reviews', downloads: '20K+' },
  { id: 'eats', label: 'Eats', icon: <Utensils size={32} />, gradient: 'linear-gradient(135deg, #f97316, #facc15)', category: 'Market & Shops', description: 'Local dining and delivery.', rating: '4.9', reviews: '18K reviews', downloads: '55K+' },
  { id: 'rides', label: 'Rides', icon: <Map size={32} />, gradient: 'linear-gradient(135deg, #eab308, #f59e0b)', category: 'Essentials', description: 'Transit and ridesharing.', rating: '4.6', reviews: '4K reviews', downloads: '15K+' },
  { id: 'wallet', label: 'Wallet', icon: <Wallet size={32} />, gradient: 'linear-gradient(135deg, #22d3ee, #0284c7)', category: 'Market & Shops', description: 'Payments and tickets.', rating: '4.8', reviews: '11K reviews', downloads: '40K+' },
  { id: 'news', label: 'News', icon: <Newspaper size={32} />, gradient: 'linear-gradient(135deg, #60a5fa, #1d4ed8)', category: 'Media & Events', description: 'Latest headlines.', rating: '4.7', reviews: '7K reviews', downloads: '25K+' },
  { id: 'music', label: 'Music', icon: <Music size={32} />, gradient: 'linear-gradient(135deg, #8b5cf6, #5b21b6)', category: 'Media & Events', description: 'Local artists and radio.', rating: '4.8', reviews: '6K reviews', downloads: '20K+' },
  { id: 'videos', label: 'Videos', icon: <Tv size={32} />, gradient: 'linear-gradient(135deg, #ef4444, #b91c1c)', category: 'Media & Events', description: 'Clips and live streams.', rating: '4.7', reviews: '5K reviews', downloads: '18K+' },
  { id: 'sports', label: 'Sports', icon: <Trophy size={32} />, gradient: 'linear-gradient(135deg, #ea580c, #9a3412)', category: 'Media & Events', description: 'High school and regional sports.', rating: '4.9', reviews: '10K reviews', downloads: '30K+' },
  { id: 'settings', label: 'Settings', icon: <Settings size={32} />, gradient: 'linear-gradient(135deg, #64748b, #475569)', category: 'Tools & Services', description: 'Preferences and account.' }
];

const CATEGORIES = ['All', 'Essentials', 'Games', 'Social & Comms', 'Market & Shops', 'Media & Events', 'Tools & Services'];

export const AppsStoreView: React.FC<{ initialMiniApp?: string }> = ({ initialMiniApp }) => {
  const { setEnv, theme } = useApp();
  const isDark = theme.includes('dark') || theme.includes('io') || theme.includes('neo');
  const [activeMiniApp, setActiveMiniApp] = useState<string | null>(initialMiniApp || null);
  const [selectedApp, setSelectedApp] = useState<AppItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.user_metadata?.favorite_apps) {
      setFavorites(user.user_metadata.favorite_apps);
    }
  };

  const toggleFavorite = async (appId: string) => {
    setIsSaving(true);
    let newFavs = [...favorites];
    if (newFavs.includes(appId)) {
      newFavs = newFavs.filter(id => id !== appId);
    } else {
      newFavs.push(appId);
    }
    
    setFavorites(newFavs);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.auth.updateUser({
        data: { favorite_apps: newFavs }
      });
    }
    setIsSaving(false);
  };

  // --- Mini App Routing ---
  if (activeMiniApp === 'slingo') return <SlingoGame onBack={() => setActiveMiniApp(null)} />;
  if (activeMiniApp === 'gator_chase') return <GatorChaseGame onBack={() => setActiveMiniApp(null)} />;
  if (activeMiniApp === 'pecan_catch') return <PecanCatchGame onBack={() => setActiveMiniApp(null)} />;
  if (activeMiniApp === 'port_arthur') return <PortArthurGame onBack={() => setActiveMiniApp(null)} />;
  if (activeMiniApp === 'beaumont') return <BeaumontGame onBack={() => setActiveMiniApp(null)} />;
  if (activeMiniApp === 'nederland') return <NederlandGame onBack={() => setActiveMiniApp(null)} />;
  if (activeMiniApp === 'port_neches') return <PortNechesGame onBack={() => setActiveMiniApp(null)} />;
  if (activeMiniApp === 'city_leaderboard') return <CityLeaderboard onBack={() => setActiveMiniApp(null)} />;
  if (activeMiniApp === 'arcade_shop') return <ArcadeShop onBack={() => setActiveMiniApp(null)} />;

  const handleLaunchApp = (app: AppItem) => {
    if (app.isMiniApp) {
      setActiveMiniApp(app.id);
    } else {
      setEnv(app.id as any);
    }
  };

  // --- RENDER CATEGORY BLOCK ---
  const renderAppCard = (app: AppItem, isLarge = false) => {
    const isFav = favorites.includes(app.id);
    return (
      <div 
        key={app.id}
        className={`apps-store-card ${isLarge ? 'large' : ''}`}
        onClick={() => setSelectedApp(app)}
      >
        <div 
          className="apps-card-icon-wrapper" 
          style={{ 
            background: app.customImage ? (app.imageBg || '#fff') : app.gradient,
            border: app.customImage ? `1px solid ${app.imageBorder || '#e5e7eb'}` : 'none'
          }}
        >
          {app.customImage ? (
            <img src={app.customImage} alt={app.label} style={app.imageStyle} />
          ) : (
            React.cloneElement(app.icon as React.ReactElement<any>, { size: isLarge ? 48 : 32, color: '#fff' })
          )}
        </div>
        <div className="apps-card-info">
          <h3 className="apps-card-title">{app.label}</h3>
          <p className="apps-card-category">{app.description}</p>
          {app.rating && (
            <div className="apps-card-rating">
              <span>{app.rating}</span>
              <Star size={10} fill="currentColor" />
            </div>
          )}
        </div>
      </div>
    );
  };

  const filteredApps = APPS_REGISTRY.filter(app => 
    app.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`apps-store-container ${isDark ? 'dark' : ''}`}>
      {/* Header */}
      <div className="apps-store-header">
        <div className="apps-header-left">
          <button className="apps-back-btn" onClick={() => setEnv('home')}>
            <ArrowLeft size={24} />
          </button>
          <div className="apps-search-bar">
            <Search size={20} className="apps-search-icon" />
            <input 
              type="text" 
              placeholder="Search for apps & games" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="apps-user-avatar" />
      </div>

      {/* Main Content Area */}
      <div className="apps-content">
        <div className="apps-content-inner">
          
          {searchQuery ? (
            <div className="apps-section">
              <h2 className="apps-section-title">Search Results</h2>
              <div className="apps-grid">
                {filteredApps.map(app => renderAppCard(app, false))}
                {filteredApps.length === 0 && (
                  <p className="apps-empty-text">No apps found matching "{searchQuery}"</p>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Leaderboard & Arcade Banners */}
              <div 
                className="apps-leaderboard-banner"
                onClick={() => handleLaunchApp(APPS_REGISTRY.find(a => a.id === 'city_leaderboard')!)}
                style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)' }}
              >
                <div className="apps-banner-icon"><Trophy size={28} /></div>
                <div className="apps-banner-text">
                  <h3>City Pride Leaderboard</h3>
                  <p>Check which SETX city has the highest score!</p>
                </div>
              </div>
              
              <div 
                className="apps-leaderboard-banner"
                onClick={() => handleLaunchApp(APPS_REGISTRY.find(a => a.id === 'arcade_shop')!)}
                style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', marginBottom: '32px' }}
              >
                <div className="apps-banner-icon"><Store size={28} /></div>
                <div className="apps-banner-text">
                  <h3>Arcade Badge Shop</h3>
                  <p>Spend your Arcade Coins on profile badges!</p>
                </div>
              </div>

              {/* Dynamic Categories */}
              {CATEGORIES.filter(c => c !== 'All').map(cat => {
                const appsInCat = APPS_REGISTRY.filter(a => a.category === cat && !['city_leaderboard', 'arcade_shop'].includes(a.id));
                if (appsInCat.length === 0) return null;
                return (
                  <div className="apps-section" key={cat}>
                    <div className="apps-section-header">
                      <h2 className="apps-section-title">{cat}</h2>
                    </div>
                    <div className="apps-carousel">
                      {appsInCat.map(app => renderAppCard(app, true))}
                    </div>
                  </div>
                );
              })}
            </>
          )}

        </div>
      </div>

      {/* App Details Modal */}
      <AnimatePresence>
        {selectedApp && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`apps-modal-overlay ${isDark ? 'dark' : ''}`}
          >
            <div className="apps-modal-header">
              <button onClick={() => setSelectedApp(null)} className="apps-modal-btn">
                <ArrowLeft size={24} />
              </button>
              <button 
                className={`apps-modal-fav-btn ${favorites.includes(selectedApp.id) ? 'active' : ''}`}
                onClick={() => toggleFavorite(selectedApp.id)}
                disabled={isSaving}
              >
                <Star size={24} fill={favorites.includes(selectedApp.id) ? "currentColor" : "none"} />
              </button>
            </div>

            <div className="apps-modal-content">
              <div className="apps-modal-content-inner">
                
                {/* Identity */}
                <div className="apps-modal-identity">
                  <div 
                    className="apps-modal-icon"
                    style={{ 
                      background: selectedApp.customImage ? (selectedApp.imageBg || '#fff') : selectedApp.gradient,
                      border: selectedApp.customImage ? `1px solid ${selectedApp.imageBorder || '#e5e7eb'}` : 'none'
                    }}
                  >
                    {selectedApp.customImage ? (
                      <img src={selectedApp.customImage} alt={selectedApp.label} style={selectedApp.imageStyle} />
                    ) : (
                      React.cloneElement(selectedApp.icon as React.ReactElement<any>, { size: 64, color: '#fff' })
                    )}
                  </div>
                  <div className="apps-modal-title-group">
                    <h1 className="apps-modal-title">{selectedApp.label}</h1>
                    <p className="apps-modal-developer">SETX 360 Ecosystem</p>
                    <p className="apps-modal-tags">{selectedApp.category}</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="apps-modal-stats">
                  <div className="apps-modal-stat-col">
                    <p className="apps-modal-stat-value">{selectedApp.rating || '4.5'} <Star size={16} fill="currentColor" /></p>
                    <p className="apps-modal-stat-label">{selectedApp.reviews || 'Reviews'}</p>
                  </div>
                  <div className="apps-modal-stat-col divider"></div>
                  <div className="apps-modal-stat-col">
                    <p className="apps-modal-stat-value">{selectedApp.downloads || '10K+'}</p>
                    <p className="apps-modal-stat-label">Downloads</p>
                  </div>
                  <div className="apps-modal-stat-col divider"></div>
                  <div className="apps-modal-stat-col">
                    <p className="apps-modal-stat-value">E</p>
                    <p className="apps-modal-stat-label">Everyone</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="apps-modal-actions">
                  <button className="apps-modal-install-btn" onClick={() => handleLaunchApp(selectedApp)}>
                    {selectedApp.isMiniApp ? 'Play' : 'Open'}
                  </button>
                </div>

                {/* About */}
                <div className="apps-modal-about">
                  <h2 className="apps-modal-section-title">About this app</h2>
                  <p className="apps-modal-about-text">
                    {selectedApp.fullDescription ? (
                      typeof selectedApp.fullDescription === 'string' ? 
                        selectedApp.fullDescription.split('\n').map((line, i) => <React.Fragment key={i}>{line}<br/></React.Fragment>) 
                        : selectedApp.fullDescription
                    ) : (
                      selectedApp.description
                    )}
                  </p>
                </div>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
