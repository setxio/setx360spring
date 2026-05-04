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
  const [credits, setCredits] = useState<number>(0);
  const [lastFreeAd, setLastFreeAd] = useState<string | null>(null);
  const [adType, setAdType] = useState<'free' | 'premium'>('free');
  const [duration, setDuration] = useState<15 | 30>(15);

  useEffect(() => {
    fetchCredits();
  }, []);

  const fetchCredits = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('ad_credits, last_free_ad_at')
        .eq('id', user.id)
        .single();
      setCredits(profile?.ad_credits ?? 0);
      setLastFreeAd(profile?.last_free_ad_at);
    }
  };

  const isMonthlyFreeEligible = () => {
    if (!lastFreeAd) return true;
    const lastDate = new Date(lastFreeAd);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return lastDate < thirtyDaysAgo;
  };

  const handleSubmit = async () => {
    const isFreeEligible = credits > 0 || isMonthlyFreeEligible();
    
    if (adType === 'free' && !isFreeEligible) {
      alert("You have used your free credits and your monthly free ad is not yet available.");
      return;
    }

    setIsSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + duration);

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
          status: 'pending',
          ad_type: adType,
          priority: adType === 'premium' ? 100 : 0,
          expires_at: expiresAt.toISOString()
        }
      ]);

    if (adError) {
      alert('Error creating ad: ' + adError.message);
      setIsSubmitting(false);
      return;
    }

    // 2. Update Credits or Monthly Timestamp
    if (adType === 'free') {
      if (credits > 0) {
        await supabase.from('profiles').update({ ad_credits: credits - 1 }).eq('id', user.id);
      } else {
        await supabase.from('profiles').update({ last_free_ad_at: new Date().toISOString() }).eq('id', user.id);
      }
    }

    setIsSubmitting(false);
    onClose();
    alert(adType === 'premium' ? 'Premium ad submitted! (Payment due upon approval)' : 'Ad submitted for review!');
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

          <div className="input-group">
            <label>Campaign Type</label>
            <div style={{ display: 'flex', gap: 10 }}>
              <button 
                className={`secondary-btn ${adType === 'free' ? 'active' : ''}`}
                style={{ flex: 1, padding: '12px', border: adType === 'free' ? '2px solid var(--primary)' : '1px solid var(--border)' }}
                onClick={() => { setAdType('free'); setDuration(15); }}
              >
                <strong>Free Ad</strong>
                <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>{credits > 0 ? `${credits} Credits Left` : (isMonthlyFreeEligible() ? 'Monthly Free Available' : 'Next Month Available')}</div>
              </button>
              <button 
                className={`secondary-btn ${adType === 'premium' ? 'active' : ''}`}
                style={{ flex: 1, padding: '12px', border: adType === 'premium' ? '2px solid var(--primary)' : '1px solid var(--border)' }}
                onClick={() => setAdType('premium')}
              >
                <strong>Premium Boost</strong>
                <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>$1 / Day (Top Priority)</div>
              </button>
            </div>
          </div>

          {adType === 'premium' && (
            <div className="input-group">
              <label>Duration</label>
              <select 
                value={duration} 
                onChange={(e) => setDuration(parseInt(e.target.value) as 15 | 30)}
                style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border)', borderRadius: '8px' }}
              >
                <option value={15}>15 Days ($15.00)</option>
                <option value={30}>30 Days ($30.00)</option>
              </select>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button 
            className="primary-btn promote-btn" 
            onClick={handleSubmit}
            disabled={isSubmitting || !title || !content}
            style={{ width: '100%', background: 'linear-gradient(to right, var(--primary), #818cf8)' }}
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : `Submit ${adType.charAt(0).toUpperCase() + adType.slice(1)} Ad`}
          </button>
        </div>
      </div>
    </div>
  );
};
