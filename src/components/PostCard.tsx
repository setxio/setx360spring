import React, { useState, useEffect } from 'react';
import { MessageCircle, Share2, Repeat, MapPin, X, Calendar, Info, Eye, ShieldCheck, Sparkles, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Avatar } from './Avatar';
import { VoteButtons } from './VoteButtons';
import { RSVPButtons } from './RSVPButtons';
import { CommentPreview } from './CommentPreview';
import { CommunityNoteCard } from './CommunityNoteCard';
import { AddCommunityNoteModal } from './AddCommunityNoteModal';
import { getCommunityNotes } from '../lib/communityNotes';
import { OptimizedImage } from './OptimizedImage';
import './PostCard.css';

interface PostCardProps {
  post: any;
  user?: any;
  userVote?: number;
  userPollVote?: number;
  onPollVote: (post: any, optionIndex: number) => void;
  onDelete: (postId: string) => void;
  onRepost: (postId: string) => void;
  onShare: (postId: string) => void;
  onNavigateToPost?: (postId: string) => void;
  hideCommentPreview?: boolean;
}

export const PostCard: React.FC<PostCardProps> = ({ 
  post, 
  user, 
  userVote, 
  userPollVote, 
  onPollVote, 
  onDelete, 
  onRepost, 
  onShare,
  onNavigateToPost,
  hideCommentPreview = false
}) => {
  const [communityNotes, setCommunityNotes] = useState<any[]>([]);
  const [isAddingNote, setIsAddingNote] = useState(false);

  const contentPost = post.type === 'repost' && post.original_post ? post.original_post : post;
  const isEvent = contentPost.type === 'event';
  const isAuthor = user?.id === post.profile_id || user?.role === 'admin';

  useEffect(() => {
    fetchNotes();
  }, [contentPost.id]);

  const fetchNotes = async () => {
    const { data } = await getCommunityNotes(contentPost.id);
    if (data) setCommunityNotes(data);
  };

  const helpfulNotes = communityNotes.filter(n => n.status === 'helpful');
  const proposedNotesCount = communityNotes.filter(n => n.status === 'proposed').length;

  return (
    <div 
      className={`premium-card post-card ${isEvent ? 'event-highlight' : ''}`} 
      onClick={() => onNavigateToPost?.(contentPost.id)}
      style={{ 
        cursor: onNavigateToPost ? 'pointer' : 'default',
        marginBottom: '16px',
        border: isEvent ? '2px solid var(--secondary)' : 'none'
      }}
    >
      {post.type === 'repost' && (
        <div className="repost-indicator">
          <Repeat size={14} /> {post.profiles?.name || 'Someone'} reposted
        </div>
      )}

      {isEvent && (
        <div className="event-badge">
          <Calendar size={10} /> UPCOMING EVENT
        </div>
      )}
      
      {contentPost.type === 'civic' && (
        <div className={`civic-status-badge ${contentPost.metadata?.civic_status || 'open'}`}>
          {contentPost.metadata?.civic_status === 'resolved' ? <CheckCircle size={10} /> : 
           contentPost.metadata?.civic_status === 'in_progress' ? <Clock size={10} className="animate-spin" /> : 
           <AlertTriangle size={10} />}
          <span>{(contentPost.metadata?.civic_type || 'ISSUE').toUpperCase()}: {(contentPost.metadata?.civic_status || 'OPEN').toUpperCase()}</span>
        </div>
      )}

      <div className="post-header">
        <div className="header-left">
          <Avatar 
            url={contentPost.author?.avatar_url}
            name={contentPost.author?.name || 'User'}
            size={40}
          />
          <div className="author-info">
            <h4 className="author-name">
              {contentPost.author?.name || 'E User'}
              {contentPost.author?.is_verified && <ShieldCheck size={14} className="verified-tick" style={{ marginLeft: 4, display: 'inline' }} />}
            </h4>
            <div className="post-meta">
              <span className="post-date">
                {new Date(contentPost.created_at).toLocaleDateString()}
              </span>
              {contentPost.location && (
                <span className="post-location">
                  <MapPin size={12} /> 
                  {contentPost.location}
                </span>
              )}
            </div>
          </div>
          {contentPost.ai_category && (
            <div className="ai-badge-chip" title={`AI Confidence: ${Math.round((contentPost.ai_confidence || 0) * 100)}%`}>
              <Sparkles size={10} /> {contentPost.ai_category.replace(/_/g, ' ')}
            </div>
          )}
        </div>
        
        {isAuthor && (
          <button 
            className="delete-btn"
            onClick={(e) => { e.stopPropagation(); onDelete(post.id); }}
            title="Delete Post"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <p className="post-content">{contentPost.content}</p>
      
      {isEvent && (
        <div onClick={e => e.stopPropagation()}>
          <RSVPButtons postId={contentPost.id} user={user} />
        </div>
      )}

      {contentPost.media_urls && contentPost.media_urls.length > 0 && (
        <div className="post-media" style={{ borderRadius: '16px', overflow: 'hidden', marginTop: '12px' }}>
          {contentPost.media_urls[0].match(/\.(mp4|webm|ogg)$/i) || contentPost.media_urls[0].includes('mixkit.co') ? (
            <video 
              src={contentPost.media_urls[0]} 
              controls 
              className="post-video"
              style={{ width: '100%', display: 'block', borderRadius: '16px' }}
              poster={contentPost.media_urls[0].replace(/\.(mp4|webm|ogg)$/i, '.jpg')}
            />
          ) : (
            <OptimizedImage src={contentPost.media_urls[0]} alt="Post Media" />
          )}
        </div>
      )}

      {contentPost.type === 'poll' && contentPost.poll_data?.options && (
        <div className="post-poll" onClick={e => e.stopPropagation()}>
          {contentPost.poll_data.options.map((opt: any, i: number) => {
            const totalVotes = contentPost.poll_data.total_votes || 0;
            const percentage = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
            const isSelected = userPollVote === i;
            return (
              <button 
                key={i} 
                className={`poll-option-btn ${isSelected ? 'selected' : ''}`} 
                onClick={() => onPollVote(contentPost, i)}
              >
                <div className="poll-progress" style={{ width: `${percentage}%` }} />
                <span className="poll-text">{opt.text} {isSelected && '✓'}</span>
                <span className="poll-percentage">{percentage}%</span>
              </button>
            );
          })}
          <div className="poll-footer">{contentPost.poll_data.total_votes || 0} votes</div>
        </div>
      )}

      {/* Community Notes Section */}
      {communityNotes.length > 0 || (user && !isAuthor) ? (
        <div className="post-notes" onClick={e => e.stopPropagation()}>
          {helpfulNotes.map(note => (
            <CommunityNoteCard key={note.id} note={note} currentUserId={user?.id} onRated={fetchNotes} />
          ))}
          
          <div className="notes-footer">
            {proposedNotesCount > 0 && helpfulNotes.length === 0 && (
              <div className="proposed-notes-indicator">
                <Info size={14} />
                <span>{proposedNotesCount} Proposed Community Note(s)</span>
              </div>
            )}
            
            {user && !isAuthor && (
              <button 
                className="add-note-btn"
                onClick={() => setIsAddingNote(true)}
              >
                Add Context
              </button>
            )}
          </div>
        </div>
      ) : null}

      <div className="post-actions" onClick={e => e.stopPropagation()}>
        <div className="action-group">
          <VoteButtons 
            post={{
              ...contentPost,
              user_vote: userVote
            }}
            user={user}
          />
          <button 
            className="action-btn"
            onClick={() => onNavigateToPost?.(contentPost.id)}
          >
            <MessageCircle size={20} /> <span>{contentPost.comments_count}</span>
          </button>
          <button 
            className="action-btn"
            onClick={() => onRepost(contentPost.id)}
            title="Repost"
          >
            <Repeat size={20} />
          </button>
          <button 
            className="action-btn"
            onClick={() => onShare(contentPost.id)}
            title="Share"
          >
            <Share2 size={20} />
          </button>
        </div>
        
        <div className="view-count">
          <Eye size={14} />
          <span>{contentPost.views || 0}</span>
        </div>
      </div>

      {/* Comment Preview Carousel */}
      {!hideCommentPreview && contentPost.comments_count > 0 && (
        <div onClick={e => e.stopPropagation()}>
          <CommentPreview comments={contentPost.comments || []} />
        </div>
      )}
      {isAddingNote && user && (
        <AddCommunityNoteModal 
          postId={contentPost.id}
          userId={user.id}
          onClose={() => setIsAddingNote(false)}
          onSuccess={fetchNotes}
        />
      )}
    </div>
  );
};
