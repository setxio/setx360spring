import React, { useState } from 'react';
import { Menu, X, ArrowLeft, LogOut } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../Avatar';
import './PremiumDashboardLayout.css';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface PremiumDashboardLayoutProps {
  title: string;
  icon?: React.ReactNode;
  navItems: NavItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  children: React.ReactNode;
  user: any;
  headerActions?: React.ReactNode;
}

export const PremiumDashboardLayout: React.FC<PremiumDashboardLayoutProps> = ({
  title,
  icon,
  navItems,
  activeTab,
  onTabChange,
  children,
  user,
  headerActions
}) => {
  const { setEnv, activeContext } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Use activeContext for branding if available, fallback to user
  const avatarUrl = activeContext?.avatar_url || user?.avatar_url;
  const displayName = activeContext?.name || user?.name;
  const displayRole = activeContext?.page_type ? `${activeContext.page_type.charAt(0).toUpperCase() + activeContext.page_type.slice(1)} Dashboard` : 'Dashboard';

  return (
    <div className="premium-dashboard-container">
      {/* Mobile Header */}
      <header className="premium-mobile-header">
        <button className="icon-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <div className="mobile-brand">
          {icon && <span className="mobile-icon">{icon}</span>}
          <span>{title}</span>
        </div>
        <Avatar url={avatarUrl} name={displayName} size={32} />
      </header>

      {/* Sidebar */}
      <aside className={`premium-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-logo">
            {icon || <div className="placeholder-icon" />}
          </div>
          <div className="brand-text">
            <h2>{title}</h2>
            <p>{displayRole}</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => {
                onTabChange(item.id);
                setIsMobileMenuOpen(false);
              }}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile-mini">
            <Avatar url={avatarUrl} name={displayName} size={36} />
            <div className="user-info">
              <strong>{displayName}</strong>
              <span>{user?.email}</span>
            </div>
          </div>
          <button className="exit-btn" onClick={() => setEnv('home')}>
            <LogOut size={18} />
            <span>Exit Dashboard</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="premium-main-content">
        <div className="content-header">
          <div className="content-title">
            <h1>{navItems.find(i => i.id === activeTab)?.label || title}</h1>
            <p className="subtitle">Manage your {displayRole.toLowerCase()} resources.</p>
          </div>
          {headerActions && (
            <div className="content-actions">
              {headerActions}
            </div>
          )}
        </div>
        
        <div className="content-body">
          {children}
        </div>
      </main>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div className="mobile-overlay" onClick={() => setIsMobileMenuOpen(false)} />
      )}
    </div>
  );
};
