import type { User } from '../types/user';
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
import { useToast } from '../context/ToastContext';
import { AdManager } from './AdManager';
import { supabase } from '../lib/supabase';
import { StaffManagement } from './StaffManagement';
import { getOrCreateWallet } from '../lib/payments';
import { BusinessCrmView } from './BusinessCrmView';
import './VendorDashboard.css';

interface ServicesDashboardProps {
  user: User;
  currentStore: any;
  stores: any[];
  onStoreChange: (store: any) => void;
  onNavigateToStore?: (id: string) => void;
}

export const ServicesDashboard: React.FC<ServicesDashboardProps> = ({ user, currentStore, stores, onStoreChange, onNavigateToStore }) => {
  const [products, setProducts] = useState<any[]>([]);
  const [storeWallet, setStoreWallet] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'bookings' | 'ads' | 'team' | 'settings' | 'crm'>('overview');
  
  // Bookings/Schedule CSM state
  const { toast } = useToast();
  const [storeBookings, setStoreBookings] = useState<any[]>([]);
  const [storeSchedules, setStoreSchedules] = useState<any[]>([]);
  const [bookingsSubTab, setBookingsSubTab] = useState<'requests' | 'calendar' | 'schedule'>('requests');

  useEffect(() => {
    fetchServicesData();
    if (currentStore) {
      fetchBookings();
      fetchSchedules();
    }
  }, [currentStore]);

  const fetchBookings = async () => {
    const { data } = await supabase
      .from('service_bookings')
      .select('*, customer:profiles!service_bookings_user_id_fkey(name, avatar_url, phone)')
      .eq('store_id', currentStore.id)
      .order('booking_date', { ascending: true });
    setStoreBookings(data || []);
  };

  const fetchSchedules = async () => {
    const { data } = await supabase
      .from('service_schedules')
      .select('*')
      .eq('store_id', currentStore.id);
    
    // Seed default if empty
    if (!data || data.length === 0) {
      const defaults = [...Array(7)].map((_, i) => ({
        day_of_week: i,
        start_time: '09:00',
        end_time: '17:00',
        is_active: i > 0 && i < 6 // Mon-Fri active
      }));
      setStoreSchedules(defaults);
    } else {
      // Ensure all 7 days exist in state
      const map = new Map(data.map(d => [d.day_of_week, d]));
      const complete = [...Array(7)].map((_, i) => map.get(i) || {
        day_of_week: i,
        start_time: '09:00',
        end_time: '17:00',
        is_active: false
      });
      setStoreSchedules(complete);
    }
  };

  const updateBookingStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('service_bookings')
        .update({ status: newStatus })
        .eq('id', id);
      if (error) throw error;
      toast(`Booking ${newStatus}`, 'success');
      fetchBookings();
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };

  const saveSchedules = async () => {
    try {
      // upsert
      const records = storeSchedules.map(s => ({
        store_id: currentStore.id,
        day_of_week: s.day_of_week,
        start_time: s.start_time,
        end_time: s.end_time,
        is_active: s.is_active
      }));
      const { error } = await supabase.from('service_schedules').upsert(records, { onConflict: 'store_id, day_of_week' });
      if (error) throw error;
      toast('Schedule updated!', 'success');
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };

  const fetchServicesData = async () => {
    setIsLoading(true);
    if (currentStore) {
      const { data: serviceData } = await supabase.from('products').select('*').eq('store_id', currentStore.id).order('created_at', { ascending: false });
      setProducts(serviceData || []);
      
      const wallet = await getOrCreateWallet(currentStore.owner_id, 'business');
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
        <button className={`vendor-tab-link ${activeTab === 'crm' ? 'active' : ''}`} onClick={() => setActiveTab('crm')}><Users size={18} /> CRM</button>
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
            <div style={{ display: 'flex', gap: 16, marginBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 16 }}>
              <button className={`sw-btn ${bookingsSubTab === 'requests' ? 'active' : ''}`} onClick={() => setBookingsSubTab('requests')}>Incoming Requests</button>
              <button className={`sw-btn ${bookingsSubTab === 'calendar' ? 'active' : ''}`} onClick={() => setBookingsSubTab('calendar')}>Confirmed Calendar</button>
              <button className={`sw-btn ${bookingsSubTab === 'schedule' ? 'active' : ''}`} onClick={() => setBookingsSubTab('schedule')}>Manage Hours</button>
            </div>

            {bookingsSubTab === 'requests' && (
              <div>
                <h3>Pending Inquiries</h3>
                {storeBookings.filter(b => b.status === 'pending').length === 0 ? (
                  <p style={{ opacity: 0.5, marginTop: 12 }}>No pending requests.</p>
                ) : (
                  <div className="product-list-grid" style={{ marginTop: 16 }}>
                    {storeBookings.filter(b => b.status === 'pending').map(b => (
                      <div key={b.id} className="product-admin-card premium-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <h4>{b.customer?.name || 'Customer'}</h4>
                          <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{b.booking_date}</span>
                        </div>
                        <p style={{ marginTop: 8 }}>Time: {b.booking_time}</p>
                        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                          <button onClick={() => updateBookingStatus(b.id, 'confirmed')} style={{ flex: 1, background: '#10b981', color: 'white', padding: '8px', borderRadius: '8px' }}>Accept</button>
                          <button onClick={() => updateBookingStatus(b.id, 'cancelled')} style={{ flex: 1, background: 'rgba(255,255,255,0.1)', color: 'white', padding: '8px', borderRadius: '8px' }}>Decline</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {bookingsSubTab === 'calendar' && (
              <div>
                <h3>Confirmed Appointments</h3>
                {storeBookings.filter(b => b.status === 'confirmed').length === 0 ? (
                  <p style={{ opacity: 0.5, marginTop: 12 }}>No confirmed bookings yet.</p>
                ) : (
                  <div className="product-list-grid" style={{ marginTop: 16 }}>
                    {storeBookings.filter(b => b.status === 'confirmed').map(b => (
                      <div key={b.id} className="product-admin-card premium-card" style={{ borderLeft: '4px solid #10b981' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <h4>{b.customer?.name || 'Customer'}</h4>
                          <span>{b.booking_date}</span>
                        </div>
                        <p style={{ color: 'var(--primary)', fontWeight: 600 }}>{b.booking_time}</p>
                        <button onClick={() => updateBookingStatus(b.id, 'completed')} style={{ marginTop: 12, background: 'var(--primary)', color: 'white', padding: '6px 12px', borderRadius: '8px' }}>Mark Completed</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {bookingsSubTab === 'schedule' && (
              <div className="premium-card" style={{ maxWidth: 600 }}>
                <h3>Working Hours</h3>
                <p style={{ opacity: 0.7, marginBottom: 24, fontSize: '0.9rem' }}>Define when customers can book your services.</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((dayName, i) => {
                    const sched = storeSchedules.find(s => s.day_of_week === i) || { is_active: false, start_time: '09:00', end_time: '17:00' };
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(255,255,255,0.05)', padding: '12px 16px', borderRadius: '8px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, width: 120 }}>
                          <input 
                            type="checkbox" 
                            checked={sched.is_active} 
                            onChange={(e) => {
                              const copy = [...storeSchedules];
                              const idx = copy.findIndex(s => s.day_of_week === i);
                              if (idx >= 0) copy[idx].is_active = e.target.checked;
                              setStoreSchedules(copy);
                            }}
                          />
                          {dayName}
                        </label>
                        
                        {sched.is_active ? (
                          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                            <input 
                              type="time" 
                              value={sched.start_time}
                              onChange={(e) => {
                                const copy = [...storeSchedules];
                                const idx = copy.findIndex(s => s.day_of_week === i);
                                if (idx >= 0) copy[idx].start_time = e.target.value;
                                setStoreSchedules(copy);
                              }}
                              style={{ background: 'var(--surface)', border: 'none', color: 'white', padding: '4px 8px', borderRadius: 4 }}
                            />
                            <span>to</span>
                            <input 
                              type="time" 
                              value={sched.end_time}
                              onChange={(e) => {
                                const copy = [...storeSchedules];
                                const idx = copy.findIndex(s => s.day_of_week === i);
                                if (idx >= 0) copy[idx].end_time = e.target.value;
                                setStoreSchedules(copy);
                              }}
                              style={{ background: 'var(--surface)', border: 'none', color: 'white', padding: '4px 8px', borderRadius: 4 }}
                            />
                          </div>
                        ) : (
                          <span style={{ opacity: 0.5 }}>Closed</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                <button 
                  onClick={saveSchedules}
                  className="primary-btn" 
                  style={{ marginTop: 24, width: '100%' }}
                >
                  Save Schedule
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'ads' && <AdManager user={user} products={products} currentStore={currentStore} storeWallet={storeWallet} onWalletUpdate={fetchServicesData} />}
        {activeTab === 'team' && <StaffManagement entityId={currentStore.id} entityType="business" user={user} />}
        {activeTab === 'crm' && <BusinessCrmView />}
      </main>
    </div>
  );
};
