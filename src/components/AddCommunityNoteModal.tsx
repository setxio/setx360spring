import React, { useState } from 'react';
import { useToast } from '../context/ToastContext';
import { X, Info, Send, Loader2 } from 'lucide-react';
import { proposeCommunityNote } from '../lib/communityNotes';
import './AddCommunityNoteModal.css';

interface AddCommunityNoteModalProps {
  postId: string;
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddCommunityNoteModal: React.FC<AddCommunityNoteModalProps> = ({ postId, userId, onClose, onSuccess }) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { error: toastError } = useToast();

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const { error } = await proposeCommunityNote(postId, userId, content.trim());
    
    if (!error) {
      onSuccess();
      onClose();
    } else {
      toastError("Failed to propose note: " + error.message);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container premium-card fade-in" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-title">
            <Info size={20} className="text-amber" />
            <h3>Propose Community Note</h3>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          <div className="note-guidelines">
            <p><strong>Goal:</strong> Provide helpful context for others. Avoid opinions or harassment.</p>
            <ul>
              <li>Cite sources if possible</li>
              <li>Be neutral and objective</li>
              <li>Address specific claims in the post</li>
            </ul>
          </div>

          <textarea 
            placeholder="Write your note here... (max 280 characters)"
            value={content}
            onChange={e => setContent(e.target.value)}
            maxLength={280}
            className="note-textarea"
          />
          <div className="char-count">
            {content.length}/280
          </div>
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          <button 
            className="submit-btn" 
            onClick={handleSubmit}
            disabled={!content.trim() || isSubmitting}
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <>Propose Note <Send size={16} /></>}
          </button>
        </div>
      </div>
    </div>
  );
};
