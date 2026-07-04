import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Users, DollarSign, ArrowUpRight, ShieldAlert, TrendingUp, Activity as LucideActivity, RefreshCw
} from 'lucide-react';

export const AdminOverviewTab: React.FC = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSales: 0,
    activeAds: 0,
    flaggedPosts: 0,
    userGrowth: '+12%',
    salesGrowth: '+8.4%'
  });
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
    
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
        supabase.from('stores').select('total_sales'),
        supabase.from('posts').select('id', { count: 'exact' }).in('moderation_status', ['flagged', 'hidden']),
        supabase.from('ads').select('id', { count: 'exact' }).eq('status', 'active'),
        supabase.from('platform_activity').select('*, profiles(*)').order('created_at', { ascending: false }).limit(20)
      ]);

      const userCount = results[0].count || 0;
      const storeData = results[1].data || [];
      const flaggedCount = results[2].count || 0;
      const adCount = results[3].count || 0;
      const activityData = results[4].data || [];

      const totalSales = storeData.reduce((acc: number, curr: any) => acc + (parseFloat(curr.total_sales) || 0), 0);

      setActivityLogs(activityData);
      setStats({
        totalUsers: userCount,
        totalSales,
        activeAds: adCount,
        flaggedPosts: flaggedCount,
        userGrowth: '+12%',
        salesGrowth: '+8.4%'
      });
    } catch (error) {
      console.error('Error fetching overview stats:', error);
    }
    setIsLoading(false);
  };

  return (
    <div className="admin-tab-container">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ color: 'var(--primary)' }}><Users size={24} /></div>
          <div className="stat-value">{stats.totalUsers.toLocaleString()}</div>
          <div className="stat-label">Total Citizens</div>
          <div className="stat-change up"><TrendingUp size={14} /> {stats.userGrowth}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#10b981' }}><DollarSign size={24} /></div>
          <div className="stat-value">${stats.totalSales.toLocaleString()}</div>
          <div className="stat-label">Market Revenue</div>
          <div className="stat-change up"><TrendingUp size={14} /> {stats.salesGrowth}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#f59e0b' }}><ArrowUpRight size={24} /></div>
          <div className="stat-value">{stats.activeAds}</div>
          <div className="stat-label">Active Promotions</div>
          <div className="stat-change">Live on feed</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#ef4444' }}><ShieldAlert size={24} /></div>
          <div className="stat-value">{stats.flaggedPosts}</div>
          <div className="stat-label">Flagged Posts</div>
          <div className="stat-change down" style={{ color: '#ef4444' }}>Pending Review</div>
        </div>
      </div>

      <div className="admin-card mt-6">
        <div className="card-header flex justify-between items-center mb-4">
          <h3 className="m-0">System Activity Stream</h3>
          <button onClick={fetchAllData} className="icon-btn"><RefreshCw size={18} /></button>
        </div>
        <div className="activity-list">
          {activityLogs.length === 0 ? (
            <p className="empty-state">No recent activity logged.</p>
          ) : activityLogs.map(log => (
            <div key={log.id} className="activity-item">
              <div className="activity-icon"><LucideActivity size={16} /></div>
              <div className="activity-details">
                <p>{log.description}</p>
                <span>{new Date(log.created_at).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
