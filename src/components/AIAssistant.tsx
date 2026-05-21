import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '../context/ToastContext';
import { 
  Sparkles, 
  Send, 
  Loader2, 
  Database, 
  History,
  CheckCircle2,
  AlertCircle,
  Terminal,
  Zap,
  Play
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';

export const AIAssistant: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [systemErrors, setSystemErrors] = useState<any[]>([]);
  const [proposedAction, setProposedAction] = useState<any | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { success, error: toastError } = useToast();

  useEffect(() => {
    fetchSystemHealth();
    fetchMaintenanceLogs();
  }, []);

  const fetchSystemHealth = async () => {
    const { data } = await supabase
      .from('system_errors')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    setSystemErrors(data || []);
  };

  const fetchMaintenanceLogs = async () => {
    const { data } = await supabase
      .from('ai_maintenance_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    setHistory(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsProcessing(true);

    try {
      // Edge Function handles auth transparently
      
      const { data, error } = await supabase.functions.invoke('architect-ai', {
        body: { query }
      });

      if (error) {
        throw new Error(error.message || 'Failed to communicate with Architect AI');
      }

      if (data?.proposedAction) {
        setProposedAction(data.proposedAction);
      }
      
      setHistory(prev => [{
        id: Date.now(),
        action_type: 'consultation',
        description: `Architect processed: "${query}"`,
        created_at: new Date().toISOString()
      }, ...prev]);

    } catch (err: any) {
      console.error('AI Architect Error:', err);
      setHistory(prev => [{
        id: Date.now(),
        action_type: 'error',
        description: `Architect Error: ${err.message || 'System is still waking up.'}`,
        created_at: new Date().toISOString()
      }, ...prev]);
    } finally {
      setIsProcessing(false);
      setQuery('');
    }
  };

  const applyProposedAction = async () => {
    if (!proposedAction) return;
    setIsProcessing(true);

    try {
      // Execute the SQL if it exists
      if (proposedAction.sql) {
        const { error } = await supabase.rpc('execute_ai_sql', { sql_query: proposedAction.sql });
        if (error) throw error;
      }

      // Log success
      await supabase.from('ai_maintenance_logs').insert({
        action_type: proposedAction.type || 'architect_fix',
        description: `Applied AI Architect suggestion: ${proposedAction.description}`,
        status: 'success'
      });

      success('Action applied successfully!');
      setProposedAction(null);
      fetchMaintenanceLogs();
    } catch (err) {
      console.error('Failed to apply action:', err);
      toastError('Failed to execute the AI logic. Check system logs.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="ai-architect-container" style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px', height: 'calc(100vh - 200px)' }}>
      {/* Main Terminal Area */}
      <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', padding: '24px', position: 'relative', overflow: 'hidden' }}>
        <div className="card-header" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'var(--admin-accent)', padding: '10px', borderRadius: '12px' }}>
              <Terminal size={24} color="#fff" />
            </div>
            <div>
              <h3 style={{ margin: 0 }}>AI Architect Terminal</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.7 }}>Natural Language Infrastructure Control</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="pulse-dot"></span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981' }}>SYSTEM ONLINE</span>
          </div>
        </div>

        {/* Output/Conversation Area */}
        <div className="terminal-output" style={{ flex: 1, overflowY: 'auto', background: 'rgba(0,0,0,0.3)', borderRadius: '16px', padding: '20px', border: '1px solid var(--admin-border)', marginBottom: '20px' }}>
          {!proposedAction && history.length === 0 && (
            <div style={{ textAlign: 'center', marginTop: '100px', opacity: 0.5 }}>
              <Sparkles size={48} style={{ marginBottom: '16px' }} />
              <p>Ready for your commands, Architect.</p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '24px' }}>
                {['Audit database for broken links', 'Summarize regional pulse', 'Check church member queue'].map(hint => (
                  <button 
                    key={hint}
                    onClick={() => setQuery(hint)}
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px 16px', borderRadius: '20px', fontSize: '0.8rem', cursor: 'pointer' }}
                  >
                    {hint}
                  </button>
                ))}
              </div>
            </div>
          )}

          {proposedAction && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="proposed-action-card" 
              style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid var(--admin-accent)', borderRadius: '16px', padding: '20px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', color: 'var(--admin-accent)' }}>
                <Zap size={20} />
                <h4 style={{ margin: 0 }}>Proposed Infrastructure Update</h4>
              </div>
              <p style={{ fontSize: '0.9rem', marginBottom: '16px' }}>{proposedAction.description}</p>
              
              {proposedAction.sql && (
                <div style={{ background: '#000', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.8rem', fontFamily: 'monospace', overflowX: 'auto' }}>
                  <code style={{ color: '#10b981' }}>{proposedAction.sql}</code>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={applyProposedAction}
                  disabled={isProcessing}
                  style={{ background: 'var(--admin-accent)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                >
                  {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
                  Execute Plan
                </button>
                <button 
                  onClick={() => setProposedAction(null)}
                  style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '10px 20px', borderRadius: '12px', cursor: 'pointer' }}
                >
                  Discard
                </button>
              </div>
            </motion.div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input 
              type="text" 
              placeholder="What would you like to build or check?"
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--admin-border)', borderRadius: '16px', padding: '16px 20px', color: '#fff', fontSize: '1rem', outline: 'none' }}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isProcessing}
            />
            <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
              <Sparkles size={20} color="var(--admin-accent)" />
            </div>
          </div>
          <button 
            type="submit"
            disabled={isProcessing || !query.trim()}
            style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'var(--admin-accent)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
          >
            {isProcessing ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}
          </button>
        </form>
      </div>

      {/* Sidebar: System Health & Maintenance History */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* System Health */}
        <div className="admin-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Database size={18} color="#ef4444" /> System Health
            </h4>
            <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>Latest 5</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {systemErrors.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', opacity: 0.5, fontSize: '0.8rem' }}>
                <CheckCircle2 size={32} style={{ color: '#10b981', marginBottom: '8px' }} />
                <p>No critical failures detected.</p>
              </div>
            ) : systemErrors.map(err => (
              <div key={err.id} style={{ display: 'flex', gap: '12px', padding: '12px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{err.message}</div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>{new Date(err.created_at).toLocaleTimeString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Maintenance History */}
        <div className="admin-card" style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <History size={18} color="var(--admin-accent)" /> <h4>AI Activity</h4>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {history.map(log => (
              <div key={log.id} style={{ position: 'relative', paddingLeft: '20px', borderLeft: '2px solid rgba(59, 130, 246, 0.1)' }}>
                <div style={{ position: 'absolute', left: '-6px', top: '4px', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--admin-accent)' }}></div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{log.action_type.toUpperCase()}</div>
                <div style={{ fontSize: '0.75rem', opacity: 0.8, marginBottom: '4px' }}>{log.description}</div>
                <div style={{ fontSize: '0.65rem', opacity: 0.5 }}>{new Date(log.created_at).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .pulse-dot {
          width: 8px;
          height: 8px;
          background: #10b981;
          border-radius: 50%;
          box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
      `}} />
    </div>
  );
};
