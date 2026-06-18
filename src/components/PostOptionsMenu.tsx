import React, { useState, useRef, useEffect } from 'react';
import { 
  MoreHorizontal, X, Bookmark, Bell, Code, Flag, 
  Clock, UserMinus, UserX, Trash2, PlusCircle, MinusCircle, Info, Edit 
} from 'lucide-react';
import './PostOptionsMenu.css';

interface PostOptionsMenuProps {
  isAuthor: boolean;
  authorName: string;
  onHide: () => void;
  onDelete?: () => void;
  onSave?: () => void;
  onReport?: () => void;
  onEdit?: () => void;
}

export const PostOptionsMenu: React.FC<PostOptionsMenuProps> = ({
  isAuthor,
  authorName,
  onHide,
  onDelete,
  onSave,
  onReport,
  onEdit
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
    setIsOpen(false);
  };

  return (
    <div className="post-options-container" ref={menuRef}>
      <button 
        className="post-option-btn more-btn" 
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
      >
        <MoreHorizontal size={20} />
      </button>
      <button 
        className="post-option-btn hide-btn" 
        onClick={(e) => handleAction(e, onHide)}
        title="Hide post"
      >
        <X size={20} />
      </button>

      {isOpen && (
        <div className="post-options-dropdown" onClick={(e) => e.stopPropagation()}>
          {!isAuthor && (
            <>
              <div className="dropdown-item" onClick={(e) => handleAction(e, () => {})}>
                <div className="item-icon bg-gray"><PlusCircle size={18} /></div>
                <div className="item-text">
                  <strong>Interested</strong>
                  <span>More of your posts will be like this.</span>
                </div>
              </div>
              <div className="dropdown-item" onClick={(e) => handleAction(e, () => {})}>
                <div className="item-icon bg-gray"><MinusCircle size={18} /></div>
                <div className="item-text">
                  <strong>Not interested</strong>
                  <span>Less of your posts will be like this.</span>
                </div>
              </div>
              <div className="dropdown-divider" />
            </>
          )}

          <div className="dropdown-item" onClick={(e) => handleAction(e, onSave || (() => {}))}>
            <div className="item-icon"><Bookmark size={18} /></div>
            <div className="item-text">
              <strong>Save post</strong>
              <span>Add this to your saved items.</span>
            </div>
          </div>
          
          <div className="dropdown-divider" />

          <div className="dropdown-item" onClick={(e) => handleAction(e, () => {})}>
            <div className="item-icon"><Bell size={18} /></div>
            <div className="item-text">
              <strong>Turn on notifications for this post</strong>
            </div>
          </div>

          <div className="dropdown-item" onClick={(e) => handleAction(e, () => {})}>
            <div className="item-icon"><Info size={18} /></div>
            <div className="item-text">
              <strong>Why am I seeing this post?</strong>
            </div>
          </div>

          <div className="dropdown-item" onClick={(e) => handleAction(e, () => {})}>
            <div className="item-icon"><Code size={18} /></div>
            <div className="item-text">
              <strong>Embed</strong>
            </div>
          </div>

          <div className="dropdown-divider" />

          {isAuthor ? (
            <>
              <div className="dropdown-item" onClick={(e) => handleAction(e, onEdit || (() => {}))}>
                <div className="item-icon"><Edit size={18} /></div>
                <div className="item-text">
                  <strong>Edit post</strong>
                  <span>Modify the content or media of this post.</span>
                </div>
              </div>
              <div className="dropdown-item danger" onClick={(e) => handleAction(e, onDelete || (() => {}))}>
                <div className="item-icon"><Trash2 size={18} /></div>
                <div className="item-text">
                  <strong>Delete post</strong>
                  <span>Permanently remove this post from your timeline.</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="dropdown-item" onClick={(e) => handleAction(e, onHide)}>
                <div className="item-icon bg-gray"><X size={18} /></div>
                <div className="item-text">
                  <strong>Hide post</strong>
                  <span>See fewer posts like this.</span>
                </div>
              </div>

              <div className="dropdown-item" onClick={(e) => handleAction(e, () => {})}>
                <div className="item-icon"><Clock size={18} /></div>
                <div className="item-text">
                  <strong>Snooze {authorName} for 30 days</strong>
                  <span>Temporarily stop seeing posts.</span>
                </div>
              </div>

              <div className="dropdown-item" onClick={(e) => handleAction(e, () => {})}>
                <div className="item-icon"><UserMinus size={18} /></div>
                <div className="item-text">
                  <strong>Unfollow {authorName}</strong>
                  <span>Stop seeing posts from this page.</span>
                </div>
              </div>

              <div className="dropdown-item" onClick={(e) => handleAction(e, onReport || (() => {}))}>
                <div className="item-icon"><Flag size={18} /></div>
                <div className="item-text">
                  <strong>Report post</strong>
                  <span>We won't let {authorName} know who reported this.</span>
                </div>
              </div>

              <div className="dropdown-item" onClick={(e) => handleAction(e, () => {})}>
                <div className="item-icon"><UserX size={18} /></div>
                <div className="item-text">
                  <strong>Block {authorName}'s profile</strong>
                  <span>You won't be able to see or contact each other.</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
