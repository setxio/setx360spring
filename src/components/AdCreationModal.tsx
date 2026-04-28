import React, { useState, useEffect } from 'react';
import { X, Megaphone, Loader2, Sparkles, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './AdCreationModal.css';

interface AdCreationModalProps {
  onClose: () => void;
}

export const AdCreationModal: React.FC<AdCreationModalProps> = ({ onClose }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    fetchCredits();
  }, []);

  const fetchCredits = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('ad_credits')
        .eq('id', user.id)
        .single();
      setCredits(profile?.ad_credits ?? 0);
    }
  };

  const handleSubmit = async () => {
    if (!credits || credits < 1) {
      alert("You don't have enough ad credits.");
      return;
    }

    setIsSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    // 1. Create Ad
    const { error: adError } = await supabase
      .from('ads')
      .insert([
        { 
          profile_id: user.id,
          title,
          content,
          image_url: imageUrl,
          target_url: targetUrl,
          status: 'pending'
        }
      ]);

    if (adError) {
      alert('Error creating ad: ' + adError.message);
      setIsSubmitting(false);
      return;
    }

    // 2. Deduction handled by DB Trigger on approval
    setIsSubmitting(false);
    onClose();
    alert('Ad submitted for review!');
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container premium-card fade-in">
        <div className="modal-header">
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Megaphone size={24} color="var(--primary)" />
            <h3>Create Sponsored Ad</h3>
          </div>
          <button className="close-btn" onClick={onClose} disabled={isSubmitting}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          <div className="credit-badge">
            <Sparkles size={16} />
            <span>Available Credits: <strong>{credits ?? '--'}</strong></span>
          </div>

          <div className="input-group">
            <label>Ad Title</label>
            <input 
              type="text" 
              placeholder="e.g. 50% Off Everything!"
              value={title}
              onChange={e => setTitle(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="input-group">
            <label>Ad Content</label>
            <textarea 
              placeholder="What do you want to promote to the community?"
              value={content}
              onChange={e => setContent(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="input-row">
            <div className="input-group">
              <label><ImageIcon size={14} /> Image URL</label>
              <input 
                type="text" 
                placeholder="https://images.unsplash.com/..."
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="input-group">
              <label><LinkIcon size={14} /> Target Link</label>
              <input 
                type="text" 
                placeholder="https://myshop.com"
                value={targetUrl}
                onChange={e => setTargetUrl(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button 
            className="primary-btn promote-btn" 
            onClick={handleSubmit}
            disabled={isSubmitting || !credits || credits < 1 || !title || !content}
            style={{ width: '100%', background: 'linear-gradient(to right, var(--primary), #818cf8)' }}
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Submit for Review (1 Credit)'}
          </button>
        </div>
      </div>
    </div>
  );
};
