import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Avatar } from './Avatar';
import { UserPlus, Check, X, Users, Search } from 'lucide-react';

export const ProPlusNetworkTab: React.FC<{ user: any }> = ({ user }) => {
  const [requests, setRequests] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  useEffect(() => {
    fetchNetwork();
  }, [user]);

  const fetchNetwork = async () => {
    // Fetch Pending Requests (where user is recipient)
    const { data: pendingReqs } = await supabase
      .from('pro_connections')
      .select('*, requester:requester_id(id, name, avatar_url, role)')
      .eq('recipient_id', user.id)
      .eq('status', 'pending');
      
    if (pendingReqs) setRequests(pendingReqs);

    // Fetch My Connections
    const { data: connData } = await supabase
      .from('pro_connections')
      .select('*, requester:requester_id(id, name, avatar_url), recipient:recipient_id(id, name, avatar_url)')
      .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .eq('status', 'accepted');

    if (connData) {
      setConnections(connData.map(c => c.requester_id === user.id ? c.recipient : c.requester));
    }

    // Fetch Suggestions (People with pro_profiles who aren't connected)
    const { data: allProProfiles } = await supabase
      .from('pro_profiles')
      .select('id, headline, industry, profiles(id, name, avatar_url)')
      .neq('id', user.id)
      .limit(10) as any;
      
    if (allProProfiles) {
      // Very basic filtering (in a real app, we'd filter out existing connections in the query)
      const connectedIds = new Set(connData?.map(c => c.requester_id === user.id ? c.recipient_id : c.requester_id) || []);
      setSuggestions(allProProfiles.filter((p: any) => !connectedIds.has(p.id)));
    }
  };

  const handleAccept = async (reqId: string) => {
    await supabase.from('pro_connections').update({ status: 'accepted' }).eq('id', reqId);
    fetchNetwork();
  };

  const handleDecline = async (reqId: string) => {
    await supabase.from('pro_connections').update({ status: 'declined' }).eq('id', reqId);
    fetchNetwork();
  };

  const handleConnect = async (targetId: string) => {
    await supabase.from('pro_connections').insert({
      requester_id: user.id,
      recipient_id: targetId,
      status: 'pending'
    });
    fetchNetwork(); // Refresh suggestions
  };

  return (
    <div className="proplus-network-tab" style={{ paddingBottom: 60 }}>
      {requests.length > 0 && (
        <div className="glass-card section-card" style={{ marginBottom: 16 }}>
          <h3 className="section-title">Pending Invitations</h3>
          <div className="connection-list" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {requests.map(req => (
              <div key={req.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, border: '1px solid var(--border)', borderRadius: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar url={req.requester.avatar_url} name={req.requester.name} size={48} />
                  <div>
                    <h4 style={{ margin: '0 0 4px' }}>{req.requester.name}</h4>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Wants to connect</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-outline" onClick={() => handleDecline(req.id)} style={{ padding: '6px 12px', border: '1px solid var(--border)', color: 'var(--text)' }}>Decline</button>
                  <button className="save-btn" onClick={() => handleAccept(req.id)} style={{ padding: '6px 12px' }}>Accept</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="glass-card section-card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 className="section-title" style={{ margin: 0 }}>Grow Your Network</h3>
          <button style={{ background: 'none', border: 'none', color: '#0284c7', fontWeight: 600, cursor: 'pointer' }}>See All</button>
        </div>
        
        <div className="suggestions-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {suggestions.map(s => {
            const profile = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles;
            return (
              <div key={s.id} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 16, textAlign: 'center', background: 'var(--bg-default)' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                  <Avatar url={profile?.avatar_url} name={profile?.name} size={80} />
                </div>
                <h4 style={{ margin: '0 0 4px', fontSize: '1.05rem' }}>{profile?.name}</h4>
                <p style={{ margin: '0 0 16px', fontSize: '0.85rem', color: 'var(--text-muted)', height: 40, overflow: 'hidden' }}>
                  {s.headline || s.industry || 'Professional'}
                </p>
                <button 
                  className="btn-outline" 
                  onClick={() => handleConnect(s.id)}
                  style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}
                >
                  <UserPlus size={16} /> Connect
                </button>
              </div>
            );
          })}
          {suggestions.length === 0 && (
            <p className="empty-text" style={{ gridColumn: '1 / -1', textAlign: 'center' }}>No new suggestions at this time.</p>
          )}
        </div>
      </div>

      <div className="glass-card section-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 className="section-title" style={{ margin: 0 }}>My Connections ({connections.length})</h3>
        </div>
        {connections.length === 0 ? (
          <div className="empty-state">
            <Users size={48} className="empty-icon" />
            <p>You don't have any professional connections yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {connections.map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, border: '1px solid var(--border)', borderRadius: 12 }}>
                <Avatar url={c.avatar_url} name={c.name} size={48} />
                <div>
                  <h4 style={{ margin: '0 0 4px' }}>{c.name}</h4>
                  <button className="btn-outline" style={{ fontSize: '0.75rem', padding: '4px 8px' }}>Message</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
