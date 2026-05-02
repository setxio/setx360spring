import React, { useState, useEffect } from 'react';
import { ChevronLeft, Loader2, Send, ThumbsUp, ThumbsDown, MessageCircle, Share2, Eye, Flag, X, MapPin, Sparkles, Bot } from 'lucide-react';
import { PostCard } from './PostCard';
import { Avatar } from './Avatar';
import { supabase } from '../lib/supabase';
import { formatText } from '../utils/textFormatting';
import { formatRelativeTime } from '../utils/dateUtils';
import { FlagContentModal } from './FlagContentModal';
import './PostDetailView.css';

interface PostDetailViewProps {
  postId: string;
  highlightCommentId?: string;
  user?: any;
  onBack: () => void;
  onNavigateToProfile?: (profileId: string) => void;
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

const CommentNode = ({ 
  comment, 
  user, 
  onReply, 
  onVote, 
  onDelete, 
  onReport, 
  onNavigateToProfile,
  depth = 0
}: any) => {
  return (
    <div className="comment-node-container">
      <div 
        id={`comment-${comment.id}`}
        className={`comment-thread-item ${depth > 0 ? 'is-reply' : ''}`}
        style={depth > 0 ? { marginLeft: Math.min(depth * 24, 48) + 'px' } : undefined}
      >
        <Avatar 
          url={comment.profiles?.avatar_url}
          name={comment.profiles?.name || 'User'}
          size={depth > 0 ? 28 : 36}
        />
        <div className="comment-body">
          <div className="comment-content-main">
            <div className="comment-header">
              <span 
                className="comment-user"
                onClick={() => comment.profile_id && onNavigateToProfile?.(comment.profile_id)}
                style={{ cursor: 'pointer' }}
              >
                {comment.profiles?.name}
                {comment.profiles?.email?.includes('setxplatform+') && (
                  <Bot size={14} className="bot-badge" style={{ color: 'var(--primary)', marginLeft: '4px', display: 'inline' }} />
                )}
              </span>
              {comment.profiles?.community && (
                <span className="post-location" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '2px', color: 'var(--primary)', fontWeight: '600' }}>
                  <MapPin size={10} />
                  {comment.profiles.community}
                </span>
              )}
              <span className="comment-date">
                {formatRelativeTime(comment.created_at)}
              </span>
            </div>
            <p className="comment-text">{formatText(comment.content)}</p>
            
            <div className="comment-actions">
              <div className="comment-action-group">
                <button className="c-action-btn" onClick={() => onVote(comment.id, 1)}>
                  <ThumbsUp size={14} /> <span>{comment.upvote_count || 0}</span>
                </button>
                <button className="c-action-btn" onClick={() => onVote(comment.id, -1)}>
                  <ThumbsDown size={14} /> <span>{comment.downvote_count || 0}</span>
                </button>
                <button className="c-action-btn" onClick={() => onReply(comment)}>
                  <MessageCircle size={14} /> <span>Reply</span>
                </button>
                <button className="c-action-btn" title="Share Comment" onClick={(e) => {
                  e.stopPropagation();
                  const url = `${window.location.origin}/?post=${comment.post_id}&comment=${comment.id}`;
                  navigator.clipboard?.writeText(url).then(() => {
                    const t = document.createElement('div');
                    t.textContent = '✓ Link copied!';
                    Object.assign(t.style, { position:'fixed', bottom:'80px', left:'50%', transform:'translateX(-50%)', background:'var(--primary)', color:'#fff', padding:'8px 18px', borderRadius:'24px', fontSize:'0.85rem', fontWeight:'600', zIndex:'9999' });
                    document.body.appendChild(t);
                    setTimeout(() => t.remove(), 2000);
                  });
                }}>
                  <Share2 size={14} />
                </button>
                {user && user.id !== comment.profile_id && (
                  <button 
                    className="c-action-btn" 
                    title="Report Comment"
                    onClick={() => onReport(comment.id)}
                  >
                    <Flag size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="comment-side-actions">
            {user && user.id === comment.profile_id ? (
              <button 
                className="comment-delete-btn" 
                onClick={() => onDelete(comment.id)}
                title="Delete Comment"
              >
                <X size={16} />
              </button>
            ) : (
              <div style={{height: 24}}></div>
            )}
            <div className="comment-views">
              <Eye size={12} /> <span>{comment.views || 0}</span>
            </div>
          </div>
        </div>
      </div>
      
      {comment.replies && comment.replies.length > 0 && (
        <div className="comment-replies">
          {comment.replies.map((reply: any) => (
            <CommentNode 
              key={reply.id} 
              comment={reply} 
              user={user}
              onReply={onReply}
              onVote={onVote}
              onDelete={onDelete}
              onReport={onReport}
              onNavigateToProfile={onNavigateToProfile}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const PostDetailView: React.FC<PostDetailViewProps> = ({ postId, highlightCommentId, user, onBack, onNavigateToProfile }) => {
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<any>(null);
  const [flagCommentId, setFlagCommentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTevisThinking, setIsTevisThinking] = useState(false);

  useEffect(() => {
    fetchPostAndComments();
    incrementViews();

    // Subscribe to new comments for this post
    const channel = supabase
      .channel(`post-comments-${postId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${postId}`
        },
        (payload) => {
          // If the new comment is from Tevis, stop the thinking indicator
          if (payload.new.profile_id === 'bc1216fe-057f-4fed-8555-8c0e66ed29d3') {
            setIsTevisThinking(false);
          }
          refreshCommentsOnly(); // Silent refresh
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId]);

  const incrementViews = async () => {
    try {
      await supabase.rpc('increment_post_views', { post_id_val: postId });
    } catch (err) {
      console.error('Failed to increment views', err);
    }
  };

  useEffect(() => {
    if (!isLoading && highlightCommentId) {
      setTimeout(() => {
        const el = document.getElementById(`comment-${highlightCommentId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('highlight-pulse');
        }
      }, 500);
    }
  }, [isLoading, highlightCommentId]);

  const refreshCommentsOnly = async () => {
    const { data: commentsData } = await supabase
      .from('comments')
      .select(`
        *,
        profiles!comments_profile_id_fkey (
          id,
          name,
          avatar_url,
          role,
          community,
          email
        )
      `)
      .eq('post_id', postId)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true });

    if (commentsData) setComments(commentsData);
  };

  const fetchPostAndComments = async () => {
    setIsLoading(true);
    
    // Fetch Post
    const { data: postData, error: postError } = await supabase
      .from('posts')
      .select(`
        *,
        author:profiles!posts_profile_id_fkey (
          id,
          name,
          avatar_url,
          role,
          community,
          county,
          state,
          country,
          email
        ),
        original_post:original_post_id (
          *,
          author:profiles!posts_profile_id_fkey (
            id,
            name,
            avatar_url,
            role,
            community,
            county,
            state,
            country,
            email
          )
        )
      `)
      .eq('id', postId)
      .single();

    if (postError) {
      console.error('Error fetching post:', postError);
      setIsLoading(false);
      return;
    }

    setPost(postData);

    // Fetch Comments
    await refreshCommentsOnly();
    setIsLoading(false);
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    
    setIsSubmitting(true);
    const isSummoningTevis = newComment.toLowerCase().includes('@tevis');
    
    const { error: submitError } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        profile_id: user.id,
        content: newComment,
        parent_id: replyTo?.id || null
      });

    if (submitError) {
      console.error('Error posting comment:', submitError);
      setError(submitError.message);
      setIsSubmitting(false);
    } else {
      setNewComment('');
      setReplyTo(null);
      if (isSummoningTevis) {
        setIsTevisThinking(true);
        // Auto-refresh fallback after 10 seconds if realtime fails or Gemini is slow
        setTimeout(() => setIsTevisThinking(false), 10000);
      }
      // fetchPostAndComments() is NOT needed here because the Realtime subscription 
      // will trigger refreshCommentsOnly() as soon as the database insert is complete.
      setIsSubmitting(false);
    }
  };

  const handleCommentVote = async (commentId: string, type: 1 | -1) => {
    if (!user) return;
    // Optimistic UI update for instant feedback
    setComments((prev: any[]) => prev.map((c: any) => {
      if (c.id === commentId) {
        return {
          ...c,
          upvote_count: type === 1 ? (c.upvote_count || 0) + 1 : c.upvote_count,
          downvote_count: type === -1 ? (c.downvote_count || 0) + 1 : c.downvote_count
        };
      }
      return c;
    }));
    // Persist to DB (fire-and-forget, errors are non-critical)
    const rpcName = type === 1 ? 'increment_comment_upvotes' : 'increment_comment_downvotes';
    supabase.rpc(rpcName, { comment_id_val: commentId }).then(({ error }) => {
      if (error) console.warn('Comment vote RPC failed:', error.message);
    });
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    
    // Optimistic UI update for real-time feel
    setComments(prev => prev.filter(c => c.id !== commentId));

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);
      
    if (error) {
      console.error('Error deleting comment:', error);
      setError(error.message);
      // Revert if error
      fetchPostAndComments();
    }
  };

  if (isLoading) {
    return (
      <div className="post-detail-loading">
        <Loader2 className="animate-spin" size={48} color="var(--primary)" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="post-detail-error">
        <p>Post not found.</p>
        <button onClick={onBack}>Go Back</button>
      </div>
    );
  }

  return (
    <div className="post-detail-view fade-in">
      <div className="post-detail-header">
        <button className="back-btn" onClick={onBack}>
          <ChevronLeft size={24} />
          <span>Back to Feed</span>
        </button>
      </div>

      <div className="post-detail-content">
        <PostCard 
          post={post} 
          user={user} 
          hideCommentPreview={true} 
          onPollVote={() => fetchPostAndComments()}
          onDelete={() => onBack()}
          onRepost={async (postId) => {
            if (!user) return;
            await supabase.from('posts').insert({ profile_id: user.id, type: 'repost', original_post_id: postId, content: '' });
            const t = document.createElement('div');
            t.textContent = '\u2713 Reposted to your timeline';
            Object.assign(t.style, { position:'fixed', bottom:'80px', left:'50%', transform:'translateX(-50%)', background:'var(--primary)', color:'#fff', padding:'10px 20px', borderRadius:'24px', fontSize:'0.9rem', fontWeight:'600', zIndex:'9999' });
            document.body.appendChild(t);
            setTimeout(() => t.remove(), 2500);
          }}
          onShare={async (postId) => {
            const url = `${window.location.origin}/?post=${postId}`;
            if (navigator.share) { try { await navigator.share({ title: 'SETX 360', url }); } catch(e) {} }
            else { await navigator.clipboard?.writeText(url); alert('Link copied!'); }
          }}
          onNavigateToProfile={onNavigateToProfile}
        />

        <div className="comments-section">
          <h3 className="comments-title">Comments ({comments.length})</h3>
          
          <div className="comments-list">
            {isTevisThinking && (
              <div className="tevis-thinking-indicator animate-pulse">
                <Sparkles size={16} color="var(--primary)" />
                <span>Tevis is researching and typing...</span>
              </div>
            )}
            {comments.length === 0 && !isTevisThinking ? (
              <div className="empty-comments">
                <p>No comments yet. Start the conversation!</p>
              </div>
            ) : (
              buildCommentTree(comments).map((rootComment: any) => (
                <CommentNode 
                  key={rootComment.id}
                  comment={rootComment}
                  user={user}
                  onReply={setReplyTo}
                  onVote={handleCommentVote}
                  onDelete={handleDeleteComment}
                  onReport={setFlagCommentId}
                  onNavigateToProfile={onNavigateToProfile}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {user && (
        <div className="post-detail-footer">
          {error && (
            <div className="error-indicator animate-fade-in">
              <span>{error}</span>
              <button onClick={() => setError(null)}>X</button>
            </div>
          )}
          {replyTo && (
            <div className="reply-indicator animate-fade-in">
              <span>Replying to <strong>{replyTo.profiles?.name}</strong></span>
              <button onClick={() => setReplyTo(null)}>Cancel</button>
            </div>
          )}
          <div className="comment-input-wrapper glass">
            <Avatar url={user.avatar_url} name={user.name} size={32} className="comment-input-avatar" />
            <input 
              type="text" 
              placeholder={replyTo ? "Write a reply..." : "Add a comment..."} 
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
              disabled={isSubmitting}
            />
            <button 
              className={`send-btn ${newComment.trim() ? 'active' : ''}`}
              onClick={handlePostComment}
              disabled={isSubmitting || !newComment.trim()}
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
            </button>
          </div>
        </div>
      )}
      
      {flagCommentId && user && (
        <FlagContentModal
          commentId={flagCommentId}
          userId={user.id}
          onClose={() => setFlagCommentId(null)}
        />
      )}
    </div>
  );
};
