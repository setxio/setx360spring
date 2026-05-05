import React, { useState, useEffect } from 'react';
import { 
  Utensils, 
  ClipboardList, 
  TrendingUp, 
  Plus, 
  Settings, 
  Loader2,
  ExternalLink,
  CheckCircle,
  Megaphone,
  Users,
  CreditCard,
  ChefHat
} from 'lucide-react';
import { AdManager } from './AdManager';
import { supabase } from '../lib/supabase';
import { StaffManagement } from './StaffManagement';
import { getOrCreateWallet } from '../lib/payments';
import { BusinessCrmView } from './BusinessCrmView';
import './VendorDashboard.css'; // Reusing styles for consistency

interface RestaurantDashboardProps {
  user: any;
  currentStore: any;
  stores: any[];
  onStoreChange: (store: any) => void;
  onNavigateToStore?: (id: string) => void;
}

export const RestaurantDashboard: React.FC<RestaurantDashboardProps> = ({ user, currentStore, stores, onStoreChange, onNavigateToStore }) => {
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [storeWallet, setStoreWallet] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'menu' | 'orders' | 'ads' | 'team' | 'settings' | 'crm'>('overview');
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [newMenuItem, setNewMenuItem] = useState({ name: '', price: '', description: '' });

  useEffect(() => {
    fetchRestaurantData();
  }, [currentStore]);

  const fetchRestaurantData = async () => {
    setIsLoading(true);
    if (currentStore) {
      const { data: menuData } = await supabase.from('products').select('*').eq('store_id', currentStore.id).order('created_at', { ascending: false });
      const { data: orderData } = await supabase.from('orders').select('*, profiles:customer_id(*)').eq('store_id', currentStore.id).order('created_at', { ascending: false });
      
      setProducts(menuData || []);
      setOrders(orderData || []);
      
      const wallet = await getOrCreateWallet(currentStore.id, 'business');
      setStoreWallet(wallet);
    }
    setIsLoading(false);
  };

  const handleCreateMenuItem = async () => {
    if (!newMenuItem.name || !newMenuItem.price) return;
    const { error } = await supabase.from('products').insert([{
      store_id: currentStore.id,
      name: newMenuItem.name,
      price: parseFloat(newMenuItem.price),
      description: newMenuItem.description,
      status: 'active'
    }]);
    if (!error) {
      setShowMenuModal(false);
      setNewMenuItem({ name: '', price: '', description: '' });
      fetchRestaurantData();
    }
  };

  if (isLoading) return <div className="vendor-dashboard-loading"><Loader2 className="animate-spin" size={48} /><p>Opening Kitchen Dashboard...</p></div>;

  return (
    <div className="vendor-dashboard-container restaurant-mode">
      {stores.length > 1 && (
        <div className="store-switcher glass">
          <label>Managing Establishment:</label>
          <select value={currentStore.id} onChange={(e) => onStoreChange(stores.find(s => s.id === e.target.value))}>
            {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      )}

      <header className="vendor-header premium-card">
        <div className="vendor-profile-brief">
          <img src={currentStore.image_url || `https://ui-avatars.com/api/?name=${currentStore.name}`} className="vendor-logo" alt={currentStore.name} />
          <div className="vendor-info">
            <h2>{currentStore.name}</h2>
            <div className="vendor-badges">
              {currentStore.is_verified && <span className="verified-badge"><CheckCircle size={12} /> Verified Restaurant</span>}
              <span className="vendor-role-badge"><ChefHat size={12} /> {currentStore.category}</span>
            </div>
          </div>
        </div>
        <div className="vendor-header-actions">
          <button className="view-shop-btn" onClick={() => onNavigateToStore?.(currentStore.id)}><ExternalLink size={16} /> View Menu</button>
        </div>
      </header>

      <nav className="vendor-tabs">
        <button className={`vendor-tab-link ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}><TrendingUp size={18} /> Overview</button>
        <button className={`vendor-tab-link ${activeTab === 'menu' ? 'active' : ''}`} onClick={() => setActiveTab('menu')}><Utensils size={18} /> Menu</button>
        <button className={`vendor-tab-link ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}><ClipboardList size={18} /> Orders</button>
        <button className={`vendor-tab-link ${activeTab === 'crm' ? 'active' : ''}`} onClick={() => setActiveTab('crm')}><Users size={18} /> CRM</button>
        <button className={`vendor-tab-link ${activeTab === 'ads' ? 'active' : ''}`} onClick={() => setActiveTab('ads')}><Megaphone size={18} /> Promotions</button>
        <button className={`vendor-tab-link ${activeTab === 'team' ? 'active' : ''}`} onClick={() => setActiveTab('team')}><Users size={18} /> Staff</button>
        <button className={`vendor-tab-link ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}><Settings size={18} /> Settings</button>
      </nav>

      <main className="vendor-content">
        {activeTab === 'overview' && (
          <div className="vendor-overview">
            <div className="vendor-stats-grid">
              <div className="stat-card premium-card"><span className="stat-label">Daily Revenue</span><span className="stat-value">${parseFloat(currentStore.total_sales || '0').toFixed(2)}</span></div>
              <div className="stat-card premium-card"><span className="stat-label">Pending Orders</span><span className="stat-value text-primary">{orders.filter(o => o.status === 'pending').length}</span></div>
              <div className="stat-card premium-card"><span className="stat-label">Live Menu Items</span><span className="stat-value">{products.length}</span></div>
              <div className="stat-card premium-card"><span className="stat-label">Wallet Balance</span><span className="stat-value">${storeWallet ? Number(storeWallet.balance).toFixed(2) : '0.00'}</span></div>
            </div>

            <div className="stripe-connect-banner glass" style={{ marginTop: 24, padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #6366f1' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ background: 'rgba(99,102,241,0.2)', padding: 12, borderRadius: 12 }}><CreditCard color="#6366f1" size={32} /></div>
                <div>
                  <h3 style={{ margin: '0 0 8px 0' }}>Merchant Payouts</h3>
                  <p style={{ margin: 0, color: 'var(--text-muted)' }}>Securely receive earnings from your digital orders.</p>
                </div>
              </div>
              <button className="primary-btn" style={{ background: '#6366f1' }}>Manage Payouts</button>
            </div>
          </div>
        )}

        {activeTab === 'menu' && (
          <div className="vendor-products">
            <div className="section-title">
              <h3>Menu Management</h3>
              <button className="primary-btn" onClick={() => setShowMenuModal(true)}><Plus size={16} /> Add Item</button>
            </div>
            <div className="product-list-grid">
              {products.map(p => (
                <div key={p.id} className="product-admin-card premium-card">
                  <div className="p-info">
                    <h4>{p.name}</h4>
                    <span className="p-price">${parseFloat(p.price).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
            {showMenuModal && (
              <div className="modal-overlay" onClick={() => setShowMenuModal(false)}>
                <div className="modal-content glass" onClick={e => e.stopPropagation()}>
                  <h3>New Menu Item</h3>
                  <input type="text" placeholder="Item Name" value={newMenuItem.name} onChange={e => setNewMenuItem({...newMenuItem, name: e.target.value})} className="glass-input" />
                  <input type="number" placeholder="Price" value={newMenuItem.price} onChange={e => setNewMenuItem({...newMenuItem, price: e.target.value})} className="glass-input" />
                  <textarea placeholder="Description" value={newMenuItem.description} onChange={e => setNewMenuItem({...newMenuItem, description: e.target.value})} className="glass-input" />
                  <button onClick={handleCreateMenuItem} className="primary-btn">Save Item</button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="vendor-orders">
             <h3>Active & Past Orders</h3>
             {/* Simplified orders table */}
          </div>
        )}

        {activeTab === 'ads' && <AdManager user={user} />}
        {activeTab === 'team' && <StaffManagement entityId={currentStore.id} entityType="business" user={user} />}
        {activeTab === 'crm' && <BusinessCrmView storeId={currentStore.id} />}
      </main>
    </div>
  );
};
