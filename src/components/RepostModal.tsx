import type { User } from '../types/user';
import { useToast } from '../context/ToastContext';
import React, { useState } from 'react';
import { X, Repeat } from 'lucide-react';
import { Avatar } from './Avatar';
import { formatText } from '../utils/textFormatting';
import { supabase } from '../lib/supabase';

interface RepostModalProps {
  post: any;
  user: User;
  onClose: () => void;
  onSuccess: () => void;
}

export const RepostModal: React.FC<RepostModalProps> = ({ post, user, onClose, onSuccess }) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { error: toastError } = useToast();

  const handleRepost = async (withMessage: boolean) => {
    if (!user) return;
    setIsSubmitting(true);

    const { error } = await supabase.from('posts').insert({
      profile_id: user.id,
      type: 'repost',
      original_post_id: post.id,
      content: withMessage ? content.trim() : '',
      community: user.community,
      county: user.county
    });

    if (error) {
      console.error("Repost failed", error);
      toastError("Failed to repost.");
    } else {
      onSuccess();
    }
    setIsSubmitting(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content repost-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Repeat size={20} color="var(--primary)" /> 
            Repost
          </h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-body">
          {/* Quote Input */}
          <div className="repost-input-container" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <Avatar url={user?.avatar_url} name={user?.name} size={40} />
              <textarea
                placeholder="Add a comment..."
                value={content}
                onChange={e => setContent(e.target.value)}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text)',
                  fontSize: '1.1rem',
                  resize: 'none',
                  outline: 'none',
                  minHeight: '100px',
                  paddingTop: '8px'
                }}
                autoFocus
              />
            </div>
          </div>

          {/* Original Post Preview */}
          <div className="quoted-post-container" style={{ pointerEvents: 'none', margin: 0 }}>
            <div className="quoted-post-header">
              <Avatar url={post.author?.avatar_url} name={post.author?.name} size={20} />
              <span className="quoted-post-author">{post.author?.name}</span>
            </div>
            <div className="quoted-post-content" style={{ WebkitLineClamp: 2 }}>
              {formatText(post.content)}
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
          <button 
            className="secondary-btn" 
            onClick={() => handleRepost(false)}
            disabled={isSubmitting || content.trim().length > 0}
            style={{ borderRadius: '24px', padding: '8px 20px', display: content.trim() ? 'none' : 'block' }}
          >
            Quick Repost
          </button>
          <button 
            className="save-btn" 
            onClick={() => handleRepost(true)}
            disabled={isSubmitting || !content.trim()}
            style={{ borderRadius: '24px', padding: '8px 24px', background: 'var(--primary)', color: 'white', fontWeight: 600 }}
          >
            {isSubmitting ? 'Posting...' : content.trim() ? 'Quote Post' : 'Post'}
          </button>
        </div>
      </div>
    </div>
  );
};
