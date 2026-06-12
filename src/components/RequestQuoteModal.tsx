import React, { useState } from 'react';
import { X, Camera, Paperclip, Send, AlertCircle, Building, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import './RequestQuoteModal.css';

interface RequestQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  proName: string;
  proId: string;
  user: any;
}

export const RequestQuoteModal: React.FC<RequestQuoteModalProps> = ({ isOpen, onClose, proName, proId, user }) => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    timeline: 'Flexible',
    budget: '',
    address: user?.address || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'pro', text: 'Thanks for reaching out! Can you provide a bit more detail on your budget?', time: 'Just now' }
  ]);
  const [replyText, setReplyText] = useState('');

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      toast('Please provide project details', 'error');
      return;
    }
    
    setIsSubmitting(true);
    try {
      // In a real app, this goes to a 'service_quotes' table
      // Mocking submission delay for prototype
      await new Promise(r => setTimeout(r, 1200));
      
      setStep(2); // Success step
    } catch (err) {
      toast('Failed to send request', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="quote-modal-overlay">
      <div className="quote-modal">
        <button className="quote-modal-close" onClick={onClose}>
          <X size={24} />
        </button>

        {step === 1 ? (
          <>
            <div className="quote-header">
              <Building size={32} className="header-icon" />
              <h2>Request a Quote</h2>
              <p>Send a project request to <strong>{proName}</strong></p>
            </div>

            <form onSubmit={handleSubmit} className="quote-form">
              <div className="form-group">
                <label>Project Title</label>
                <input 
                  type="text" 
                  name="title"
                  placeholder="e.g., Master Bathroom Remodel" 
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Project Description</label>
                <textarea 
                  name="description"
                  placeholder="Describe what you need done in detail..."
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Expected Timeline</label>
                  <select name="timeline" value={formData.timeline} onChange={handleChange}>
                    <option value="ASAP">As Soon As Possible</option>
                    <option value="Within 1 Week">Within 1 Week</option>
                    <option value="Within 1 Month">Within 1 Month</option>
                    <option value="Flexible">Flexible</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Budget (Optional)</label>
                  <input 
                    type="text" 
                    name="budget"
                    placeholder="e.g., $5,000 - $10,000"
                    value={formData.budget}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Service Address</label>
                <input 
                  type="text" 
                  name="address"
                  placeholder="Street Address, City, Zip"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>

              <div className="attachment-zone">
                <Camera size={24} color="var(--text-muted)" />
                <span>Upload Photos or Blueprints</span>
                <p className="hint">JPEG, PNG, PDF up to 10MB</p>
              </div>

              <div className="quote-actions">
                <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
                <button type="submit" className="submit-btn" disabled={isSubmitting}>
                  {isSubmitting ? 'Sending...' : <><Send size={18} /> Request Quote</>}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="quote-messaging-interface" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '500px' }}>
            <div className="quote-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '16px' }}>
              <h2>Quote Thread</h2>
              <p>Discussing <strong>{formData.title}</strong> with <strong>{proName}</strong></p>
            </div>
            
            <div className="quote-chat-history" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px' }}>
              <div className="quote-msg user-msg" style={{ alignSelf: 'flex-end', background: 'var(--primary)', color: 'white', padding: '12px 16px', borderRadius: '16px 16px 0 16px', maxWidth: '85%' }}>
                <p style={{ margin: 0, fontSize: '0.95rem' }}><strong>Request:</strong> {formData.title}</p>
                <p style={{ margin: '8px 0 0', fontSize: '0.9rem', opacity: 0.9 }}>{formData.description}</p>
                <div style={{ fontSize: '0.75rem', opacity: 0.7, textAlign: 'right', marginTop: '4px' }}>Sent Request</div>
              </div>

              {messages.map((msg, i) => (
                <div key={i} className={`quote-msg ${msg.sender}-msg`} style={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', background: msg.sender === 'user' ? 'var(--primary)' : 'var(--bg-soft)', color: msg.sender === 'user' ? 'white' : 'var(--text)', border: msg.sender === 'user' ? 'none' : '1px solid var(--border)', padding: '12px 16px', borderRadius: msg.sender === 'user' ? '16px 16px 0 16px' : '16px 16px 16px 0', maxWidth: '85%' }}>
                  <p style={{ margin: 0, fontSize: '0.95rem' }}>{msg.text}</p>
                  <div style={{ fontSize: '0.75rem', opacity: 0.7, textAlign: msg.sender === 'user' ? 'right' : 'left', marginTop: '4px' }}>{msg.time}</div>
                </div>
              ))}
            </div>

            <div className="quote-input-area" style={{ borderTop: '1px solid var(--border)', padding: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button className="attach-btn" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px' }}>
                <Paperclip size={20} />
              </button>
              <input 
                type="text" 
                placeholder="Type your reply..." 
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && replyText.trim()) {
                    setMessages(prev => [...prev, { sender: 'user', text: replyText, time: 'Just now' }]);
                    setReplyText('');
                  }
                }}
                style={{ flex: 1, padding: '12px 16px', borderRadius: '24px', border: '1px solid var(--border)', background: 'var(--bg-soft)', color: 'var(--text)', outline: 'none' }}
              />
              <button 
                className="send-btn" 
                disabled={!replyText.trim()}
                onClick={() => {
                  if (replyText.trim()) {
                    setMessages(prev => [...prev, { sender: 'user', text: replyText, time: 'Just now' }]);
                    setReplyText('');
                  }
                }}
                style={{ background: replyText.trim() ? 'var(--primary)' : 'var(--bg-soft)', color: replyText.trim() ? 'white' : 'var(--text-muted)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: replyText.trim() ? 'pointer' : 'default', transition: 'all 0.2s' }}
              >
                <Send size={18} style={{ marginLeft: '2px' }} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
