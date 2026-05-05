import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  Loader2,
  LogOut,
  Store,
  Grid,
  Users,
  DollarSign,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  Siren,
  Home,
  Activity as LucideActivity,
  Trash2,
  Unlock as LucideUnlock,
  Lock as LucideLock,
  Bell,
  Settings as LucideSettings,
  Save,
  Menu,
  X,
  TrendingUp,
  ArrowUpRight,
  Shield
} from 'lucide-react';
import { AdminDataImport } from './AdminDataImport';
import { AIAssistant } from './AIAssistant';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import './AdminDashboard.css';

type AdminTab = 'overview' | 'reviews' | 'vendors' | 'directory' | 'modules' | 'moderation' | 'intelligence' | 'alerts' | 'activity' | 'settings';

export const AdminDashboard: React.FC<{ activeTab?: number }> = ({ activeTab: propTab }) => {
  const { theme } = useApp();
  const tabMap: Record<number, AdminTab> = {
    0: 'overview',
    1: 'reviews',
    2: 'vendors',
    3: 'directory',
    4: 'modules',
    5: 'moderation',
    6: 'intelligence',
    7: 'alerts',
    8: 'activity',
    9: 'settings'
  };
  
  const [activeTab, setActiveTab] = useState<AdminTab>((propTab !== undefined && tabMap[propTab]) ? tabMap[propTab] : 'overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (propTab !== undefined && tabMap[propTab]) {
      setActiveTab(tabMap[propTab]);
    }
  }, [propTab]);

  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSales: 0,
    activeAds: 0,
    pendingVerifications: 0,
    flaggedPosts: 0,
    userGrowth: '+12%',
    salesGrowth: '+8.4%'
  });

  // State for various lists
  const [verifications, setVerifications] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [flaggedPosts, setFlaggedPosts] = useState<any[]>([]);
  const [legacyRequests, setLegacyRequests] = useState<any[]>([]);
  const [platformSettings, setPlatformSettings] = useState<any>({
    vendor_fee_percentage: 0.10,
    driver_fee_percentage: 0.10,
    base_delivery_fee: 3.00,
    stripe_connected: false,
    is_refunds_enabled: true,
    refund_window_days: 30
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [editingFeeUser, setEditingFeeUser] = useState<any>(null);
  const [customFeesForm, setCustomFeesForm] = useState({ fee_percentage: '', base_fee: '' });

  // Search states
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchAllData();
    
    // Subscribe to platform activity
    const activityChannel = supabase
      .channel('platform-activity')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'platform_activity' }, (payload) => {
        setActivityLogs(prev => [payload.new, ...prev].slice(0, 20));
      })
      .subscribe();

    return () => { supabase.removeChannel(activityChannel); };
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const results = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('verifications').select('*, profiles(*)').eq('status', 'pending'),
        supabase.from('stores').select('*, profiles:owner_id(*)').order('created_at', { ascending: false }),
        supabase.from('posts').select('*, author:profiles!posts_profile_id_fkey(name, avatar_url)').in('moderation_status', ['flagged', 'hidden']),
        supabase.from('platform_activity').select('*, profiles(*)').order('created_at', { ascending: false }).limit(20),
        supabase.from('ads').select('id', { count: 'exact' }).eq('status', 'active'),
        supabase.from('platform_settings').select('*').eq('id', 1).single(),
        supabase.from('legacy_access_requests').select('*, requester:profiles!requester_id(*), target:profiles!user_id(*)').eq('status', 'pending')
      ]) as any[];

      const userCount = results[0].data;
      const verifData = results[1].data;
      const storeData = results[2].data;
      const flaggedData = results[3].data;
      const activityData = results[4].data;
      const adData = results[5].data;
      const settingsData = results[6].data;
      const legacyData = results[7].data;

      const totalSales = storeData?.reduce((acc: number, curr: any) => acc + (parseFloat(curr.total_sales) || 0), 0) || 0;

      setVerifications(verifData || []);
      setVendors(storeData || []);
      setFlaggedPosts(flaggedData || []);
      setActivityLogs(activityData || []);
      setLegacyRequests(legacyData || []);
      if (settingsData) setPlatformSettings(settingsData);
      
      fetchUsers();
      fetchAnnouncements();

      setStats(prev => ({
        ...prev,
        totalUsers: userCount?.length || 0,
        totalSales,
        pendingVerifications: verifData?.length || 0,
        flaggedPosts: flaggedData?.length || 0,
        activeAds: adData?.length || 0
      }));

    } catch (error) {
      console.error('Error fetching admin data:', error);
    }
    setIsLoading(false);
  };

  const fetchUsers = async () => {
    const { data } = await supabase.from('profiles').select('*').order('name');
    setUsers(data || []);
  };

  const handleSaveCustomFees = async () => {
    if (!editingFeeUser) return;
    
    const updates = {
      custom_fee_percentage: customFeesForm.fee_percentage ? parseFloat(customFeesForm.fee_percentage) / 100 : null,
      custom_base_fee: customFeesForm.base_fee ? parseFloat(customFeesForm.base_fee) : null
    };

    const { error } = await supabase.from('profiles').update(updates).eq('id', editingFeeUser.id);
    if (!error) {
      alert('Custom fees updated successfully');
      setEditingFeeUser(null);
      fetchUsers();
    } else {
      alert('Error updating custom fees');
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'frozen' ? 'active' : 'frozen';
    await supabase.from('profiles').update({ status: newStatus }).eq('id', userId);
    fetchUsers();
  };

  const fetchAnnouncements = async () => {
    const { data } = await supabase.from('platform_announcements').select('*').order('created_at', { ascending: false });
    setAnnouncements(data || []);
  };

  const addAnnouncement = async () => {
    const content = window.prompt('Enter announcement text:');
    if (content) {
      await supabase.from('platform_announcements').insert({ content, is_active: true });
      fetchAnnouncements();
    }
  };

  const toggleAnnouncement = async (id: number, currentActive: boolean) => {
    await supabase.from('platform_announcements').update({ is_active: !currentActive }).eq('id', id);
    fetchAnnouncements();
  };

  const handleAction = async (id: string, profileId: string, role: string, isApproval: boolean) => {
    const status = isApproval ? 'approved' : 'rejected';
    const { error } = await supabase.from('verifications').update({ status }).eq('id', id);

    if (!error && isApproval) {
      let vRole = role;
      if (role === 'resident') vRole = 'v_resident';
      else if (role === 'business') vRole = 'v_business';
      
      await supabase.from('profiles').update({ role: vRole }).eq('id', profileId);
      
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('platform_activity').insert({
        action_type: 'store_approved',
        description: `Approved verification for ${profileId} as ${role}`,
        user_id: user?.id
      });
    }
    fetchAllData();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const saveSettings = async () => {
    setIsSavingSettings(true);
    const { error } = await supabase.from('platform_settings').update({
      vendor_fee_percentage: platformSettings.vendor_fee_percentage,
      driver_fee_percentage: platformSettings.driver_fee_percentage,
      base_delivery_fee: platformSettings.base_delivery_fee,
      stripe_connected: platformSettings.stripe_connected,
      is_refunds_enabled: platformSettings.is_refunds_enabled,
      refund_window_days: platformSettings.refund_window_days
    }).eq('id', 1);
    
    setIsSavingSettings(false);
    if (error) alert('Error saving settings');
    else alert('Settings saved successfully!');
  };

  const handleModeration = async (postId: string, status: string) => {
    const { error } = await supabase.from('posts').update({ moderation_status: status }).eq('id', postId);
    if (!error) fetchAllData();
  };

  const issueStrike = async (userId: string, reason: string) => {
    if (!window.confirm(`Issue a strike to user ${userId} for ${reason}?`)) return;
    
    const { error } = await supabase.from('user_strikes').insert({
      user_id: userId,
      reason: reason,
      issued_by: (await supabase.auth.getUser()).data.user?.id
    });
    
    if (!error) {
      alert('Strike issued. Automated penalty logic triggered.');
      fetchAllData();
    } else {
      alert('Error issuing strike: ' + error.message);
    }
  };

  const handleLegacyRequest = async (requestId: string, approve: boolean) => {
    const status = approve ? 'approved' : 'rejected';
    const pin = approve ? Math.random().toString(36).substring(2, 8).toUpperCase() : null;
    
    const { error } = await supabase
      .from('legacy_access_requests')
      .update({ 
        status, 
        access_pin: pin,
        resolved_at: new Date().toISOString()
      })
      .eq('id', requestId);
    
    if (!error) {
      alert(approve ? `Request approved. PIN: ${pin}` : 'Request rejected.');
      fetchAllData();
    }
  };

  const renderOverview = () => (
    <div className="overview-tab">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon"><Users size={24} /></div>
          <div className="stat-value">{stats.totalUsers.toLocaleString()}</div>
          <div className="stat-label">Citizens</div>
          <div className="stat-change up"><TrendingUp size={14} /> {stats.userGrowth}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><DollarSign size={24} /></div>
          <div className="stat-value">${stats.totalSales.toLocaleString()}</div>
          <div className="stat-label">Marketplace Revenue</div>
          <div className="stat-change up"><TrendingUp size={14} /> {stats.salesGrowth}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><ArrowUpRight size={24} /></div>
          <div className="stat-value">{stats.activeAds}</div>
          <div className="stat-label">Active Promotions</div>
          <div className="stat-change">Live on feed</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><ShieldAlert size={24} /></div>
          <div className="stat-value">{stats.flaggedPosts}</div>
          <div className="stat-label">Pending Reviews</div>
          <div className="stat-change down" style={{ color: '#ef4444' }}>Alerts raised</div>
        </div>
      </div>

      <div className="dashboard-main">
        <div className="admin-card">
          <div className="card-header">
            <h3>System Activity</h3>
            <button className="icon-btn" onClick={() => setActiveTab('activity')}><RefreshCw size={18} /></button>
          </div>
          <div className="activity-list">
            {activityLogs.length === 0 ? (
              <p className="empty-state">No recent activity logged.</p>
            ) : activityLogs.map(log => (
              <div key={log.id} className="activity-item">
                <div className="activity-icon">
                  <LucideActivity size={16} />
                </div>
                <div className="activity-details">
                  <p>{log.description}</p>
                  <span>{new Date(log.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-card">
          <div className="card-header">
            <h3>Priority Tasks</h3>
            <span style={{ fontSize: '0.8rem', padding: '4px 10px', borderRadius: '10px', background: 'var(--admin-accent)', color: '#fff', fontWeight: 900 }}>{verifications.length}</span>
          </div>
          <div className="mini-verification-list">
            {verifications.slice(0, 5).map(req => (
              <div key={req.id} className="mini-req-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--admin-border)' }}>
                <div className="req-info" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="user-avatar">{req.profiles?.name?.[0] || '?'}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{req.profiles?.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{req.role_requested}</div>
                  </div>
                </div>
                <button onClick={() => handleAction(req.id, req.profile_id, req.role_requested, true)} className="icon-btn approve" style={{ width: 32, height: 32, color: '#10b981' }}><CheckCircle size={16} /></button>
              </div>
            ))}
            {verifications.length === 0 && <p style={{ textAlign: 'center', padding: '20px 0', color: '#64748b' }}>All caught up!</p>}
            {verifications.length > 5 && (
              <button className="view-all-btn" style={{ width: '100%', marginTop: 12, padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', cursor: 'pointer' }} onClick={() => setActiveTab('reviews')}>See all requests</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const NavItem = ({ tab, icon: Icon, label }: { tab: AdminTab, icon: any, label: string }) => (
    <button 
      className={`nav-item ${activeTab === tab ? 'active' : ''}`} 
      onClick={() => {
        setActiveTab(tab);
        setIsMobileMenuOpen(false);
      }}
    >
      <Icon size={20} /> <span>{label}</span>
    </button>
  );

  return (
    <div className="admin-dashboard-container">
      {/* Mobile Menu Toggle */}
      <button className="mobile-admin-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <aside className={`admin-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-icon">
            <ShieldCheck size={26} color="black" strokeWidth={2.5} />
          </div>
          <div className="brand-text">
            <h2>{theme.startsWith('io-') ? 'IO' : 'SETX'} 360</h2>
            <p>Admin Control</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavItem tab="overview" icon={Home} label="Overview" />
          <NavItem tab="directory" icon={Users} label="Citizen Directory" />
          <NavItem tab="vendors" icon={Store} label="Merchant Registry" />
          <NavItem tab="reviews" icon={Shield} label="Verifications" />
          <NavItem tab="moderation" icon={ShieldAlert} label="Content Moderation" />
          <NavItem tab="alerts" icon={Siren} label="Crisis Center" />
          <NavItem tab="intelligence" icon={Sparkles} label="AI Architect" />
          <NavItem tab="modules" icon={Grid} label="Asset Manager" />
          <NavItem tab="activity" icon={LucideActivity} label="System Events" />
          <NavItem tab="settings" icon={LucideSettings} label="Global Config" />
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item" onClick={handleSignOut} style={{ color: '#ef4444', width: '100%', justifyContent: 'center' }}>
            <LogOut size={20} /> <span>Terminate Session</span>
          </button>
        </div>
      </aside>

      <main className="admin-content">
        <header className="content-header">
          <div className="header-info">
            <h1>{activeTab.split(/(?=[A-Z])/).join(" ").charAt(0).toUpperCase() + activeTab.split(/(?=[A-Z])/).join(" ").slice(1)}</h1>
            <p>Command and control interface for platform infrastructure.</p>
          </div>
          <div className="header-actions">
            <button className="icon-btn"><Bell size={20} /></button>
            <button className="icon-btn" onClick={fetchAllData}><RefreshCw size={20} /></button>
          </div>
        </header>

        {isLoading ? (
          <div className="admin-loading-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
            <Loader2 className="animate-spin" size={48} color="var(--admin-accent)" />
            <p style={{ marginTop: 16, fontWeight: 700, color: '#94a3b8' }}>Syncing Terminal Systems...</p>
          </div>
        ) : (
          <div className="tab-content">
            {activeTab === 'moderation' && (
              <div className="admin-card">
                <div className="card-header">
                  <h3>Content Moderation</h3>
                  <button className="icon-btn" onClick={fetchAllData}><RefreshCw size={18} /></button>
                </div>
                <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: 24 }}>
                  Review content flagged by the community for NSFW, harassment, or misinformation.
                </p>

                <div className="flagged-list">
                  {flaggedPosts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                      <CheckCircle size={48} style={{ color: '#10b981', marginBottom: 16 }} />
                      <p>Clean Feed. No flagged content pending review.</p>
                    </div>
                  ) : (
                    <table className="premium-table">
                      <thead>
                        <tr>
                          <th>Author</th>
                          <th>Content</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {flaggedPosts.map(post => (
                          <tr key={post.id}>
                            <td>
                              <div style={{ fontWeight: 700 }}>{post.author?.name}</div>
                              <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{post.author?.email}</div>
                            </td>
                            <td>
                              <div style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {post.content}
                              </div>
                            </td>
                            <td><span className={`role-badge ${post.moderation_status}`}>{post.moderation_status}</span></td>
                            <td>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button className="icon-btn" onClick={() => handleModeration(post.id, 'hidden')} title="Hide Content"><LucideLock size={14} /></button>
                                <button className="icon-btn" onClick={() => issueStrike(post.profile_id, 'NSFW Violation')} style={{ color: '#ef4444' }} title="Issue Strike"><ShieldAlert size={14} /></button>
                                <button className="icon-btn" onClick={() => handleModeration(post.id, 'active')} style={{ color: '#10b981' }} title="Keep Content"><CheckCircle size={14} /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'vendors' && (
              <div className="admin-card">
                <div className="card-header">
                  <h3>Merchant Registry</h3>
                  <button className="icon-btn" onClick={fetchAllData}><RefreshCw size={18} /></button>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table className="premium-table">
                    <thead>
                      <tr>
                        <th>Business</th>
                        <th>Owner</th>
                        <th>Trust Score</th>
                        <th>Performance</th>
                        <th>Status</th>
                        <th>Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendors.map(vendor => (
                        <tr key={vendor.id}>
                          <td>
                            <div style={{ fontWeight: 700 }}>{vendor.name}</div>
                            <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{vendor.business_type || 'Retail'}</div>
                          </td>
                          <td>{vendor.profiles?.name || 'Unknown'}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ height: 8, flex: 1, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${vendor.trust_score || 85}%`, background: (vendor.trust_score || 85) > 80 ? '#10b981' : '#f59e0b' }} />
                              </div>
                              <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{vendor.trust_score || 85}%</span>
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.8rem' }}>📦 {vendor.fulfillment_rate || 100}% Fill</div>
                            <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>⏱️ {vendor.response_time_hours || 24}h Resp</div>
                          </td>
                          <td><span className={`role-badge ${vendor.status}`}>{vendor.status}</span></td>
                          <td>{new Date(vendor.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {activeTab === 'directory' && (
              <div className="admin-card">
                <div className="card-header">
                  <h3>Citizen Directory</h3>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <input 
                      type="text" 
                      placeholder="Search citizens..." 
                      style={{ padding: '8px 16px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--admin-border)', color: '#fff' }}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button className="icon-btn" onClick={() => fetchUsers()}><RefreshCw size={18} /></button>
                  </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table className="premium-table">
                    <thead>
                      <tr>
                        <th>Citizen</th>
                        <th>Role</th>
                        <th>Region</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.filter(u => u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || u.email?.toLowerCase().includes(searchQuery.toLowerCase())).map(user => (
                        <tr key={user.id}>
                          <td>
                            <div className="user-info">
                              <div className="user-avatar">{user.name?.[0] || '?'}</div>
                              <div>
                                <div style={{ fontWeight: 700 }}>{user.name}</div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td><span className={`role-badge ${user.role}`}>{user.role}</span></td>
                          <td>{user.city || 'Unknown'}</td>
                          <td>
                            <span style={{ 
                              padding: '4px 8px', borderRadius: 8, fontSize: '0.7rem', fontWeight: 900,
                              background: user.status === 'frozen' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                              color: user.status === 'frozen' ? '#ef4444' : '#10b981'
                            }}>
                              {(user.status || 'active').toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button 
                                className="icon-btn" 
                                style={{ width: 32, height: 32 }}
                                onClick={() => {
                                  setEditingFeeUser(user);
                                  setCustomFeesForm({
                                    fee_percentage: user.custom_fee_percentage !== null ? (user.custom_fee_percentage * 100).toString() : '',
                                    base_fee: user.custom_base_fee !== null ? user.custom_base_fee.toString() : ''
                                  });
                                }}
                              >
                                <DollarSign size={14} />
                              </button>
                              <button onClick={() => toggleUserStatus(user.id, user.status)} className="icon-btn" style={{ width: 32, height: 32 }}>
                                {user.status === 'frozen' ? <LucideUnlock size={14} /> : <LucideLock size={14} />}
                              </button>
                              <button className="icon-btn" style={{ width: 32, height: 32, color: '#ef4444' }}><Trash2 size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Custom Fee Modal */}
                {editingFeeUser && (
                  <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 20 }}>
                    <div className="stat-card" style={{ maxWidth: 450, width: '100%', border: '1px solid var(--admin-accent)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <h3 style={{ margin: 0 }}>Fee Override: {editingFeeUser.name}</h3>
                        <button className="icon-btn" onClick={() => setEditingFeeUser(null)} style={{ width: 32, height: 32 }}><X size={16} /></button>
                      </div>
                      
                      <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: 24 }}>Leave fields empty to revert to global platform rates.</p>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <div className="input-group">
                          <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: 8, fontWeight: 700 }}>Custom Fee Percentage (%)</label>
                          <input 
                            type="number" step="0.1" placeholder="e.g. 5.5"
                            style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--admin-border)', color: '#fff' }}
                            value={customFeesForm.fee_percentage}
                            onChange={(e) => setCustomFeesForm({...customFeesForm, fee_percentage: e.target.value})}
                          />
                        </div>
                        
                        <div className="input-group">
                          <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: 8, fontWeight: 700 }}>Custom Base Fee ($)</label>
                          <input 
                            type="number" step="0.50" placeholder="e.g. 1.00"
                            style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--admin-border)', color: '#fff' }}
                            value={customFeesForm.base_fee}
                            onChange={(e) => setCustomFeesForm({...customFeesForm, base_fee: e.target.value})}
                          />
                        </div>

                        <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                          <button 
                            className="icon-btn" 
                            style={{ flex: 1, background: 'var(--admin-accent)', color: '#fff', fontWeight: 900, height: 48, width: 'auto' }}
                            onClick={handleSaveCustomFees}
                          >
                            Save Override
                          </button>
                          <button 
                            className="icon-btn" 
                            style={{ flex: 1, height: 48, width: 'auto' }}
                            onClick={() => setEditingFeeUser(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'modules' && (
              <div className="admin-card">
                <div className="card-header">
                  <h3>Content Manager</h3>
                  <button className="icon-btn" onClick={addAnnouncement} style={{ width: 'auto', padding: '0 16px', gap: 8 }}>+ Announcement</button>
                </div>
                <div className="announcement-list" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {announcements.map(ann => (
                    <div key={ann.id} className="stat-card" style={{ padding: 20 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: 700 }}>{ann.content}</div>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                          <span className={`role-badge ${ann.type}`}>{ann.type}</span>
                          <button className="icon-btn" onClick={() => toggleAnnouncement(ann.id, ann.is_active)} style={{ color: ann.is_active ? '#10b981' : '#64748b' }}>
                            {ann.is_active ? <CheckCircle size={18} /> : <X size={18} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {announcements.length === 0 && <p style={{ textAlign: 'center', color: '#64748b' }}>No active announcements.</p>}
                </div>
              </div>
            )}
            {activeTab === 'intelligence' && (
              <div className="intelligence-tab">
                <AIAssistant />
                <div style={{ marginTop: 40 }}>
                  <AdminDataImport />
                </div>
              </div>
            )}
            {activeTab === 'settings' && (
              <div className="admin-card">
                <div className="card-header">
                  <h3>Global Parameters</h3>
                  <button 
                    className="icon-btn" 
                    onClick={saveSettings}
                    disabled={isSavingSettings}
                    style={{ width: 'auto', padding: '0 20px', gap: 8, background: 'var(--admin-accent)', color: '#fff' }}
                  >
                    {isSavingSettings ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Apply Changes
                  </button>
                </div>
                
                <div className="settings-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginTop: 24 }}>
                  <div className="stat-card">
                    <h4 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}><DollarSign size={20} color="var(--admin-accent)" /> Marketplace Splits</h4>
                    <div className="input-group" style={{ marginBottom: 20 }}>
                      <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 8 }}>
                        <span>Vendor Fee</span>
                        <span style={{ fontWeight: 900 }}>{(platformSettings.vendor_fee_percentage * 100).toFixed(1)}%</span>
                      </label>
                      <input 
                        type="range" min="0" max="0.30" step="0.005"
                        value={platformSettings.vendor_fee_percentage}
                        onChange={(e) => setPlatformSettings({...platformSettings, vendor_fee_percentage: parseFloat(e.target.value)})}
                        style={{ width: '100%', accentColor: 'var(--admin-accent)' }}
                      />
                    </div>
                    <div className="input-group">
                      <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 8 }}>
                        <span>Driver Fee</span>
                        <span style={{ fontWeight: 900 }}>{(platformSettings.driver_fee_percentage * 100).toFixed(1)}%</span>
                      </label>
                      <input 
                        type="range" min="0" max="0.30" step="0.005"
                        value={platformSettings.driver_fee_percentage}
                        onChange={(e) => setPlatformSettings({...platformSettings, driver_fee_percentage: parseFloat(e.target.value)})}
                        style={{ width: '100%', accentColor: 'var(--admin-accent)' }}
                      />
                    </div>
                  </div>

                  <div className="stat-card">
                    <h4 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}><RefreshCw size={20} color="#ef4444" /> Platform Policies</h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <span style={{ fontSize: '0.85rem' }}>Enable Refunds</span>
                      <button 
                        className="icon-btn" 
                        style={{ width: 32, height: 32, background: platformSettings.is_refunds_enabled ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: platformSettings.is_refunds_enabled ? '#10b981' : '#ef4444' }}
                        onClick={() => setPlatformSettings({...platformSettings, is_refunds_enabled: !platformSettings.is_refunds_enabled})}
                      >
                        {platformSettings.is_refunds_enabled ? <CheckCircle size={16} /> : <X size={16} />}
                      </button>
                    </div>
                    <div className="input-group">
                      <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: 8 }}>Refund Window (Days)</label>
                      <input 
                        type="number" 
                        style={{ width: '100%', padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--admin-border)', color: '#fff' }}
                        value={platformSettings.refund_window_days}
                        onChange={(e) => setPlatformSettings({...platformSettings, refund_window_days: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'alerts' && (
              <div className="admin-card">
                <div className="card-header">
                  <h3>Crisis Center: Legacy Access Requests</h3>
                  <button className="icon-btn" onClick={fetchAllData}><RefreshCw size={18} /></button>
                </div>
                <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: 24 }}>
                  Review requests from designated Guardians to access accounts of deceased or incapacitated citizens.
                  <strong> Approval generates a temporary PIN for the requester.</strong>
                </p>

                <div className="legacy-requests-list">
                  {legacyRequests.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(255,255,255,0.02)', borderRadius: 16 }}>
                      <ShieldCheck size={48} style={{ color: '#10b981', marginBottom: 16 }} />
                      <p>No pending access requests. System stable.</p>
                    </div>
                  ) : (
                    <table className="premium-table">
                      <thead>
                        <tr>
                          <th>Target Account</th>
                          <th>Requester (Guardian)</th>
                          <th>Requested At</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {legacyRequests.map(req => (
                          <tr key={req.id}>
                            <td>
                              <div style={{ fontWeight: 700 }}>{req.target?.name}</div>
                              <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{req.target?.email}</div>
                            </td>
                            <td>
                              <div style={{ fontWeight: 700 }}>{req.requester?.name}</div>
                              <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{req.requester?.email}</div>
                            </td>
                            <td>{new Date(req.created_at).toLocaleDateString()}</td>
                            <td>
                              <div style={{ display: 'flex', gap: 12 }}>
                                <button 
                                  className="icon-btn" 
                                  style={{ background: 'var(--admin-accent)', color: '#fff', width: 'auto', padding: '0 12px' }}
                                  onClick={() => handleLegacyRequest(req.id, true)}
                                >
                                  Approve & Generate PIN
                                </button>
                                <button 
                                  className="icon-btn" 
                                  style={{ color: '#ef4444' }}
                                  onClick={() => handleLegacyRequest(req.id, false)}
                                >
                                  Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
