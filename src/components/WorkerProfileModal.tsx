import React from 'react';
import { X, ShieldCheck, Star, Briefcase, Clock, MapPin, CheckCircle2 } from 'lucide-react';
import './WorkerProfileModal.css';

interface WorkerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  workerName: string;
  workerInitial: string;
  isVerified: boolean;
  successRate: number;
  totalGigs: number;
  primaryCategory: string;
  onAccept?: () => void;
}

const MOCK_REVIEWS = [
  { id: 1, requester: 'Sarah M.', rating: 5, date: '2 days ago', text: 'James was incredibly fast and professional! Handled the delivery perfectly.' },
  { id: 2, requester: 'David K.', rating: 5, date: '1 week ago', text: 'Arrived on time and helped me move a heavy couch. Highly recommend.' },
  { id: 3, requester: 'Auto-System', rating: 5, date: '2 weeks ago', text: 'Auto-generated 5-star review (No rating provided within 10 days of completion).', isAuto: true },
];

export const WorkerProfileModal: React.FC<WorkerProfileModalProps> = ({ 
  isOpen, 
  onClose, 
  workerName, 
  workerInitial, 
  isVerified,
  successRate,
  totalGigs,
  primaryCategory,
  onAccept
}) => {
  if (!isOpen) return null;

  return (
    <div className="gig-modal-overlay">
      <div className="gig-modal worker-profile-modal">
        <button className="gig-modal-close" onClick={onClose}>
          <X size={24} />
        </button>

        <div className="worker-profile-content">
          {/* Hero Section */}
          <div className="worker-hero">
            <div className={`worker-avatar-large ${isVerified ? 'verified' : ''}`}>
              {workerInitial}
              {isVerified && (
                <div className="verified-badge-large">
                  <ShieldCheck size={16} />
                </div>
              )}
            </div>
            <h2>{workerName}</h2>
            {isVerified && <span className="verified-status-pill"><ShieldCheck size={14} /> Verified Worker</span>}
          </div>

          {/* Stats Grid */}
          <div className="worker-stats-grid">
            <div className="worker-stat-card">
              <Star size={20} className="stat-icon star" />
              <div className="stat-value">{successRate}%</div>
              <div className="stat-label">Success Rate</div>
            </div>
            <div className="worker-stat-card">
              <Briefcase size={20} className="stat-icon" />
              <div className="stat-value">{totalGigs}</div>
              <div className="stat-label">Gigs Completed</div>
            </div>
            <div className="worker-stat-card">
              <Clock size={20} className="stat-icon" />
              <div className="stat-value">{primaryCategory}</div>
              <div className="stat-label">Primary Skill</div>
            </div>
          </div>

          {/* Verification Checklist */}
          {isVerified && (
            <div className="verification-checklist">
              <h3>Verification Status</h3>
              <ul>
                <li><CheckCircle2 size={16} className="check-icon" /> Identity Verified</li>
                <li><CheckCircle2 size={16} className="check-icon" /> Background Check Passed</li>
                <li><CheckCircle2 size={16} className="check-icon" /> Payment Methods Linked</li>
              </ul>
            </div>
          )}

          {/* Reviews Section */}
          <div className="worker-reviews-section">
            <h3>Recent Reviews</h3>
            <div className="reviews-list">
              {MOCK_REVIEWS.map(review => (
                <div key={review.id} className="review-card">
                  <div className="review-header">
                    <span className="reviewer-name">{review.requester}</span>
                    <span className="review-date">{review.date}</span>
                  </div>
                  <div className="review-stars">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} size={14} className="star-filled" />
                    ))}
                  </div>
                  <p className={`review-text ${review.isAuto ? 'auto-generated' : ''}`}>
                    {review.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Action Footer */}
          {onAccept && (
            <div className="worker-action-footer">
              <button className="primary-btn accept-btn" onClick={onAccept}>
                Hire {workerName}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
