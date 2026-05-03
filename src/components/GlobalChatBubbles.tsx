import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Avatar } from './Avatar';
import { useApp } from '../context/AppContext';
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
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isTyping, setIsTyping] = useState(false);
  const { onlineUsers } = useApp();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingChannelRef = useRef<any>(null);
  const isTypingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const savedPosition = useRef<{ left: string; top: string; right: string; bottom: string } | null>(null);

  // --- Drag support ---
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const onDragStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (expandedChatId) return; // don't drag while a chat is open
    const el = containerRef.current;
    if (!el) return;
    isDragging.current = true;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const rect = el.getBoundingClientRect();
    dragOffset.current = { x: clientX - rect.left, y: clientY - rect.top };
    el.style.transition = 'none';
  };

  useEffect(() => {
    const onMove = (e: TouchEvent | MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      const el = containerRef.current;
      const newLeft = clientX - dragOffset.current.x;
      const newTop = clientY - dragOffset.current.y;
      // Clamp inside viewport
      const maxX = window.innerWidth - el.offsetWidth;
      const maxY = window.innerHeight - el.offsetHeight;
      el.style.left = `${Math.max(0, Math.min(newLeft, maxX))}px`;
      el.style.top = `${Math.max(0, Math.min(newTop, maxY))}px`;
      el.style.right = 'auto';
      el.style.bottom = 'auto';
    };
    const onEnd = () => {
      isDragging.current = false;
      if (containerRef.current) containerRef.current.style.transition = '';
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onEnd);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
    };
  }, []);

  // ── Dismissed bubbles persistence ──
  const DISMISSED_KEY = 'setx360_dismissed_bubbles';
  const getDismissedSet = (): Set<string> => {
    try {
      const raw = localStorage.getItem(DISMISSED_KEY);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch { return new Set(); }
  };
  const addDismissed = (profileId: string) => {
    const set = getDismissedSet();
    set.add(profileId);
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...set]));
  };
  const removeDismissed = (profileId: string) => {
    const set = getDismissedSet();
    set.delete(profileId);
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...set]));
  };

  useEffect(() => {
    if (!user) return;

    // ── Load existing conversations on mount so bubbles appear immediately ──
    const loadRecentConversations = async () => {
      // Fetch the most recent message with each unique conversation partner
      const { data: sentMessages } = await supabase
        .from('messages')
        .select('*')
        .eq('sender_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      const { data: receivedMessages } = await supabase
        .from('messages')
        .select('*')
        .eq('receiver_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      const allMsgs = [...(sentMessages || []), ...(receivedMessages || [])]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // Find unique partner IDs — latest conversation partner first
      const seen = new Set<string>();
      const partners: string[] = [];
      for (const msg of allMsgs) {
        const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        if (!seen.has(partnerId)) {
          seen.add(partnerId);
          partners.push(partnerId);
        }
        if (partners.length >= 3) break; // Show max 3 bubbles
      }

      if (partners.length === 0) return;

      // Filter out dismissed bubbles
      const dismissed = getDismissedSet();
      const activeParters = partners.filter(id => !dismissed.has(id));
      if (activeParters.length === 0) return;

      // Fetch profiles for those partners
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .in('id', activeParters);

      const profileMap: Record<string, any> = {};
      profiles?.forEach(p => { profileMap[p.id] = p; });

      const newSessions: Record<string, ChatSession> = {};
      for (const partnerId of activeParters) {
        const profile = profileMap[partnerId];
        if (!profile) continue;
        // Get messages for this conversation
        const convoMsgs = allMsgs
          .filter(m =>
            (m.sender_id === user.id && m.receiver_id === partnerId) ||
            (m.sender_id === partnerId && m.receiver_id === user.id)
          )
          .slice(0, 30)
          .reverse(); // oldest first for display

        newSessions[partnerId] = {
          profileId: partnerId,
          name: profile.name,
          avatar_url: profile.avatar_url,
          messages: convoMsgs,
          unread: 0,
        };
      }
      setSessions(newSessions);
    };

    loadRecentConversations();

    // ── Real-time: incoming new messages ──
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
  }, [sessions, expandedChatId, typingUsers]);

  // Typing presence — stable channel ref, doesn't re-subscribe on every keystroke
  useEffect(() => {
    if (!expandedChatId || !user) return;

    const channelId = [user.id, expandedChatId].sort().join('-');
    const channel = supabase.channel(`typing-${channelId}`, {
      config: { presence: { key: user.id } }
    })
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const typing = Object.values(state).some((p: any) => 
        p[0]?.user_id === expandedChatId && p[0]?.is_typing
      );
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        if (typing) newSet.add(expandedChatId);
        else newSet.delete(expandedChatId);
        return newSet;
      });
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ user_id: user.id, is_typing: isTypingRef.current });
      }
    });

    typingChannelRef.current = channel;
    return () => {
      channel.unsubscribe();
      typingChannelRef.current = null;
    };
  }, [expandedChatId, user]); // ← removed isTyping to prevent channel teardown on every keystroke

  // Update typing state on existing channel without re-subscribing
  useEffect(() => {
    isTypingRef.current = isTyping;
    if (typingChannelRef.current) {
      typingChannelRef.current.track({ user_id: user.id, is_typing: isTyping });
    }
  }, [isTyping]);

  const handleIncomingMessage = async (message: Message) => {
    const senderId = message.sender_id;

    // If this sender was previously dismissed, un-dismiss them since it's a new live message
    removeDismissed(senderId);

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
    const el = containerRef.current;
    if (expandedChatId === profileId) {
      // Collapsing — restore saved position if we moved it
      setExpandedChatId(null);
      if (el && savedPosition.current) {
        el.style.left = savedPosition.current.left;
        el.style.top = savedPosition.current.top;
        el.style.right = savedPosition.current.right;
        el.style.bottom = savedPosition.current.bottom;
        savedPosition.current = null;
      }
    } else {
      // Expanding — on mobile, snap to left if on right half to prevent overflow
      if (el && window.innerWidth < 768) {
        const rect = el.getBoundingClientRect();
        const isChatWiderThanRemaining = rect.left + 320 > window.innerWidth;
        if (isChatWiderThanRemaining) {
          savedPosition.current = {
            left: el.style.left,
            top: el.style.top,
            right: el.style.right,
            bottom: el.style.bottom,
          };
          el.style.left = '8px';
          el.style.right = 'auto';
          // keep top/bottom as-is
        }
      }
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
    if (expandedChatId === profileId) {
      setExpandedChatId(null);
      // Restore position if we'd moved it
      if (containerRef.current && savedPosition.current) {
        const el = containerRef.current;
        el.style.left = savedPosition.current.left;
        el.style.top = savedPosition.current.top;
        el.style.right = savedPosition.current.right;
        el.style.bottom = savedPosition.current.bottom;
        savedPosition.current = null;
      }
    }
    // Persist dismissal so it doesn't reappear on refresh
    addDismissed(profileId);
    setSessions(prev => {
      const newSessions = { ...prev };
      delete newSessions[profileId];
      return newSessions;
    });
  };

  const handleInputChange = (profileId: string, value: string) => {
    setInputValues(prev => ({ ...prev, [profileId]: value }));
    if (!isTyping) {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 3000);
    }
  };

  if (!user || Object.keys(sessions).length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="global-bubbles-container"
      onMouseDown={onDragStart}
      onTouchStart={onDragStart}
    >
      {Object.values(sessions).map(session => {
        const isExpanded = expandedChatId === session.profileId;

        return (
          <div key={session.profileId} className={`chat-bubble-widget ${isExpanded ? 'expanded' : ''}`}>
            
            {/* The Floating Avatar Bubble */}
            <div className="bubble-head" onClick={() => toggleExpand(session.profileId)}>
              <div className="avatar-wrapper">
                <Avatar name={session.name} url={session.avatar_url} size={48} />
                {onlineUsers.has(session.profileId) && (
                  <span className="global-online-indicator" title="Online"></span>
                )}
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
                    <div style={{ position: 'relative' }}>
                      <Avatar name={session.name} url={session.avatar_url} size={28} />
                      {onlineUsers.has(session.profileId) && (
                        <span className="global-online-indicator" title="Online" style={{ width: 8, height: 8, bottom: 0, right: 0 }}></span>
                      )}
                    </div>
                    <div className="mini-chat-info-stack">
                      <span className="mini-chat-name">{session.name}</span>
                      {typingUsers.has(session.profileId) ? (
                        <span className="global-typing-text">typing...</span>
                      ) : onlineUsers.has(session.profileId) ? (
                        <span className="global-online-text">Active now</span>
                      ) : null}
                    </div>
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
                  {typingUsers.has(session.profileId) && (
                    <div className="mini-bubble-wrapper received">
                      <div className="typing-indicator-bubble mini-bubble">
                        <div className="typing-dot" />
                        <div className="typing-dot" />
                        <div className="typing-dot" />
                      </div>
                    </div>
                  )}
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
