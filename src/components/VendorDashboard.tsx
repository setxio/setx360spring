import type { User } from '../types/user';
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
  Layout,
  CreditCard as BankCard,
  CheckCircle2,
  XCircle,
  Menu,
  ChevronLeft
} from 'lucide-react';
import { AdManager } from './AdManager';
import { supabase } from '../lib/supabase';
import { StaffManagement } from './StaffManagement';
import { getOrCreateWallet, processRefund, b2bTransfer } from '../lib/payments';
import { StoreSetupWizard } from './StoreSetupWizard';
import { StoreIntegrations } from './StoreIntegrations';
import { StoreFrontEditor } from './StoreFrontEditor';
import { RestaurantDashboard } from './RestaurantDashboard';
import { ServicesDashboard } from './ServicesDashboard';
import { MasterBusinessDashboard } from './MasterBusinessDashboard';
import { BusinessCrmView } from './BusinessCrmView';
import './VendorDashboard.css';

interface VendorDashboardProps {
  user: User;
  initialStoreId?: string | null;
  activeTab?: number;
  onNavigateToStore?: (id: string) => void;
}

export const VendorDashboard: React.FC<VendorDashboardProps> = ({ user, initialStoreId, activeTab: propTab, onNavigateToStore }) => {
  const [stores, setStores] = useState<any[]>([]);
  const [currentStore, setCurrentStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [storeWallet, setStoreWallet] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isShowingWizard, setIsShowingWizard] = useState(false);
  const [isMasterMode, setIsMasterMode] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const tabMap = ['overview', 'products', 'orders', 'crm', 'withdrawals', 'ads', 'storefront', 'team', 'settings', 'billing'] as const;
  type TabType = typeof tabMap[number];
  const [activeTab, setActiveTab] = useState<TabType>((propTab !== undefined && tabMap[propTab]) ? tabMap[propTab] : 'overview');
  
  const [showProductModal, setShowProductModal] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', description: '', stock_quantity: 10 });
  const [savingProduct, setSavingProduct] = useState(false);

  const [isSubscribing, setIsSubscribing] = useState(false);
  const [billingError, setBillingError] = useState('');
  const [billingSuccess, setBillingSuccess] = useState('');
  const [tenantProfile, setTenantProfile] = useState<any>(null);
  const [platformSettings, setPlatformSettings] = useState<any>(null);

  // B2B Transfer State
  const [b2bReceiverId, setB2bReceiverId] = useState('');
  const [b2bAmount, setB2bAmount] = useState('');
  const [b2bDescription, setB2bDescription] = useState('');
  const [isB2bLoading, setIsB2bLoading] = useState(false);

  useEffect(() => {
    if (propTab !== undefined && tabMap[propTab]) {
      setActiveTab(tabMap[propTab]);
    }
  }, [propTab]);

  useEffect(() => {
    if (user) {
      fetchVendorData();
      fetchTenantProfile();
    }
  }, [user]);

  useEffect(() => {
    if (stores.length > 1 && !currentStore) {
      setIsMasterMode(true);
    }
  }, [stores]);

  const fetchTenantProfile = async () => {
    const { data } = await supabase.from('tenants').select('*').eq('owner_id', user?.id).single();
    if (data) setTenantProfile(data);
  };

  const fetchVendorData = async () => {
    setIsLoading(true);
    const staffStoreIds = user.clearances?.filter((c: any) => c.entity_type === 'business').map((c: any) => c.entity_id) || [];

    const { data: storeData } = await supabase
      .from('stores')
      .select('*')
      .or(`owner_id.eq.${user.id}${staffStoreIds.length > 0 ? `,id.in.(${staffStoreIds.map((id: string) => `"${id}"`).join(',')})` : ''}`);

    if (storeData && storeData.length > 0) {
      setStores(storeData);
      
      let activeStore = null;
      if (initialStoreId) activeStore = storeData.find((s: any) => s.id === initialStoreId);
      if (!activeStore) activeStore = currentStore ? storeData.find((s: any) => s.id === currentStore.id) || storeData[0] : storeData[0];
      
      setCurrentStore(activeStore);
      if (initialStoreId && activeStore) setIsMasterMode(false);

      const { data: productData } = await supabase.from('products').select('*').eq('store_id', activeStore.id).order('created_at', { ascending: false });
      const { data: orderData } = await supabase.from('orders').select('*, profiles:customer_id(*)').eq('store_id', activeStore.id).order('created_at', { ascending: false });
      const { data: withdrawalData } = await supabase.from('withdrawals').select('*').eq('store_id', activeStore.id).order('created_at', { ascending: false });
      const { data: settingsData } = await supabase.from('platform_settings').select('*').single();

      setProducts(productData || []);
      setOrders(orderData || []);
      setWithdrawals(withdrawalData || []);
      setPlatformSettings(settingsData);
      
      const wallet = await getOrCreateWallet(activeStore.owner_id, 'business');
      setStoreWallet(wallet);
    }
    setIsLoading(false);
  };

  const handleCreateWithdrawal = async (amount: number) => {
    if (!storeWallet || amount > storeWallet.balance) { alert('Insufficient balance'); return; }
    const { error } = await supabase.from('withdrawals').insert([{ store_id: currentStore.id, amount, status: 'pending' }]);
    if (error) alert('Error requesting withdrawal'); else fetchVendorData();
  };

  const handleB2bTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStore || !storeWallet) return;
    const amountNum = parseFloat(b2bAmount);
    if (isNaN(amountNum) || amountNum <= 0) { alert('Invalid amount'); return; }
    if (amountNum > storeWallet.balance) { alert('Insufficient balance'); return; }
    
    setIsB2bLoading(true);
    const result = await b2bTransfer(currentStore.owner_id, b2bReceiverId, amountNum, b2bDescription);
    setIsB2bLoading(false);
    
    if (result.success) {
      alert('Transfer successful! Funds moved across the Mesh Network.');
      setB2bAmount('');
      setB2bReceiverId('');
      setB2bDescription('');
      fetchVendorData();
    } else {
      alert('Transfer failed: ' + result.error);
    }
  };


  const handleSaveStoreSettings = async () => {
    setIsLoading(true);
    const { error } = await supabase
      .from('stores')
      .update({ is_refunds_enabled: currentStore.is_refunds_enabled, refund_window_days: currentStore.refund_window_days })
      .eq('id', currentStore.id);
    setIsLoading(false);
    if (error) alert('Error saving settings'); else alert('Store settings updated successfully');
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
    if (!window.confirm('Are you sure you want to issue a full refund for this order?')) return;
    setIsLoading(true);
    const result = await processRefund(orderId);
    setIsLoading(false);
    if (result.success) { alert('Refund processed successfully'); fetchVendorData(); } 
    else { alert(`Refund failed: ${result.error}`); }
  };

  const handleSubscribeSaaS = async () => {
    setBillingError(''); setBillingSuccess(''); setIsSubscribing(true);
    try {
      const tenantSlug = tenantProfile?.slug || currentStore?.slug || `store-${currentStore?.id?.slice(0,6)}`;
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/billing/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ tenant_slug: tenantSlug })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initialize SaaS subscription');
      window.location.href = data.url;
    } catch (err: any) {
      console.error('SaaS subscription error:', err);
      setBillingError(err.message);
      setIsSubscribing(false);
    }
  };

  if (isLoading) return <div className="vendor-dashboard-loading"><Loader2 className="animate-spin" size={48} /><p>Initializing Command Center...</p></div>;

  if (!currentStore) return (
    <div className="premium-card empty-vendor-state" style={{ margin: 'auto', maxWidth: 500, textAlign: 'center', marginTop: '10vh' }}>
      <ShoppingBag size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
      <h3>Welcome to Merchant Center</h3>
      <p>Set up your business storefront to start selling.</p>
      <button className="primary-btn" onClick={() => setIsShowingWizard(true)} style={{ margin: '16px auto' }}>Create Store</button>
      {isShowingWizard && (
        <StoreSetupWizard 
          user={user} 
          onComplete={(newStore) => { setIsShowingWizard(false); setStores([...stores, newStore]); setCurrentStore(newStore); fetchVendorData(); }}
          onCancel={() => setIsShowingWizard(false)}
        />
      )}
    </div>
  );

  if (isMasterMode && stores.length > 1) {
    return <MasterBusinessDashboard user={user} stores={stores} onSelectStore={(s) => { setIsMasterMode(false); setCurrentStore(s); fetchVendorData(); }} />;
  }

  if (currentStore?.category === 'Food & Drink') {
    return <RestaurantDashboard user={user} currentStore={currentStore} stores={stores} onStoreChange={(s) => { setCurrentStore(s); fetchVendorData(); }} onNavigateToStore={onNavigateToStore} />;
  }

  if (currentStore?.category === 'Services') {
    return <ServicesDashboard user={user} currentStore={currentStore} stores={stores} onStoreChange={(s) => { setCurrentStore(s); fetchVendorData(); }} onNavigateToStore={onNavigateToStore} />;
  }

  // Pure CSS Mock Chart Data for Overview
  const mockChartData = [40, 60, 45, 80, 55, 90, 75, 100, 85, 95, 70, 90];

  return (
    <div className="vendor-dashboard-container">
      {/* ── Elite Sidebar ── */}
      <aside className={`elite-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <img src={currentStore.image_url || `https://ui-avatars.com/api/?name=${currentStore.name}&background=random`} alt="Logo" />
            <span className="sidebar-label" style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
              {currentStore.name}
            </span>
          </div>
          <button className="collapse-btn" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
            {sidebarCollapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
        
        <nav className="sidebar-nav">
          {[
            { id: 'overview', icon: <TrendingUp size={20} />, label: 'Overview' },
            { id: 'products', icon: <Package size={20} />, label: 'Products' },
            { id: 'orders', icon: <ShoppingBag size={20} />, label: 'Orders' },
            { id: 'crm', icon: <Users size={20} />, label: 'Customers' },
            { id: 'ads', icon: <Megaphone size={20} />, label: 'Marketing' },
            { id: 'storefront', icon: <Layout size={20} />, label: 'Storefront' },
            { id: 'team', icon: <Users size={20} />, label: 'Team' },
            { id: 'settings', icon: <Settings size={20} />, label: 'Settings' },
            ...(platformSettings?.is_withdrawal_enabled ? [{ id: 'withdrawals', icon: <DollarSign size={20} />, label: 'Payouts' }] : []),
          ].map(item => (
            <div 
              key={item.id} 
              className={`sidebar-item ${activeTab === item.id ? 'active' : ''} ${sidebarCollapsed ? 'collapsed-mode' : ''}`}
              onClick={() => setActiveTab(item.id as TabType)}
              title={sidebarCollapsed ? item.label : undefined}
            >
              {item.icon}
              <span className="sidebar-label">{item.label}</span>
            </div>
          ))}
          
          <div style={{ marginTop: 'auto' }}>
            <div 
              className={`sidebar-item ${activeTab === 'billing' ? 'active' : ''} ${sidebarCollapsed ? 'collapsed-mode' : ''}`}
              onClick={() => setActiveTab('billing')}
              style={{ color: activeTab === 'billing' ? '#fff' : '#6366f1' }}
              title={sidebarCollapsed ? "SaaS Billing" : undefined}
            >
              <BankCard size={20} />
              <span className="sidebar-label">SaaS Billing</span>
            </div>
          </div>
        </nav>
      </aside>

      {/* ── Main Content Area ── */}
      <main className="vendor-content-area">
        <div className="vendor-header-bar">
          <div>
            <h1>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
            <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0', fontSize: '0.9rem' }}>
              {activeTab === 'overview' && "Your command center for business performance."}
              {activeTab === 'products' && "Manage inventory, pricing, and variants."}
              {activeTab === 'orders' && "Fulfill incoming orders and manage returns."}
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {stores.length > 1 && (
              <select 
                className="store-switcher-dropdown"
                value={currentStore?.id} 
                onChange={(e) => { 
                  if (e.target.value === 'master') setIsMasterMode(true);
                  else {
                    const selected = stores.find(s => s.id === e.target.value); 
                    setIsMasterMode(false);
                    setCurrentStore(selected); 
                    fetchVendorData(); 
                  }
                }}
              >
                <option value="master">✨ Master Portfolio</option>
                {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            )}
            
            {activeTab === 'products' && (
              <button className="primary-btn" onClick={() => setShowProductModal(true)}>
                <Plus size={16} /> New Product
              </button>
            )}
            
            <button className="mini-btn" onClick={() => onNavigateToStore?.(currentStore.id)} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}>
              <ExternalLink size={16} /> View Shop
            </button>
          </div>
        </div>

        {/* ── Active Tab Views ── */}
        
        {activeTab === 'overview' && (
          <div className="fade-in">
            <div className="command-grid">
              <div className="elite-widget">
                <div className="widget-glow" />
                <div className="widget-title"><DollarSign size={16} /> Gross Revenue</div>
                <div className="widget-value">${parseFloat(currentStore.total_sales || '0').toFixed(2)}</div>
                <div className="widget-trend trend-up"><TrendingUp size={12} /> +12% this week</div>
              </div>
              
              <div className="elite-widget">
                <div className="widget-title"><ShoppingBag size={16} /> Total Orders</div>
                <div className="widget-value">{orders.length}</div>
                <div className="widget-trend trend-up"><TrendingUp size={12} /> +4% this week</div>
              </div>
              
              <div className="elite-widget" style={{ borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                <div className="widget-title"><CheckCircle size={16} /> Trust Score</div>
                <div className="widget-value">{currentStore.trust_score || 85}%</div>
                <div style={{ marginTop: 12, height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ width: `${currentStore.trust_score || 85}%`, height: '100%', background: '#10b981' }} />
                </div>
              </div>
              
              <div className="elite-widget">
                <div className="widget-title"><CreditCard size={16} /> Wallet Balance</div>
                <div className="widget-value text-primary">${storeWallet ? Number(storeWallet.balance).toFixed(2) : '0.00'}</div>
                {platformSettings?.is_withdrawal_enabled && storeWallet?.balance > 0 && (
                  <button className="mini-btn" style={{ marginTop: 12, background: 'var(--primary)', color: 'white', border: 'none' }} onClick={() => setActiveTab('withdrawals')}>Withdraw</button>
                )}
              </div>
            </div>

            <div className="elite-table-wrapper" style={{ padding: '24px 32px' }}>
              <h3 style={{ margin: '0 0 8px 0' }}>Sales Over Time</h3>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Visualizing the last 12 days of local commerce.</p>
              
              {/* Pure CSS Bar Chart */}
              <div className="css-chart-container">
                {mockChartData.map((val, i) => (
                  <div key={i} className="chart-bar" style={{ height: `${val}%` }}>
                    <div className="chart-bar-tooltip">${val * 12}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                <span>12 Days Ago</span>
                <span>Today</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="fade-in">
            {products.length === 0 ? (
              <div className="elite-widget" style={{ alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
                <Package size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
                <h3 style={{ margin: '0 0 8px 0' }}>No Inventory</h3>
                <p style={{ color: 'var(--text-muted)', margin: 0 }}>Add your first product to start selling locally.</p>
                <button className="primary-btn" onClick={() => setShowProductModal(true)} style={{ marginTop: 24 }}><Plus size={16} /> Create Product</button>
              </div>
            ) : (
              <div className="elite-table-wrapper">
                <div className="elite-table-header">
                  <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>All Products</div>
                  <input type="text" placeholder="Search products..." style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '6px 12px', borderRadius: 8, fontSize: '0.85rem' }} />
                </div>
                <table className="elite-table">
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}><input type="checkbox" className="checkbox-custom" /></th>
                      <th>Product Name</th>
                      <th>Price</th>
                      <th>Stock Level</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => {
                      const stockRatio = p.stock_quantity ? Math.min(100, (p.stock_quantity / 50) * 100) : 0;
                      const stockColor = p.stock_quantity > 10 ? '#10b981' : p.stock_quantity > 0 ? '#eab308' : '#ef4444';
                      
                      return (
                        <tr key={p.id}>
                          <td><input type="checkbox" className="checkbox-custom" /></td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                                {p.image_urls?.[0] ? <img src={p.image_urls[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Package size={20} style={{ margin: 10, opacity: 0.5 }} />}
                              </div>
                              <div style={{ fontWeight: 600 }}>{p.name}</div>
                            </div>
                          </td>
                          <td style={{ fontWeight: 800 }}>${parseFloat(p.price).toFixed(2)}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: '0.85rem', width: 24 }}>{p.stock_quantity ?? 0}</span>
                              <div className="stock-bar-bg">
                                <div className="stock-bar-fill" style={{ width: `${stockRatio}%`, background: stockColor }} />
                              </div>
                            </div>
                          </td>
                          <td>
                            <span style={{ padding: '4px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 800, background: p.stock_quantity > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: p.stock_quantity > 0 ? '#10b981' : '#ef4444' }}>
                              {p.stock_quantity > 0 ? 'ACTIVE' : 'OUT OF STOCK'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="fade-in">
             <div className="elite-table-wrapper">
                <table className="elite-table">
                  <thead>
                    <tr>
                      <th>Order Date</th>
                      <th>Customer</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length === 0 ? (
                      <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>No orders found yet.</td></tr>
                    ) : orders.map(order => (
                      <tr key={order.id}>
                        <td>{new Date(order.created_at).toLocaleDateString()}</td>
                        <td>
                          <div style={{ fontWeight: 700 }}>{order.profiles?.name || 'Guest'}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{order.id.slice(0, 8)}</div>
                        </td>
                        <td style={{ fontWeight: 800 }}>${parseFloat(order.amount).toFixed(2)}</td>
                        <td>
                          <span style={{ padding: '4px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 800, background: order.status === 'refunded' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: order.status === 'refunded' ? '#ef4444' : '#10b981' }}>
                            {order.status.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          {order.status === 'completed' && currentStore.is_refunds_enabled && (
                            <button className="mini-btn" style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)', borderRadius: 4 }} onClick={() => handleRefund(order.id)}>
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

        {activeTab === 'crm' && <div className="fade-in"><BusinessCrmView /></div>}
        {activeTab === 'ads' && <div className="fade-in"><AdManager user={user} products={products} currentStore={currentStore} storeWallet={storeWallet} onWalletUpdate={fetchVendorData} /></div>}
        {activeTab === 'storefront' && <div className="fade-in"><StoreFrontEditor store={currentStore} onUpdate={fetchVendorData} /></div>}
        {activeTab === 'team' && <div className="fade-in"><StaffManagement entityId={currentStore.id} entityType="business" user={user} /></div>}
        
        {activeTab === 'settings' && (
          <div className="fade-in" style={{ maxWidth: 800 }}>
            <div className="elite-widget" style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h3 style={{ margin: 0 }}>Store Policies</h3>
                <button className="primary-btn" onClick={handleSaveStoreSettings}>Save Changes</button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                  <div style={{ fontWeight: 700 }}>Enable Customer Refunds</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Allow yourself and your staff to issue refunds for orders.</div>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" checked={currentStore.is_refunds_enabled} onChange={(e) => setCurrentStore({...currentStore, is_refunds_enabled: e.target.checked})} />
                  <span className="slider"></span>
                </label>
              </div>
              <div className="input-group">
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 700 }}>Refund Window (Days)</label>
                <input type="number" style={{ width: '120px', padding: '8px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }} value={currentStore.refund_window_days} onChange={(e) => setCurrentStore({...currentStore, refund_window_days: parseInt(e.target.value)})} />
              </div>
            </div>
            <StoreIntegrations store={currentStore} onUpdate={fetchVendorData} />
          </div>
        )}

        {activeTab === 'withdrawals' && platformSettings?.is_withdrawal_enabled && (
           <div className="fade-in">
             <div className="elite-widget" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
               <div>
                 <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Available Balance</div>
                 <h2 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary)' }}>${storeWallet ? Number(storeWallet.balance).toFixed(2) : '0.00'}</h2>
               </div>
               <button className="primary-btn" onClick={() => handleCreateWithdrawal(storeWallet?.balance || 0)} disabled={!storeWallet || storeWallet.balance <= 0}>Request Bank Payout</button>
             </div>
             
             {/* B2B Mesh Transfer Panel */}
             <div className="elite-widget" style={{ marginBottom: 24, border: '1px solid rgba(16, 185, 129, 0.2)', background: 'rgba(16, 185, 129, 0.02)' }}>
               <h3 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}><RefreshCw size={18} color="#10b981" /> Circular Micro-Economy (B2B Transfer)</h3>
               <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 16 }}>Instantly pay other local merchants from your wallet balance with zero processing fees. Keep money circulating locally!</p>
               
               <form onSubmit={handleB2bTransfer} style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                 <div style={{ flex: 1, minWidth: 200 }}>
                   <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>Receiver Owner ID</label>
                   <input type="text" required placeholder="Enter Merchant Owner UUID" value={b2bReceiverId} onChange={e => setB2bReceiverId(e.target.value)} className="glass-input" style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }} />
                 </div>
                 <div style={{ width: 120 }}>
                   <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>Amount ($)</label>
                   <input type="number" required min="1" step="0.01" placeholder="0.00" value={b2bAmount} onChange={e => setB2bAmount(e.target.value)} className="glass-input" style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }} />
                 </div>
                 <div style={{ flex: 1, minWidth: 200 }}>
                   <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>Description</label>
                   <input type="text" placeholder="e.g. Invoice #1024 for wholesale beans" value={b2bDescription} onChange={e => setB2bDescription(e.target.value)} className="glass-input" style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }} />
                 </div>
                 <button type="submit" disabled={isB2bLoading || !storeWallet || storeWallet.balance <= 0} className="primary-btn" style={{ background: '#10b981', color: '#fff', border: 'none', padding: '8px 24px', height: '37px' }}>
                   {isB2bLoading ? <Loader2 className="animate-spin" size={16} /> : 'Send Funds'}
                 </button>
               </form>
             </div>

             <div className="elite-table-wrapper">
                <div className="elite-table-header"><h3 style={{ margin: 0, fontSize: '1rem' }}>Withdrawal History</h3></div>
                <table className="elite-table">
                  <tbody>
                    {withdrawals.length === 0 ? <tr><td style={{ textAlign: 'center', opacity: 0.5 }}>No withdrawal requests yet.</td></tr> : withdrawals.map(w => (
                      <tr key={w.id}>
                        <td>{new Date(w.created_at).toLocaleDateString()}</td>
                        <td style={{ fontWeight: 800 }}>${w.amount}</td>
                        <td><span style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: 6, background: w.status === 'approved' ? 'rgba(16,185,129,0.1)' : 'rgba(234,179,8,0.1)', color: w.status === 'approved' ? '#10b981' : '#eab308', fontWeight: 800 }}>{w.status.toUpperCase()}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
           </div>
        )}

        {activeTab === 'billing' && (
          <div className="fade-in">
            <div className="elite-widget" style={{ border: '1px solid #6366f1', background: 'linear-gradient(135deg, rgba(99,102,241,0.05) 0%, transparent 100%)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 24 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <BankCard size={20} color="#6366f1" />
                    <span style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.8rem', color: '#6366f1' }}>SETX.io SaaS</span>
                  </div>
                  <h2 style={{ fontSize: '1.8rem', fontWeight: 900, margin: '0 0 8px 0', color: '#fff' }}>Enterprise Storefront Hosting</h2>
                  <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-secondary)', maxWidth: 500, lineHeight: 1.5 }}>
                    Deploy your standalone storefront with automated inventory sync, custom domain mapping, and 1% Stripe Connect processing.
                  </p>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '24px 32px', textAlign: 'center', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)', minWidth: 220 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>RECURRING INVESTMENT</div>
                  <h3 style={{ fontSize: '2.5rem', fontWeight: 900, margin: '0 0 16px 0', color: '#fff' }}>$49<span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}> / mo</span></h3>
                  <button 
                    className="primary-btn" 
                    style={{ width: '100%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                    onClick={handleSubscribeSaaS}
                    disabled={isSubscribing}
                  >
                    {isSubscribing ? <Loader2 className="animate-spin" size={18} /> : <BankCard size={18} />} Subscribe Now
                  </button>
                </div>
              </div>

              {billingError && <div style={{ marginTop: 24, padding: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: 8, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 8 }}><XCircle size={16} /> <span>{billingError}</span></div>}
              {billingSuccess && <div style={{ marginTop: 24, padding: 12, background: 'rgba(16,185,129,0.1)', border: '1px solid #10b981', borderRadius: 8, color: '#10b981', display: 'flex', alignItems: 'center', gap: 8 }}><CheckCircle2 size={16} /> <span>{billingSuccess}</span></div>}
            </div>
          </div>
        )}

      </main>

      {/* Product Creation Modal */}
      {showProductModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }} onClick={() => setShowProductModal(false)}>
          <div className="elite-widget" style={{ width: '90%', maxWidth: 480, padding: 32 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 24px' }}>Add New Product</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>Product Name *</label>
                <input type="text" value={newProduct.name} onChange={e => setNewProduct(p => ({...p, name: e.target.value}))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', marginTop: 6 }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>Price ($) *</label>
                <input type="number" value={newProduct.price} onChange={e => setNewProduct(p => ({...p, price: e.target.value}))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', marginTop: 6 }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>Description</label>
                <textarea value={newProduct.description} onChange={e => setNewProduct(p => ({...p, description: e.target.value}))} rows={3} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', marginTop: 6, resize: 'vertical' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>Starting Stock Quantity</label>
                <input type="number" value={newProduct.stock_quantity} onChange={e => setNewProduct(p => ({...p, stock_quantity: parseInt(e.target.value)}))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', marginTop: 6 }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button className="primary-btn" onClick={handleCreateProduct} disabled={savingProduct} style={{ flex: 1, justifyContent: 'center' }}>{savingProduct ? 'Saving...' : 'Create Product'}</button>
              <button onClick={() => setShowProductModal(false)} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', cursor: 'pointer', fontWeight: 700 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
