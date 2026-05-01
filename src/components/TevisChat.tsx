import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, Loader2, Minimize2, Maximize2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './TevisChat.css';

interface Message {
  role: 'user' | 'tevis';
  content: string;
  timestamp: Date;
}

interface TevisChatProps {
  user?: any;
}

export const TevisChat: React.FC<TevisChatProps> = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'tevis', 
      content: `Howdy${user ? `, ${user.name}` : ''}! I'm Tevis, your Southeast Texas guide. How can I help y'all today?`, 
      timestamp: new Date() 
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Call the Tevis AI Edge Function
      const { data, error } = await supabase.functions.invoke('tevis-ai', {
        body: {
          message: input,
          history: messages.slice(-10).map(m => ({ role: m.role === 'tevis' ? 'model' : 'user', content: m.content })),
          userProfile: user
        }
      });

      if (error) throw error;

      const tevisMessage: Message = {
        role: 'tevis',
        content: data.reply,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, tevisMessage]);
    } catch (err) {
      console.error("Tevis Chat Error:", err);
      setMessages(prev => [...prev, {
        role: 'tevis',
        content: "I'm sorry, I'm having a bit of trouble connecting to my local roots. Can you try asking me again?",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button className="tevis-fab bounce-in" onClick={() => setIsOpen(true)}>
        <Bot size={28} />
        <span className="fab-label">Ask Tevis</span>
      </button>
    );
  }

  return (
    <div className={`tevis-container ${isMinimized ? 'minimized' : ''} slide-up`}>
      <div className="tevis-header">
        <div className="tevis-title">
          <Bot size={20} className="tevis-icon" />
          <div>
            <h3>Tevis</h3>
            <span>SETX 360 AI Guide</span>
          </div>
        </div>
        <div className="tevis-actions">
          <button onClick={() => setIsMinimized(!isMinimized)}>
            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
          <button onClick={() => setIsOpen(false)}><X size={18} /></button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <div className="tevis-messages" ref={scrollRef}>
            {messages.map((msg, i) => (
              <div key={i} className={`tevis-bubble-wrapper ${msg.role}`}>
                <div className="tevis-bubble">
                  {msg.content}
                </div>
                <span className="bubble-time">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
            {isLoading && (
              <div className="tevis-bubble-wrapper tevis">
                <div className="tevis-bubble loading">
                  <Loader2 className="animate-spin" size={16} />
                  Thinking...
                </div>
              </div>
            )}
          </div>

          <div className="tevis-input-area">
            <input 
              type="text" 
              placeholder="Ask me about SETX..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            />
            <button 
              className={`send-btn ${input.trim() ? 'active' : ''}`}
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
            >
              <Send size={18} />
            </button>
          </div>
        </>
      )}
    </div>
  );
};
