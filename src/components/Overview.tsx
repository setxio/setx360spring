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
  TrendingUp
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import './AdminDashboard.css'; // Reuse existing styles for now

export const Overview: React.FC<{ user: any }> = ({ user }) => {
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

  const [verifications, setVerifications] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);

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
                    <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>{req.role_requested}</div>
                  </div>
                </div>
                <button onClick={() => handleAction(req.id, req.profile_id, req.role_requested, true)} className="icon-btn approve" style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}><CheckCircle size={16} /></button>
              </div>
            ))}
            {verifications.length === 0 && <p style={{ textAlign: 'center', padding: '20px 0', opacity: 0.5 }}>All caught up!</p>}
          </div>
        </div>
      </div>
    </div>
  );
};
