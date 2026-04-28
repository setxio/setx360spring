import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, CheckCircle2, Loader2, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface VerificationModalProps {
  onClose: () => void;
  user: any;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({ onClose, user }) => {
  const [role, setRole] = useState(user.role === 'visitor' ? 'resident' : user.role);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSubmitting, onClose]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const { error } = await supabase
      .from('verifications')
      .insert([{
        profile_id: user.id || (await supabase.auth.getUser()).data.user?.id,
        requested_role: role,
        notes: notes,
        status: 'pending'
      }]);

    if (error) {
      console.error('Error submitting verification:', error);
      alert('Failed to submit request.');
    } else {
      setIsSuccess(true);
    }
    setIsSubmitting(false);
  };

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  };

  const containerStyle: React.CSSProperties = {
    background: 'var(--surface, #1a1a2e)',
    borderRadius: '24px',
    width: '90%',
    maxWidth: '500px',
    border: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
    overflow: 'hidden',
  };

  if (isSuccess) {
    return (
      <div style={overlayStyle} onClick={onClose}>
        <div style={{ ...containerStyle, textAlign: 'center', padding: '48px 40px' }} onClick={e => e.stopPropagation()}>
          <CheckCircle2 size={64} color="var(--primary)" style={{ marginBottom: '20px' }} />
          <h3 style={{ margin: '0 0 12px', fontSize: '1.4rem', fontWeight: 800 }}>Request Submitted!</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '28px', lineHeight: 1.5 }}>
            Our admin team will review your <strong>{role}</strong> verification request. You'll receive your badge once approved.
          </p>
          <button className="primary-btn" onClick={onClose} style={{ minWidth: '140px' }}>Done</button>
        </div>
      </div>
    );
  }

  return (
    <div style={overlayStyle} onClick={() => !isSubmitting && onClose()}>
      <div style={containerStyle} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <ShieldCheck size={24} color="var(--primary)" />
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Get Verified</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', gap: '10px', background: 'rgba(99,102,241,0.08)', padding: '12px 14px', borderRadius: '12px', marginBottom: '20px', border: '1px solid rgba(99,102,241,0.15)' }}>
            <Info size={16} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <p style={{ margin: 0, fontSize: '0.87rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Verification confirms your status to the community and unlocks exclusive features.
            </p>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Badge Type</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              disabled={isSubmitting}
              style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'var(--text, #fff)', fontSize: '0.95rem', outline: 'none', cursor: 'pointer' }}
            >
              <option value="resident">Resident</option>
              <option value="business">Business</option>
              <option value="venue">Venue</option>
              <option value="media">Media</option>
              <option value="non_profit">Non Profit</option>
              <option value="church">Church</option>
              <option value="artist">Artist</option>
              <option value="chamber">Chamber Member</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Proof / Notes (Optional)</label>
            <textarea
              placeholder="Business address, social handle, or any details that help us verify you..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              disabled={isSubmitting}
              rows={3}
              style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'var(--text, #fff)', fontSize: '0.9rem', resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '0 24px 24px' }}>
          <button
            className="primary-btn"
            onClick={handleSubmit}
            disabled={isSubmitting}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            {isSubmitting ? <><Loader2 className="animate-spin" size={18} /> Submitting...</> : 'Submit Request'}
          </button>
        </div>

      </div>
    </div>
  );
};
