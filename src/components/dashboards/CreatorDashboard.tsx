import type { User } from '../../types/user';
import React, { useState } from 'react';
import { 
  Palette, 
  Music, 
  Tv, 
  Calendar, 
  Settings, 
  Loader2,
  TrendingUp,
  Image as ImageIcon,
  MessageSquare
} from 'lucide-react';
import { AdManager } from './AdManager';
import { CreatorEventsManager } from './CreatorEventsManager';
import { CreatorMediaManager } from './CreatorMediaManager';
import { PremiumDashboardLayout } from './PremiumDashboardLayout';
import './VendorDashboard.css';

interface CreatorDashboardProps {
  user: User;
  activeTab?: number;
}

export const CreatorDashboard: React.FC<CreatorDashboardProps> = ({ user, activeTab: propTab }) => {
  const tabMap = ['portfolio', 'gigs', 'ads', 'settings', 'overview'];
  const [activeTab, setActiveTab] = useState<'overview' | 'portfolio' | 'gigs' | 'ads' | 'settings'>((propTab !== undefined && tabMap[propTab]) ? tabMap[propTab] as any : 'overview');
  
  const [isLoading] = useState(false);

  if (isLoading) {
    return (
      <div className="vendor-dashboard-loading">
        <Loader2 className="animate-spin" size={48} />
        <p>Loading Creator Studio...</p>
      </div>
    );
  }

  const getRoleIcon = () => {
    switch(user?.role) {
      case 'artist': return <Palette size={24} />;
      case 'venue': return <Music size={24} />;
      case 'media': return <Tv size={24} />;
      default: return <Palette size={24} />;
    }
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: <TrendingUp size={20} /> },
    { id: 'portfolio', label: 'Portfolio', icon: <ImageIcon size={20} /> },
    { id: 'gigs', label: 'Events & Gigs', icon: <Calendar size={20} /> },
    { id: 'ads', label: 'Ads & Promos', icon: <MessageSquare size={20} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={20} /> }
  ];

  return (
    <PremiumDashboardLayout
      title={user?.name || "Creator Studio"}
      icon={getRoleIcon()}
      navItems={navItems}
      activeTab={activeTab}
      onTabChange={(tab) => setActiveTab(tab as any)}
      user={user}
    >
        {activeTab === 'overview' && (
          <div className="vendor-overview fade-in">
            <div className="vendor-stats-grid">
              <div className="stat-card premium-card">
                <span className="stat-label">Total Views</span>
                <span className="stat-value">--</span>
              </div>
              <div className="stat-card premium-card">
                <span className="stat-label">Followers</span>
                <span className="stat-value">--</span>
              </div>
              <div className="stat-card premium-card">
                <span className="stat-label">Upcoming Gigs</span>
                <span className="stat-value">0</span>
              </div>
            </div>
            <div className="premium-card empty-vendor-state" style={{ marginTop: 24 }}>
              <h3>Welcome to your Creator Studio</h3>
              <p>Manage your portfolio, book gigs, and promote your brand.</p>
            </div>
          </div>
        )}

        {activeTab === 'portfolio' && (
          <CreatorMediaManager user={user} />
        )}

        {activeTab === 'gigs' && (
          <CreatorEventsManager user={user} />
        )}

        {activeTab === 'ads' && (
          <div className="fade-in">
            <AdManager user={user} />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="premium-card empty-vendor-state fade-in">
            <Settings size={48} style={{ opacity: 0.5, marginBottom: 16 }} />
            <h3>Settings</h3>
            <p>Creator settings management coming soon.</p>
          </div>
        )}
    </PremiumDashboardLayout>
  );
};
