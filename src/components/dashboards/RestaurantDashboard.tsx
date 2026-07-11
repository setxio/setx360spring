import type { User } from '../../types/user';
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
import { supabase } from '../../lib/supabase';
import { useApp } from '../../context/AppContext';
import { PremiumDashboardLayout } from './PremiumDashboardLayout';
import { TeamManager } from './TeamManager';
import { getOrCreateWallet } from '../../lib/payments';
import { BusinessCrmView } from './BusinessCrmView';

interface RestaurantDashboardProps {
  user: User;
}

export const RestaurantDashboard: React.FC<RestaurantDashboardProps> = ({ user }) => {
  const { activeContext } = useApp();
  const [currentStore, setCurrentStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [storeWallet, setStoreWallet] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'menu' | 'orders' | 'ads' | 'team' | 'settings' | 'crm'>('overview');
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [newMenuItem, setNewMenuItem] = useState({ name: '', price: '', description: '' });

  useEffect(() => {
    fetchRestaurantData();
  }, [activeContext]);

  const fetchRestaurantData = async () => {
    setIsLoading(true);
    if (activeContext?.id) {
      // For now, treat activeContext as the store directly, or fetch from stores table
      const { data: storeData } = await supabase.from('stores').select('*').eq('id', activeContext.id).single();
      const resolvedStore = storeData || activeContext;
      setCurrentStore(resolvedStore);

      const { data: menuData } = await supabase.from('products').select('*').eq('store_id', activeContext.id).order('created_at', { ascending: false });
      const { data: orderData } = await supabase.from('orders').select('*, profiles:customer_id(*)').eq('store_id', activeContext.id).order('created_at', { ascending: false });
      
      setProducts(menuData || []);
      setOrders(orderData || []);
      
      const wallet = await getOrCreateWallet(currentStore.owner_id, 'business');
      setStoreWallet(wallet);
    }
    setIsLoading(false);
  };

  const handleCreateMenuItem = async () => {
    if (!newMenuItem.name || !newMenuItem.price || !currentStore) return;
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

  const navItems = [
    { id: 'overview', label: 'Overview', icon: <TrendingUp size={20} /> },
    { id: 'menu', label: 'Menu', icon: <Utensils size={20} /> },
    { id: 'orders', label: 'Orders', icon: <ClipboardList size={20} /> },
    { id: 'crm', label: 'CRM', icon: <Users size={20} /> },
    { id: 'ads', label: 'Promotions', icon: <Megaphone size={20} /> },
    { id: 'team', label: 'Staff', icon: <Users size={20} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={20} /> }
  ];

  return (
    <PremiumDashboardLayout
      title={currentStore?.name || "Restaurant Dashboard"}
      icon={<ChefHat size={24} />}
      navItems={navItems}
      activeTab={activeTab}
      onTabChange={(tab) => setActiveTab(tab as any)}
      user={user}
      headerActions={
        <button className="premium-btn" onClick={() => window.open(`/?env=shop&store=${currentStore?.id}`)}>
          <ExternalLink size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} /> 
          View Menu
        </button>
      }
    >
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

        {activeTab === 'ads' && <AdManager user={user} products={products} currentStore={currentStore} storeWallet={storeWallet} onWalletUpdate={fetchRestaurantData} />}
        {activeTab === 'team' && <TeamManager />}
        {activeTab === 'crm' && <BusinessCrmView />}
    </PremiumDashboardLayout>
  );
};
