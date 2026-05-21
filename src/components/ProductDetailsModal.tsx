import type { User } from '../types/user';
import React, { useEffect, useState } from 'react';
import { X, Heart, Star, MapPin, Clock, Phone, MessageSquare, Map } from 'lucide-react';
import { QuickMessageModal } from './QuickMessageModal';
import { ProductReviewSystem } from './ProductReviewSystem';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useApp } from '../context/AppContext';
import './ProductDetailsModal.css';

interface ProductDetailsModalProps {
  product: any;
  user: User;
  onClose: () => void;
  onNavigateToStore?: (storeId: string) => void;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({ product, user, onClose, onNavigateToStore }) => {
  const [activeThumb, setActiveThumb] = useState(0);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const { addToCart, addToWishlist } = useCart();
  const { setEnv, setActiveTab } = useApp();
  
  // Prevent scroll on body when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const thumbnails = product.image_urls || [
    'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800',
    'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&hue=100',
    'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&sepia=1'
  ];

  const specs = [
    { label: 'Brand', value: product.brand || 'Artisan Local' },
    { label: 'Category', value: product.category || 'Handcrafted' },
    { label: 'Material', value: product.material || 'Sustainable Mixed' },
    { label: 'Dimensions', value: product.dimensions || '8 x 10 x 2 inches' },
    { label: 'Weight', value: product.weight || '1.2 lbs' },
    { label: 'Origin', value: 'Southeast Texas, USA' }
  ];

  return (
    <AnimatePresence>
      <div className="product-modal-overlay" onClick={onClose}>
        <motion.div 
          className="product-modal-content"
          initial={{ scale: 0.95, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 30 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className="close-modal-btn" onClick={onClose} aria-label="Close">
            <X size={24} />
          </button>

          <div className="product-modal-body">
            {/* Top Section: Breadcrumbs and Primary Layout */}
            <div className="product-top-container">
              
              {/* Left: Image Gallery */}
              <div className="image-gallery-container">
                <div className="thumbnails-list">
                  {thumbnails.map((img: string, i: number) => (
                    <img 
                      key={i} 
                      src={img} 
                      className={`thumb-item ${activeThumb === i ? 'active' : ''}`}
                      onMouseEnter={() => setActiveThumb(i)}
                      alt={`Thumbnail ${i}`}
                    />
                  ))}
                </div>
                <div className="main-image-wrapper">
                  <motion.img 
                    key={activeThumb}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    src={thumbnails[activeThumb]} 
                    alt={product.name} 
                    className="main-image-premium"
                  />
                </div>
              </div>

              {/* Center: Core Information */}
              <div className="core-details-wrapper">
                <div className="breadcrumb-mock">
                  Products › {product.category || 'Market'} › {product.subcategory || 'Specialty'}
                </div>
                <h1 className="product-title-premium">{product.name}</h1>
                <div 
                  className="brand-link" 
                  style={{ cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => {
                  const storeId = product.store_id || product.stores?.id;
                  if (storeId) {
                    onNavigateToStore?.(storeId);
                    onClose();
                  }
                }}
              >
                Visit the {product.stores?.name || 'Local Artisan'} Store
              </div>
                
                <div className="rating-row-amazon">
                  <div className="star-rating-summary">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={16} fill={s <= Math.round(product.avg_rating || 0) ? 'currentColor' : 'none'} color={s <= Math.round(product.avg_rating || 0) ? '#f59e0b' : 'rgba(var(--text-muted-rgb), 0.2)'} />
                    ))}
                  </div>
                  <span className="rating-text">{Number(product.avg_rating || 0).toFixed(1)}</span>
                  <span className="review-text">{product.review_count || 0} ratings</span>
                </div>

                <div className="price-section-amazon">
                  <div style={{ display: 'flex', alignItems: 'baseline' }}>
                    <span className="discount-badge-large">-15%</span>
                    <span className="current-price-amazon"><small style={{ fontSize: '1rem', verticalAlign: 'top' }}>$</small>{product.price}</span>
                  </div>
                  <div className="list-price-amazon">List Price: ${(product.price * 1.15).toFixed(2)}</div>
                </div>

                <div className="about-item-section">
                  <h4>About this item</h4>
                  <ul className="about-list">
                    <li><strong>HANDCRAFTED QUALITY:</strong> Each piece is meticulously created by local SETX artisans, ensuring a unique and high-quality finish that mass-produced items can't match.</li>
                    <li><strong>LOCALLY SOURCED:</strong> We prioritize materials found right here in the region, supporting local suppliers and reducing our environmental footprint.</li>
                    <li><strong>COMMUNITY IMPACT:</strong> Your purchase directly contributes to the growth of local small businesses and independent creators in Southeast Texas.</li>
                    <li><strong>DURABLE DESIGN:</strong> Built to last using time-honored techniques passed down through generations of local makers.</li>
                  </ul>
                </div>
              </div>

              {/* Right: Buy Box */}
              <div className="buy-box-container">
                <div className="buy-box-price">${product.price}</div>
                <div className="delivery-info-amazon">
                  Get <strong>Fast, Free Shipping</strong> with Local Express Delivery.<br/>
                  FREE delivery <strong>Tomorrow, May 6</strong>. Order within <span style={{ color: '#007600' }}>3 hrs 45 mins</span>.
                </div>
                
                <div className="delivery-location" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px', color: 'var(--text-muted)' }}>
                  <MapPin size={14} /> Deliver to {user?.community || 'Port Arthur'} {user?.zip || '77642'}
                </div>

                <div className="stock-status">In Stock</div>

                <div className="buy-box-actions">
                  <button className="amazon-btn btn-yellow" onClick={() => addToCart(product, 1)}>Add to Cart</button>
                  <button className="amazon-btn btn-orange" onClick={() => { addToCart(product, 1); setEnv('market'); setActiveTab(3); onClose(); }}>Buy Now</button>
                </div>

                <div className="seller-info-amazon">
                  <div className="seller-row">
                    <span>Ships from</span>
                    <span>SETX Logistics</span>
                  </div>
                  <div className="seller-row">
                    <span>Sold by</span>
                    <span 
                      style={{ cursor: 'pointer', textDecoration: 'underline', color: 'var(--primary)' }}
                      onClick={() => {
                        const storeId = product.store_id || product.stores?.id;
                        if (storeId) {
                          onNavigateToStore?.(storeId);
                          onClose();
                        }
                      }}
                    >
                      {product.stores?.name || 'Local Artisan'}
                    </span>
                  </div>
                  <div className="seller-row">
                    <span>Returns</span>
                    <span>Eligible for Return or Replacement</span>
                  </div>
                  <div className="seller-row">
                    <span>Payments</span>
                    <span>Secure transaction</span>
                  </div>
                </div>

                <button 
                  onClick={() => addToWishlist(product)}
                  style={{ marginTop: '16px', background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Heart size={14} /> Add to List
                </button>
              </div>
            </div>

            {/* Extended Content: Product Description */}
            <div className="extended-content-section">
              <h2 className="section-title">Product Description</h2>
              <div style={{ display: 'flex', gap: '40px', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ lineHeight: 1.8, fontSize: '1.1rem', color: 'var(--text-muted)' }}>
                    {product.description || "Discover the essence of Southeast Texas craftsmanship. This product represents more than just a purchase; it's a piece of our community's heart and soul. Carefully designed to meet the highest standards of durability and aesthetics, it seamlessly blends traditional methods with modern needs."}
                  </p>
                </div>
                <div style={{ flex: 1 }}>
                  <img src={thumbnails[0]} style={{ width: '100%', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }} alt="Feature" />
                </div>
              </div>
            </div>

            {/* Product Information Table */}
            <div className="extended-content-section">
              <h2 className="section-title">Product Information</h2>
              <div className="product-info-grid">
                <div>
                  <h4>Technical Details</h4>
                  <table className="info-table">
                    <tbody>
                      {specs.slice(0, 3).map((s, i) => (
                        <tr key={i}>
                          <td>{s.label}</td>
                          <td>{s.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div>
                  <h4>Additional Information</h4>
                  <table className="info-table">
                    <tbody>
                      {specs.slice(3).map((s, i) => (
                        <tr key={i}>
                          <td>{s.label}</td>
                          <td>{s.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Frequently Bought Together (Mock Bundle) */}
            <div className="extended-content-section bundle-section-amazon">
              <h2 className="section-title">Frequently Bought Together</h2>
              <div className="bundle-grid-premium">
                <div className="bundle-items-flow">
                  <div className="bundle-item-box">
                    <img src={thumbnails[0]} alt="Current" />
                  </div>
                  <div className="bundle-plus">+</div>
                  <div className="bundle-item-box">
                    <img src="https://images.unsplash.com/photo-1585333127302-d29837a7b378?w=300" alt="Related 1" />
                    <div className="bundle-item-label">Local Artisan Stand</div>
                  </div>
                  <div className="bundle-plus">+</div>
                  <div className="bundle-item-box">
                    <img src="https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=300" alt="Related 2" />
                    <div className="bundle-item-label">Premium Leather Sleeve</div>
                  </div>
                </div>

                <div className="bundle-checkout-card">
                  <div className="bundle-total-price">
                    <span>Total price:</span>
                    <strong>${(product.price + 24.99 + 39.99).toFixed(2)}</strong>
                  </div>
                  <button 
                    className="amazon-btn btn-yellow"
                    onClick={() => {
                      addToCart(product, 1);
                      addToCart({
                        id: `related-stand-${product.id}`,
                        name: 'Local Artisan Stand',
                        price: 24.99,
                        image_url: 'https://images.unsplash.com/photo-1585333127302-d29837a7b378?w=300',
                        store_id: product.store_id || product.stores?.id,
                        store_name: product.stores?.name || 'Local Merchant'
                      }, 1);
                      addToCart({
                        id: `related-sleeve-${product.id}`,
                        name: 'Premium Leather Sleeve',
                        price: 39.99,
                        image_url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=300',
                        store_id: product.store_id || product.stores?.id,
                        store_name: product.stores?.name || 'Local Merchant'
                      }, 1);
                    }}
                  >
                    Add all three to Cart
                  </button>
                  <p className="bundle-disclaimer">These items are often shipped separately by different local merchants.</p>
                </div>
              </div>
            </div>

            {/* Physical Store Section (Only for physical stores) */}
            {product.stores?.type === 'physical' && (
              <div className="extended-content-section physical-store-section">
                <h2 className="section-title">Physical Store Information</h2>
                <div className="store-info-grid">
                  <div className="store-contact-hours">
                    <div className="info-card-premium">
                      <h4><Clock size={18} /> Store Hours</h4>
                      <ul className="hours-list">
                        <li><span>Monday - Friday</span> <span>9:00 AM - 7:00 PM</span></li>
                        <li><span>Saturday</span> <span>10:00 AM - 6:00 PM</span></li>
                        <li><span>Sunday</span> <span className="closed-tag">Closed</span></li>
                      </ul>
                    </div>
                    
                    <div className="info-card-premium" style={{ marginTop: '20px' }}>
                      <h4><Phone size={18} /> Contact & Support</h4>
                      <p style={{ fontSize: '0.9rem', marginBottom: '16px', opacity: 0.8 }}>Have questions about this item or want to visit us in person?</p>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button className="contact-btn secondary" onClick={() => window.open('tel:4095550123')}>
                          <Phone size={16} /> (409) 555-0123
                        </button>
                        <button className="contact-btn primary" onClick={() => setShowMessageModal(true)}>
                          <MessageSquare size={16} /> Message Shop
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="store-location-map">
                    <div className="mock-map-container">
                      <div className="map-overlay-info">
                        <MapPin size={20} color="var(--primary)" />
                        <div>
                          <strong>{product.stores?.name}</strong>
                          <p>123 Artisan Way, Port Arthur, TX 77642</p>
                        </div>
                      </div>
                      <img 
                        src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=800&h=500&fit=crop" 
                        alt="Store Location" 
                        className="mock-map-img"
                      />
                      <button className="get-directions-btn" onClick={() => window.open('https://maps.google.com')}>
                        <Map size={16} /> Get Directions
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Reviews Section */}
            <div className="extended-content-section" style={{ background: 'var(--bg)' }}>
              <h2 className="section-title">Customer Reviews</h2>
              <ProductReviewSystem 
                productId={product.id} 
                currentUserId={user?.id}
                avgRating={product.avg_rating || 0}
                reviewCount={product.review_count || 0}
              />
            </div>
          </div>
        </motion.div>

        {showMessageModal && (
          <QuickMessageModal
            user={user}
            recipientId={product.stores?.owner_id}
            recipientName={product.stores?.name}
            recipientAvatar={product.stores?.image_url}
            onClose={() => setShowMessageModal(false)}
          />
        )}
      </div>
    </AnimatePresence>
  );
};

