import type { User } from '../types/user';
import React, { useState, useEffect } from 'react';
import { X, Send, Loader2 } from 'lucide-react';
import { Avatar } from './Avatar';
import { supabase } from '../lib/supabase';
import { formatRelativeTime } from '../utils/dateUtils';
import './CommentsModal.css';

interface CommentsModalProps {
  postId: string;
  user: User;
  onClose: () => void;
  onCommentAdded: () => void;
}

const buildCommentTree = (flatComments: any[]) => {
  const commentMap = new Map();
  const roots: any[] = [];

  flatComments.forEach(c => {
    commentMap.set(c.id, { ...c, replies: [] });
  });

  flatComments.forEach(c => {
    if (c.parent_id && commentMap.has(c.parent_id)) {
      commentMap.get(c.parent_id).replies.push(commentMap.get(c.id));
    } else {
      roots.push(commentMap.get(c.id));
    }
  });

  return roots;
};

const SimpleCommentNode = ({ comment, onReply, depth = 0 }: any) => {
  return (
    <div className="comment-node-container" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div 
        style={{ 
          display: 'flex', 
          gap: '12px',
          marginLeft: depth > 0 ? `${Math.min(depth * 24, 48)}px` : '0',
          borderLeft: depth > 0 ? '2px solid rgba(255,255,255,0.1)' : 'none',
          paddingLeft: depth > 0 ? '12px' : '0'
        }}
      >
        <Avatar 
          url={comment.profiles?.avatar_url}
          name={comment.profiles?.name || 'User'}
          size={depth > 0 ? 28 : 36}
        />
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px', flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{comment.profiles?.name || 'User'}</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {formatRelativeTime(comment.created_at)}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-light)', lineHeight: 1.4, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {comment.content}
          </p>
          <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              onClick={() => onReply(comment)}
              style={{
                background: 'none', border: 'none', color: 'var(--text-muted)',
                fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
              }}
            >
              Reply
            </button>
          </div>
        </div>
      </div>
      
      {comment.replies && comment.replies.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {comment.replies.map((reply: any) => (
            <SimpleCommentNode 
              key={reply.id} 
              comment={reply} 
              onReply={onReply}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const CommentsModal: React.FC<CommentsModalProps> = ({ postId, user, onClose, onCommentAdded }) => {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();

    // Subscribe to new comments for this post
    const channel = supabase
      .channel(`modal-comments-${postId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${postId}`
        },
        () => {
          refreshCommentsOnly(); // Refresh list silently when a new comment arrives
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId]);

  const refreshCommentsOnly = async () => {
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
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true });

    if (!error && data) {
      setComments(data);
    }
  };

  const fetchComments = async () => {
    setIsLoading(true);
    await refreshCommentsOnly();
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
          content: newComment.trim(),
          parent_id: replyTo?.id || null
        }
      ]);

    if (error) {
      console.error('Error posting comment:', error);
      alert("Failed to post comment. Please try again.");
    } else {
      setNewComment('');
      setReplyTo(null);
      // fetchComments() is NOT needed here because Realtime handles the refresh silently
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
            buildCommentTree(comments).map((rootComment: any) => (
              <SimpleCommentNode 
                key={rootComment.id} 
                comment={rootComment} 
                onReply={setReplyTo}
              />
            ))
          )}
        </div>

        {user ? (
          <div className="modal-footer" style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {replyTo && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--primary)', padding: '0 8px' }}>
                <span>Replying to <strong>{replyTo.profiles?.name || 'User'}</strong></span>
                <button onClick={() => setReplyTo(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>Cancel</button>
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                placeholder={replyTo ? "Write a reply..." : "Write a comment..."} 
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
