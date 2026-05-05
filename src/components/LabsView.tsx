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
  Zap,
  ShoppingBag,
  MessageSquare,
  Star,
  Users
} from 'lucide-react';
import './LabsView.css';

export const LabsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'solutions' | 'integrations' | 'domains' | 'infrastructure' | 'store' | 'forum'>('solutions');
  const [isCreatingSite, setIsCreatingSite] = useState(false);
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteSlug, setNewSiteSlug] = useState('');

  const templates = [
    { name: 'Restaurant Pro', category: 'Food & Drink', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=400', sync: ['Menu', 'Orders', 'Social'] },
    { name: 'Retail Storefront', category: 'Retail', image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=400', sync: ['Inventory', 'Sales', 'Ads'] },
    { name: 'Service Portfolio', category: 'Services', image: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=400', sync: ['Bookings', 'Leads', 'Reviews'] }
  ];

  const integrations = [
    { name: '360 Social Sync', description: 'Automatically push website updates to the SETX 360 Social Feed.', status: 'Active' },
    { name: 'Global Marketplace', description: 'List products from your site directly into the SETX 360 Market.', status: 'Active' },
    { name: 'Eats Dispatch', description: 'Enable 360 delivery drivers for your standalone restaurant site.', status: 'Beta' }
  ];

  return (
    <div className="labs-container fade-in">
      {/* Labs Header */}
      <header className="labs-header">
        <div className="labs-brand">
          <Code2 size={32} className="labs-logo-icon" />
          <div>
            <h1>SETX <span>Labs</span></h1>
            <p>Developer tools for the regional ecosystem</p>
          </div>
        </div>
        <div className="labs-stats">
          <div className="stat-pill"><Cpu size={14} /> 1.2ms Avg Latency</div>
          <div className="stat-pill"><Database size={14} /> 99.99% Sync Uptime</div>
        </div>
      </header>

      {/* Main Navigation */}
      <nav className="labs-nav">
        <button className={activeTab === 'solutions' ? 'active' : ''} onClick={() => setActiveTab('solutions')}><Layout size={18} /> Website Builder</button>
        <button className={activeTab === 'store' ? 'active' : ''} onClick={() => setActiveTab('store')}><ShoppingBag size={18} /> Theme Store</button>
        <button className={activeTab === 'integrations' ? 'active' : ''} onClick={() => setActiveTab('integrations')}><Puzzle size={18} /> 360 Integrations</button>
        <button className={activeTab === 'domains' ? 'active' : ''} onClick={() => setActiveTab('domains')}><Globe size={18} /> Domain Management</button>
        <button className={activeTab === 'forum' ? 'active' : ''} onClick={() => setActiveTab('forum')}><MessageSquare size={18} /> Dev Forum</button>
        <button className={activeTab === 'infrastructure' ? 'active' : ''} onClick={() => setActiveTab('infrastructure')}><Settings2 size={18} /> Settings</button>
      </nav>

      <main className="labs-content">
        {activeTab === 'solutions' && (
          <section className="labs-section">
            <div className="section-header">
              <h2>Site Solutions & Templates</h2>
              <button className="primary-labs-btn" onClick={() => setIsCreatingSite(true)}><Plus size={18} /> New Standalone Site</button>
            </div>
            <div className="template-grid">
              {templates.map(t => (
                <div key={t.name} className="template-card glass">
                  <div className="template-preview" style={{ backgroundImage: `url(${t.image})` }}>
                    <div className="preview-overlay">
                      <button className="preview-btn">Preview Theme</button>
                    </div>
                  </div>
                  <div className="template-info">
                    <span className="category">{t.category}</span>
                    <h3>{t.name}</h3>
                    <div className="sync-badges">
                      {t.sync.map(s => <span key={s} className="sync-badge"><Zap size={10} /> {s} Sync</span>)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Create Site Modal */}
        {isCreatingSite && (
          <div className="labs-modal-overlay glass" onClick={() => setIsCreatingSite(false)}>
            <div className="labs-modal premium-card fade-in" onClick={e => e.stopPropagation()}>
              <header className="modal-header">
                <Layout className="modal-icon" />
                <div>
                  <h3>Launch Your New Project</h3>
                  <p>Start with a temporary SETX.IO address.</p>
                </div>
              </header>
              <div className="modal-body">
                <div className="input-group">
                  <label>Business or Project Name</label>
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
                <button className="primary-labs-btn" disabled={!newSiteSlug}>Initialize Project <ArrowRight size={16} /></button>
              </footer>
            </div>
          </div>
        )}

        {activeTab === 'integrations' && (
          <section className="labs-section">
            <h2>Ecosystem Plugins</h2>
            <div className="integrations-list">
              {integrations.map(i => (
                <div key={i.name} className="integration-item glass">
                  <div className="int-main">
                    <div className="int-icon"><ShieldCheck /></div>
                    <div className="int-text">
                      <h3>{i.name}</h3>
                      <p>{i.description}</p>
                    </div>
                  </div>
                  <div className="int-actions">
                    <span className={`status ${i.status.toLowerCase()}`}>{i.status}</span>
                    <button className="configure-btn">Configure <ArrowRight size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'domains' && (
          <section className="labs-section">
            <div className="section-header">
              <h2>Domain Routing</h2>
              <button className="primary-labs-btn">Connect Domain</button>
            </div>
            <div className="domains-table-wrapper glass">
              <table className="domains-table">
                <thead>
                  <tr>
                    <th>Domain Name</th>
                    <th>Pointing To</th>
                    <th>Status</th>
                    <th>360 Sync</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>eatatlouis.com</td>
                    <td>Louis Cajun Kitchen (Restaurant)</td>
                    <td><span className="status active">Connected</span></td>
                    <td>Enabled</td>
                    <td><ExternalLink size={16} /></td>
                  </tr>
                  <tr>
                    <td>setxpro.io</td>
                    <td>SETX.IO Labs (Corporate)</td>
                    <td><span className="status active">Connected</span></td>
                    <td>Enabled</td>
                    <td><ExternalLink size={16} /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        )}
        {activeTab === 'store' && (
          <section className="labs-section">
            <div className="section-header">
              <h2>Premium Theme Store</h2>
              <div className="filter-group">
                <button className="filter-btn active">All</button>
                <button className="filter-btn">Free</button>
                <button className="filter-btn">Premium</button>
              </div>
            </div>
            <div className="template-grid">
              {[
                { name: 'Neo-Genesis', price: '$49', rating: 4.9, image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=400' },
                { name: 'Pure Civic', price: 'Free', rating: 4.7, image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=400' },
                { name: 'Cajun Gourmet', price: '$29', rating: 5.0, image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=400' }
              ].map(theme => (
                <div key={theme.name} className="template-card theme-card glass">
                  <div className="template-preview" style={{ backgroundImage: `url(${theme.image})` }}>
                    <div className="price-tag">{theme.price}</div>
                  </div>
                  <div className="template-info">
                    <div className="theme-meta">
                      <h3>{theme.name}</h3>
                      <div className="rating"><Star size={14} fill="currentColor" /> {theme.rating}</div>
                    </div>
                    <button className="install-btn">Install Theme</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'forum' && (
          <section className="labs-section">
            <div className="section-header">
              <h2>Developer Forum</h2>
              <button className="primary-labs-btn">Start Discussion</button>
            </div>
            <div className="forum-list">
              {[
                { title: 'Best practices for 360 Market Sync?', author: 'dev_tx', replies: 24, activity: '2m ago' },
                { title: 'Custom CSS variables for stand-alone restaurant themes', author: 'setx_pro', replies: 8, activity: '1h ago' },
                { title: 'Domain pointing issues with .io extensions', author: 'labs_ninja', replies: 15, activity: '3h ago' }
              ].map(post => (
                <div key={post.title} className="forum-item glass">
                  <div className="forum-main">
                    <MessageSquare size={20} className="forum-icon" />
                    <div>
                      <h3>{post.title}</h3>
                      <span className="author">Posted by {post.author}</span>
                    </div>
                  </div>
                  <div className="forum-meta">
                    <div className="meta-stat"><Users size={14} /> {post.replies}</div>
                    <div className="meta-stat">{post.activity}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};
