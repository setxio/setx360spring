import React from 'react';
import { ShoppingBag, Box, Zap, MapPin, Star, Plus } from 'lucide-react';
import './ProductCardElite.css';

export interface ProductElite {
  id: string;
  name: string;
  price: number;
  image_urls: string[];
  stock_quantity?: number;
  is_sponsored?: boolean;
  priority?: number;
  store_id?: string;
  store_name?: string;
  avg_rating?: number;
  eligible_for_sameday?: boolean;
}

interface ProductCardEliteProps {
  product: ProductElite;
  onSelect: (product: ProductElite) => void;
  onNavigateToStore?: (storeId: string) => void;
  onQuickBuy?: (product: ProductElite) => void;
}

export const ProductCardElite: React.FC<ProductCardEliteProps> = ({ 
  product, 
  onSelect, 
  onNavigateToStore,
  onQuickBuy 
}) => {
  const isLowStock = product.stock_quantity !== undefined && product.stock_quantity < 5;
  const isOut = product.stock_quantity === 0;

  return (
    <div className="elite-product-card glass" onClick={() => onSelect(product)}>
      <div className="elite-image-container">
        <img 
          src={product.image_urls?.[0] || 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&h=500&fit=crop'} 
          alt={product.name} 
          loading="lazy"
        />
        
        {/* Badges */}
        <div className="elite-badges-top">
          {product.is_sponsored ? (
            <div className="elite-badge sponsored"><Zap size={10} fill="currentColor" /> Sponsored</div>
          ) : product.priority ? (
            <div className="elite-badge featured">Featured</div>
          ) : null}
          {product.eligible_for_sameday && (
            <div className="elite-badge sameday"><Zap size={10} fill="currentColor" /> SETX Same-Day</div>
          )}
        </div>

        {/* AR & Quick Actions */}
        <div className="elite-actions-overlay">
          <button className="elite-action-btn ar-btn" title="View in AR" onClick={(e) => { e.stopPropagation(); /* AR Hook */ }}>
            <Box size={18} />
          </button>
        </div>
      </div>

      <div className="elite-product-info">
        <div className="elite-title-row">
          <h4 className="elite-product-title">{product.name}</h4>
          <span className="elite-product-price">${(product.price || 0).toFixed(2)}</span>
        </div>

        {product.store_name && (
          <div 
            className="elite-store-link"
            onClick={(e) => { e.stopPropagation(); if (product.store_id) onNavigateToStore?.(product.store_id); }}
          >
            <MapPin size={12} />
            <span>{product.store_name}</span>
            {product.avg_rating && (
              <span className="elite-rating">
                • {product.avg_rating.toFixed(1)} <Star size={10} fill="currentColor" />
              </span>
            )}
          </div>
        )}

        <div className="elite-footer-row">
          <div className="elite-stock-status">
            {isOut ? (
              <span className="stock-out">Out of Stock</span>
            ) : isLowStock ? (
              <span className="stock-low">Only {product.stock_quantity} left!</span>
            ) : (
              <span className="stock-ok">In Stock locally</span>
            )}
          </div>

          <button 
            className={`elite-quick-buy ${isOut ? 'disabled' : ''}`}
            disabled={isOut}
            onClick={(e) => {
              e.stopPropagation();
              if (onQuickBuy) onQuickBuy(product);
            }}
          >
            {product.eligible_for_sameday ? (
              <>Buy Now <Zap size={14} fill="currentColor" /></>
            ) : (
              <><Plus size={16} /> Add to Cart</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
