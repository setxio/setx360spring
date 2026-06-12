import React, { useState } from 'react';
import { X, Globe, ChevronDown, Smile, ChevronRight, MessageCircle, Link2, Users, User, PhoneCall, BookOpen } from 'lucide-react';
import { Avatar } from './Avatar';
import './ShareModal.css';

interface ShareModalProps {
  post: any;
  user: any;
  onClose: () => void;
  onShareNow: (text: string) => void;
}

// Dummy data for highest engagement friends
const TOP_FRIENDS = [
  { id: '1', name: 'Joey Hilliard', avatar: 'https://i.pravatar.cc/150?u=1' },
  { id: '2', name: 'Zach Patronis', avatar: 'https://i.pravatar.cc/150?u=2' },
  { id: '3', name: 'Leo Ashcraft', avatar: 'https://i.pravatar.cc/150?u=3' },
  { id: '4', name: 'Pastor Kennedy', avatar: 'https://i.pravatar.cc/150?u=4' },
  { id: '5', name: 'Mike Getz', avatar: 'https://i.pravatar.cc/150?u=5' },
  { id: '6', name: 'Cory Crenshaw', avatar: 'https://i.pravatar.cc/150?u=6' },
];

export const ShareModal: React.FC<ShareModalProps> = ({ post, user, onClose, onShareNow }) => {
  const [text, setText] = useState('');

  return (
    <div className="share-modal-overlay" onClick={onClose}>
      <div className="share-modal-content" onClick={e => e.stopPropagation()}>
        <div className="share-header">
          <h2 className="share-title">Share</h2>
          <button className="share-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="share-body">
          <div className="share-info-banner">
            Links you share are unique to you and may be used to improve suggestions and ads you see. <a>Learn more</a>
          </div>

          <div className="share-author-row">
            <Avatar url={user?.avatar_url} name={user?.name || 'You'} size={40} />
            <div className="share-author-info">
              <span className="share-author-name">{user?.name || 'You'}</span>
              <div className="share-privacy-badges">
                <button className="privacy-badge">
                  Feed <ChevronDown size={14} />
                </button>
                <button className="privacy-badge">
                  <Globe size={14} /> Public <ChevronDown size={14} />
                </button>
              </div>
            </div>
          </div>

          <div className="share-input-wrapper">
            <textarea
              className="share-textarea no-scrollbar"
              placeholder="Say something about this..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <button className="emoji-btn">
              <Smile size={20} />
            </button>
          </div>

          <button 
            className="share-now-btn" 
            onClick={() => {
              onShareNow(text);
              onClose();
            }}
          >
            Share now
          </button>
        </div>

        <div className="share-divider" />

        <div className="share-section">
          <h3 className="share-section-title">Send in Messenger</h3>
          <div className="share-scroll-row no-scrollbar">
            {TOP_FRIENDS.map(friend => (
              <div key={friend.id} className="share-friend-item">
                <Avatar url={friend.avatar} name={friend.name} size={48} />
                <span className="share-friend-name">{friend.name}</span>
              </div>
            ))}
            <button className="scroll-more-btn">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="share-section" style={{ paddingBottom: '16px' }}>
          <h3 className="share-section-title">Share to</h3>
          <div className="share-scroll-row no-scrollbar">
            <button className="share-action-item">
              <div className="action-icon-circle"><MessageCircle size={24} /></div>
              <span>Messenger</span>
            </button>
            <button className="share-action-item">
              <div className="action-icon-circle"><PhoneCall size={24} /></div>
              <span>WhatsApp</span>
            </button>
            <button className="share-action-item">
              <div className="action-icon-circle"><BookOpen size={24} /></div>
              <span>Your story</span>
            </button>
            <button className="share-action-item" onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/?post=${post.id}`);
              onClose();
            }}>
              <div className="action-icon-circle"><Link2 size={24} /></div>
              <span>Copy link</span>
            </button>
            <button className="share-action-item">
              <div className="action-icon-circle"><Users size={24} /></div>
              <span>Group</span>
            </button>
            <button className="share-action-item">
              <div className="action-icon-circle"><User size={24} /></div>
              <span>Friend's profile</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
