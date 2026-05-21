import React, { useState } from 'react';
import { ShoppingCart, Trash2, ArrowRight, Heart, Plus, Minus } from 'lucide-react';
import { EmptyState } from './EmptyState';
import { useCart } from '../context/CartContext';
import { useApp } from '../context/AppContext';
import { SetxCheckoutOverlay } from './SetxCheckoutOverlay';
import './CartWishlistView.css';

export const CartView: React.FC = () => {
  const { cartItems, updateQuantity, removeFromCart, clearCart, cartTotal, cartCount } = useCart();
  const { setActiveTab } = useApp();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  if (cartItems.length === 0) {
    return (
      <EmptyState 
        icon={ShoppingCart}
        title="Your Cart is Empty"
        message="Looks like you haven't added anything to your cart yet. Explore the marketplace to find something special!"
        action={{
          label: "Shop Now",
          onClick: () => setActiveTab(0)
        }}
      />
    );
  }

  const subtotal = cartTotal;
  const tax = subtotal * 0.0825;
  const total = subtotal + tax;

  const firstItem = cartItems[0];
  const checkoutRequest = {
    merchantId: firstItem?.storeId || 'unknown-merchant',
    amount: total,
    description: `Purchase of ${cartCount} items at ${firstItem?.store || 'Local Merchant'}`
  };

  return (
    <div className="cart-wishlist-view">
      <div className="items-list">
        {cartItems.map(item => (
          <div key={item.id} className="premium-card item-row-card">
            <img src={item.image} alt={item.name} className="item-thumbnail" />
            <div className="item-details">
              <h4 className="item-name">{item.name}</h4>
              <p className="item-store">{item.store}</p>
              <div className="item-price-actions">
                <span className="item-price">${item.price.toFixed(2)}</span>
                <div className="item-qty-selector">
                  <button className="qty-btn" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                    <Minus size={12} />
                  </button>
                  <span className="qty-val">{item.quantity}</span>
                  <button className="qty-btn" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            </div>
            <button className="remove-btn" onClick={() => removeFromCart(item.id)}>
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>

      <div className="premium-card checkout-summary">
        <h3>Order Summary</h3>
        <div className="summary-row">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="summary-row">
          <span>Estimated Tax</span>
          <span>${tax.toFixed(2)}</span>
        </div>
        <div className="summary-divider"></div>
        <div className="summary-row total">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
        <button className="checkout-btn" onClick={() => setIsCheckoutOpen(true)}>
          Proceed to Checkout <ArrowRight size={18} />
        </button>
      </div>

      <SetxCheckoutOverlay 
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        request={checkoutRequest}
        onSuccess={(txId) => {
          clearCart();
          setIsCheckoutOpen(false);
        }}
      />
    </div>
  );
};

export const WishlistView: React.FC = () => {
  const { wishlistItems, moveToCart, removeFromWishlist } = useCart();
  const { setActiveTab } = useApp();

  if (wishlistItems.length === 0) {
    return (
      <EmptyState 
        icon={Heart}
        title="Wishlist is Empty"
        message="Save items you love to your wishlist and they'll appear here for easy access later."
        action={{
          label: "Browse Marketplace",
          onClick: () => setActiveTab(0)
        }}
      />
    );
  }

  return (
    <div className="cart-wishlist-view">
      <div className="header-actions">
        <span>{wishlistItems.length} items saved</span>
      </div>
      
      <div className="items-list">
        {wishlistItems.map(item => (
          <div key={item.id} className="premium-card item-row-card">
            <img src={item.image} alt={item.name} className="item-thumbnail" />
            <div className="item-details">
              <h4 className="item-name">{item.name}</h4>
              <p className="item-store">{item.store}</p>
              <span className="item-price">${item.price.toFixed(2)}</span>
            </div>
            <div className="wishlist-actions">
              <button className="add-to-cart-btn" onClick={() => moveToCart(item.id)}>
                <ShoppingCart size={16} /> Add
              </button>
              <button className="remove-btn" onClick={() => removeFromWishlist(item.id)}>
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
