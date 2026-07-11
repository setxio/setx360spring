import React, { useState } from 'react';
import type { User } from '../../types/user';
import { 
  LayoutDashboard, 
  Users, 
  MessageSquareWarning, 
  Store, 
  Megaphone,
  LogOut,
  ChevronLeft,
  Database,
  Building,
  Contact,
  BookOpen,
  UploadCloud,
  Bot,
  AlertTriangle
} from 'lucide-react';
import '../AdminDashboard.css';
import { useApp } from '../../context/AppContext';

// Import the new tabs
import { AdminOverviewTab } from './AdminOverviewTab';
import { AdminUsersTab } from './AdminUsersTab';
import { AdminContentTab } from './AdminContentTab';
import { AdminMarketTab } from './AdminMarketTab';
import { AdminAdsAndFundsTab } from './AdminAdsAndFundsTab';
import { AdminCrmView } from './AdminCrmView';
import { AdminVendorsTab } from './AdminVendorsTab';
import { AdminDirectoryTab } from './AdminDirectoryTab';
import { AdminWikiTab } from './AdminWikiTab';
import { AdminDataImport } from './AdminDataImport';
import { AIAssistant } from './AIAssistant';
import { SosAlertsManager } from '../dashboards/SosAlertsManager';

export const AdminDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'content' | 'market' | 'ads' | 'crm' | 'vendors' | 'directory' | 'wiki' | 'data' | 'ai' | 'alerts'>('overview');
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
    { id: 'crm', label: 'CRM', icon: <Contact size={20} /> },
    { id: 'vendors', label: 'Vendors', icon: <Building size={20} /> },
    { id: 'directory', label: 'Directory', icon: <Database size={20} /> },
    { id: 'wiki', label: 'Wiki', icon: <BookOpen size={20} /> },
    { id: 'data', label: 'Data Import', icon: <UploadCloud size={20} /> },
    { id: 'alerts', label: 'Crisis Alerts', icon: <AlertTriangle size={20} /> },
    { id: 'ai', label: 'AI Assistant', icon: <Bot size={20} /> },
  ];

  return (
    <div className="admin-dashboard-container">
      {/* WordPress-style Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <img src="/slingo-icon.png" alt="Logo" style={{ width: 32, height: 32 }} />
          <div>
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Super Admin</h2>
            <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>Platform Control</span>
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
                <span>Super Administrator</span>
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
          {activeTab === 'crm' && <AdminCrmView />}
          {activeTab === 'vendors' && <AdminVendorsTab vendors={[]} onRefresh={() => {}} />}
          {activeTab === 'directory' && <AdminDirectoryTab 
            users={[]}
            searchQuery=""
            onSearchChange={() => {}}
            onRefresh={() => {}}
            editingFeeUser={null}
            customFeesForm={{ fee_percentage: '', base_fee: '' }}
            onEditFeeUser={() => {}}
            onCloseFeeModal={() => {}}
            onFeeFormChange={() => {}}
            onSaveCustomFees={() => {}}
            onToggleUserStatus={() => {}}
          />}
          {activeTab === 'wiki' && <AdminWikiTab />}
          {activeTab === 'data' && <AdminDataImport />}
          {activeTab === 'alerts' && <SosAlertsManager user={user} />}
          {activeTab === 'ai' && <AIAssistant />}
        </div>
      </main>
    </div>
  );
};
