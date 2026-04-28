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
import './VendorDashboard.css'; // Reusing layout styles

interface CreatorDashboardProps {
  user: any;
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

  return (
    <div className="vendor-dashboard-container">
      {/* Creator Header */}
      <header className="vendor-header premium-card">
        <div className="vendor-profile-brief">
          <div className="vendor-logo" style={{ background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {getRoleIcon()}
          </div>
          <div className="vendor-info">
            <h2>{user?.name || 'Creator Studio'}</h2>
            <div className="vendor-badges">
              <span className="vendor-role-badge">{user?.role?.toUpperCase()}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs Navigation */}
      <nav className="vendor-tabs">
        <button className={`vendor-tab-link ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          <TrendingUp size={18} /> Overview
        </button>
        <button className={`vendor-tab-link ${activeTab === 'portfolio' ? 'active' : ''}`} onClick={() => setActiveTab('portfolio')}>
          <ImageIcon size={18} /> Portfolio
        </button>
        <button className={`vendor-tab-link ${activeTab === 'gigs' ? 'active' : ''}`} onClick={() => setActiveTab('gigs')}>
          <Calendar size={18} /> Events & Gigs
        </button>
        <button className={`vendor-tab-link ${activeTab === 'ads' ? 'active' : ''}`} onClick={() => setActiveTab('ads')}>
          <MessageSquare size={18} /> Ads & Promos
        </button>
        <button className={`vendor-tab-link ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
          <Settings size={18} /> Settings
        </button>
      </nav>

      {/* Tab Content */}
      <main className="vendor-content">
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
          <div className="premium-card empty-vendor-state fade-in">
            <ImageIcon size={48} style={{ opacity: 0.5, marginBottom: 16 }} />
            <h3>Portfolio Empty</h3>
            <p>Feature coming soon: Upload your tracks, art, or articles here.</p>
          </div>
        )}

        {activeTab === 'gigs' && (
          <div className="premium-card empty-vendor-state fade-in">
            <Calendar size={48} style={{ opacity: 0.5, marginBottom: 16 }} />
            <h3>No Upcoming Events</h3>
            <p>Feature coming soon: Schedule your gigs or venue events.</p>
          </div>
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
      </main>
    </div>
  );
};
