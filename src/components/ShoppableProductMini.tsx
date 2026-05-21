import React from 'react';
import { ShoppingBag, Zap } from 'lucide-react';
import './ShoppableProductMini.css';

interface ShoppableProductMiniProps {
  product: any;
  onClick: (product: any) => void;
}

export const ShoppableProductMini: React.FC<ShoppableProductMiniProps> = ({ product, onClick }) => {
  return (
    <div className="shoppable-mini-card glass" onClick={(e) => { e.stopPropagation(); onClick(product); }}>
      <img src={product.image_urls?.[0] || 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=100'} alt={product.name} className="mini-product-img" />
      <div className="mini-product-info">
        <span className="mini-product-name">{product.name}</span>
        <span className="mini-product-price">${product.price?.toFixed(2) || '0.00'}</span>
        {product.eligible_for_sameday && (
          <div className="mini-badge-sameday">
            <Zap size={8} fill="currentColor" /> Same-Day
          </div>
        )}
      </div>
      <button className="mini-buy-btn">
        Buy
      </button>
    </div>
  );
};
