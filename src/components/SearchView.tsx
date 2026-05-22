import React, { useState } from 'react';
import { Search, Compass, Rss, Store, Calendar, MapPin, Zap } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { motion } from 'framer-motion';
import './SearchView.css';

interface SearchViewProps {
  user: any;
  scope: string;
  onNavigate: (env: string) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({ user, scope, onNavigate }) => {
  const { theme, isSetxIO, setIsSearchOpen } = useApp();
  const [query, setQuery] = useState('');

  const getHeaderLogo = () => {
    if (theme.startsWith('io-')) return '/logo-io.png';
    if (theme.startsWith('neo')) return '/logo-neo.png';
    if (theme.startsWith('twilight')) return '/logo-twilight.png';
    if (theme.startsWith('efutura')) return '/logo-efutura.png';
    return theme.includes('light') ? '/logo-setx-blue.png' : '/logo-setx-transparent.png';
  };

  const handleSearchClick = () => {
    setIsSearchOpen(true);
  };

  const quickLinks = [
    { icon: <Store size={16} />, label: 'Market', env: 'market' },
    { icon: <Compass size={16} />, label: 'Discover', env: 'discover' },
    { icon: <Rss size={16} />, label: 'Social', env: 'social' },
    { icon: <Calendar size={16} />, label: 'Events', env: 'events' },
    { icon: <Zap size={16} />, label: 'Eats', env: 'eats' }
  ];

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
        
        <div className="search-input-wrapper" onClick={handleSearchClick}>
          <Search className="search-input-icon" />
          <input 
            type="text" 
            className="search-main-input" 
            placeholder={`Search ${scope === 'city' ? user?.community || 'Local' : 'SETX'}...`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            readOnly
          />
        </div>

        <div className="search-action-buttons">
          <button className="search-btn" onClick={handleSearchClick}>SETX Search</button>
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
      </motion.div>
    </div>
  );
};
