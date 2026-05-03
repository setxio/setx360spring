import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Heart, 
  MessageSquare, 
  UserPlus, 
  ShoppingBag, 
  CheckCircle2,
  Package,
  ArrowRight,
  Loader2,
  Trash2,
  Briefcase,
  ShieldAlert,
  TrendingUp,
  Users,
  RefreshCw,
  Zap,
  AtSign
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import './NotificationsView.css';

interface Notification {
  id: string;
  type: string;
  content: string;
  sender_id: string;
  is_read: boolean;
  created_at: string;
  reference_id?: string;
  sender?: {
    name: string;
    avatar_url: string;
  } | null;
}

export const NotificationsView: React.FC<{ user: any }> = ({ user }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'mentions' | 'social'>('all');

  useEffect(() => {
    if (user) {
      fetchNotifications();
      
      // Subscribe to real-time notifications
      const channel = supabase
        .channel(`notifications-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `recipient_id=eq.${user.id}`
          },
          (payload) => {
            handleNewNotification(payload.new as Notification);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchNotifications = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        sender:profiles!sender_id (
          name,
          avatar_url
        )
      `)
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setNotifications(data);
    }
    setIsLoading(false);
  };

  const handleNewNotification = async (notif: Notification) => {
    // Fetch sender info for the new notification
    const { data: sender } = await supabase
      .from('profiles')
      .select('name, avatar_url')
      .eq('id', notif.sender_id)
      .single();

    const fullNotif = { ...notif, sender };
    setNotifications(prev => [fullNotif, ...prev]);
  };

  const markAllAsRead = async () => {
    const { error } = await supabase.rpc('mark_all_notifications_as_read', { user_id_val: user.id });
    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    }
  };

  const deleteNotification = async (id: string) => {
    const { error } = await supabase.from('notifications').delete().eq('id', id);
    if (!error) {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart size={18} color="#ef4444" fill="#ef4444" />;
      case 'comment': return <MessageSquare size={18} color="#3b82f6" />;
      case 'mention': return <AtSign size={18} color="#a855f7" />;
      case 'follow': return <UserPlus size={18} color="#10b981" />;
      case 'order_placed': return <ShoppingBag size={18} color="#f59e0b" />;
      case 'order_shipped': return <Package size={18} color="#8b5cf6" />;
      case 'payout_approved': return <CheckCircle2 size={18} color="#10b981" />;
      case 'vendor_lead': return <Briefcase size={18} color="#f59e0b" />;
      case 'moderation_flag': return <ShieldAlert size={18} color="#ef4444" />;
      case 'vendor_upsell': return <TrendingUp size={18} color="#f59e0b" />;
      case 'follow_suggestion': return <Users size={18} color="#10b981" />;
      case 'reengage': return <RefreshCw size={18} color="#3b82f6" />;
      case 'group_suggestion': return <Users size={18} color="#8b5cf6" />;
      case 'anomaly_spike': return <Zap size={18} color="#ef4444" />;
      default: return <Bell size={18} color="var(--primary)" />;
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    return `${Math.floor(diffInSeconds / 86400)}d`;
  };

  if (isLoading) {
    return (
      <div className="notifications-loading">
        <Loader2 className="animate-spin" size={40} color="var(--primary)" />
      </div>
    );
  }

  return (
    <div className="notifications-container">
      <div className="notifications-header">
        <h1>Alerts</h1>
        <div className="header-actions">
          <button className="mark-read-btn" onClick={markAllAsRead}>
            Mark all as read
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '8px', padding: '0 0 16px', borderBottom: '1px solid var(--border)', marginBottom: '12px' }}>
        {(['all', 'mentions', 'social'] as const).map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            style={{
              padding: '6px 16px', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 600,
              border: activeFilter === f ? 'none' : '1px solid var(--border)',
              background: activeFilter === f ? 'var(--primary)' : 'transparent',
              color: activeFilter === f ? '#fff' : 'var(--text-muted)',
              cursor: 'pointer', transition: 'all 0.2s ease'
            }}
          >
            {f === 'all' ? 'All' : f === 'mentions' ? '@ Mentions' : '❤️ Social'}
          </button>
        ))}
      </div>

      <div className="notifications-list">
        {notifications
          .filter(n => {
            if (activeFilter === 'mentions') return n.type === 'mention';
            if (activeFilter === 'social') return ['like', 'comment', 'follow', 'repost'].includes(n.type);
            return true;
          })
          .length === 0 ? (
          <div className="notifications-empty premium-card">
            <div className="empty-icon-ring">
              <Bell size={32} />
            </div>
            <h3>All caught up!</h3>
            <p>No new alerts at the moment. Check back later for activity.</p>
          </div>
          ) : (
          notifications
            .filter(n => {
              if (activeFilter === 'mentions') return n.type === 'mention';
              if (activeFilter === 'social') return ['like', 'comment', 'follow', 'repost'].includes(n.type);
              return true;
            })
            .map((notif) => (
            <div 
              key={notif.id} 
              className={`notification-item premium-card ${!notif.is_read ? 'unread' : ''}`}
            >
              <div className="notif-avatar-wrapper">
                <img 
                  src={notif.sender?.avatar_url || `https://ui-avatars.com/api/?name=${notif.sender?.name || 'User'}`} 
                  alt={notif.sender?.name}
                  className="notif-sender-avatar"
                />
                <div className="notif-type-icon">
                  {getIcon(notif.type)}
                </div>
              </div>

              <div className="notif-content">
                <p>
                  <strong>{notif.sender?.name || 'Someone'}</strong> {notif.content}
                </p>
                <span className="notif-time">{formatRelativeTime(notif.created_at)}</span>
              </div>

              <div className="notif-actions">
                {notif.reference_id && (
                  <button className="view-notif-btn">
                    View <ArrowRight size={14} />
                  </button>
                )}
                <button className="delete-notif-btn" onClick={() => deleteNotification(notif.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
              
              {!notif.is_read && <div className="unread-dot" />}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
