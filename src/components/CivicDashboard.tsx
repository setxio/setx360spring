import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Crown,
  Users, 
  Settings, 
  Loader2,
  TrendingUp,
  MessageSquare,
  Clock,
  Wallet,
  History,
  ArrowUp,
  ShieldAlert,
  CheckCircle,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getOrCreateWallet } from '../lib/payments';
import { AdManager } from './AdManager';
import { StaffManagement } from './StaffManagement';
import './VendorDashboard.css'; // Reusing layout styles

interface CivicDashboardProps {
  user: any;
  activeTab?: number;
}

export const CivicDashboard: React.FC<CivicDashboardProps> = ({ user, activeTab: propTab }) => {
  const tabMap = ['directory', 'alerts', 'ads', 'settings', 'overview', 'tickets', 'utilities', 'team'];
  const [activeTab, setActiveTab] = useState<'overview' | 'directory' | 'alerts' | 'ads' | 'settings' | 'tickets' | 'utilities' | 'team'>((propTab !== undefined && tabMap[propTab]) ? tabMap[propTab] as any : 'overview');
  
  const [isLoading, setIsLoading] = useState(false);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [cityWallet, setCityWallet] = useState<any>(null);

  const isManager = user?.role === 'city_manager' || user?.role === 'admin' || user?.role === 'official' || user?.role === 'v_official';
  const isWorker = user?.role === 'city_worker';

  useEffect(() => {
    if (activeTab === 'tickets') fetchIncidents();
    if (activeTab === 'utilities') fetchTransactions();
    if (activeTab === 'tickets' && isManager) fetchStaff();
  }, [activeTab]);

  const fetchIncidents = async () => {
    setIsLoading(true);
    let query = supabase
      .from('civic_incidents')
      .select('*, reporter:profiles!civic_incidents_reporter_id_fkey(name), assignee:profiles!civic_incidents_assigned_to_fkey(name)')
      .order('created_at', { ascending: false });

    // Workers only see their own assignments
    if (isWorker) {
      query = query.eq('assigned_to', user.id);
    }

    const { data, error } = await query;
    
    if (!error && data) {
      setIncidents(data);
    } else {
      // Fallback/Mock
      setIncidents([
        { id: '1', type: 'pothole', description: 'Deep pothole on Main St', location: '123 Main St', status: 'open', priority: 'medium', created_at: new Date().toISOString(), upvote_count: 12, reporter: { name: 'Citizen Jane' } },
        { id: '2', type: 'streetlight', description: 'Light out at intersection', location: '4th and Elm', status: 'in_progress', priority: 'high', created_at: new Date(Date.now() - 86400000).toISOString(), upvote_count: 5, reporter: { name: 'John Resident' } }
      ]);
    }
    setIsLoading(false);
  };

  const fetchStaff = async () => {
    const { data } = await supabase
      .from('staff_clearance')
      .select('profile_id, profiles:profile_id(name)')
      .eq('entity_type', 'civic');
    if (data) setStaff(data.map(s => ({ id: s.profile_id, name: (s.profiles as any)?.name })));
  };

  const fetchTransactions = async () => {
    setIsLoading(true);
    // In MVP, we use a static UUID for the City System Wallet, or we get the user's civic wallet
    const wallet = await getOrCreateWallet('00000000-0000-0000-0000-000000000000', 'civic');
    if (wallet) {
      setCityWallet(wallet);
      const { data } = await supabase
        .from('fintech_ledger')
        .select('*')
        .eq('wallet_id', wallet.id)
        .eq('type', 'payment')
        .order('created_at', { ascending: false });
      if (data) setTransactions(data);
    }
    setIsLoading(false);
  };

  const updateIncident = async (id: string, updates: any) => {
    // Optimistic Update
    setIncidents(incidents.map(inc => inc.id === id ? { ...inc, ...updates } : inc));
    
    await supabase
      .from('civic_incidents')
      .update(updates)
      .eq('id', id);
  };

  if (isLoading && incidents.length === 0) {
    return (
      <div className="vendor-dashboard-loading">
        <Loader2 className="animate-spin" size={48} />
        <p>Opening Civic Command...</p>
      </div>
    );
  }

  return (
    <div className="vendor-dashboard-container">
      {/* Civic Header */}
      <header className="vendor-header premium-card">
        <div className="vendor-profile-brief">
          <div className="vendor-logo" style={{ background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isManager ? <Crown size={24} /> : <ShieldAlert size={24} />}
          </div>
          <div className="vendor-info">
            <h2>{user?.community} {isManager ? 'Command' : 'Staff'}</h2>
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
        {isManager && (
          <button className={`vendor-tab-link ${activeTab === 'directory' ? 'active' : ''}`} onClick={() => setActiveTab('directory')}>
            <Users size={18} /> Directory
          </button>
        )}
        <button className={`vendor-tab-link ${activeTab === 'tickets' ? 'active' : ''}`} onClick={() => setActiveTab('tickets')}>
          <History size={18} /> {isWorker ? 'My Tasks' : 'Issue Tracker'}
        </button>
        {isManager && (
          <button className={`vendor-tab-link ${activeTab === 'utilities' ? 'active' : ''}`} onClick={() => setActiveTab('utilities')}>
            <Wallet size={18} /> Utilities
          </button>
        )}
        <button className={`vendor-tab-link ${activeTab === 'alerts' ? 'active' : ''}`} onClick={() => setActiveTab('alerts')}>
          <AlertTriangle size={18} /> Alerts
        </button>
        {isManager && (
          <>
            <button className={`vendor-tab-link ${activeTab === 'ads' ? 'active' : ''}`} onClick={() => setActiveTab('ads')}>
              <MessageSquare size={18} /> Sponsorships
            </button>
            <button className={`vendor-tab-link ${activeTab === 'team' ? 'active' : ''}`} onClick={() => setActiveTab('team')}>
              <Users size={18} /> Team
            </button>
          </>
        )}
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
                <span className="stat-label">Active Incidents</span>
                <span className="stat-value">{incidents.filter(i => i.status !== 'resolved').length}</span>
              </div>
              <div className="stat-card premium-card">
                <span className="stat-label">Resolved (30d)</span>
                <span className="stat-value">--</span>
              </div>
            </div>
            <div className="premium-card empty-vendor-state" style={{ marginTop: 24 }}>
              <h3>Civic Operations</h3>
              <p>Welcome to the back-end command center. Use the tabs above to manage city infrastructure.</p>
            </div>
          </div>
        )}

        {activeTab === 'tickets' && (
          <div className="civic-tickets-container fade-in">
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <h2>{isWorker ? 'My Assigned Tasks' : 'Community Issue Tracker'}</h2>
                <p style={{ color: 'var(--text-secondary)' }}>
                  {isWorker ? 'Update the status of issues assigned to you.' : 'Assign and manage resident-reported issues.'}
                </p>
              </div>
              <button className="primary-btn" onClick={fetchIncidents} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>Refresh</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {incidents.length === 0 ? (
                <div className="empty-state premium-card">
                  <CheckCircle size={48} style={{ opacity: 0.5, marginBottom: 16 }} />
                  <h3>No Tickets Found</h3>
                  <p>All clear! There are no active issues in your queue.</p>
                </div>
              ) : incidents.map((inc) => (
                <div key={inc.id} className="premium-card" style={{ padding: 20, borderLeft: `4px solid var(--${inc.priority === 'emergency' ? 'accent' : inc.priority === 'high' ? 'warning' : 'primary'})` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                        <span style={{ fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-primary)' }}>{inc.type.replace('_', ' ')}</span>
                        <span className={`priority-badge ${inc.priority}`} style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', fontWeight: 700 }}>{inc.priority.toUpperCase()}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={14} /> {new Date(inc.created_at).toLocaleDateString()}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--secondary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <ArrowUp size={14} /> {inc.upvote_count || 0} Upvotes
                        </span>
                      </div>
                      <p style={{ marginBottom: 4, fontWeight: 500 }}>{inc.description}</p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Location: {inc.location}</p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 8 }}>Reported by: {inc.reporter?.name || 'Anonymous'}</p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 200 }}>
                      <div className="input-group">
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Status</label>
                        <select 
                          value={inc.status} 
                          onChange={(e) => updateIncident(inc.id, { status: e.target.value })}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: 8, background: 'var(--surface-hover)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
                        >
                          <option value="open">Open</option>
                          <option value="assigned">Assigned</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>

                      {isManager && (
                        <div className="input-group">
                          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Assign To</label>
                          <select 
                            value={inc.assigned_to || ''} 
                            onChange={(e) => updateIncident(inc.id, { assigned_to: e.target.value || null, status: e.target.value ? 'assigned' : 'open' })}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, background: 'var(--surface-hover)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
                          >
                            <option value="">Unassigned</option>
                            {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                        </div>
                      )}

                      {isWorker && inc.assigned_to && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, textAlign: 'right' }}>
                          Assigned to You
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'utilities' && (
          <div className="civic-utilities-container fade-in">
            <div style={{ marginBottom: 24 }}>
              <h2>Utility Revenue Dashboard</h2>
              <p style={{ color: 'var(--text-secondary)' }}>Monitor incoming payments for municipal services.</p>
            </div>

            <div className="vendor-stats-grid" style={{ marginBottom: 24 }}>
              <div className="stat-card premium-card">
                <span className="stat-label">Wallet Balance (SEC)</span>
                <span className="stat-value text-success">
                  ${cityWallet ? Number(cityWallet.balance).toFixed(2) : '0.00'}
                </span>
              </div>
              <div className="stat-card premium-card">
                <span className="stat-label">Total Transactions</span>
                <span className="stat-value">{transactions.length}</span>
              </div>
            </div>

            <div className="premium-card">
              <h3 style={{ marginBottom: 16 }}>Recent Payments</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)' }}>
                      <th style={{ padding: '12px 8px' }}>Date</th>
                      <th style={{ padding: '12px 8px' }}>Type</th>
                      <th style={{ padding: '12px 8px' }}>Amount</th>
                      <th style={{ padding: '12px 8px' }}>Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length === 0 ? (
                      <tr><td colSpan={5} style={{ padding: '24px', textAlign: 'center', opacity: 0.5 }}>No recent transactions.</td></tr>
                    ) : transactions.map(tx => (
                      <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '12px 8px', fontSize: '0.9rem' }}>{new Date(tx.created_at).toLocaleDateString()}</td>
                        <td style={{ padding: '12px 8px' }}>{tx.description || tx.type.toUpperCase()}</td>
                        <td style={{ padding: '12px 8px', fontWeight: 600, color: tx.amount > 0 ? '#10b981' : '#ef4444' }}>
                          {tx.amount > 0 ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
                        </td>
                        <td style={{ padding: '12px 8px', fontSize: '0.8rem' }}>{tx.reference_id || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="premium-card empty-vendor-state fade-in">
            <AlertTriangle size={48} style={{ opacity: 0.5, marginBottom: 16 }} />
            <h3>Community Alerts</h3>
            <p>Feature coming soon: Issue official notices to the Radar feed.</p>
          </div>
        )}

        {activeTab === 'ads' && (
          <div className="fade-in">
            <AdManager user={user} />
          </div>
        )}

        {activeTab === 'team' && (
          <div className="fade-in">
            <StaffManagement entityId={user.id} entityType="civic" user={user} />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="premium-card empty-vendor-state fade-in">
            <Settings size={48} style={{ opacity: 0.5, marginBottom: 16 }} />
            <h3>Settings</h3>
            <p>Civic settings management coming soon.</p>
          </div>
        )}
      </main>
    </div>
  );
};
