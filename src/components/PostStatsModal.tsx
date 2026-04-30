import React, { useState, useEffect } from 'react';
import { X, Eye, ThumbsUp, ThumbsDown, MessageCircle, Repeat, Flame, MapPin, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Avatar } from './Avatar';
import './PostStatsModal.css';

interface PostStatsModalProps {
  post: any;
  onClose: () => void;
}

export const PostStatsModal: React.FC<PostStatsModalProps> = ({ post, onClose }) => {
  const [interactions, setInteractions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchInteractions();
  }, [post.id]);

  const fetchInteractions = async () => {
    setIsLoading(true);
    
    // 1. Fetch Likes
    const { data: likesData, error: likesError } = await supabase
      .from('likes')
      .select(`
        id,
        created_at,
        profiles!likes_profile_id_fkey (
          id,
          name,
          avatar_url,
          community
        )
      `)
      .eq('post_id', post.id);

    // 2. Fetch Comments
    const { data: commentsData, error: commentsError } = await supabase
      .from('comments')
      .select(`
        id,
        created_at,
        content,
        profiles!comments_profile_id_fkey (
          id,
          name,
          avatar_url,
          community
        )
      `)
      .eq('post_id', post.id);

    if (likesError) console.error("Error fetching likes:", likesError);
    if (commentsError) console.error("Error fetching comments:", commentsError);

    // 3. Format and Merge
    const formattedLikes = (likesData || []).map(like => ({
      id: `like-${like.id}`,
      type: 'like',
      date: new Date(like.created_at),
      profile: like.profiles,
      content: 'Liked this post'
    }));

    const formattedComments = (commentsData || []).map(comment => ({
      id: `comment-${comment.id}`,
      type: 'comment',
      date: new Date(comment.created_at),
      profile: comment.profiles,
      content: `Commented: "${comment.content.length > 30 ? comment.content.substring(0, 30) + '...' : comment.content}"`
    }));

    // Combine and sort by newest first
    const merged = [...formattedLikes, ...formattedComments].sort((a, b) => b.date.getTime() - a.date.getTime());
    
    setInteractions(merged);
    setIsLoading(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container stats-modal fade-in">
        <div className="modal-header">
          <h2>Post Analytics</h2>
          <button className="close-btn" onClick={onClose}><X size={24} /></button>
        </div>
        
        <div className="stats-overview">
          <div className="stat-box"><Eye size={18} /> <span>{post.views || 0} Views</span></div>
          <div className="stat-box"><ThumbsUp size={18} /> <span>{post.upvote_count || 0} Likes</span></div>
          <div className="stat-box"><ThumbsDown size={18} /> <span>{post.downvote_count || 0} Dislikes</span></div>
          <div className="stat-box"><MessageCircle size={18} /> <span>{post.comments_count || 0} Comments</span></div>
          <div className="stat-box"><Repeat size={18} /> <span>{post.repost_count || 0} Reposts</span></div>
          <div className="stat-box"><Flame size={18} color="#ef4444" /> <span>{post.hot_score?.toFixed(1) || 0} Hot Score</span></div>
        </div>

        <div className="interactions-section">
          <h3>Activity Feed</h3>
          
          {isLoading ? (
            <div className="stats-loading">
              <Loader2 className="animate-spin" size={32} />
              <p>Loading interactions...</p>
            </div>
          ) : interactions.length === 0 ? (
            <div className="empty-stats">
              <p>No recorded interactions yet.</p>
            </div>
          ) : (
            <div className="interactions-list">
              {interactions.map(interaction => (
                <div key={interaction.id} className="interaction-item">
                  <Avatar 
                    url={interaction.profile?.avatar_url} 
                    name={interaction.profile?.name || 'User'} 
                    size={36} 
                  />
                  <div className="interaction-details">
                    <div className="interaction-header">
                      <span className="interaction-name">{interaction.profile?.name}</span>
                      {interaction.profile?.community && (
                        <span className="interaction-location">
                          <MapPin size={10} />
                          {interaction.profile.community}
                        </span>
                      )}
                    </div>
                    <div className="interaction-action">
                      {interaction.type === 'like' ? (
                        <span className="action-badge like"><ThumbsUp size={12} /> Liked</span>
                      ) : (
                        <span className="action-badge comment"><MessageCircle size={12} /> Commented</span>
                      )}
                      <span className="interaction-date">{interaction.date.toLocaleDateString()} at {interaction.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    {interaction.type === 'comment' && (
                      <p className="interaction-content-preview">{interaction.content}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
