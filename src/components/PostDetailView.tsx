import React, { useState, useEffect } from 'react';
import { ChevronLeft, Loader2, Send } from 'lucide-react';
import { PostCard } from './PostCard';
import { Avatar } from './Avatar';
import { supabase } from '../lib/supabase';
import './PostDetailView.css';

interface PostDetailViewProps {
  postId: string;
  user?: any;
  onBack: () => void;
}

export const PostDetailView: React.FC<PostDetailViewProps> = ({ postId, user, onBack }) => {
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPostAndComments();
  }, [postId]);

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
          country
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
            country
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
    const { data: commentsData } = await supabase
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

    setComments(commentsData || []);
    setIsLoading(false);
  };

  const handlePostComment = async () => {
    if (!newComment.trim() || !user) return;

    setIsSubmitting(true);
    const { error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        profile_id: user.id,
        content: newComment.trim()
      });

    if (!error) {
      setNewComment('');
      // Increment comment count
      await supabase.rpc('increment_post_comments', { post_id_val: postId });
      fetchPostAndComments();
    }
    setIsSubmitting(false);
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
          onRepost={() => {}}
          onShare={() => {}}
        />

        <div className="comments-section">
          <h3 className="comments-title">Comments ({comments.length})</h3>
          
          <div className="comments-list">
            {comments.length === 0 ? (
              <div className="empty-comments">
                <p>No comments yet. Start the conversation!</p>
              </div>
            ) : (
              comments.map(comment => (
                <div key={comment.id} className="comment-thread-item">
                  <Avatar 
                    url={comment.profiles?.avatar_url}
                    name={comment.profiles?.name || 'User'}
                    size={36}
                  />
                  <div className="comment-body">
                    <div className="comment-header">
                      <span className="comment-user">{comment.profiles?.name}</span>
                      <span className="comment-date">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="comment-text">{comment.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {user && (
        <div className="post-detail-footer">
          <div className="comment-input-wrapper glass">
            <Avatar url={user.avatar_url} name={user.name} size={32} />
            <input 
              type="text" 
              placeholder="Add a comment..." 
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
    </div>
  );
};
