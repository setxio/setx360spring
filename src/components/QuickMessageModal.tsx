import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Send, 
  Loader2, 
  MessageSquare
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Avatar } from './Avatar';

interface QuickMessageModalProps {
  user: any;
  recipientId: string;
  recipientName: string;
  recipientAvatar?: string;
  onClose: () => void;
}

export const QuickMessageModal: React.FC<QuickMessageModalProps> = ({ 
  user, 
  recipientId, 
  recipientName, 
  recipientAvatar,
  onClose 
}) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    
    // Subscribe to new messages
    const channel = supabase.channel(`quick-msg-${recipientId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `or(and(sender_id.eq.${user.id},receiver_id.eq.${recipientId}),and(sender_id.eq.${recipientId},receiver_id.eq.${user.id}))`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [recipientId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${recipientId}),and(sender_id.eq.${recipientId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true });

    if (!error && data) setMessages(data);
    setLoading(false);
  };

  const handleSend = async () => {
    if (!input.trim() || isSending) return;
    setIsSending(true);

    const { error } = await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: recipientId,
      content: input.trim()
    });

    if (!error) {
      setInput('');
    }
    setIsSending(false);
  };

  return (
    <div className="quick-message-overlay" onClick={onClose}>
      <div className="quick-message-modal glass fade-in" onClick={e => e.stopPropagation()}>
        <header className="quick-msg-header">
          <div className="recipient-info">
            <Avatar name={recipientName} url={recipientAvatar} size={36} />
            <div className="text-info">
              <h4>{recipientName}</h4>
              <span className="status-indicator online">Message Shop</span>
            </div>
          </div>
          <button className="close-quick-msg" onClick={onClose}><X size={20} /></button>
        </header>

        <div className="quick-msg-body">
          {loading ? (
            <div className="msg-loading"><Loader2 className="animate-spin" /></div>
          ) : messages.length === 0 ? (
            <div className="empty-quick-msg">
              <MessageSquare size={32} />
              <p>Start a conversation with <strong>{recipientName}</strong></p>
            </div>
          ) : (
            <div className="quick-msg-list">
              {messages.map((msg) => (
                <div key={msg.id} className={`quick-bubble ${msg.sender_id === user.id ? 'sent' : 'received'}`}>
                  <div className="bubble-text">{msg.content}</div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <footer className="quick-msg-footer">
          <input 
            type="text" 
            placeholder="Type your message..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
          />
          <button className="send-quick-btn" onClick={handleSend} disabled={!input.trim() || isSending}>
            {isSending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
          </button>
        </footer>
      </div>

      <style>{`
        .quick-message-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.4);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }
        .quick-message-modal {
          width: 380px;
          height: 500px;
          display: flex;
          flex-direction: column;
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.1);
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0,0,0,0.4);
        }
        .quick-msg-header {
          padding: 16px;
          background: rgba(255,255,255,0.03);
          border-bottom: 1px solid rgba(255,255,255,0.05);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .recipient-info {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .text-info h4 { margin: 0; font-size: 0.95rem; }
        .status-indicator { font-size: 0.7rem; opacity: 0.6; display: flex; align-items: center; gap: 4px; }
        .status-indicator::before { content: ''; width: 6px; height: 6px; background: #10b981; border-radius: 50%; }
        .close-quick-msg { background: none; border: none; color: var(--text-muted); cursor: pointer; }

        .quick-msg-body {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
        }
        .quick-msg-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .quick-bubble {
          max-width: 80%;
          padding: 10px 14px;
          border-radius: 18px;
          font-size: 0.85rem;
          line-height: 1.4;
        }
        .quick-bubble.sent {
          align-self: flex-end;
          background: var(--store-primary, var(--primary));
          color: #fff;
          border-bottom-right-radius: 4px;
        }
        .quick-bubble.received {
          align-self: flex-start;
          background: rgba(255,255,255,0.08);
          color: var(--text);
          border-bottom-left-radius: 4px;
        }
        
        .empty-quick-msg {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          opacity: 0.5;
          text-align: center;
          padding: 40px;
        }

        .quick-msg-footer {
          padding: 16px;
          display: flex;
          gap: 10px;
          background: rgba(255,255,255,0.02);
          border-top: 1px solid rgba(255,255,255,0.05);
        }
        .quick-msg-footer input {
          flex: 1;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 10px 16px;
          color: #fff;
          font-size: 0.9rem;
        }
        .send-quick-btn {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: var(--store-primary, var(--primary));
          color: white;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .send-quick-btn:hover:not(:disabled) {
          transform: scale(1.05);
          filter: brightness(1.1);
        }
      `}</style>
    </div>
  );
};
