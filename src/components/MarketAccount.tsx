import React, { useState, useEffect } from 'react';
import { 
  Package, 
  CreditCard, 
  MapPin, 
  ChevronRight, 
  Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import './MarketAccount.css';

interface MarketAccountProps {
  user: any;
}

export const MarketAccount: React.FC<MarketAccountProps> = ({ user }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'billing' | 'addresses'>('orders');

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (
            name,
            image_urls
          ),
          stores (
            name
          )
        )
      `)
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setOrders(data);
    }
    setIsLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'pending': return '#fbbf24';
      case 'cancelled': return '#ef4444';
      case 'refunded': return '#8b5cf6';
      default: return '#94a3b8';
    }
  };

  if (isLoading) {
    return (
      <div className="market-account-loading">
        <Loader2 className="animate-spin" size={48} color="var(--primary)" />
      </div>
    );
  }

  return (
    <div className="market-account-container">
      <div className="account-sidebar">
        <div className="account-user-card premium-card">
          <img 
            src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.name}`} 
            alt={user.name} 
            className="account-avatar"
          />
          <h3 className="account-name">{user.name}</h3>
          <p className="account-email">{user.email}</p>
        </div>
        <nav className="account-nav-menu premium-card">
          <button 
            className={`nav-menu-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <Package size={20} /> My Orders
          </button>
          <button 
            className={`nav-menu-btn ${activeTab === 'billing' ? 'active' : ''}`}
            onClick={() => setActiveTab('billing')}
          >
            <CreditCard size={20} /> Billing Info
          </button>
          <button 
            className={`nav-menu-btn ${activeTab === 'addresses' ? 'active' : ''}`}
            onClick={() => setActiveTab('addresses')}
          >
            <MapPin size={20} /> Addresses
          </button>
        </nav>
      </div>

      <div className="account-content">
        {activeTab === 'orders' && (
          <div className="account-section">
            <h2 className="section-title">Order History</h2>
            {orders.length === 0 ? (
              <div className="empty-state premium-card">
                <Package size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
                <h3>No Orders Yet</h3>
                <p>Looks like you haven't made any purchases yet.</p>
                <button className="start-shopping-btn">Start Shopping</button>
              </div>
            ) : (
              <div className="orders-list">
                {orders.map(order => (
                  <div key={order.id} className="order-card premium-card">
                    <div className="order-header">
                      <div className="order-meta">
                        <span className="order-id">Order #{order.id.slice(0, 8).toUpperCase()}</span>
                        <span className="order-date">{new Date(order.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="order-status-badge" style={{ color: getStatusColor(order.status), background: `${getStatusColor(order.status)}15` }}>
                        {order.status}
                      </div>
                    </div>
                    
                    <div className="order-items">
                      {order.order_items?.map((item: any, idx: number) => (
                        <div key={idx} className="order-item-row">
                          <img 
                            src={item.products?.image_urls?.[0] || 'https://via.placeholder.com/60'} 
                            alt={item.products?.name} 
                            className="order-item-img"
                          />
                          <div className="order-item-details">
                            <h4>{item.products?.name || 'Unknown Product'}</h4>
                            <p>Sold by: {item.stores?.name || 'Local Vendor'}</p>
                          </div>
                          <div className="order-item-price">
                            <span>Qty: {item.quantity}</span>
                            <strong>${item.unit_price}</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="order-footer">
                      <div className="order-total">
                        <span>Total:</span>
                        <h2>${order.total_amount}</h2>
                      </div>
                      <button className="view-details-btn">View Details <ChevronRight size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="account-section">
            <h2 className="section-title">Billing Information</h2>
            <div className="empty-state premium-card">
              <CreditCard size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
              <h3>No Payment Methods Saved</h3>
              <p>Add a payment method to express checkout on future orders.</p>
              <button className="start-shopping-btn">Add Payment Method</button>
            </div>
          </div>
        )}

        {activeTab === 'addresses' && (
          <div className="account-section">
            <h2 className="section-title">Saved Addresses</h2>
            <div className="empty-state premium-card">
              <MapPin size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
              <h3>No Addresses Saved</h3>
              <p>Save shipping addresses for a faster checkout experience.</p>
              <button className="start-shopping-btn">Add New Address</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
