import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import { Shield, Check, Archive, Mail, RefreshCw, X } from 'lucide-react';

export const AdminMessagesView: React.FC = () => {
  const { user } = useApp();
  const [messages, setMessages] = useState<any[]>([]);
  const [reads, setReads] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'inbox' | 'archived'>('inbox');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMessages();
  }, [user]);

  const fetchMessages = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      // Fetch all active broadcasts
      const { data: broadcasts } = await supabase
        .from('admin_broadcasts')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false });

      // Fetch user reads
      const { data: readData } = await supabase
        .from('user_broadcast_reads')
        .select('broadcast_id')
        .eq('user_id', user.id);

      setMessages(broadcasts || []);
      setReads((readData || []).map(r => r.broadcast_id));
    } catch (error) {
      console.error('Error fetching admin messages:', error);
    }
    setIsLoading(false);
  };

  const handleArchive = async (broadcastId: string) => {
    if (!user) return;
    
    // Optimistic update
    setReads(prev => [...prev, broadcastId]);

    try {
      await supabase.from('user_broadcast_reads').insert({
        user_id: user.id,
        broadcast_id: broadcastId
      });
    } catch (err) {
      console.error('Failed to archive message', err);
      // Revert optimistic update
      setReads(prev => prev.filter(id => id !== broadcastId));
    }
  };

  const handleUnarchive = async (broadcastId: string) => {
    if (!user) return;
    
    // Optimistic update
    setReads(prev => prev.filter(id => id !== broadcastId));

    try {
      await supabase
        .from('user_broadcast_reads')
        .delete()
        .eq('user_id', user.id)
        .eq('broadcast_id', broadcastId);
    } catch (err) {
      console.error('Failed to unarchive message', err);
      // Revert optimistic update
      setReads(prev => [...prev, broadcastId]);
    }
  };

  const inboxMessages = messages.filter(m => !reads.includes(m.id));
  const archivedMessages = messages.filter(m => reads.includes(m.id));

  const displayMessages = activeTab === 'inbox' ? inboxMessages : archivedMessages;

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', paddingBottom: '100px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Shield color="var(--primary)" />
          Admin HQ
        </h1>
        <button 
          onClick={fetchMessages} 
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px' }}
        >
          <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <button 
          onClick={() => setActiveTab('inbox')}
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: '12px',
            border: 'none',
            background: activeTab === 'inbox' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
            color: activeTab === 'inbox' ? '#fff' : 'var(--text-muted)',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <Mail size={18} />
          Inbox {inboxMessages.length > 0 && `(${inboxMessages.length})`}
        </button>
        <button 
          onClick={() => setActiveTab('archived')}
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: '12px',
            border: 'none',
            background: activeTab === 'archived' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
            color: activeTab === 'archived' ? '#fff' : 'var(--text-muted)',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <Archive size={18} />
          Archived
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            Loading messages...
          </div>
        ) : displayMessages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>
            <Mail size={48} color="var(--text-muted)" style={{ marginBottom: '16px', opacity: 0.5 }} />
            <h3 style={{ margin: '0 0 8px' }}>You're all caught up!</h3>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              {activeTab === 'inbox' ? 'No new admin broadcasts.' : 'No archived messages.'}
            </p>
          </div>
        ) : (
          displayMessages.map((msg) => (
            <div 
              key={msg.id} 
              style={{ 
                background: 'var(--bg-card)', 
                padding: '20px', 
                borderRadius: '16px', 
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', background: msg.type === 'alert' ? '#ef4444' : 'var(--primary)' }} />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '6px', 
                    fontSize: '0.75rem', 
                    fontWeight: 800, 
                    background: msg.type === 'alert' ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)', 
                    color: msg.type === 'alert' ? '#ef4444' : '#60a5fa',
                    textTransform: 'uppercase'
                  }}>
                    {msg.type}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {new Date(msg.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                {activeTab === 'inbox' ? (
                  <button 
                    onClick={() => handleArchive(msg.id)}
                    style={{ 
                      padding: '6px 12px', 
                      background: 'rgba(16, 185, 129, 0.1)', 
                      color: '#10b981', 
                      border: '1px solid rgba(16, 185, 129, 0.2)', 
                      borderRadius: '8px', 
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 700
                    }}
                  >
                    <Check size={14} /> Mark Read
                  </button>
                ) : (
                  <button 
                    onClick={() => handleUnarchive(msg.id)}
                    style={{ 
                      padding: '6px 12px', 
                      background: 'none', 
                      color: 'var(--text-muted)', 
                      border: '1px solid var(--border)', 
                      borderRadius: '8px', 
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.8rem'
                    }}
                  >
                    <X size={14} /> Move to Inbox
                  </button>
                )}
              </div>
              
              <p style={{ margin: 0, color: 'var(--text)', lineHeight: 1.6, fontSize: '0.95rem' }}>
                {msg.message}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
