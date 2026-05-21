import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Sparkles, Utensils, Ticket, Clock, Loader2, Navigation } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { OrderTrackingMap } from './OrderTrackingMap';
import './LocalActionAgent.css';

export const LocalActionAgent: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user'|'agent', content: string | React.ReactNode}[]>([
    { role: 'agent', content: "Hi! I'm your Local Action Agent. I don't just search—I execute. Tell me what you need done in SETX today." }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showTracking, setShowTracking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { success } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleConfirmAction = () => {
    success("Payment successful! Reservation confirmed, tickets bought, and rideshare dispatched.");
    setShowTracking(true);
  };

  const processAIResponse = (userText: string) => {
    setIsTyping(true);
    
    setTimeout(() => {
      let response: React.ReactNode | string = "";

      if (userText.toLowerCase().includes('date') || userText.toLowerCase().includes('dinner')) {
        response = (
          <div className="action-card fade-in">
            <div className="action-card-header">
              <Sparkles size={16} /> <span>Suggested Itinerary Generated</span>
            </div>
            
            <div className="action-card-body">
              <div className="action-item">
                <div className="action-icon"><Utensils size={18} /></div>
                <div className="action-details">
                  <h4>Dinner at Luigi's Italian</h4>
                  <p>Reservation for 2 • 7:00 PM</p>
                </div>
                <div className="action-price">$80 est.</div>
              </div>

              <div className="action-item">
                <div className="action-icon"><Ticket size={18} /></div>
                <div className="action-details">
                  <h4>Cinemark 12</h4>
                  <p>2 Tickets • "Dune: Part Two" • 8:45 PM</p>
                </div>
                <div className="action-price">$28.00</div>
              </div>

              <div className="action-item">
                <div className="action-icon"><Navigation size={18} /></div>
                <div className="action-details">
                  <h4>SETX Rideshare (Round Trip)</h4>
                  <p>Pickup at 6:30 PM</p>
                </div>
                <div className="action-price">$35.00</div>
              </div>
            </div>

            <div className="action-card-footer">
              <div className="total-price">Total: <strong>$143.00</strong></div>
              <button className="confirm-action-btn" onClick={handleConfirmAction}>
                1-Click Confirm & Book All
              </button>
            </div>
          </div>
        );
      } else {
        response = "I can help with that! Let me search the local grid for the best options. (Try asking me to 'Plan a date night for this Friday').";
      }

      setMessages(prev => [...prev, { role: 'agent', content: response }]);
      setIsTyping(false);
    }, 1500);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userText }]);
    setInput('');
    processAIResponse(userText);
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.button 
        className="action-agent-fab"
        onClick={() => setIsOpen(true)}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Sparkles size={24} />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="action-agent-window"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25 }}
          >
            <div className="agent-header">
              <div className="agent-title">
                <div className="agent-avatar"><Sparkles size={18} /></div>
                <div>
                  <h3>Omni-Agent</h3>
                  <p>Local Autonomous Execution</p>
                </div>
              </div>
              <button className="close-agent-btn" onClick={() => setIsOpen(false)}><X size={20} /></button>
            </div>

            <div className="agent-messages">
              {messages.map((msg, i) => (
                <div key={i} className={`message-bubble ${msg.role}`}>
                  {msg.role === 'agent' && <div className="message-avatar"><Sparkles size={14} /></div>}
                  <div className="message-content">{msg.content}</div>
                </div>
              ))}
              
              {isTyping && (
                <div className="message-bubble agent typing">
                  <div className="message-avatar"><Sparkles size={14} /></div>
                  <div className="message-content">
                    <Loader2 className="animate-spin" size={16} /> Parsing local data...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form className="agent-input-area" onSubmit={handleSend}>
              <input 
                type="text" 
                placeholder="Ask me to do something locally..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <button type="submit" disabled={!input.trim()}><Send size={18} /></button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Show Tracking Map if rideshare booked */}
      <AnimatePresence>
        {showTracking && (
          <OrderTrackingMap 
            orderId="RIDE-09X2" 
            productName="SETX Rideshare (VIP)" 
            storeName="Local Driver Network" 
            onClose={() => setShowTracking(false)} 
          />
        )}
      </AnimatePresence>
    </>
  );
};
