import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Package, 
  DollarSign, 
  TrendingUp, 
  Plus, 
  Settings, 
  Loader2,
  ExternalLink,
  CheckCircle,
  Megaphone,
  Users,
  CreditCard,
  RefreshCw,
  Layout
} from 'lucide-react';
import { AdManager } from './AdManager';
import { supabase } from '../lib/supabase';
import { StaffManagement } from './StaffManagement';
import { getOrCreateWallet, processRefund } from '../lib/payments';
import { StoreSetupWizard } from './StoreSetupWizard';
import { StoreIntegrations } from './StoreIntegrations';
import { StoreFrontEditor } from './StoreFrontEditor';
import './VendorDashboard.css';

interface VendorDashboardProps {
  user: any;
}

export const VendorDashboard: React.FC<VendorDashboardProps & { activeTab?: number, onNavigateToStore?: (id: string) => void }> = ({ user, activeTab: propTab, onNavigateToStore }) => {
  const [stores, setStores] = useState<any[]>([]);
  const [currentStore, setCurrentStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [storeWallet, setStoreWallet] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isShowingWizard, setIsShowingWizard] = useState(false);
  
  // tabMap must match vendorNav order in App.tsx: products,orders,withdrawals,settings,overview,ads,storefront,team
  const tabMap = ['products', 'orders', 'withdrawals', 'settings', 'overview', 'ads', 'storefront', 'team'];
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'withdrawals' | 'settings' | 'ads' | 'storefront' | 'team'>((propTab !== undefined && tabMap[propTab]) ? tabMap[propTab] as any : 'overview');
  const [showProductModal, setShowProductModal] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', description: '', stock_quantity: 10 });
  const [savingProduct, setSavingProduct] = useState(false);

  useEffect(() => {
    if (propTab !== undefined && tabMap[propTab]) {
      setActiveTab(tabMap[propTab] as any);
    }
  }, [propTab]);

  const [platformSettings, setPlatformSettings] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchVendorData();
    }
  }, [user]);

  const fetchVendorData = async () => {
    setIsLoading(true);
    const staffStoreIds = user.clearances
      ?.filter((c: any) => c.entity_type === 'business')
      .map((c: any) => c.entity_id) || [];

    const { data: storeData } = await supabase
      .from('stores')
      .select('*')
      .or(`owner_id.eq.${user.id}${staffStoreIds.length > 0 ? `,id.in.(${staffStoreIds.map((id: string) => `"${id}"`).join(',')})` : ''}`);

    if (storeData && storeData.length > 0) {
      setStores(storeData);
      const activeStore = currentStore ? storeData.find((s: any) => s.id === currentStore.id) || storeData[0] : storeData[0];
      setCurrentStore(activeStore);

      const { data: productData } = await supabase.from('products').select('*').eq('store_id', activeStore.id).order('created_at', { ascending: false });
      const { data: orderData } = await supabase.from('orders').select('*, profiles:customer_id(*)').eq('store_id', activeStore.id).order('created_at', { ascending: false });
      const { data: withdrawalData } = await supabase.from('withdrawals').select('*').eq('store_id', activeStore.id).order('created_at', { ascending: false });
      const { data: settingsData } = await supabase.from('platform_settings').select('*').single();

      setProducts(productData || []);
      setOrders(orderData || []);
      setWithdrawals(withdrawalData || []);
      setPlatformSettings(settingsData);
      
      const wallet = await getOrCreateWallet(activeStore.id, 'business');
      setStoreWallet(wallet);
    }
    setIsLoading(false);
  };

  const handleCreateWithdrawal = async (amount: number) => {
    if (!storeWallet || amount > storeWallet.balance) { alert('Insufficient balance'); return; }
    const { error } = await supabase.from('withdrawals').insert([{ store_id: currentStore.id, amount, status: 'pending' }]);
    if (error) alert('Error requesting withdrawal'); else fetchVendorData();
  };

  const handleSaveStoreSettings = async () => {
    setIsLoading(true);
    const { error } = await supabase
      .from('stores')
      .update({
        is_refunds_enabled: currentStore.is_refunds_enabled,
        refund_window_days: currentStore.refund_window_days
      })
      .eq('id', currentStore.id);
    
    setIsLoading(false);
    if (error) alert('Error saving settings');
    else alert('Store settings updated successfully');
  };

  const handleCreateProduct = async () => {
    if (!newProduct.name || !newProduct.price) { alert('Name and price are required.'); return; }
    setSavingProduct(true);
    const { error } = await supabase.from('products').insert([{
      store_id: currentStore.id,
      name: newProduct.name,
      price: parseFloat(newProduct.price),
      description: newProduct.description,
      stock_quantity: newProduct.stock_quantity,
      status: 'active'
    }]);
    setSavingProduct(false);
    if (error) { alert('Error creating product: ' + error.message); return; }
    setShowProductModal(false);
    setNewProduct({ name: '', price: '', description: '', stock_quantity: 10 });
    fetchVendorData();
  };

  const handleRefund = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to issue a full refund for this order? This will move funds back to the customer wallet.')) return;
    
    setIsLoading(true);
    const result = await processRefund(orderId);
    setIsLoading(false);

    if (result.success) {
      alert('Refund processed successfully');
      fetchVendorData();
    } else {
      alert(`Refund failed: ${result.error}`);
    }
  };

  if (isLoading) return <div className="vendor-dashboard-loading"><Loader2 className="animate-spin" size={48} /><p>Opening Merchant Center...</p></div>;

  if (!currentStore) return (
    <div className="premium-card empty-vendor-state">
      <ShoppingBag size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
      <h3>No Store Found</h3>
      <p>You haven't set up a business storefront yet.</p>
      <button className="create-store-btn primary-btn" onClick={() => setIsShowingWizard(true)}>Create Your First Store</button>
      {isShowingWizard && (
        <StoreSetupWizard 
          user={user} 
          onComplete={(newStore) => {
            setIsShowingWizard(false);
            setStores([...stores, newStore]);
            setCurrentStore(newStore);
            fetchVendorData();
          }}
          onCancel={() => setIsShowingWizard(false)}
        />
      )}
    </div>
  );

  return (
    <div className="vendor-dashboard-container">
      {stores.length > 1 && (
        <div className="store-switcher glass">
          <label>Managing Store:</label>
          <select value={currentStore.id} onChange={(e) => { const selected = stores.find(s => s.id === e.target.value); setCurrentStore(selected); fetchVendorData(); }}>
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
              {currentStore.is_verified && <span className="verified-badge"><CheckCircle size={12} /> Verified Vendor</span>}
              <span className="vendor-role-badge">{currentStore.category}</span>
            </div>
          </div>
        </div>
        <div className="vendor-header-actions">
          <button className="view-shop-btn" onClick={() => currentStore && onNavigateToStore?.(currentStore.id)}><ExternalLink size={16} /> View Shop</button>
          <button className="add-store-btn" onClick={() => setIsShowingWizard(true)}><Plus size={16} /> Add Store</button>
        </div>
      </header>

      {isShowingWizard && (
        <StoreSetupWizard 
          user={user} 
          onComplete={(newStore) => {
            setIsShowingWizard(false);
            setStores([...stores, newStore]);
            setCurrentStore(newStore);
            fetchVendorData();
          }}
          onCancel={() => setIsShowingWizard(false)}
        />
      )}

      <nav className="vendor-tabs">
        <button className={`vendor-tab-link ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}><TrendingUp size={18} /> Overview</button>
        <button className={`vendor-tab-link ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}><Package size={18} /> Products</button>
        <button className={`vendor-tab-link ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}><ShoppingBag size={18} /> Orders</button>
        {platformSettings?.is_withdrawal_enabled && <button className={`vendor-tab-link ${activeTab === 'withdrawals' ? 'active' : ''}`} onClick={() => setActiveTab('withdrawals')}><DollarSign size={18} /> Withdrawals</button>}
        <button className={`vendor-tab-link ${activeTab === 'ads' ? 'active' : ''}`} onClick={() => setActiveTab('ads')}><Megaphone size={18} /> Ads</button>
        <button className={`vendor-tab-link ${activeTab === 'storefront' ? 'active' : ''}`} onClick={() => setActiveTab('storefront')}><Layout size={18} /> Store Front</button>
        <button className={`vendor-tab-link ${activeTab === 'team' ? 'active' : ''}`} onClick={() => setActiveTab('team')}><Users size={18} /> Team</button>
        <button className={`vendor-tab-link ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}><Settings size={18} /> Settings</button>
      </nav>

      <main className="vendor-content">
        {activeTab === 'overview' && (
          <div className="vendor-overview">
            <div className="vendor-stats-grid">
              <div className="stat-card premium-card"><span className="stat-label">Total Sales</span><span className="stat-value">${parseFloat(currentStore.total_sales || '0').toFixed(2)}</span></div>
              <div className="stat-card premium-card"><span className="stat-label">Wallet Balance</span><span className="stat-value text-primary">${storeWallet ? Number(storeWallet.balance).toFixed(2) : '0.00'}</span></div>
              <div className="stat-card premium-card"><span className="stat-label">Orders</span><span className="stat-value">{orders.length}</span></div>
              <div className="stat-card premium-card"><span className="stat-label">Products</span><span className="stat-value">{products.length}</span></div>
            </div>

            <div className="vendor-stats-grid" style={{ marginTop: 24 }}>
              <div className="stat-card premium-card" style={{ border: '1px solid rgba(16,185,129,0.2)' }}>
                <span className="stat-label">Trust Score</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                  <div style={{ height: 10, flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: 5, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${currentStore.trust_score || 85}%`, background: 'var(--primary)' }} />
                  </div>
                  <span className="stat-value" style={{ fontSize: '1.2rem' }}>{currentStore.trust_score || 85}%</span>
                </div>
              </div>
              <div className="stat-card premium-card">
                <span className="stat-label">Response Time</span>
                <span className="stat-value" style={{ fontSize: '1.2rem', marginTop: 8 }}>{currentStore.response_time_hours || 24}h</span>
                <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>Average response time</div>
              </div>
              <div className="stat-card premium-card">
                <span className="stat-label">Fulfillment Rate</span>
                <span className="stat-value" style={{ fontSize: '1.2rem', marginTop: 8 }}>{currentStore.fulfillment_rate || 100}%</span>
                <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>Order completion rate</div>
              </div>
            </div>

            <div className="stripe-connect-banner glass" style={{ marginTop: 24, padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #6366f1' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ background: 'rgba(99,102,241,0.2)', padding: 12, borderRadius: 12 }}><CreditCard color="#6366f1" size={32} /></div>
                <div>
                  <h3 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: 8 }}>Stripe Connect <span style={{ fontSize: '0.7rem', background: '#ef4444', color: '#fff', padding: '2px 8px', borderRadius: 12 }}>Required</span></h3>
                  <p style={{ margin: 0, color: 'var(--text-muted)' }}>Connect your bank account to receive split payouts instantly and legally.</p>
                </div>
              </div>
              <button className="primary-btn" style={{ background: '#6366f1' }}>Connect Bank Account</button>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="vendor-products">
            <div className="section-title">
              <h3>Manage Products ({products.length})</h3>
              <button className="primary-btn" onClick={() => setShowProductModal(true)}><Plus size={16} /> New Product</button>
            </div>
            {products.length === 0 ? (
              <div className="premium-card" style={{ padding: '60px', textAlign: 'center', opacity: 0.6 }}>
                <Package size={48} style={{ marginBottom: 16 }} />
                <h3>No Products Yet</h3>
                <p>Add your first product to start selling.</p>
                <button className="primary-btn" onClick={() => setShowProductModal(true)} style={{ margin: '16px auto 0' }}><Plus size={16} /> Add Product</button>
              </div>
            ) : (
              <div className="product-list-grid">
                {products.map(p => (
                  <div key={p.id} className="product-admin-card premium-card">
                    {p.image_urls?.[0] ? <img src={p.image_urls[0]} className="p-thumb" alt="" /> : <div className="p-thumb" style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, display:'flex', alignItems:'center', justifyContent:'center' }}><Package size={24} opacity={0.3}/></div>}
                    <div className="p-info">
                      <h4>{p.name}</h4>
                      <span className="p-price">${parseFloat(p.price).toFixed(2)}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 8 }}>Stock: {p.stock_quantity ?? '—'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Add Product Modal */}
            {showProductModal && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowProductModal(false)}>
                <div style={{ background: 'var(--surface,#1a1a2e)', borderRadius: 20, padding: 32, width: '90%', maxWidth: 480, border: '1px solid rgba(255,255,255,0.1)' }} onClick={e => e.stopPropagation()}>
                  <h3 style={{ margin: '0 0 24px' }}>Add New Product</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>Product Name *</label>
                      <input type="text" value={newProduct.name} onChange={e => setNewProduct(p => ({...p, name: e.target.value}))} placeholder="e.g. Handmade Candle" style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', marginTop: 6, boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>Price ($) *</label>
                      <input type="number" value={newProduct.price} onChange={e => setNewProduct(p => ({...p, price: e.target.value}))} placeholder="24.99" style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', marginTop: 6, boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>Description</label>
                      <textarea value={newProduct.description} onChange={e => setNewProduct(p => ({...p, description: e.target.value}))} placeholder="Describe your product..." rows={3} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', marginTop: 6, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>Starting Stock Quantity</label>
                      <input type="number" value={newProduct.stock_quantity} onChange={e => setNewProduct(p => ({...p, stock_quantity: parseInt(e.target.value)}))} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', marginTop: 6, boxSizing: 'border-box' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                    <button className="primary-btn" onClick={handleCreateProduct} disabled={savingProduct} style={{ flex: 1, justifyContent: 'center' }}>{savingProduct ? 'Saving...' : 'Create Product'}</button>
                    <button onClick={() => setShowProductModal(false)} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', cursor: 'pointer', fontWeight: 700 }}>Cancel</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="vendor-orders">
            <div className="section-title"><h3>Marketplace Orders</h3></div>
            <div className="orders-table-container premium-card" style={{ marginTop: 20 }}>
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Order Date</th>
                    <th>Customer</th>
                    <th>Method</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>No orders found yet.</td></tr>
                  ) : orders.map(order => (
                    <tr key={order.id}>
                      <td>{new Date(order.created_at).toLocaleDateString()}</td>
                      <td>
                        <div style={{ fontWeight: 700 }}>{order.profiles?.name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{order.id.slice(0, 8)}</div>
                      </td>
                      <td><span className={`method-badge ${order.payment_method}`} style={{ 
                        padding: '2px 6px', borderRadius: 4, fontSize: '0.6rem', fontWeight: 800,
                        background: order.payment_method === 'stripe' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(234, 179, 8, 0.1)',
                        color: order.payment_method === 'stripe' ? '#6366f1' : '#eab308'
                      }}>{order.payment_method.toUpperCase()}</span></td>
                      <td>${parseFloat(order.amount).toFixed(2)}</td>
                      <td>
                        <span className={`status-badge ${order.status}`} style={{
                          padding: '4px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 800,
                          background: order.status === 'refunded' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                          color: order.status === 'refunded' ? '#ef4444' : '#10b981'
                        }}>
                          {order.status.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        {order.status === 'completed' && (
                          <button 
                            className="mini-btn" 
                            style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)', borderRadius: 4 }}
                            onClick={() => handleRefund(order.id)}
                          >
                            <RefreshCw size={14} /> Refund
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'withdrawals' && (
          <div className="vendor-withdrawals">
            <div className="withdrawal-header-card premium-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 32, marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Available Balance</div>
                <h2 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary)' }}>${storeWallet ? Number(storeWallet.balance).toFixed(2) : '0.00'}</h2>
              </div>
              <button className="primary-btn" onClick={() => handleCreateWithdrawal(storeWallet?.balance || 0)} disabled={!storeWallet || storeWallet.balance <= 0}>Request Payout</button>
            </div>
            <section className="premium-card" style={{ padding: 24 }}>
              <h3 style={{ margin: '0 0 16px' }}>Withdrawal History</h3>
              {withdrawals.length === 0 ? <p style={{ opacity: 0.5 }}>No withdrawal requests yet.</p> : withdrawals.map(w => (
                <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span>{new Date(w.created_at).toLocaleDateString()}</span>
                  <span style={{ fontWeight: 700 }}>${w.amount}</span>
                  <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: 6, background: w.status === 'approved' ? 'rgba(16,185,129,0.1)' : 'rgba(234,179,8,0.1)', color: w.status === 'approved' ? '#10b981' : '#eab308', fontWeight: 700 }}>{w.status.toUpperCase()}</span>
                </div>
              ))}
            </section>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="vendor-settings">
            <div className="premium-card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h3>Store Policies</h3>
                <button className="primary-btn" onClick={handleSaveStoreSettings}>Save Changes</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>Enable Customer Refunds</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Allow yourself and your staff to issue refunds for orders.</div>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={currentStore.is_refunds_enabled} 
                      onChange={(e) => setCurrentStore({...currentStore, is_refunds_enabled: e.target.checked})} 
                    />
                    <span className="slider"></span>
                  </label>
                </div>

                <div className="input-group">
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 700 }}>Refund Window (Days)</label>
                  <input 
                    type="number" 
                    className="glass-input"
                    style={{ width: '120px', padding: '8px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: 8, color: '#fff' }}
                    value={currentStore.refund_window_days}
                    onChange={(e) => setCurrentStore({...currentStore, refund_window_days: parseInt(e.target.value)})}
                  />
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>Maximum days after purchase that a refund can be issued.</div>
                </div>
              </div>
            </div>

            <div className="premium-card" style={{ marginTop: 24, padding: 0 }}>
              <StoreIntegrations store={currentStore} onUpdate={fetchVendorData} />
            </div>
          </div>
        )}

        {activeTab === 'ads' && <div className="fade-in"><AdManager user={user} /></div>}
        {activeTab === 'storefront' && currentStore && <div className="fade-in"><StoreFrontEditor store={currentStore} onUpdate={fetchVendorData} /></div>}
        {activeTab === 'team' && currentStore && <div className="fade-in"><StaffManagement entityId={currentStore.id} entityType="business" user={user} /></div>}
      </main>
    </div>
  );
};
