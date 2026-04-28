import { ShoppingCart, Trash2, ArrowRight, Heart } from 'lucide-react';
import { EmptyState } from './EmptyState';
import './CartWishlistView.css';

const mockCartItems: any[] = []; // Empty for demo of empty state
const mockWishlistItems: any[] = [];

export const CartView: React.FC = () => {
  if (mockCartItems.length === 0) {
    return (
      <EmptyState 
        icon={ShoppingCart}
        title="Your Cart is Empty"
        message="Looks like you haven't added anything to your cart yet. Explore the marketplace to find something special!"
        action={{
          label: "Shop Now",
          onClick: () => window.location.hash = '#market' // Simple hash routing fallback
        }}
      />
    );
  }

  const subtotal = mockCartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.0825;
  const total = subtotal + tax;

  return (
    <div className="cart-wishlist-view">
      <div className="items-list">
        {mockCartItems.map(item => (
          <div key={item.id} className="premium-card item-row-card">
            <img src={item.image} alt={item.name} className="item-thumbnail" />
            <div className="item-details">
              <h4 className="item-name">{item.name}</h4>
              <p className="item-store">{item.store}</p>
              <div className="item-price-actions">
                <span className="item-price">${item.price.toFixed(2)}</span>
                <div className="item-qty">Qty: {item.quantity}</div>
              </div>
            </div>
            <button className="remove-btn">
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
        <button className="checkout-btn">
          Proceed to Checkout <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};

export const WishlistView: React.FC = () => {
  if (mockWishlistItems.length === 0) {
    return (
      <EmptyState 
        icon={Heart}
        title="Wishlist is Empty"
        message="Save items you love to your wishlist and they'll appear here for easy access later."
        action={{
          label: "Browse Marketplace",
          onClick: () => window.location.hash = '#market'
        }}
      />
    );
  }

  return (
    <div className="cart-wishlist-view">
      <div className="header-actions">
        <span>{mockWishlistItems.length} items saved</span>
        <button className="share-list-btn">Share List</button>
      </div>
      
      <div className="items-list">
        {mockWishlistItems.map(item => (
          <div key={item.id} className="premium-card item-row-card">
            <img src={item.image} alt={item.name} className="item-thumbnail" />
            <div className="item-details">
              <h4 className="item-name">{item.name}</h4>
              <p className="item-store">{item.store}</p>
              <span className="item-price">${item.price.toFixed(2)}</span>
            </div>
            <div className="wishlist-actions">
              <button className="add-to-cart-btn">
                <ShoppingCart size={16} /> Add
              </button>
              <button className="remove-btn">
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
