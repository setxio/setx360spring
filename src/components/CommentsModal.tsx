import React, { useState, useEffect } from 'react';
import { X, Send, Loader2 } from 'lucide-react';
import { Avatar } from './Avatar';
import { supabase } from '../lib/supabase';
import './CommentsModal.css';

interface CommentsModalProps {
  postId: string;
  user: any;
  onClose: () => void;
  onCommentAdded: () => void;
}

export const CommentsModal: React.FC<CommentsModalProps> = ({ postId, user, onClose, onCommentAdded }) => {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        profiles!comments_profile_id_fkey (
          id,
          name,
          avatar_url,
          role
        )
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
    } else {
      setComments(data || []);
    }
    setIsLoading(false);
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    if (!user) {
      alert("You need to be logged in to comment.");
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase
      .from('comments')
      .insert([
        {
          post_id: postId,
          profile_id: user.id,
          content: newComment.trim()
        }
      ]);

    if (error) {
      console.error('Error posting comment:', error);
      alert("Failed to post comment. Please try again.");
    } else {
      // Also update post comment count
      const { error: rpcError } = await supabase.rpc('increment_post_comments', { post_id_val: postId });
      if (rpcError) console.error("Could not increment count via RPC", rpcError);
        
      setNewComment('');
      fetchComments();
      onCommentAdded();
    }
    setIsSubmitting(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container premium-card fade-in" style={{ maxWidth: '500px', height: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header">
          <h3 style={{ margin: 0 }}>Comments</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
              <Loader2 className="animate-spin" size={32} color="var(--primary)" />
            </div>
          ) : comments.length === 0 ? (
            <div className="empty-state" style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '40px' }}>
              <p>No comments yet. Be the first!</p>
            </div>
          ) : (
            comments.map(comment => (
              <div key={comment.id} style={{ display: 'flex', gap: '12px' }}>
                <Avatar 
                  url={comment.profiles?.avatar_url}
                  name={comment.profiles?.name || 'User'}
                  size={36}
                />
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{comment.profiles?.name || 'E User'}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-light)', lineHeight: 1.4 }}>
                    {comment.content}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {user ? (
          <div className="modal-footer" style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '8px' }}>
            <input 
              type="text" 
              placeholder="Write a comment..." 
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handlePostComment();
              }}
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.05)',
                border: 'none',
                padding: '12px 16px',
                borderRadius: '24px',
                color: 'white',
                outline: 'none'
              }}
              disabled={isSubmitting}
            />
            <button 
              onClick={handlePostComment}
              disabled={isSubmitting || !newComment.trim()}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: newComment.trim() ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: newComment.trim() ? 'pointer' : 'not-allowed',
                color: 'white'
              }}
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} style={{ marginLeft: '-2px' }} />}
            </button>
          </div>
        ) : (
          <div className="modal-footer" style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Sign in to join the conversation.
          </div>
        )}
      </div>
    </div>
  );
};
