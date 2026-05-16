import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Truck, 
    MapPin, 
    Clock, 
    DollarSign, 
    CheckCircle2, 
    Navigation, 
    Package, 
    Zap, 
    AlertCircle,
    Loader2,
    Activity
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import './DriverDashboard.css';

interface DriverDashboardProps {
    user: any;
}

export const DriverDashboard: React.FC<DriverDashboardProps> = ({ user }) => {
    const [isOnDuty, setIsOnDuty] = useState(false);
    const [availableOrders, setAvailableOrders] = useState<any[]>([]);
    const [activeOrder, setActiveOrder] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [earnings, setEarnings] = useState({ daily: 0, completed: 0 });

    useEffect(() => {
        if (user) {
            fetchDriverState();
            const channel = supabase
                .channel('delivery-updates')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchAvailableOrders)
                .subscribe();
            
            return () => { supabase.removeChannel(channel); };
        }
    }, [user]);

    const fetchDriverState = async () => {
        setIsLoading(true);
        try {
            // 1. Get driver status
            const { data: profile } = await supabase.from('profiles').select('driver_mode_active, vehicle_info').eq('id', user.id).single();
            setIsOnDuty(profile?.driver_mode_active || false);

            // 2. Get active assignment
            const { data: active } = await supabase
                .from('orders')
                .select('*, stores(name, location, logo_url)')
                .eq('driver_id', user.id)
                .neq('delivery_status', 'delivered')
                .single();
            
            if (active) setActiveOrder(active);

            // 3. Get earnings stats
            const today = new Date();
            today.setHours(0,0,0,0);
            const { data: dailyStats } = await supabase
                .from('orders')
                .select('total_amount')
                .eq('driver_id', user.id)
                .eq('delivery_status', 'delivered')
                .gte('created_at', today.toISOString());
            
            if (dailyStats) {
                setEarnings({
                    daily: dailyStats.reduce((acc, curr) => acc + (Number(curr.total_amount) * 0.1), 0), // Mock 10% delivery fee
                    completed: dailyStats.length
                });
            }

            await fetchAvailableOrders();
        } catch (err) {
            console.error('Driver state fetch error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchAvailableOrders = async () => {
        const { data } = await supabase
            .from('orders')
            .select('*, stores(name, location, logo_url)')
            .eq('delivery_status', 'pending')
            .is('driver_id', null)
            .order('created_at', { ascending: false });
        
        setAvailableOrders(data || []);
    };

    const toggleDuty = async () => {
        const newState = !isOnDuty;
        const { error } = await supabase.from('profiles').update({ driver_mode_active: newState }).eq('id', user.id);
        if (!error) setIsOnDuty(newState);
    };

    const claimOrder = async (orderId: string) => {
        const { error } = await supabase
            .from('orders')
            .update({ driver_id: user.id, delivery_status: 'claimed' })
            .eq('id', orderId);
        
        if (!error) fetchDriverState();
    };

    const updateStatus = async (status: string) => {
        if (!activeOrder) return;
        const { error } = await supabase
            .from('orders')
            .update({ delivery_status: status })
            .eq('id', activeOrder.id);
        
        if (!error) {
            if (status === 'delivered') {
                setActiveOrder(null);
                fetchDriverState();
            } else {
                setActiveOrder({ ...activeOrder, delivery_status: status });
            }
        }
    };

    if (isLoading) return (
        <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 className="animate-spin" size={32} color="var(--primary)" />
        </div>
    );

    return (
        <div className="driver-dashboard">
            {/* Header: Duty Toggle & Stats */}
            <div className="driver-header-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h2 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '0.25rem' }}>Driver Mode</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: isOnDuty ? '#10b981' : 'var(--text-muted)' }}>
                            <Activity size={14} className={isOnDuty ? "pulse" : ""} />
                            {isOnDuty ? "Accepting Orders" : "Offline"}
                        </div>
                    </div>
                    <button 
                        onClick={toggleDuty}
                        className={`duty-toggle ${isOnDuty ? 'active' : ''}`}
                    >
                        <div className="toggle-handle" />
                    </button>
                </div>

                <div className="driver-stats-row">
                    <div className="stat-pill">
                        <DollarSign size={16} />
                        <div>
                            <span>${earnings.daily.toFixed(2)}</span>
                            <small>Today's Tips</small>
                        </div>
                    </div>
                    <div className="stat-pill">
                        <CheckCircle2 size={16} />
                        <div>
                            <span>{earnings.completed}</span>
                            <small>Filled</small>
                        </div>
                    </div>
                    <div className="stat-pill">
                        <Zap size={16} />
                        <div>
                            <span>5.0</span>
                            <small>Rating</small>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div style={{ padding: '1.5rem' }}>
                <AnimatePresence mode="wait">
                    {activeOrder ? (
                        <motion.div 
                            key="active"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="active-fulfillment-card"
                        >
                            <div className="fulfillment-header">
                                <span className="badge-live">Active Delivery</span>
                                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Order #{activeOrder.id.slice(0,8)}</span>
                            </div>

                            <div className="fulfillment-steps">
                                <div className="step-group">
                                    <div className="step-icon-box active">
                                        <Package size={20} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ margin: 0, fontWeight: 700 }}>{activeOrder.stores?.name}</h4>
                                        <p style={{ margin: '2px 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{activeOrder.stores?.location || 'Merchant Address'}</p>
                                    </div>
                                    <button className="nav-btn"><Navigation size={18} /></button>
                                </div>

                                <div className="step-connector active" />

                                <div className="step-group">
                                    <div className={`step-icon-box ${['picked_up', 'arriving', 'delivered'].includes(activeOrder.delivery_status) ? 'active' : ''}`}>
                                        <MapPin size={20} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ margin: 0, fontWeight: 700 }}>Customer Drop-off</h4>
                                        <p style={{ margin: '2px 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{activeOrder.shipping_address || 'Calculating...'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="fulfillment-actions">
                                {activeOrder.delivery_status === 'claimed' && (
                                    <button onClick={() => updateStatus('at_merchant')} className="primary-btn fulfillment-btn">I'm at the Merchant</button>
                                )}
                                {activeOrder.delivery_status === 'at_merchant' && (
                                    <button onClick={() => updateStatus('picked_up')} className="primary-btn fulfillment-btn">Order Picked Up</button>
                                )}
                                {activeOrder.delivery_status === 'picked_up' && (
                                    <button onClick={() => updateStatus('arriving')} className="primary-btn fulfillment-btn">I'm Arriving</button>
                                )}
                                {activeOrder.delivery_status === 'arriving' && (
                                    <button onClick={() => updateStatus('delivered')} className="success-btn fulfillment-btn">Mark as Delivered</button>
                                )}
                            </div>
                        </motion.div>
                    ) : !isOnDuty ? (
                        <motion.div 
                            key="offline"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="empty-logistics-state"
                        >
                            <AlertCircle size={48} opacity={0.2} />
                            <h3 style={{ margin: '1rem 0 0.5rem' }}>You're currently offline</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Go on duty to start receiving delivery requests from local businesses.</p>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="available"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}>
                                <Truck size={18} color="var(--primary)" />
                                <h3 style={{ fontWeight: 800 }}>Available Nearby</h3>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {availableOrders.length === 0 ? (
                                    <div className="empty-logistics-state">
                                        <Clock size={40} opacity={0.2} />
                                        <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Searching for orders in your area...</p>
                                    </div>
                                ) : (
                                    availableOrders.map(order => (
                                        <div key={order.id} className="available-order-card">
                                            <div style={{ display: 'flex', gap: '12px', marginBottom: '1rem' }}>
                                                <div className="store-mini-logo">
                                                    {order.stores?.logo_url ? <img src={order.stores.logo_url} /> : <Zap size={16} />}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 700 }}>{order.stores?.name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SETX Region · 2.4 miles away</div>
                                                </div>
                                                <div className="order-price-badge">${(Number(order.total_amount) * 0.1).toFixed(2)}</div>
                                            </div>
                                            <button onClick={() => claimOrder(order.id)} className="claim-btn">Claim Order</button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
