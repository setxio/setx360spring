import type { User } from '../types/user';
import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  Loader2,
  Users,
  DollarSign,
  ShieldAlert,
  Activity as LucideActivity,
  RefreshCw,
  ArrowUpRight,
  TrendingUp,
  X
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import './AdminDashboard.css'; // Reuse existing styles for now

export const Overview: React.FC<{ user: User }> = ({ user }) => {
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

  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [classifiedReports, setClassifiedReports] = useState<any[]>([]);
  const [disputedUsers, setDisputedUsers] = useState<any[]>([]);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeProfileId, setDisputeProfileId] = useState('');
  const [disputeReason, setDisputeReason] = useState('');

  const [bugReports, setBugReports] = useState<any[]>([]);
  const [adminBroadcasts, setAdminBroadcasts] = useState<any[]>([]);
  const [newBroadcastMsg, setNewBroadcastMsg] = useState('');
  const [newBroadcastType, setNewBroadcastType] = useState('info');

  useEffect(() => {
    fetchAllData();
    
    // Subscribe to platform activity
    const activityChannel = supabase
      .channel('platform-activity-overview')
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
        supabase.from('stores').select('*, profiles:owner_id(*)'),
        supabase.from('posts').select('*, author:profiles!posts_profile_id_fkey(name, avatar_url)').in('moderation_status', ['flagged', 'hidden']),
        supabase.from('platform_activity').select('*, profiles(*)').order('created_at', { ascending: false }).limit(20),
        supabase.from('ads').select('id', { count: 'exact' }).eq('status', 'active'),
        supabase.from('classified_reports').select('*, reporter:profiles!classified_reports_reporter_id_fkey(name), item:classified_items(*)').eq('status', 'pending'),
        supabase.from('profiles').select('*').eq('identity_disputed', true),
        supabase.from('bug_reports').select('*, profile:profiles(name, avatar_url)').order('created_at', { ascending: false }).limit(20),
        supabase.from('admin_broadcasts').select('*').order('created_at', { ascending: false }).limit(10)
      ]) as any[];

      const userCount = results[0].data;
      const verifData = results[1].data;
      const storeData = results[2].data;
      const flaggedData = results[3].data;
      const activityData = results[4].data;
      const adData = results[5].data;

      const totalSales = storeData?.reduce((acc: number, curr: any) => acc + (parseFloat(curr.total_sales) || 0), 0) || 0;

      setVerifications(verifData || []);
      setActivityLogs(activityData || []);
      setClassifiedReports(results[6].data || []);
      setDisputedUsers(results[7].data || []);
      setBugReports(results[8].data || []);
      setAdminBroadcasts(results[9].data || []);

      setStats(prev => ({
        ...prev,
        totalUsers: userCount?.length || 0,
        totalSales,
        pendingVerifications: verifData?.length || 0,
        flaggedPosts: flaggedData?.length || 0,
        activeAds: adData?.length || 0
      }));

    } catch (error) {
      console.error('Error fetching overview data:', error);
    }
    setIsLoading(false);
  };

  const handleAction = async (id: string, profileId: string, role: string, isApproval: boolean) => {
    const status = isApproval ? 'approved' : 'rejected';

    const verification = verifications.find(v => v.id === id);
    if (verification?.document_url) {
      await supabase.storage.from('identity_documents').remove([verification.document_url]);
    }

    const { error } = await supabase.from('verifications').update({ status }).eq('id', id);

    if (!error && isApproval) {
      let vRole = role;
      if (role === 'resident') vRole = 'v_resident';
      else if (role === 'business') vRole = 'v_business';
      
      await supabase.from('profiles').update({ role: vRole }).eq('id', profileId);
      
      await supabase.from('platform_activity').insert({
        action_type: 'store_approved',
        description: `Approved verification for ${profileId} as ${role}`,
        user_id: user?.id
      });
    }
    fetchAllData();
  };

  const handleReportAction = async (reportId: string, action: 'dismiss' | 'delete_item', itemId?: string) => {
    if (action === 'dismiss') {
      await supabase.from('classified_reports').update({ status: 'dismissed' }).eq('id', reportId);
    } else if (action === 'delete_item' && itemId) {
      await supabase.from('classified_reports').update({ status: 'reviewed' }).eq('id', reportId);
      await supabase.from('classified_items').update({ deleted_at: new Date().toISOString(), status: 'deleted' }).eq('id', itemId);
    }
    fetchAllData();
  };

  const handleFlagIdentity = async () => {
    if (!disputeProfileId) return;
    await supabase.from('profiles').update({
      identity_disputed: true,
      dispute_reason: disputeReason || 'Flagged for falsified identity by Admin',
      read_only: true,
      is_verified: false,
      role: 'visitor',
      dispute_date: new Date().toISOString()
    }).eq('id', disputeProfileId);
    
    setShowDisputeModal(false);
    setDisputeProfileId('');
    setDisputeReason('');
    fetchAllData();
  };

  const handleBroadcastAdd = async () => {
    if (!newBroadcastMsg.trim()) return;
    await supabase.from('admin_broadcasts').insert({
      message: newBroadcastMsg,
      type: newBroadcastType,
      active: true
    });
    setNewBroadcastMsg('');
    fetchAllData();
  };

  const handleBroadcastDelete = async (id: string) => {
    await supabase.from('admin_broadcasts').delete().eq('id', id);
    fetchAllData();
  };

  const handleBugStatus = async (id: string, status: string) => {
    await supabase.from('bug_reports').update({ status }).eq('id', id);
    fetchAllData();
  };

  if (isLoading) {
    return (
      <div className="admin-loading-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Loader2 className="animate-spin" size={48} color="var(--admin-accent)" />
        <p style={{ marginTop: 16, fontWeight: 700, color: '#94a3b8' }}>Syncing Terminal Systems...</p>
      </div>
    );
  }

  return (
    <div className="overview-tab" style={{ padding: '20px' }}>
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div className="stat-card" style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="stat-icon" style={{ marginBottom: '12px', color: 'var(--primary)' }}><Users size={24} /></div>
          <div className="stat-value" style={{ fontSize: '1.5rem', fontWeight: 900 }}>{stats.totalUsers.toLocaleString()}</div>
          <div className="stat-label" style={{ fontSize: '0.8rem', opacity: 0.6 }}>Citizens</div>
          <div className="stat-change up" style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '8px' }}><TrendingUp size={14} /> {stats.userGrowth}</div>
        </div>
        <div className="stat-card" style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="stat-icon" style={{ marginBottom: '12px', color: '#10b981' }}><DollarSign size={24} /></div>
          <div className="stat-value" style={{ fontSize: '1.5rem', fontWeight: 900 }}>${stats.totalSales.toLocaleString()}</div>
          <div className="stat-label" style={{ fontSize: '0.8rem', opacity: 0.6 }}>Marketplace Revenue</div>
          <div className="stat-change up" style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '8px' }}><TrendingUp size={14} /> {stats.salesGrowth}</div>
        </div>
        <div className="stat-card" style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="stat-icon" style={{ marginBottom: '12px', color: '#f59e0b' }}><ArrowUpRight size={24} /></div>
          <div className="stat-value" style={{ fontSize: '1.5rem', fontWeight: 900 }}>{stats.activeAds}</div>
          <div className="stat-label" style={{ fontSize: '0.8rem', opacity: 0.6 }}>Active Promotions</div>
          <div className="stat-change" style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '8px' }}>Live on feed</div>
        </div>
        <div className="stat-card" style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="stat-icon" style={{ marginBottom: '12px', color: '#ef4444' }}><ShieldAlert size={24} /></div>
          <div className="stat-value" style={{ fontSize: '1.5rem', fontWeight: 900 }}>{stats.flaggedPosts}</div>
          <div className="stat-label" style={{ fontSize: '0.8rem', opacity: 0.6 }}>Pending Reviews</div>
          <div className="stat-change down" style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '8px' }}>Alerts raised</div>
        </div>
      </div>

      <div className="dashboard-main" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
        <div className="admin-card" style={{ background: 'rgba(255,255,255,0.03)', padding: '24px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0 }}>System Activity</h3>
            <button className="icon-btn" onClick={fetchAllData} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><RefreshCw size={18} /></button>
          </div>
          <div className="activity-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {activityLogs.length === 0 ? (
              <p className="empty-state" style={{ opacity: 0.5, textAlign: 'center', padding: '20px' }}>No recent activity logged.</p>
            ) : activityLogs.map(log => (
              <div key={log.id} className="activity-item" style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div className="activity-icon" style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                  <LucideActivity size={16} />
                </div>
                <div className="activity-details">
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>{log.description}</p>
                  <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>{new Date(log.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-card" style={{ background: 'rgba(255,255,255,0.03)', padding: '24px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0 }}>Priority Tasks</h3>
            <span style={{ fontSize: '0.8rem', padding: '4px 10px', borderRadius: '10px', background: 'var(--primary)', color: '#fff', fontWeight: 900 }}>{verifications.length}</span>
          </div>
          <div className="mini-verification-list">
            {verifications.slice(0, 5).map(req => (
              <div key={req.id} className="mini-req-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="req-info" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="user-avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 900 }}>{req.profiles?.name?.[0] || '?'}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{req.profiles?.name}</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>{req.requested_role}</div>
                    {req.physical_address && <div style={{ fontSize: '0.7rem', color: '#f59e0b' }}>{req.physical_address}</div>}
                    {req.document_url && (
                      <button 
                        onClick={async () => {
                          const { data } = await supabase.storage.from('identity_documents').createSignedUrl(req.document_url, 60);
                          if (data?.signedUrl) window.open(data.signedUrl, '_blank');
                        }}
                        style={{ fontSize: '0.7rem', background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                      >
                        View ID Document
                      </button>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button onClick={() => handleAction(req.id, req.profile_id, req.requested_role, false)} className="icon-btn reject" style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><X size={16} /></button>
                  <button onClick={() => handleAction(req.id, req.profile_id, req.requested_role, true)} className="icon-btn approve" style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}><CheckCircle size={16} /></button>
                </div>
              </div>
            ))}
            {verifications.length === 0 && <p style={{ textAlign: 'center', padding: '20px 0', opacity: 0.5 }}>All caught up!</p>}
          </div>
        </div>

        <div className="admin-card" style={{ background: 'rgba(255,255,255,0.03)', padding: '24px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0 }}>Classified Reports</h3>
            <span style={{ fontSize: '0.8rem', padding: '4px 10px', borderRadius: '10px', background: '#ef4444', color: '#fff', fontWeight: 900 }}>{classifiedReports.length}</span>
          </div>
          <div className="mini-verification-list">
            {classifiedReports.slice(0, 5).map(report => (
              <div key={report.id} className="mini-req-item" style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Reported: {report.item?.title || 'Unknown Item'}</div>
                <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Reason: {report.reason}</div>
                <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>By: {report.reporter?.name || 'Anonymous'}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <button onClick={() => handleReportAction(report.id, 'dismiss')} style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 6, color: '#fff', fontSize: '0.8rem', cursor: 'pointer' }}>Dismiss</button>
                  <button onClick={() => handleReportAction(report.id, 'delete_item', report.item_id)} style={{ padding: '6px 12px', background: 'rgba(239,68,68,0.2)', border: 'none', borderRadius: 6, color: '#ef4444', fontSize: '0.8rem', cursor: 'pointer' }}>Delete Item</button>
                </div>
              </div>
            ))}
            {classifiedReports.length === 0 && <p style={{ textAlign: 'center', padding: '20px 0', opacity: 0.5 }}>No pending reports.</p>}
          </div>
        </div>

        <div className="admin-card" style={{ background: 'rgba(255,255,255,0.03)', padding: '24px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', gridColumn: '1 / -1' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0 }}>Identity Disputes</h3>
            <button onClick={() => setShowDisputeModal(true)} style={{ padding: '6px 12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>
              + Flag User Identity
            </button>
          </div>
          <div className="mini-verification-list">
            {disputedUsers.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '20px 0', opacity: 0.5 }}>No active identity disputes.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>
                    <th style={{ textAlign: 'left', padding: '12px' }}>User</th>
                    <th style={{ textAlign: 'left', padding: '12px' }}>Dispute Date</th>
                    <th style={{ textAlign: 'left', padding: '12px' }}>Reason</th>
                    <th style={{ textAlign: 'left', padding: '12px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {disputedUsers.map(u => {
                    const disputeDate = new Date(u.dispute_date);
                    const daysPassed = Math.floor((new Date().getTime() - disputeDate.getTime()) / (1000 * 3600 * 24));
                    const isSuspended = daysPassed >= 30;
                    return (
                      <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 900 }}>{u.name?.[0] || '?'}</div>
                          <span style={{ fontWeight: 600 }}>{u.name}</span>
                          <span style={{ opacity: 0.5, fontSize: '0.8rem' }}>({u.id.slice(0,8)}...)</span>
                        </td>
                        <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{disputeDate.toLocaleDateString()}</td>
                        <td style={{ padding: '12px', color: '#f59e0b' }}>{u.dispute_reason}</td>
                        <td style={{ padding: '12px' }}>
                          {isSuspended ? (
                            <span style={{ padding: '4px 8px', background: 'rgba(239,68,68,0.2)', color: '#ef4444', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 700 }}>Suspended (&gt;30d)</span>
                          ) : (
                            <span style={{ padding: '4px 8px', background: 'rgba(245,158,11,0.2)', color: '#f59e0b', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 700 }}>Read-Only ({30 - daysPassed}d left)</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Bug Reports */}
        <div className="admin-card" style={{ background: 'rgba(255,255,255,0.03)', padding: '24px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', gridColumn: '1 / -1' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0 }}>Bug Reports</h3>
          </div>
          <div className="mini-verification-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {bugReports.length === 0 ? (
              <p style={{ opacity: 0.5 }}>No bugs reported.</p>
            ) : bugReports.map(bug => (
              <div key={bug.id} style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', padding: '4px 8px', background: 'rgba(239,68,68,0.2)', color: '#ef4444', borderRadius: '6px', fontWeight: 800 }}>{bug.platform}</span>
                    <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>{new Date(bug.created_at).toLocaleDateString()}</span>
                  </div>
                  {bug.status === 'open' ? (
                    <button onClick={() => handleBugStatus(bug.id, 'resolved')} style={{ padding: '4px 8px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem' }}>Mark Resolved</button>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 800 }}>Resolved</span>
                  )}
                </div>
                <p style={{ fontSize: '0.9rem', margin: '0 0 12px', color: 'var(--text)' }}>{bug.description}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Reported by {bug.profile?.name || 'Anonymous'}</div>
                  {bug.screenshot_url && (
                    <button 
                      onClick={async () => {
                        const { data } = await supabase.storage.from('bug_screenshots').createSignedUrl(bug.screenshot_url, 60);
                        if (data?.signedUrl) window.open(data.signedUrl, '_blank');
                      }}
                      style={{ fontSize: '0.75rem', background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                    >
                      View Screenshot
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Admin Broadcasts */}
        <div className="admin-card" style={{ background: 'rgba(255,255,255,0.03)', padding: '24px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', gridColumn: '1 / -1' }}>
          <div className="card-header" style={{ marginBottom: '20px' }}>
            <h3 style={{ margin: 0 }}>System Broadcasts</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>These appear as ghost widgets on the minimalist homepage.</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
            <select value={newBroadcastType} onChange={e => setNewBroadcastType(e.target.value)} style={{ padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', color: 'var(--text)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <option value="info">Info Notice</option>
              <option value="alert">System Alert</option>
            </select>
            <input 
              type="text" 
              value={newBroadcastMsg} 
              onChange={e => setNewBroadcastMsg(e.target.value)} 
              placeholder="Enter broadcast message..." 
              style={{ flex: 1, padding: '10px 16px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', color: 'var(--text)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
            <button onClick={handleBroadcastAdd} className="primary-btn" style={{ padding: '10px 24px', whiteSpace: 'nowrap' }}>Push Broadcast</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {adminBroadcasts.map(b => (
              <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, background: b.type === 'alert' ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)', color: b.type === 'alert' ? '#ef4444' : '#60a5fa' }}>
                    {b.type.toUpperCase()}
                  </span>
                  <span style={{ fontSize: '0.95rem' }}>{b.message}</span>
                </div>
                <button onClick={() => handleBroadcastDelete(b.id)} style={{ padding: '6px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer' }}><X size={16} /></button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showDisputeModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', width: '90%', maxWidth: '400px', border: '1px solid var(--border)' }}>
            <h3 style={{ margin: '0 0 16px', color: '#ef4444' }}>Flag Identity</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              This will strip the user's verified checkmark and place them in Read-Only mode until they successfully verify their identity with an ID. After 30 days, they will be suspended.
            </p>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px' }}>User ID</label>
              <input type="text" value={disputeProfileId} onChange={e => setDisputeProfileId(e.target.value)} style={{ width: '100%', padding: '8px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '6px' }} placeholder="Enter exact profile UUID" />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px' }}>Reason for Dispute</label>
              <input type="text" value={disputeReason} onChange={e => setDisputeReason(e.target.value)} style={{ width: '100%', padding: '8px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '6px' }} placeholder="e.g. Falsified photo, suspicious activity" />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowDisputeModal(false)} style={{ padding: '8px 16px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleFlagIdentity} style={{ padding: '8px 16px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 700 }}>Confirm Flag</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
