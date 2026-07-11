import React, { useState, useEffect } from 'react';
import { supabase as supabase } from '../../lib/supabase';
import { AlertOctagon, Loader2, CheckCircle, MapPin } from 'lucide-react';
import type { User } from '../../types/user';

export const SosAlertsManager: React.FC<{ user: User }> = ({ user }) => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
    
    // Listen for new alerts in real-time
    const subscription = supabase
      .channel('sos_alerts_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sos_alerts' }, payload => {
        fetchAlerts(); // Refresh to get user details too
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchAlerts = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('sos_alerts')
      .select('*, user:profiles!user_id(name, email, phone)')
      .order('created_at', { ascending: false });
      
    setAlerts(data || []);
    setIsLoading(false);
  };

  const handleResolve = async (id: string) => {
    await supabase.from('sos_alerts').update({ status: 'resolved', resolved_at: new Date().toISOString() }).eq('id', id);
    fetchAlerts();
  };

  if (isLoading && alerts.length === 0) return <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Loader2 className="animate-spin" /></div>;

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><AlertOctagon color="#ef4444" /> Live SOS Alerts</h2>
          <p style={{ color: 'var(--text-muted)' }}>Monitor emergency slide-to-SOS triggers from the Resident App.</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {alerts.length === 0 ? (
          <div className="premium-card empty-state" style={{ textAlign: 'center', padding: 40 }}>
            <CheckCircle size={48} color="#10b981" style={{ marginBottom: 16, opacity: 0.5 }} />
            <h3>No Active Alerts</h3>
            <p style={{ color: 'var(--text-muted)' }}>All clear! There are no emergency alerts at this time.</p>
          </div>
        ) : alerts.map(alert => (
          <div key={alert.id} className="premium-card" style={{ borderLeft: `4px solid ${alert.status === 'active' ? '#ef4444' : '#10b981'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <span style={{ fontWeight: 800, fontSize: '1.2rem', color: alert.status === 'active' ? '#ef4444' : '#10b981' }}>
                    {alert.status === 'active' ? 'ACTIVE SOS' : 'RESOLVED'}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {new Date(alert.created_at).toLocaleString()}
                  </span>
                </div>
                
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontWeight: 700 }}>{alert.user?.name || 'Unknown User'}</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Contact: {alert.user?.phone || alert.user?.email || 'N/A'}</div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  <MapPin size={16} /> 
                  <a href={`https://www.google.com/maps/search/?api=1&query=${alert.lat},${alert.lng}`} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                    {alert.lat.toFixed(4)}, {alert.lng.toFixed(4)} (Open in Maps)
                  </a>
                </div>
                
                {alert.meta?.app && (
                  <div style={{ marginTop: 8, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Triggered from: {alert.meta.app} ({alert.meta.source})
                  </div>
                )}
              </div>
              
              <div>
                {alert.status === 'active' && (
                  <button className="primary-btn" onClick={() => handleResolve(alert.id)} style={{ background: '#10b981' }}>
                    Mark as Resolved
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

