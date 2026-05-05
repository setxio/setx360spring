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
  Zap
} from 'lucide-react';
import './LabsView.css';

export const LabsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'solutions' | 'integrations' | 'domains' | 'infrastructure'>('solutions');

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
        <button className={activeTab === 'integrations' ? 'active' : ''} onClick={() => setActiveTab('integrations')}><Puzzle size={18} /> 360 Integrations</button>
        <button className={activeTab === 'domains' ? 'active' : ''} onClick={() => setActiveTab('domains')}><Globe size={18} /> Domain Management</button>
        <button className={activeTab === 'infrastructure' ? 'active' : ''} onClick={() => setActiveTab('infrastructure')}><Settings2 size={18} /> Settings</button>
      </nav>

      <main className="labs-content">
        {activeTab === 'solutions' && (
          <section className="labs-section">
            <div className="section-header">
              <h2>Site Solutions & Templates</h2>
              <button className="primary-labs-btn"><Plus size={18} /> New Standalone Site</button>
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
      </main>
    </div>
  );
};
