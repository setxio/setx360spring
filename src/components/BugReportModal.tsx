import React, { useState, useEffect } from 'react';
import { X, Bug, Loader2, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface BugReportModalProps {
  onClose: () => void;
  user: any;
  platform: string;
}

export const BugReportModal: React.FC<BugReportModalProps> = ({ onClose, user, platform }) => {
  const [description, setDescription] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSubmitting, onClose]);

  const handleSubmit = async () => {
    if (!description.trim()) {
      alert('Please enter a description of the bug.');
      return;
    }
    setIsSubmitting(true);
    let screenshotUrl = null;

    try {
      const actualUserId = user?.id || (await supabase.auth.getUser()).data.user?.id;

      if (screenshot) {
        const fileExt = screenshot.name.split('.').pop();
        const fileName = `${actualUserId || 'anon'}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('bug_screenshots')
          .upload(fileName, screenshot);
          
        if (uploadError) throw uploadError;
        screenshotUrl = fileName;
      }

      const { error } = await supabase
        .from('bug_reports')
        .insert([{
          profile_id: actualUserId || null,
          platform: platform,
          description: description,
          screenshot_url: screenshotUrl,
          status: 'open'
        }]);

      if (error) throw error;
      setIsSuccess(true);
    } catch (error) {
      console.error('Error submitting bug report:', error);
      alert('Failed to submit bug report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const overlayStyle: React.CSSProperties = {
    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
    background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(10px)',
    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999,
  };

  const containerStyle: React.CSSProperties = {
    background: 'var(--surface, #1a1a2e)', borderRadius: '24px', width: '90%', maxWidth: '500px',
    border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 24px 64px rgba(0,0,0,0.6)', overflow: 'hidden',
  };

  if (isSuccess) {
    return (
      <div style={overlayStyle} onClick={onClose}>
        <div style={{ ...containerStyle, textAlign: 'center', padding: '48px 40px' }} onClick={e => e.stopPropagation()}>
          <Bug size={64} color="var(--primary)" style={{ marginBottom: '20px' }} />
          <h3 style={{ margin: '0 0 12px', fontSize: '1.4rem', fontWeight: 800 }}>Bug Reported!</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '28px', lineHeight: 1.5 }}>
            Thank you for helping us improve SETX 360! Our engineering team will review your report from the <strong>{platform}</strong> platform.
          </p>
          <button className="primary-btn" onClick={onClose} style={{ minWidth: '140px' }}>Done</button>
        </div>
      </div>
    );
  }

  return (
    <div style={overlayStyle} onClick={() => !isSubmitting && onClose()}>
      <div style={containerStyle} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Bug size={24} color="#ef4444" />
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Report a Bug</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', gap: '10px', background: 'rgba(239,68,68,0.08)', padding: '12px 14px', borderRadius: '12px', marginBottom: '20px', border: '1px solid rgba(239,68,68,0.15)' }}>
            <Info size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
            <p style={{ margin: 0, fontSize: '0.87rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              You are reporting an issue from the <strong>{platform}</strong> app. Please be as detailed as possible.
            </p>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>What happened?</label>
            <textarea
              placeholder="Describe what you expected to happen, and what actually happened..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              disabled={isSubmitting}
              rows={4}
              style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'var(--text, #fff)', fontSize: '0.95rem', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Screenshot (Optional)</label>
            <div style={{ border: '1px dashed rgba(255,255,255,0.2)', padding: '16px', borderRadius: '10px', textAlign: 'center', background: 'rgba(255,255,255,0.02)' }}>
              <input
                type="file"
                accept="image/*"
                onChange={e => setScreenshot(e.target.files?.[0] || null)}
                disabled={isSubmitting}
                style={{ width: '100%', color: 'var(--text-muted)', fontSize: '0.9rem' }}
              />
              {screenshot && <p style={{ margin: '8px 0 0', fontSize: '0.85rem', color: '#ef4444' }}>{screenshot.name}</p>}
            </div>
          </div>
        </div>

        <div style={{ padding: '0 24px 24px' }}>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            style={{ width: '100%', background: '#ef4444', color: '#fff', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1 }}
          >
            {isSubmitting ? <><Loader2 className="animate-spin" size={18} /> Sending...</> : 'Submit Report'}
          </button>
        </div>
      </div>
    </div>
  );
};
