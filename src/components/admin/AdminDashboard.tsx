import React, { useState } from 'react';
import type { User } from '../../types/user';
import { 
  LayoutDashboard, 
  Users, 
  MessageSquareWarning, 
  Store, 
  Megaphone,
  LogOut,
  ChevronLeft
} from 'lucide-react';
import '../AdminDashboard.css';
import { useApp } from '../../context/AppContext';

// Import the new tabs
import { AdminOverviewTab } from './AdminOverviewTab';
import { AdminUsersTab } from './AdminUsersTab';
import { AdminContentTab } from './AdminContentTab';
import { AdminMarketTab } from './AdminMarketTab';
import { AdminAdsAndFundsTab } from './AdminAdsAndFundsTab';

export const AdminDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'content' | 'market' | 'ads'>('overview');
  const { setEnv } = useApp();

  const handleExit = () => {
    setEnv('home');
  };

  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'users', label: 'Users & Identity', icon: <Users size={20} /> },
    { id: 'content', label: 'Content Moderation', icon: <MessageSquareWarning size={20} /> },
    { id: 'market', label: 'Market & Gigs', icon: <Store size={20} /> },
    { id: 'ads', label: 'Ads & Crowdfunds', icon: <Megaphone size={20} /> },
  ];

  return (
    <div className="admin-dashboard-container">
      {/* WordPress-style Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <img src="/slingo-icon.png" alt="Logo" style={{ width: 32, height: 32 }} />
          <div>
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>SETX Admin</h2>
            <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>Super-App Control</span>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <button 
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id as any)}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item exit-btn" onClick={handleExit}>
            <ChevronLeft size={20} />
            Back to App
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main-content">
        <header className="admin-header">
          <div className="header-title">
            <h1>
              {navItems.find(n => n.id === activeTab)?.label}
            </h1>
          </div>
          <div className="header-actions">
            <div className="admin-profile-badge">
              <img src={user.avatar_url || 'https://via.placeholder.com/40'} alt="Admin" />
              <div>
                <strong>{user.name || user.first_name}</strong>
                <span>System Administrator</span>
              </div>
            </div>
          </div>
        </header>

        <div className="admin-content-scroll">
          {/* Tab Content will go here */}
          {activeTab === 'overview' && <AdminOverviewTab />}
          {activeTab === 'users' && <AdminUsersTab />}
          {activeTab === 'content' && <AdminContentTab />}
          {activeTab === 'market' && <AdminMarketTab />}
          {activeTab === 'ads' && <AdminAdsAndFundsTab />}
        </div>
      </main>
    </div>
  );
};
