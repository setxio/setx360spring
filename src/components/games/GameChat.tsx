import React, { useState, useEffect, useRef } from 'react';
import { Send, User as UserIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../Avatar';
import './GameChat.css';

interface Message {
  id: string;
  user_id: string;
  user_name: string;
  avatar_url?: string;
  content: string;
  created_at: string;
}

export const GameChat: React.FC = () => {
  const { user } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const channel = supabase.channel('slingo-chat', {
      config: { broadcast: { self: true } }
    });

    channel
      .on('broadcast', { event: 'chat-message' }, (payload) => {
        setMessages((prev) => [...prev, payload.payload as Message]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !user) return;

    const newMessage: Message = {
      id: Math.random().toString(36).substring(7),
      user_id: user.id,
      user_name: user.first_name ? `${user.first_name} ${user.last_name || ''}` : 'Anonymous',
      avatar_url: user.avatar_url,
      content: inputValue.trim(),
      created_at: new Date().toISOString(),
    };

    supabase.channel('slingo-chat').send({
      type: 'broadcast',
      event: 'chat-message',
      payload: newMessage,
    });
    
    setInputValue('');
  };

  return (
    <div className="game-chat-inner">
      <div className="game-chat-messages">
        {messages.length === 0 ? (
          <div className="game-chat-empty">
            Welcome to the Slingo Room!<br/>Be the first to say hello.
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="game-chat-message-row">
              <Avatar url={msg.avatar_url} name={msg.user_name} size={32} />
              <div className="game-chat-message-content">
                <div className="game-chat-message-header">
                  <span className="game-chat-user">{msg.user_name}</span>
                  <span className="game-chat-time">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="game-chat-text">{msg.content}</p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="game-chat-input-area">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={user ? "Say something..." : "Sign in to chat"}
          disabled={!user}
          className="game-chat-input"
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || !user}
          className="game-chat-send-btn"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};
