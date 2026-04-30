import React, { useState } from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './FlagContentModal.css';

interface FlagContentModalProps {
  postId?: string;
  commentId?: string;
  userId: string;
  onClose: () => void;
}

const FLAG_REASONS = [
  'Spam',
  'Harassment or Hate Speech',
  'Inappropriate Content (NSFW)',
  'Misinformation',
  'Other'
];

export const FlagContentModal: React.FC<FlagContentModalProps> = ({ postId, commentId, userId, onClose }) => {
  const [selectedReason, setSelectedReason] = useState(FLAG_REASONS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    const { error } = await supabase
      .from('content_flags')
      .insert({
        reporter_id: userId,
        post_id: postId || null,
        comment_id: commentId || null,
        reason: selectedReason
      });

    if (!error) {
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } else {
      console.error('Error flagging content:', error);
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content flag-modal">
        <button className="close-btn" onClick={onClose}><X size={24} /></button>
        
        <h2><AlertTriangle size={20} style={{marginRight: 8, color: '#f59e0b'}} /> Report Content</h2>
        
        {success ? (
          <div className="flag-success">
            <p>Thank you for your report. Our moderation team will review this shortly.</p>
          </div>
        ) : (
          <>
            <p className="flag-description">
              Please select a reason for reporting this {postId ? 'post' : 'comment'}. This helps our moderation team take appropriate action.
            </p>
            
            <div className="flag-reasons">
              {FLAG_REASONS.map(reason => (
                <label key={reason} className="flag-reason-option">
                  <input 
                    type="radio" 
                    name="flagReason" 
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>
            
            <div className="modal-actions">
              <button className="cancel-btn" onClick={onClose}>Cancel</button>
              <button 
                className="submit-btn flag-submit" 
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Submit Report'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
