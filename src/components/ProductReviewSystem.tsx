import React, { useState, useEffect } from 'react';
import { Star, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './ProductReviewSystem.css';

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  is_verified_purchase: boolean;
  profile_id: string;
  profiles: {
    name: string;
    avatar_url: string;
  };
}

interface ProductReviewSystemProps {
  productId: string;
  currentUserId?: string;
  avgRating: number;
  reviewCount: number;
}

export const ProductReviewSystem: React.FC<ProductReviewSystemProps> = ({ 
  productId, 
  currentUserId,
  avgRating,
  reviewCount 
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userHasReviewed, setUserHasReviewed] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('product_reviews')
      .select(`
        *,
        profiles (
          name,
          avatar_url
        )
      `)
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setReviews(data as any);
      const reviewed = data.some((r: any) => r.profile_id === currentUserId);
      setUserHasReviewed(reviewed);
    }
    setIsLoading(false);
  };

  const handleDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
    
    return date.toLocaleDateString();
  };

  const handleSubmitReview = async () => {
    if (!currentUserId || newRating === 0) return;

    setIsSubmitting(true);
    const { error } = await supabase
      .from('product_reviews')
      .insert({
        product_id: productId,
        profile_id: currentUserId,
        rating: newRating,
        comment: newComment,
        is_verified_purchase: true // Simplified for now
      });

    if (!error) {
      setNewRating(0);
      setNewComment('');
      fetchReviews();
    }
    setIsSubmitting(false);
  };

  const renderStars = (rating: number, interactive = false) => {
    return (
      <div className="rating-stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`star-btn ${star <= (interactive ? newRating : rating) ? 'active' : ''}`}
            onClick={() => interactive && setNewRating(star)}
            disabled={!interactive}
          >
            <Star fill={star <= (interactive ? newRating : rating) ? 'currentColor' : 'none'} size={interactive ? 24 : 16} />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="reviews-container">
      <div className="reviews-summary">
        <div className="overall-rating">
          <div className="rating-number">{avgRating.toFixed(1)}</div>
          {renderStars(avgRating)}
          <div className="rating-count">{reviewCount} reviews</div>
        </div>

        <div className="rating-bars">
          {[5, 4, 3, 2, 1].map((num) => {
            const count = reviews.filter(r => r.rating === num).length;
            const percent = reviewCount > 0 ? (count / reviewCount) * 100 : 0;
            return (
              <div key={num} className="rating-bar-row">
                <span>{num} stars</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${percent}%` }}></div>
                </div>
                <span>{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {!userHasReviewed && currentUserId && (
        <div className="add-review-section">
          <h3>Share your experience</h3>
          <p>How would you rate this product?</p>
          <div className="star-input">
            {renderStars(0, true)}
          </div>
          <textarea
            className="review-textarea"
            placeholder="What did you like or dislike? How's the quality?"
            rows={4}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          ></textarea>
          <button 
            className="submit-review-btn" 
            onClick={handleSubmitReview}
            disabled={isSubmitting || newRating === 0}
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : 'Post Review'}
          </button>
        </div>
      )}

      <div className="review-list">
        {isLoading ? (
          <div className="discovery-loading" style={{ height: '200px' }}>
            <Loader2 className="animate-spin" size={32} color="var(--primary)" />
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="review-item animate-fade-in">
              <div className="review-header">
                <img 
                  src={review.profiles.avatar_url || `https://ui-avatars.com/api/?name=${review.profiles.name}`} 
                  alt={review.profiles.name} 
                  className="reviewer-avatar" 
                />
                <div className="reviewer-info">
                  <div className="reviewer-name">
                    {review.profiles.name}
                    {review.is_verified_purchase && (
                      <span className="verified-badge">
                        <CheckCircle2 size={10} /> Verified
                      </span>
                    )}
                  </div>
                  <div className="review-date">
                    {handleDate(review.created_at)}
                  </div>
                </div>
                {renderStars(review.rating)}
              </div>
              <p className="review-comment">{review.comment}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
