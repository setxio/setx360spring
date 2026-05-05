import React, { useState } from 'react';
import { 
  Code2, 
  Globe, 
  Puzzle, 
  Settings2, 
  Plus, 
  ArrowRight, 
  Database, 
  Cpu, 
  Layout, 
  ExternalLink,
  ShieldCheck,
  ShoppingBag,
  Users,
  Grid,
  BarChart3,
  Search,
  Eye,
  Settings
} from 'lucide-react';
import { SignUpFlow } from './SignUpFlow';
import { useApp } from '../context/AppContext';
import './LabsView.css';

export const LabsView: React.FC = () => {
  const { user, setEnv } = useApp();
  const [activeTab, setActiveTab] = useState<'portfolio' | 'audit' | 'integrations' | 'domains' | 'store' | 'settings'>('portfolio');
  const [isCreatingSite, setIsCreatingSite] = useState(false);
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteSlug, setNewSiteSlug] = useState('');

  // Auto-route super-admin
  const isSuperAdmin = user?.email === 'setxplatform@gmail.com' || user?.role === 'admin';

  if (!user) {
    return (
      <div className="labs-onboarding-gate">
        <div className="onboarding-card glass fade-in">
          <Code2 size={48} className="labs-logo-icon" />
          <h2>Founder Onboarding</h2>
          <p>Join SETX Labs to build standalone websites and manage your regional business portfolio.</p>
          <div className="onboarding-actions">
            <SignUpFlow />
          </div>
        </div>
      </div>
    );
  }

  const myProjects = [
    { name: 'Cajun Gourmet', category: 'Food', domain: 'cajungourmet.setx.io', status: 'Live', leads: 42 },
    { name: 'Beaumont Bistro', category: 'Food', domain: 'beaumontbistro.com', status: 'Draft', leads: 0 },
  ];

  const allEcosystemProjects = [
    { name: 'Cajun Gourmet', partner: 'James Wilson', type: 'Restaurant', leads: 124, health: 'Optimal' },
    { name: 'Regional Tech', partner: 'Sarah Miller', type: 'Services', leads: 82, health: 'Optimal' },
    { name: 'Civic Center', partner: 'City of Beaumont', type: 'Civic', leads: 512, health: 'Optimal' },
    { name: 'Louis Kitchen', partner: 'Louis P.', type: 'Restaurant', leads: 18, health: 'Warning' },
  ];

  return (
    <div className="labs-wp-container fade-in">
      {/* WP-Style Sidebar */}
      <aside className="labs-sidebar">
        <div className="sidebar-brand">
          <div className="labs-logo">
            <Code2 size={24} />
            <span>SETX <strong>Labs</strong></span>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <div className="nav-group">
            <div className="group-label">Venture Management</div>
            <button className={activeTab === 'portfolio' ? 'active' : ''} onClick={() => setActiveTab('portfolio')}><Grid size={18} /> My Portfolio</button>
            <button className={activeTab === 'domains' ? 'active' : ''} onClick={() => setActiveTab('domains')}><Globe size={18} /> Domain Control</button>
          </div>

          <div className="nav-group">
            <div className="group-label">Ecosystem Tools</div>
            <button className={activeTab === 'store' ? 'active' : ''} onClick={() => setActiveTab('store')}><ShoppingBag size={18} /> Theme Store</button>
            <button className={activeTab === 'integrations' ? 'active' : ''} onClick={() => setActiveTab('integrations')}><Puzzle size={18} /> 360 Plugins</button>
          </div>

          {isSuperAdmin && (
            <div className="nav-group admin">
              <div className="group-label">Platform Admin</div>
              <button className={activeTab === 'audit' ? 'active' : ''} onClick={() => setActiveTab('audit')}><ShieldCheck size={18} /> Ecosystem Audit</button>
              <button onClick={() => setEnv('admin')}><Database size={18} /> System DB</button>
            </div>
          )}

          <div className="nav-group bottom">
            <button className={activeTab === 'settings' ? 'active' : ''} onClick={() => setActiveTab('settings')}><Settings2 size={18} /> Settings</button>
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="labs-main">
        <header className="labs-top-bar">
          <div className="search-box">
            <Search size={16} />
            <input type="text" placeholder="Search projects, domains, or leads..." />
          </div>
          <div className="top-bar-actions">
            <div className="stat-pill"><Cpu size={14} /> 1.2ms</div>
            <div className="user-profile">
              <span>{user.name}</span>
              <div className="avatar">{user.name[0]}</div>
            </div>
          </div>
        </header>

        <div className="labs-body">
          {activeTab === 'portfolio' && (
            <div className="portfolio-view fade-in">
              <div className="view-header">
                <div>
                  <h1>My Venture Portfolio</h1>
                  <p>Manage your collection of regional businesses and websites.</p>
                </div>
                <button className="create-site-btn" onClick={() => setIsCreatingSite(true)}>
                  <Plus size={18} /> Add New Venture
                </button>
              </div>

              <div className="project-grid">
                {myProjects.map(project => (
                  <div key={project.name} className="project-card glass">
                    <div className="card-top">
                      <div className="card-info">
                        <span className="category">{project.category}</span>
                        <h3>{project.name}</h3>
                        <span className="domain">{project.domain}</span>
                      </div>
                      <div className={`status-pill ${project.status.toLowerCase()}`}>{project.status}</div>
                    </div>
                    <div className="card-stats">
                      <div className="stat-item">
                        <Users size={14} />
                        <span>{project.leads} Leads</span>
                      </div>
                      <div className="stat-item">
                        <BarChart3 size={14} />
                        <span>2.4k Hits</span>
                      </div>
                    </div>
                    <div className="card-actions">
                      <button className="action-btn secondary"><Eye size={16} /> View Site</button>
                      <button className="action-btn primary"><Settings size={16} /> Manage CRM</button>
                    </div>
                  </div>
                ))}
                
                <div className="add-project-card" onClick={() => setIsCreatingSite(true)}>
                  <Plus size={32} />
                  <span>Launch New Project</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'audit' && isSuperAdmin && (
            <div className="audit-view fade-in">
              <div className="view-header">
                <div>
                  <h1>Ecosystem Audit</h1>
                  <p>Global oversight of all regional projects and sync health.</p>
                </div>
                <div className="filter-pills">
                  <span className="filter-pill active">All</span>
                  <span className="filter-pill">Active</span>
                  <span className="filter-pill">Issues</span>
                </div>
              </div>

              <div className="audit-table-wrapper glass">
                <table className="audit-table">
                  <thead>
                    <tr>
                      <th>Project Name</th>
                      <th>Partner</th>
                      <th>Type</th>
                      <th>Lead Count</th>
                      <th>Sync Health</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allEcosystemProjects.map(project => (
                      <tr key={project.name}>
                        <td className="name-cell">
                          <div className="project-thumb"></div>
                          {project.name}
                        </td>
                        <td>{project.partner}</td>
                        <td>{project.type}</td>
                        <td><strong>{project.leads}</strong></td>
                        <td>
                          <span className={`health-badge ${project.health.toLowerCase()}`}>
                            {project.health}
                          </span>
                        </td>
                        <td>
                          <div className="table-actions">
                            <button title="View Site"><ExternalLink size={16} /></button>
                            <button title="View Partner CRM"><Settings size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Site Creation Modal */}
          {isCreatingSite && (
            <div className="labs-modal-overlay glass" onClick={() => setIsCreatingSite(false)}>
              <div className="labs-modal premium-card fade-in" onClick={e => e.stopPropagation()}>
                <header className="modal-header">
                  <Layout className="modal-icon" />
                  <div>
                    <h3>Launch New Venture</h3>
                    <p>Start your next project in the ecosystem.</p>
                  </div>
                </header>
                <div className="modal-body">
                  <div className="input-group">
                    <label>Business Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Beaumont Bistro"
                      value={newSiteName}
                      onChange={(e) => {
                        setNewSiteName(e.target.value);
                        setNewSiteSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
                      }}
                    />
                  </div>
                  <div className="slug-preview">
                    <span className="label">Temporary URL:</span>
                    <span className="url">setx.io/<strong>{newSiteSlug || 'your-slug'}</strong></span>
                  </div>
                </div>
                <footer className="modal-footer">
                  <button className="secondary-labs-btn" onClick={() => setIsCreatingSite(false)}>Cancel</button>
                  <button className="primary-labs-btn" disabled={!newSiteSlug} onClick={() => {
                    alert(`Venture Initialized: ${newSiteName}. This has been added to your Master Portfolio.`);
                    setIsCreatingSite(false);
                  }}>Initialize Venture <ArrowRight size={16} /></button>
                </footer>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
