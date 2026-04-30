import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Avatar } from './Avatar';
import './CommentPreview.css';

interface CommentPreviewProps {
  comments: any[];
  onCommentClick?: (commentId: string) => void;
  onNavigateToProfile?: (profileId: string) => void;
}

export const CommentPreview: React.FC<CommentPreviewProps> = ({ comments, onCommentClick, onNavigateToProfile }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Show max 5 comments in preview
  const previewComments = comments.slice(0, 5);

  useEffect(() => {
    if (previewComments.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % previewComments.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [previewComments.length]);

  if (previewComments.length === 0) return null;

  const currentComment = previewComments[currentIndex];

  return (
    <div className="comment-preview-carousel">
      <div className="carousel-content">
        {previewComments.length > 1 && (
          <button 
            className="carousel-control prev" 
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex((prev) => (prev - 1 + previewComments.length) % previewComments.length);
            }}
          >
            <ChevronLeft size={14} />
          </button>
        )}

        <div 
          className="comment-item animate-fade-in" 
          key={currentComment.id}
          onClick={() => onCommentClick?.(currentComment.id)}
          style={{ cursor: onCommentClick ? 'pointer' : 'default' }}
        >
          <Avatar 
            url={currentComment.profiles?.avatar_url} 
            name={currentComment.profiles?.name || 'User'} 
            size={24} 
          />
          <div className="comment-bubble">
            <span 
              className="comment-author"
              onClick={(e) => {
                if (currentComment.profile_id) {
                  e.stopPropagation();
                  onNavigateToProfile?.(currentComment.profile_id);
                }
              }}
              style={{ cursor: 'pointer' }}
            >
              {currentComment.profiles?.name || 'Anonymous'}
            </span>
            <p className="comment-text">{currentComment.content}</p>
          </div>
        </div>

        {previewComments.length > 1 && (
          <button 
            className="carousel-control next" 
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex((prev) => (prev + 1) % previewComments.length);
            }}
          >
            <ChevronRight size={14} />
          </button>
        )}
      </div>

      <div className="carousel-indicators">
        {previewComments.map((_, idx) => (
          <div 
            key={idx} 
            className={`indicator ${idx === currentIndex ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex(idx);
            }}
          />
        ))}
      </div>
    </div>
  );
};
