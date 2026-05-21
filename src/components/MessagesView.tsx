import type { User } from '../types/user';
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Avatar } from './Avatar';
import { EmptyState } from './EmptyState';
import { useApp } from '../context/AppContext';
import { Search, MessageSquare, ArrowLeft, Send, Image as ImageIcon, Loader2, Plus, Check, CheckCheck } from 'lucide-react';
import './MessagesView.css';

interface MessagesViewProps {
  user: User;
}

interface MessageData {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  media_url?: string;
  created_at: string;
  read_at?: string | null;
}

interface Conversation {
  otherId: string;
  name: string;
  avatar: string | undefined;
  lastMessage: string;
  lastTimestamp: string;
}

export const MessagesView: React.FC<MessagesViewProps> = ({ user }) => {
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  
  const queryClient = useQueryClient();
  const { data: allMessages = [], isLoading: loading } = useQuery({
    queryKey: ['messages', user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as MessageData[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const { onlineUsers } = useApp();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingChannelRef = useRef<any>(null);
  const isTypingRef = useRef(false);

  const calculateAge = (m: number, d: number, y: number) => {
    if (!m || !d || !y) return 0;
    const today = new Date();
    const birthDate = new Date(y, m - 1, d);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Auto scroll to bottom with smoother behavior
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [allMessages, activeChatId, otherUserTyping]);

  // Typing indicator via Realtime Broadcast
  useEffect(() => {
    if (!activeChatId || !user || user.enable_typing_indicators === false) return;

    const channelId = [user.id, activeChatId].sort().join('-');
    const channel = supabase.channel(`broadcast-typing-${channelId}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload?.userId === activeChatId) {
          setOtherUserTyping(payload.payload?.isTyping || false);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && isTypingRef.current) {
          await channel.send({
            type: 'broadcast',
            event: 'typing',
            payload: { userId: user.id, isTyping: true }
          });
        }
      });

    typingChannelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
      typingChannelRef.current = null;
      setOtherUserTyping(false);
    };
  }, [activeChatId, user]);

  // Update typing state via Broadcast
  useEffect(() => {
    isTypingRef.current = isTyping;
    if (typingChannelRef.current && user?.enable_typing_indicators !== false) {
      typingChannelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: user.id, isTyping: isTyping }
      });
    }
  }, [isTyping, user]);

  useEffect(() => {
    // FIX: Two separate channels — Supabase only allows ONE filter per channel subscription
    const rxChannel = supabase.channel(`messages-rx-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` }, (payload) => handleIncomingMessage(payload.new as MessageData))
      .subscribe();

    const txChannel = supabase.channel(`messages-tx-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `sender_id=eq.${user.id}` }, (payload) => handleIncomingMessage(payload.new as MessageData))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `sender_id=eq.${user.id}` }, (payload) => handleIncomingMessage(payload.new as MessageData))
      .subscribe();

    return () => {
      supabase.removeChannel(rxChannel);
      supabase.removeChannel(txChannel);
    };
  }, [user.id]);

  const handleIncomingMessage = (newMsg: MessageData) => {
    queryClient.setQueryData(['messages', user.id], (prev: MessageData[] | undefined) => {
      const messages = prev || [];
      const idx = messages.findIndex(m => m.id === newMsg.id);
      if (idx > -1) {
        const next = [...messages];
        next[idx] = newMsg;
        return next;
      }
      return [...messages, newMsg];
    });
    
    // Auto-mark as read if we are in this chat
    if (newMsg.receiver_id === user.id && newMsg.sender_id === activeChatId) {
      markAsRead(newMsg.sender_id);
    }
  };

  const markAsRead = async (senderId: string) => {
    if (!user || user.enable_read_receipts === false) return;
    
    const { error } = await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('receiver_id', user.id)
      .eq('sender_id', senderId)
      .is('read_at', null);
      
    if (error) console.error("Error marking as read:", error);
  };

  useEffect(() => {
    if (activeChatId) {
      markAsRead(activeChatId);
    }
  }, [activeChatId]);

  const typingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
    if (!isTyping && user.enable_typing_indicators !== false) {
      setIsTyping(true);
    }
    // Refresh the timeout on every keystroke
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeChatId) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `chat-attachments/${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('public')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('public')
        .getPublicUrl(filePath);

      await sendMessage(null, publicUrl);
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const sendMessage = async (text: string | null, mediaUrl?: string) => {
    if (!activeChatId) return;
    const { data, error } = await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: activeChatId,
      content: text || '',
      media_url: mediaUrl
    }).select().single();
    if (!error && data) {
      queryClient.setQueryData(['messages', user.id], (prev: MessageData[] | undefined) => {
        return [...(prev || []), data as MessageData];
      });
    }
  };

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    sendMessage(messageInput);
    setMessageInput('');
    setIsTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };

  // Rebuild conversations list whenever allMessages changes
  useEffect(() => {
    const buildConversations = async () => {
      const convMap = new Map<string, MessageData>();
      allMessages.forEach(msg => {
        const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        // Keep the latest message
        const currentStored = convMap.get(otherId);
        if (!currentStored || new Date(msg.created_at) > new Date(currentStored.created_at)) {
          convMap.set(otherId, msg);
        }
      });

      const uniqueOtherIds = Array.from(convMap.keys());
      if (uniqueOtherIds.length === 0) {
        setConversations([]);
        return;
      }

      // Fetch profiles for these users
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .in('id', uniqueOtherIds);

      if (profiles) {
        const convList = uniqueOtherIds.map(otherId => {
          const profile = profiles.find(p => p.id === otherId);
          const lastMsg = convMap.get(otherId)!;
          return {
            otherId,
            name: profile?.name || 'Unknown User',
            avatar: profile?.avatar_url || undefined,
            lastMessage: lastMsg.content,
            lastTimestamp: new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
        });

        // Sort conversations by latest message timestamp mostly
        convList.sort((a, b) => {
          const msgA = convMap.get(a.otherId)!;
          const msgB = convMap.get(b.otherId)!;
          return new Date(msgB.created_at).getTime() - new Date(msgA.created_at).getTime();
        });

        setConversations(convList);
      }
    };
    buildConversations();
  }, [allMessages, user.id]);

  const searchUsers = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    let sbQuery = supabase
      .from('profiles')
      .select('id, name, avatar_url, community')
      .ilike('name', `%${query}%`)
      .neq('id', user.id);

    // ENFORCE LOCAL CHAT ONLY (For Minors)
    const userAge = user ? calculateAge(user.birth_month, user.birth_day, user.birth_year) : 0;
    const isMinor = userAge > 0 && userAge < 18;
    const currentYear = new Date().getFullYear();

    if (user && isMinor && user.role !== 'admin') {
      if (user.community) {
        sbQuery = sbQuery.eq('community', user.community);
      } else if (user.county) {
        sbQuery = sbQuery.eq('county', user.county);
      }
    }

    // PROTECT MINORS FROM ADULT DISCOVERY
    if (user && !isMinor && user.role !== 'admin') {
      // Adults should only see users born 18+ years ago
      sbQuery = sbQuery.lte('birth_year', currentYear - 18);
    }

    const { data } = await sbQuery.limit(5);
    
    if (data) setSearchResults(data);
    setIsSearching(false);
  };

  const startNewChat = (otherUser: any) => {
    setActiveChatId(otherUser.id);
    setSearchQuery('');
    setSearchResults([]);
    // Ensure they are in the conversation list optimistically
    if (!conversations.find(c => c.otherId === otherUser.id)) {
      setConversations(prev => [{
        otherId: otherUser.id,
        name: otherUser.name,
        avatar: otherUser.avatar_url,
        lastMessage: 'Start a conversation...',
        lastTimestamp: ''
      }, ...prev]);
    }
  };

  const activeConversation = conversations.find(c => c.otherId === activeChatId);
  const currentChatMessages = allMessages.filter(
    m => (m.sender_id === user.id && m.receiver_id === activeChatId) || 
         (m.sender_id === activeChatId && m.receiver_id === user.id)
  );

  return (
    <div className={`messages-layout ${activeChatId ? 'chat-active' : ''}`}>
      
      {/* SIDEBAR - Conversation List */}
      <div className="messages-sidebar">
        <div className="messages-header">
          <h2>Messages</h2>
          <div className="search-conversations">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Search users to message..." 
              value={searchQuery}
              onChange={(e) => searchUsers(e.target.value)}
            />
          </div>
          
          {/* Search Dropdown */}
          {searchQuery && (
            <div className="search-results-dropdown" style={{ 
              position: 'absolute', top: '100px', left: 0, right: 0, 
              background: 'var(--bg)', zIndex: 10, borderBottom: '1px solid var(--border)', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' 
            }}>
              {isSearching ? (
                <div style={{ padding: '16px', textAlign: 'center' }}><Loader2 className="animate-spin" size={16} /></div>
              ) : searchResults.length > 0 ? (
                searchResults.map(res => (
                  <div key={res.id} onClick={() => startNewChat(res)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}>
                    <Avatar name={res.name} url={res.avatar_url} size={32} />
                    <span style={{ fontWeight: 600 }}>{res.name}</span>
                    <Plus size={16} style={{ marginLeft: 'auto', color: 'var(--primary)' }} />
                  </div>
                ))
              ) : (
                <div style={{ padding: '16px', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>No users found</div>
              )}
            </div>
          )}
        </div>

        <div className="conversation-list">
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><Loader2 className="animate-spin" color="var(--primary)" /></div>
          ) : conversations.length === 0 ? (
            <EmptyState 
              icon={MessageSquare}
              title="No Messages"
              message="Start a conversation with neighbors or local businesses. Your chats will appear here."
            />
          ) : (
            conversations.map((conv) => (
              <div 
                key={conv.otherId} 
                className={`conversation-item ${activeChatId === conv.otherId ? 'active' : ''}`}
                onClick={() => setActiveChatId(conv.otherId)}
              >
                <div style={{ position: 'relative' }}>
                  <Avatar name={conv.name} url={conv.avatar} size={48} />
                  {onlineUsers.has(conv.otherId) && (
                    <span className="online-indicator" title="Online"></span>
                  )}
                </div>
                <div className="conversation-info">
                  <div className="conv-header-row">
                    <span className="conv-name">{conv.name}</span>
                    <span className="conv-time">{conv.lastTimestamp}</span>
                  </div>
                  <div className="conv-preview" style={{ color: 'var(--text-muted)' }}>
                    {conv.lastMessage}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="chat-area">
        {!activeChatId ? (
          <div className="empty-chat">
            <MessageSquare size={64} />
            <h2>Your Messages</h2>
            <p>Select a conversation or start a new one to chat.</p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="chat-header">
              <button className="back-btn" onClick={() => setActiveChatId(null)}>
                <ArrowLeft size={20} />
              </button>
              {activeConversation && (
                <>
                  <div style={{ position: 'relative' }}>
                    <Avatar name={activeConversation.name} url={activeConversation.avatar} size={40} />
                    {onlineUsers.has(activeConversation.otherId) && (
                      <span className="online-indicator" title="Online" style={{ width: 10, height: 10, bottom: 2, right: 2 }}></span>
                    )}
                  </div>
                  <div className="chat-user-info-stack">
                    <span className="chat-user-name">{activeConversation.name}</span>
                    {otherUserTyping ? (
                      <span className="typing-status-text">typing...</span>
                    ) : onlineUsers.has(activeConversation.otherId) ? (
                      <span className="online-status-text">Active now</span>
                    ) : null}
                  </div>
                </>
              )}
            </div>

            {/* Chat History */}
            <div className="chat-history">
              {currentChatMessages.map((msg, idx) => {
                const isSent = msg.sender_id === user.id;
                const showStamp = idx === currentChatMessages.length - 1 || 
                  new Date(currentChatMessages[idx+1].created_at).getTime() - new Date(msg.created_at).getTime() > 1000 * 60 * 5;
                
                return (
                  <div key={msg.id} className={`chat-bubble-wrapper ${isSent ? 'sent' : 'received'}`}>
                    <div className="bubble-content-stack">
                      <div className="chat-bubble">
                        {msg.media_url && (
                          <div className="chat-media-wrapper" style={{ marginBottom: msg.content ? '8px' : '0' }}>
                            <img src={msg.media_url} alt="Shared" style={{ maxWidth: '100%', borderRadius: '12px', cursor: 'pointer' }} onClick={() => window.open(msg.media_url, '_blank')} />
                          </div>
                        )}
                        <span className="msg-text">{msg.content}</span>
                      </div>
                      <div className="message-status-row">
                        {showStamp && (
                          <span className="chat-timestamp">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                        {isSent && (
                          <span className={`read-status-icon ${msg.read_at ? 'read' : ''}`}>
                            {msg.read_at ? (
                              <CheckCheck size={14} color="var(--primary)" />
                            ) : (
                              <Check size={14} />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {otherUserTyping && (
                <div className="chat-bubble-wrapper received">
                  <div className="typing-indicator-bubble chat-bubble">
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="chat-input-area">
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                accept="image/*" 
                onChange={handleFileUpload} 
              />
              <div className="chat-input-wrapper">
                <button 
                  className="attach-btn" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? <Loader2 className="animate-spin" size={20} /> : <ImageIcon size={20} />}
                </button>
                <input 
                  type="text" 
                  placeholder="Type a message..." 
                  value={messageInput}
                  onChange={handleTyping}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button 
                  className="send-btn" 
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() && !isUploading}
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

    </div>
  );
};
