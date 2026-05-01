import React, { useState, useEffect } from 'react';
import { MessageCircle, Share2, Repeat, MapPin, X, Calendar, Info, Eye, ShieldCheck, Sparkles, AlertTriangle, CheckCircle, Clock, Flag, BarChart2, Bookmark } from 'lucide-react';
import { Avatar } from './Avatar';
import { VoteButtons } from './VoteButtons';
import { RSVPButtons } from './RSVPButtons';
import { CommentPreview } from './CommentPreview';
import { CommunityNoteCard } from './CommunityNoteCard';
import { AddCommunityNoteModal } from './AddCommunityNoteModal';
import { FlagContentModal } from './FlagContentModal';
import { getCommunityNotes } from '../lib/communityNotes';
import { OptimizedImage } from './OptimizedImage';
import { formatText } from '../utils/textFormatting';
import { PostStatsModal } from './PostStatsModal';
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
  onNavigateToPost?: (postId: string, commentId?: string) => void;
  onNavigateToProfile?: (profileId: string) => void;
  isBookmarked?: boolean;
  onToggleBookmark?: (postId: string) => void;
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
  onNavigateToProfile,
  isBookmarked = false,
  onToggleBookmark,
  hideCommentPreview = false
}) => {
  const [communityNotes, setCommunityNotes] = useState<any[]>([]);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  const extractYoutubeId = (text: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = text.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const contentPost = post.type === 'repost' && post.original_post ? post.original_post : post;
  const youtubeId = extractYoutubeId(contentPost.content || '');
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
            <h4 
              className="author-name" 
              onClick={(e) => { e.stopPropagation(); onNavigateToProfile?.(contentPost.profile_id); }}
              style={{ cursor: 'pointer' }}
            >
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

      <div className="post-content">
        <p>{formatText(contentPost.content)}</p>
      </div>
      
      {isEvent && (
        <div onClick={e => e.stopPropagation()}>
          <RSVPButtons postId={contentPost.id} user={user} />
        </div>
      )}

      {((contentPost.media_urls && contentPost.media_urls.length > 0) || youtubeId) && (
        <div className="post-media-container" onClick={e => e.stopPropagation()}>
          <div 
            className="post-media-slider no-scrollbar"
            onScroll={(e) => {
              const target = e.target as HTMLDivElement;
              const index = Math.round(target.scrollLeft / target.offsetWidth);
              if (index !== activeMediaIndex) setActiveMediaIndex(index);
            }}
          >
            {/* Embedded YouTube Video */}
            {youtubeId && (
              <div className="media-slide">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${youtubeId}`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="post-video youtube-embed"
                />
              </div>
            )}

            {/* Local Media Files */}
            {contentPost.media_urls?.map((url: string, idx: number) => (
              <div key={idx} className="media-slide">
                {url.match(/\.(mp4|webm|ogg)$/i) || url.includes('mixkit.co') ? (
                  <video 
                    src={url} 
                    controls 
                    className="post-video"
                    poster={url.replace(/\.(mp4|webm|ogg)$/i, '.jpg')}
                  />
                ) : (
                  <OptimizedImage src={url} alt={`Post Media ${idx + 1}`} />
                )}
              </div>
            ))}
          </div>
          {(contentPost.media_urls?.length > 1 || (youtubeId && contentPost.media_urls?.length > 0)) && (
            <div className="media-indicators">
              {Array.from({ length: (contentPost.media_urls?.length || 0) + (youtubeId ? 1 : 0) }).map((_, idx) => (
                <div 
                  key={idx} 
                  className={`media-dot ${idx === activeMediaIndex ? 'active' : ''}`} 
                />
              ))}
            </div>
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
          <button 
            className="action-btn flag"
            onClick={() => setShowFlagModal(true)}
            title="Report Post"
          >
            <Flag size={20} />
          </button>
          <button 
            className={`action-btn bookmark ${isBookmarked ? 'active' : ''}`}
            onClick={(e) => { e.stopPropagation(); onToggleBookmark?.(contentPost.id); }}
            title={isBookmarked ? "Remove Bookmark" : "Save Post"}
          >
            <Bookmark size={20} fill={isBookmarked ? "var(--primary)" : "none"} />
          </button>
        </div>
        
        <div 
          className="view-count"
          style={user?.id === contentPost.profile_id ? { cursor: 'pointer', color: 'var(--primary)' } : {}}
          onClick={(e) => {
            e.stopPropagation();
            if (user?.id === contentPost.profile_id) {
              setShowStatsModal(true);
            }
          }}
          title={user?.id === contentPost.profile_id ? "View Detailed Stats" : ""}
        >
          <Eye size={14} />
          <span>{contentPost.views || 0}</span>
          {user?.id === contentPost.profile_id && <BarChart2 size={14} style={{ marginLeft: 4 }} />}
        </div>
      </div>

      {/* Comment Preview Carousel */}
      {!hideCommentPreview && contentPost.comments_count > 0 && (
        <div onClick={e => e.stopPropagation()}>
          <CommentPreview 
            comments={contentPost.comments || []} 
            onCommentClick={(commentId) => onNavigateToPost?.(contentPost.id, commentId)}
            onNavigateToProfile={onNavigateToProfile}
          />
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
      {showFlagModal && user && (
        <FlagContentModal
          postId={contentPost.id}
          userId={user.id}
          onClose={() => setShowFlagModal(false)}
        />
      )}

      {showStatsModal && user?.id === contentPost.profile_id && (
        <PostStatsModal 
          post={contentPost}
          onClose={() => setShowStatsModal(false)}
        />
      )}
    </div>
  );
};
