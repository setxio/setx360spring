import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Calendar, 
  TrendingUp, 
  Plus, 
  Settings, 
  Loader2,
  ExternalLink,
  Megaphone,
  Users,
  ShieldCheck
} from 'lucide-react';
import { AdManager } from './AdManager';
import { supabase } from '../lib/supabase';
import { StaffManagement } from './StaffManagement';
import { getOrCreateWallet } from '../lib/payments';
import './VendorDashboard.css';

interface ServicesDashboardProps {
  user: any;
  currentStore: any;
  stores: any[];
  onStoreChange: (store: any) => void;
  onNavigateToStore?: (id: string) => void;
}

export const ServicesDashboard: React.FC<ServicesDashboardProps> = ({ user, currentStore, stores, onStoreChange, onNavigateToStore }) => {
  const [products, setProducts] = useState<any[]>([]);
  const [storeWallet, setStoreWallet] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'bookings' | 'ads' | 'team' | 'settings'>('overview');

  useEffect(() => {
    fetchServicesData();
  }, [currentStore]);

  const fetchServicesData = async () => {
    setIsLoading(true);
    if (currentStore) {
      const { data: serviceData } = await supabase.from('products').select('*').eq('store_id', currentStore.id).order('created_at', { ascending: false });
      setProducts(serviceData || []);
      
      const wallet = await getOrCreateWallet(currentStore.id, 'business');
      setStoreWallet(wallet);
    }
    setIsLoading(false);
  };

  if (isLoading) return <div className="vendor-dashboard-loading"><Loader2 className="animate-spin" size={48} /><p>Opening Professional Suite...</p></div>;

  return (
    <div className="vendor-dashboard-container services-mode">
      {stores.length > 1 && (
        <div className="store-switcher glass">
          <label>Managing Practice:</label>
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
              {currentStore.is_verified && <span className="verified-badge"><ShieldCheck size={12} /> Verified Professional</span>}
              <span className="vendor-role-badge"><Briefcase size={12} /> {currentStore.category}</span>
            </div>
          </div>
        </div>
        <div className="vendor-header-actions">
          <button className="view-shop-btn" onClick={() => onNavigateToStore?.(currentStore.id)}><ExternalLink size={16} /> Public Profile</button>
        </div>
      </header>

      <nav className="vendor-tabs">
        <button className={`vendor-tab-link ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}><TrendingUp size={18} /> Insights</button>
        <button className={`vendor-tab-link ${activeTab === 'services' ? 'active' : ''}`} onClick={() => setActiveTab('services')}><Briefcase size={18} /> My Services</button>
        <button className={`vendor-tab-link ${activeTab === 'bookings' ? 'active' : ''}`} onClick={() => setActiveTab('bookings')}><Calendar size={18} /> Inquiries</button>
        <button className={`vendor-tab-link ${activeTab === 'ads' ? 'active' : ''}`} onClick={() => setActiveTab('ads')}><Megaphone size={18} /> Lead Gen</button>
        <button className={`vendor-tab-link ${activeTab === 'team' ? 'active' : ''}`} onClick={() => setActiveTab('team')}><Users size={18} /> Staff</button>
        <button className={`vendor-tab-link ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}><Settings size={18} /> Settings</button>
      </nav>

      <main className="vendor-content">
        {activeTab === 'overview' && (
          <div className="vendor-overview">
            <div className="vendor-stats-grid">
              <div className="stat-card premium-card"><span className="stat-label">Project Inquiries</span><span className="stat-value">12</span></div>
              <div className="stat-card premium-card"><span className="stat-label">Active Services</span><span className="stat-value">{products.length}</span></div>
              <div className="stat-card premium-card"><span className="stat-label">Client Rating</span><span className="stat-value">4.9/5</span></div>
              <div className="stat-card premium-card"><span className="stat-label">Wallet Balance</span><span className="stat-value">${storeWallet ? Number(storeWallet.balance).toFixed(2) : '0.00'}</span></div>
            </div>
          </div>
        )}

        {activeTab === 'services' && (
          <div className="vendor-products">
            <div className="section-title">
              <h3>Service Listings</h3>
              <button className="primary-btn"><Plus size={16} /> New Service</button>
            </div>
            <div className="product-list-grid">
              {products.map(p => (
                <div key={p.id} className="product-admin-card premium-card">
                  <h4>{p.name}</h4>
                  <p>{p.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="vendor-orders">
             <h3>Booking Requests & Messages</h3>
             <p style={{ opacity: 0.5 }}>Service inquiries from customers will appear here.</p>
          </div>
        )}

        {activeTab === 'ads' && <AdManager user={user} />}
        {activeTab === 'team' && <StaffManagement entityId={currentStore.id} entityType="business" user={user} />}
      </main>
    </div>
  );
};
