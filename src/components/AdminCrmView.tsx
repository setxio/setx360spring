import React, { useState } from 'react';
import { 
  Shield, 
  Users, 
  AlertTriangle, 
  Download, 
  RefreshCw,
  Search,
  Globe,
  Database,
  ArrowUpRight,
  TrendingUp,
  Activity
} from 'lucide-react';
import './AdminCrmView.css';

export const AdminCrmView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'audit' | 'entities'>('overview');

  const globalStats = [
    { label: 'Total Platform Users', value: '14,822', change: '+12%', icon: Users },
    { label: 'Avg. Lead Value', value: '$4,102', change: '+5.4%', icon: TrendingUp },
    { label: 'Conversion Rate', value: '18.2%', change: '-1.2%', icon: Activity },
    { label: 'Sync Health', value: '99.9%', change: 'Optimal', icon: RefreshCw },
  ];

  return (
    <div className="admin-crm-container fade-in">
      <header className="admin-crm-header">
        <div className="header-left">
          <div className="admin-badge"><Shield size={14} /> System Admin</div>
          <h1>Ultimate CRM Console</h1>
          <p>Global relationship management and cross-platform analytics.</p>
        </div>
        <div className="header-actions">
          <button className="export-btn"><Download size={18} /> Export Global Data</button>
          <button className="refresh-btn"><RefreshCw size={18} /></button>
        </div>
      </header>

      {/* Global Metrics */}
      <div className="admin-stats-row">
        {globalStats.map((stat, i) => (
          <div key={i} className="admin-stat-card glass">
            <div className="stat-top">
              <stat.icon size={20} className="stat-icon" />
              <span className={`stat-change ${stat.change.startsWith('+') ? 'positive' : ''}`}>
                {stat.change}
              </span>
            </div>
            <div className="stat-main">
              <span className="stat-value">{stat.value}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-crm-layout">
        {/* Left Panel: Global Filters & Controls */}
        <aside className="admin-crm-sidebar glass">
          <div className="sidebar-section">
            <h3>Environment Select</h3>
            <div className="env-selector">
              <label><input type="checkbox" defaultChecked /> SETX 360 Market</label>
              <label><input type="checkbox" defaultChecked /> SETX Labs</label>
              <label><input type="checkbox" defaultChecked /> Civic Portals</label>
            </div>
          </div>

          <div className="sidebar-section">
            <h3>Entity Filtering</h3>
            <div className="filter-item">
              <label>Min. Lead Value</label>
              <input type="range" min="0" max="10000" step="500" />
            </div>
            <div className="filter-item">
              <label>Status Tier</label>
              <select>
                <option>All Tiers</option>
                <option>Enterprise</option>
                <option>Mid-Market</option>
                <option>Small Business</option>
              </select>
            </div>
          </div>

          <div className="sidebar-footer">
            <button className="full-audit-btn"><Database size={16} /> Run Full DB Audit</button>
          </div>
        </aside>

        {/* Main Panel: High-Level Analytics */}
        <main className="admin-crm-main">
          <div className="main-nav">
            <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>Global Feed</button>
            <button className={activeTab === 'audit' ? 'active' : ''} onClick={() => setActiveTab('audit')}>Churn Risk</button>
            <button className={activeTab === 'entities' ? 'active' : ''} onClick={() => setActiveTab('entities')}>Entity Explorer</button>
          </div>

          <div className="main-content glass">
            <div className="content-header">
              <h2>Real-time Lead Activity</h2>
              <div className="search-box">
                <Search size={16} />
                <input type="text" placeholder="Search entire ecosystem..." />
              </div>
            </div>

            <div className="admin-feed">
              {[
                { type: 'Lead Created', store: 'Cajun Gourmet', value: '$2,500', time: 'Just now', user: 'James W.' },
                { type: 'Sync Success', store: 'Regional Bank', value: 'N/A', time: '12m ago', user: 'System' },
                { type: 'High Value Lead', store: 'Civic Center', value: '$12,000', time: '1h ago', user: 'Sarah M.' },
                { type: 'Domain Connected', store: 'SETX Tech', value: 'N/A', time: '3h ago', user: 'Alex P.' },
              ].map((item, i) => (
                <div key={i} className="feed-item">
                  <div className="feed-icon"><Activity size={16} /></div>
                  <div className="feed-info">
                    <div className="info-top">
                      <span className="type">{item.type}</span>
                      <span className="store">at {item.store}</span>
                    </div>
                    <div className="info-bottom">
                      <span className="user">Agent: {item.user}</span>
                      <span className="time">{item.time}</span>
                    </div>
                  </div>
                  <div className="feed-value">
                    {item.value !== 'N/A' && <span className="value-badge">{item.value}</span>}
                    <ArrowUpRight size={16} className="go-arrow" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Infrastructure Health */}
          <div className="health-grid">
            <div className="health-card glass">
              <div className="health-header">
                <Globe size={18} />
                <h4>Domain Routing</h4>
              </div>
              <div className="health-status">
                <div className="status-dot online"></div>
                <span>99.9% Uptime</span>
              </div>
            </div>
            <div className="health-card glass">
              <div className="health-header">
                <Database size={18} />
                <h4>Sync Latency</h4>
              </div>
              <div className="health-status">
                <div className="status-dot online"></div>
                <span>42ms</span>
              </div>
            </div>
            <div className="health-card glass alert">
              <div className="health-header">
                <AlertTriangle size={18} />
                <h4>SSL Issues</h4>
              </div>
              <div className="health-status">
                <div className="status-dot warning"></div>
                <span>2 Pending</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
