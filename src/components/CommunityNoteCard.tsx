import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Info, ShieldCheck } from 'lucide-react';
import { rateCommunityNote } from '../lib/communityNotes';
import { Avatar } from './Avatar';
import './CommunityNoteCard.css';

interface CommunityNoteCardProps {
  note: any;
  currentUserId?: string;
  isProposed?: boolean;
  onRated?: () => void;
}

export const CommunityNoteCard: React.FC<CommunityNoteCardProps> = ({ note, currentUserId, isProposed = false, onRated }) => {
  const [isRating, setIsRating] = useState(false);
  const userRating = note.ratings?.find((r: any) => r.user_id === currentUserId)?.rating;

  const handleRate = async (rating: 'helpful' | 'not_helpful' | 'somewhat_helpful') => {
    if (!currentUserId || isRating) return;
    
    setIsRating(true);
    const { error } = await rateCommunityNote(note.id, currentUserId, rating);
    if (!error && onRated) {
      onRated();
    }
    setIsRating(false);
  };

  const helpfulCount = note.ratings?.filter((r: any) => r.rating === 'helpful').length || 0;
  const notHelpfulCount = note.ratings?.filter((r: any) => r.rating === 'not_helpful').length || 0;

  return (
    <div className={`community-note-card ${isProposed ? 'proposed' : 'helpful'}`}>
      <div className="note-header">
        <div className="note-status-icon">
          {note.status === 'helpful' ? (
            <ShieldCheck size={18} className="text-blue" />
          ) : (
            <Info size={18} className="text-amber" />
          )}
        </div>
        <div className="note-meta">
          <span className="note-badge">
            {note.status === 'helpful' ? 'Confirmed Context' : 'Proposed Note'}
          </span>
          {note.profiles && (
            <div className="note-author">
              <Avatar url={note.profiles.avatar_url} name={note.profiles.name} size={16} />
              <span>@{note.profiles.name?.replace(/\s+/g, '').toLowerCase()}</span>
            </div>
          )}
        </div>
      </div>

      <p className="note-content">{note.content}</p>

      <div className="note-actions">
        <div className="rating-group">
          <button 
            className={`rate-btn ${userRating === 'helpful' ? 'active' : ''}`}
            onClick={(e) => { e.stopPropagation(); handleRate('helpful'); }}
            disabled={isRating}
          >
            <ThumbsUp size={14} fill={userRating === 'helpful' ? 'currentColor' : 'none'} />
            <span>Helpful ({helpfulCount})</span>
          </button>
          <button 
            className={`rate-btn ${userRating === 'not_helpful' ? 'active' : ''}`}
            onClick={(e) => { e.stopPropagation(); handleRate('not_helpful'); }}
            disabled={isRating}
          >
            <ThumbsDown size={14} fill={userRating === 'not_helpful' ? 'currentColor' : 'none'} />
            <span>Not Helpful ({notHelpfulCount})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
