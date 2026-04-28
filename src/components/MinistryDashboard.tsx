import React, { useState } from 'react';
import { 
  Church, 
  HeartHandshake, 
  Calendar, 
  Gift, 
  Settings, 
  Loader2,
  TrendingUp,
  MessageSquare,
  Users
} from 'lucide-react';
import { AdManager } from './AdManager';
import './VendorDashboard.css'; // Reusing layout styles

interface MinistryDashboardProps {
  user: any;
  activeTab?: number;
}

export const MinistryDashboard: React.FC<MinistryDashboardProps> = ({ user, activeTab: propTab }) => {
  const tabMap = ['events', 'donations', 'members', 'ads', 'settings', 'overview'];
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'donations' | 'members' | 'ads' | 'settings'>((propTab !== undefined && tabMap[propTab]) ? tabMap[propTab] as any : 'overview');
  
  const [isLoading] = useState(false);

  if (isLoading) {
    return (
      <div className="vendor-dashboard-loading">
        <Loader2 className="animate-spin" size={48} />
        <p>Loading Ministry Hub...</p>
      </div>
    );
  }

  return (
    <div className="vendor-dashboard-container">
      {/* Ministry Header */}
      <header className="vendor-header premium-card">
        <div className="vendor-profile-brief">
          <div className="vendor-logo" style={{ background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {user?.role === 'church' ? <Church size={24} /> : <HeartHandshake size={24} />}
          </div>
          <div className="vendor-info">
            <h2>{user?.name || 'Ministry & Outreach'}</h2>
            <div className="vendor-badges">
              <span className="vendor-role-badge">{user?.role?.replace('_', ' ').toUpperCase()}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs Navigation */}
      <nav className="vendor-tabs">
        <button className={`vendor-tab-link ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          <TrendingUp size={18} /> Overview
        </button>
        <button className={`vendor-tab-link ${activeTab === 'events' ? 'active' : ''}`} onClick={() => setActiveTab('events')}>
          <Calendar size={18} /> Events
        </button>
        <button className={`vendor-tab-link ${activeTab === 'donations' ? 'active' : ''}`} onClick={() => setActiveTab('donations')}>
          <Gift size={18} /> Donations
        </button>
        <button className={`vendor-tab-link ${activeTab === 'members' ? 'active' : ''}`} onClick={() => setActiveTab('members')}>
          <Users size={18} /> Members
        </button>
        <button className={`vendor-tab-link ${activeTab === 'ads' ? 'active' : ''}`} onClick={() => setActiveTab('ads')}>
          <MessageSquare size={18} /> Outreach
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
                <span className="stat-label">Upcoming Events</span>
                <span className="stat-value">0</span>
              </div>
              <div className="stat-card premium-card">
                <span className="stat-label">Community Reach</span>
                <span className="stat-value">--</span>
              </div>
            </div>
            <div className="premium-card empty-vendor-state" style={{ marginTop: 24 }}>
              <h3>Community Outreach Hub</h3>
              <p>Manage your services, food drives, and faith events.</p>
            </div>
          </div>
        )}

        {activeTab === 'events' && (
          <div className="premium-card empty-vendor-state fade-in">
            <Calendar size={48} style={{ opacity: 0.5, marginBottom: 16 }} />
            <h3>Event Manager</h3>
            <p>Feature coming soon: Schedule services and outreach events.</p>
          </div>
        )}

        {activeTab === 'donations' && (
          <div className="premium-card empty-vendor-state fade-in">
            <Gift size={48} style={{ opacity: 0.5, marginBottom: 16 }} />
            <h3>Donations</h3>
            <p>Feature coming soon: Track community support and tithes.</p>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="premium-card empty-vendor-state fade-in">
            <Users size={48} style={{ opacity: 0.5, marginBottom: 16 }} />
            <h3>Membership Requests</h3>
            <p>You have 0 pending membership requests to approve.</p>
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
            <p>Organization settings coming soon.</p>
          </div>
        )}
      </main>
    </div>
  );
};
