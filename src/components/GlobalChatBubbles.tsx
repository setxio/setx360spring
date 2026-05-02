import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Avatar } from './Avatar';
import { X, Send, Loader2, Minimize2 } from 'lucide-react';
import './GlobalChatBubbles.css';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
}

interface ChatSession {
  profileId: string;
  name: string;
  avatar_url?: string;
  messages: Message[];
  unread: number;
}

interface GlobalChatBubblesProps {
  user: any;
}

export const GlobalChatBubbles: React.FC<GlobalChatBubblesProps> = ({ user }) => {
  const [sessions, setSessions] = useState<Record<string, ChatSession>>({});
  const [expandedChatId, setExpandedChatId] = useState<string | null>(null);
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel('global-chat-bubbles')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages', 
        filter: `receiver_id=eq.${user.id}` 
      }, async (payload) => {
        const newMessage = payload.new as Message;
        handleIncomingMessage(newMessage);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Scroll to bottom when a chat is expanded or new message arrives
  useEffect(() => {
    if (expandedChatId) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [sessions, expandedChatId]);

  const handleIncomingMessage = async (message: Message) => {
    const senderId = message.sender_id;

    setSessions(prev => {
      const isExpanded = expandedChatId === senderId;
      const existingSession = prev[senderId];

      if (existingSession) {
        return {
          ...prev,
          [senderId]: {
            ...existingSession,
            messages: [...existingSession.messages, message],
            unread: isExpanded ? 0 : existingSession.unread + 1
          }
        };
      } else {
        // Need to fetch profile
        fetchProfileAndAddSession(senderId, message);
        return prev;
      }
    });
  };

  const fetchProfileAndAddSession = async (senderId: string, initialMessage: Message) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, avatar_url')
      .eq('id', senderId)
      .single();

    if (profile) {
      setSessions(prev => ({
        ...prev,
        [senderId]: {
          profileId: senderId,
          name: profile.name,
          avatar_url: profile.avatar_url,
          messages: [initialMessage],
          unread: 1
        }
      }));
    }
  };

  const handleSendMessage = async (receiverId: string) => {
    const text = inputValues[receiverId];
    if (!text?.trim() || !user || isSending) return;

    setIsSending(true);
    
    // Optimistic UI update
    const optimisticMsg: Message = {
      id: Date.now().toString(),
      sender_id: user.id,
      receiver_id: receiverId,
      content: text,
      created_at: new Date().toISOString()
    };

    setSessions(prev => {
      const session = prev[receiverId];
      if (!session) return prev;
      return {
        ...prev,
        [receiverId]: {
          ...session,
          messages: [...session.messages, optimisticMsg]
        }
      };
    });

    setInputValues(prev => ({ ...prev, [receiverId]: '' }));

    // Send to DB
    await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: receiverId,
      content: text
    });

    setIsSending(false);
  };

  const toggleExpand = (profileId: string) => {
    if (expandedChatId === profileId) {
      setExpandedChatId(null);
    } else {
      setExpandedChatId(profileId);
      // Mark as read
      setSessions(prev => ({
        ...prev,
        [profileId]: { ...prev[profileId], unread: 0 }
      }));
    }
  };

  const closeBubble = (e: React.MouseEvent, profileId: string) => {
    e.stopPropagation();
    if (expandedChatId === profileId) setExpandedChatId(null);
    setSessions(prev => {
      const newSessions = { ...prev };
      delete newSessions[profileId];
      return newSessions;
    });
  };

  const handleInputChange = (profileId: string, value: string) => {
    setInputValues(prev => ({ ...prev, [profileId]: value }));
  };

  if (!user || Object.keys(sessions).length === 0) return null;

  return (
    <div className="global-bubbles-container">
      {Object.values(sessions).map(session => {
        const isExpanded = expandedChatId === session.profileId;

        return (
          <div key={session.profileId} className={`chat-bubble-widget ${isExpanded ? 'expanded' : ''}`}>
            
            {/* The Floating Avatar Bubble */}
            <div className="bubble-head" onClick={() => toggleExpand(session.profileId)}>
              <div className="avatar-wrapper">
                <Avatar name={session.name} url={session.avatar_url} size={48} />
                {session.unread > 0 && !isExpanded && (
                  <span className="unread-badge">{session.unread}</span>
                )}
              </div>
              <button className="close-bubble-btn" onClick={(e) => closeBubble(e, session.profileId)}>
                <X size={14} />
              </button>
            </div>

            {/* The Mini Chat Window */}
            {isExpanded && (
              <div className="mini-chat-window glass slide-up">
                <div className="mini-chat-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Avatar name={session.name} url={session.avatar_url} size={28} />
                    <span className="mini-chat-name">{session.name}</span>
                  </div>
                  <div className="mini-chat-actions">
                    <button onClick={() => toggleExpand(session.profileId)}><Minimize2 size={16} /></button>
                    <button onClick={(e) => closeBubble(e, session.profileId)}><X size={16} /></button>
                  </div>
                </div>

                <div className="mini-chat-messages">
                  {session.messages.map((msg, idx) => {
                    const isSent = msg.sender_id === user.id;
                    return (
                      <div key={msg.id || idx} className={`mini-bubble-wrapper ${isSent ? 'sent' : 'received'}`}>
                        <div className="mini-bubble">
                          {msg.content}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                <div className="mini-chat-input">
                  <input 
                    type="text" 
                    placeholder="Type a message..." 
                    value={inputValues[session.profileId] || ''}
                    onChange={(e) => handleInputChange(session.profileId, e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(session.profileId)}
                  />
                  <button 
                    className={`send-btn ${inputValues[session.profileId]?.trim() ? 'active' : ''}`}
                    onClick={() => handleSendMessage(session.profileId)}
                    disabled={!inputValues[session.profileId]?.trim() || isSending}
                  >
                    {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
