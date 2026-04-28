import React, { useEffect } from 'react';
import { X, ShoppingCart, Heart, Share2, Store, CheckCircle2, ChevronRight } from 'lucide-react';
import { ProductReviewSystem } from './ProductReviewSystem';
import { motion } from 'framer-motion';
import './ProductDetailsModal.css';

interface ProductDetailsModalProps {
  product: any;
  user: any;
  onClose: () => void;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({ product, user, onClose }) => {
  // Prevent scroll on body when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div className="product-modal-overlay" onClick={onClose}>
      <motion.div 
        className="product-modal-content"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="product-modal-header">
          <h2>Product Details</h2>
          <button className="close-modal-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="product-modal-body">
          <div className="product-main-info">
            <div className="product-visuals">
              <img 
                src={product.image_urls?.[0] || 'https://images.unsplash.com/photo-1544816155-12df9643f363'} 
                alt={product.name} 
                className="product-main-image"
              />
            </div>

            <div className="product-details-content">
              <div className="vendor-link">
                <Store size={14} />
                <span>{product.stores?.name || 'Local Vendor'}</span>
                <ChevronRight size={14} />
              </div>

              <h1>{product.name}</h1>

              <div className="product-rating-overview">
                <div className="star-rating-summary">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <CheckCircle2 key={s} size={14} fill={s <= Math.round(product.avg_rating) ? 'currentColor' : 'none'} color={s <= Math.round(product.avg_rating) ? '#f59e0b' : 'rgba(255,255,255,0.1)'} />
                  ))}
                </div>
                <span className="rating-text">{product.avg_rating.toFixed(1)}</span>
                <span className="review-text">({product.review_count} reviews)</span>
              </div>

              <div className="product-price-large">${product.price}</div>

              <p className="product-description-text">
                {product.description || "No description provided for this artisanal product. Contact the vendor for more details."}
              </p>

              <div className="product-actions-group">
                <button className="add-to-cart-btn-large">
                  <ShoppingCart size={20} />
                  Add to Cart
                </button>
                <button className="wishlist-btn-large" title="Add to Wishlist">
                  <Heart size={20} />
                </button>
                <button className="wishlist-btn-large" title="Share">
                  <Share2 size={20} />
                </button>
              </div>
            </div>
          </div>

          <div className="product-reviews-section">
            <h2 className="section-title">Customer Feedback</h2>
            <ProductReviewSystem 
              productId={product.id} 
              currentUserId={user?.id}
              avgRating={product.avg_rating || 0}
              reviewCount={product.review_count || 0}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
};
