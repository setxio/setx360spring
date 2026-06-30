import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Star, Briefcase, Clock, MapPin, CheckCircle2, DollarSign, Wallet as WalletIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
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
  cashAppHandle?: string;
  zelleHandle?: string;
  workerId?: string;
  onAccept?: () => void;
}

export const WorkerProfileModal: React.FC<WorkerProfileModalProps> = ({ 
  isOpen, 
  onClose, 
  workerName, 
  workerInitial, 
  isVerified,
  successRate,
  totalGigs,
  primaryCategory,
  cashAppHandle,
  zelleHandle,
  workerId,
  onAccept
}) => {
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen && workerId) {
      fetchReviews();
    }
  }, [isOpen, workerId]);

  const fetchReviews = async () => {
    try {
      const { data } = await supabase
        .from('gig_reviews')
        .select(`
          *,
          gig:gigs(title),
          reviewer:profiles!reviewer_id(first_name, last_name)
        `)
        .eq('worker_id', workerId)
        .order('created_at', { ascending: false });
      if (data) setReviews(data);
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
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

          {/* Payment Methods */}
          {(cashAppHandle || zelleHandle) && (
            <div className="verification-checklist" style={{ marginTop: '16px' }}>
              <h3>Payment Methods</h3>
              <ul>
                {cashAppHandle && <li><DollarSign size={16} style={{ color: '#00D632', marginRight: '8px' }} /> Cash App: {cashAppHandle}</li>}
                {zelleHandle && <li><WalletIcon size={16} style={{ color: '#7412e8', marginRight: '8px' }} /> Zelle: {zelleHandle}</li>}
              </ul>
            </div>
          )}

          {/* Reviews Section */}
          <div className="worker-reviews-section">
            <div className="section-header-row">
              <h3>Reviews & History</h3>
              <span className="review-count">{reviews.length} completed gigs</span>
            </div>
            
            <div className="reviews-list">
              {reviews.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)' }}>No completed gigs or reviews yet.</p>
              ) : reviews.map(review => (
                <div key={review.id} className="review-card">
                  <div className="review-header">
                    <div className="reviewer-info">
                      <div className="reviewer-avatar">{review.reviewer?.first_name?.[0] || 'U'}</div>
                      <div className="reviewer-details">
                        <span className="reviewer-name">{review.reviewer?.first_name} {review.reviewer?.last_name || ''}</span>
                        <span className="review-date">{new Date(review.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="review-rating">
                      <Star size={14} className="star-icon" />
                      <span>{review.rating}.0</span>
                    </div>
                  </div>
                  <div className="review-gig-title" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '500' }}>
                    Gig: {review.gig?.title || 'Unknown Gig'}
                  </div>
                  {review.review_text && (
                    <p className={`review-text ${review.is_auto ? 'auto-review' : ''}`}>
                      {review.review_text}
                    </p>
                  )}
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
