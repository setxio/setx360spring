import type { User } from '../types/user';
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
    Activity,
    Coins,
    RefreshCw
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import './DriverDashboard.css';

interface DriverDashboardProps {
    user: User;
}

export const DriverDashboard: React.FC<DriverDashboardProps> = ({ user }) => {
    const [isOnDuty, setIsOnDuty] = useState(false);
    const [availableOrders, setAvailableOrders] = useState<any[]>([]);
    const [activeOrder, setActiveOrder] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [earnings, setEarnings] = useState({ daily: 0, completed: 0 });

    // Zebec Continuous Streaming Payroll State
    const [payrollStream, setPayrollStream] = useState<any>(null);
    const [streamedAmount, setStreamedAmount] = useState<number>(0);
    const [isWithdrawing, setIsWithdrawing] = useState(false);
    const [withdrawSuccess, setWithdrawSuccess] = useState('');
    const [withdrawError, setWithdrawError] = useState('');

    useEffect(() => {
        if (user) {
            fetchDriverState();
            const channel = supabase
                .channel('delivery-updates')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchAvailableOrders())
                .subscribe();
            
            return () => { supabase.removeChannel(channel); };
        }
    }, [user]);

    // Live Streaming Ticker Interval (Zebec Protocol Simulation)
    useEffect(() => {
        let interval: any;
        if (isOnDuty && payrollStream) {
            interval = setInterval(() => {
                // rate_per_second is stored as SETX per second (e.g. 0.0055 SETX/sec ≈ $20/hr)
                const ratePerSec = parseFloat(payrollStream.rate_per_second) || 0.0055;
                setStreamedAmount(prev => prev + ratePerSec);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isOnDuty, payrollStream]);

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
                    daily: dailyStats.reduce((acc, curr) => acc + (Number(curr.total_amount) * 0.1), 0),
                    completed: dailyStats.length
                });
            }

            // 4. Fetch Active Zebec Payroll Stream
            await fetchPayrollStream(profile?.driver_mode_active || false);
            await fetchAvailableOrders();
        } catch (err) {
            console.error('Driver state fetch error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchAvailableOrders = async () => {
        try {
            const { data } = await supabase
                .from('orders')
                .select('*, stores(name, location, logo_url)')
                .is('driver_id', null)
                .eq('status', 'ready_for_pickup')
                .order('created_at', { ascending: false })
                .limit(10);
            setAvailableOrders(data || []);
        } catch (err) {
            console.error('Failed to fetch available orders:', err);
        }
    };

    const fetchPayrollStream = async (dutyActive: boolean) => {
        if (!dutyActive) {
            setPayrollStream(null);
            setStreamedAmount(0);
            return;
        }

        const { data, error } = await supabase
            .from('driver_payroll_streams')
            .select('*')
            .eq('driver_id', user.id)
            .eq('is_active', true)
            .single();

        if (!error && data) {
            setPayrollStream(data);
            // Calculate elapsed seconds since stream start
            const elapsedSec = Math.floor((Date.now() - new Date(data.start_time).getTime()) / 1000);
            const ratePerSec = parseFloat(data.rate_per_second) || 0.0055;
            setStreamedAmount((parseFloat(data.balance_earned) || 0) + (elapsedSec * ratePerSec));
        } else {
            // Create a mock stream for demonstration if table is empty
            const mockStream = {
                id: 'stream_' + Date.now(),
                driver_id: user.id,
                rate_per_second: '0.0055', // $19.80 / hour
                balance_earned: '12.45',
                start_time: new Date(Date.now() - 3600000).toISOString(),
                is_active: true
            };
            setPayrollStream(mockStream);
            setStreamedAmount(12.45);
        }
    };

    const toggleDuty = async () => {
        const newState = !isOnDuty;
        const { error } = await supabase.from('profiles').update({ driver_mode_active: newState }).eq('id', user.id);
        if (!error) {
            setIsOnDuty(newState);
            fetchPayrollStream(newState);
        }
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

    // Instant Zebec Mid-Shift Withdrawal Handler
    const handleWithdrawMidShift = async () => {
        if (!payrollStream || streamedAmount <= 0) return;
        setIsWithdrawing(true);
        setWithdrawError('');
        setWithdrawSuccess('');

        try {
            const withdrawAmount = parseFloat(streamedAmount.toFixed(2));

            // 1. Update stream balance in driver_payroll_streams
            await supabase
                .from('driver_payroll_streams')
                .update({ balance_earned: '0.00', start_time: new Date().toISOString() })
                .eq('id', payrollStream.id);

            // 2. Credit driver's fintech wallet
            const { data: wallet } = await supabase
                .from('fintech_wallets')
                .select('id, balance')
                .eq('owner_id', user.id)
                .single();

            if (wallet) {
                await supabase
                    .from('fintech_wallets')
                    .update({ balance: wallet.balance + withdrawAmount })
                    .eq('id', wallet.id);
                
                await supabase
                    .from('fintech_ledger')
                    .insert({
                        wallet_id: wallet.id,
                        amount: withdrawAmount,
                        type: 'deposit',
                        description: 'Zebec Streaming Payroll Mid-Shift Withdrawal'
                    });
            }

            setStreamedAmount(0);
            setWithdrawSuccess(`Successfully withdrew ${withdrawAmount} SETX directly to your wallet!`);
            setTimeout(() => setWithdrawSuccess(''), 4000);
        } catch (err: any) {
            console.error('Withdrawal error:', err);
            setWithdrawError('Failed to process mid-shift withdrawal.');
        } finally {
            setIsWithdrawing(false);
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
                            {isOnDuty ? "Accepting Orders & Streaming Payroll" : "Offline"}
                        </div>
                    </div>
                    <button onClick={toggleDuty} className={`duty-toggle ${isOnDuty ? 'active' : ''}`}>
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
                
                {/* Zebec Continuous Streaming Payroll Live Ticker Card */}
                {isOnDuty && ( payrollStream || streamedAmount > 0 ) && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="premium-card glass"
                        style={{ padding: 24, marginBottom: 24, border: '2px solid var(--accent)', background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(16,185,129,0.15) 100%)' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                    <Coins size={20} className="text-accent pulse" />
                                    <span style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.85rem', color: 'var(--accent)' }}>Zebec Continuous Streaming Payroll</span>
                                    <span style={{ fontSize: '0.75rem', background: 'rgba(16,185,129,0.2)', color: '#10b981', padding: '2px 8px', borderRadius: 12, fontWeight: 700 }}>LIVE STREAM</span>
                                </div>
                                <h3 style={{ fontSize: '2.5rem', fontWeight: 900, margin: 0, fontFamily: 'monospace', color: '#fff' }}>
                                    {streamedAmount.toFixed(4)} <span style={{ fontSize: '1.25rem', color: 'var(--accent)' }}>SETX</span>
                                </h3>
                                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    Accruing in real-time at 0.0055 SETX/sec ($19.80/hr base rate). 100% Gas Subsidized.
                                </p>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                                <button 
                                    className="primary-btn" 
                                    style={{ padding: '12px 24px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}
                                    onClick={handleWithdrawMidShift}
                                    disabled={isWithdrawing || streamedAmount <= 0}
                                >
                                    {isWithdrawing ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
                                    Withdraw Mid-Shift
                                </button>
                                {withdrawSuccess && <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 700 }}>{withdrawSuccess}</div>}
                                {withdrawError && <div style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 700 }}>{withdrawError}</div>}
                            </div>
                        </div>
                    </motion.div>
                )}

                <AnimatePresence mode="wait">
                    {activeOrder ? (
                        <motion.div key="active" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="active-fulfillment-card">
                            <div className="fulfillment-header">
                                <span className="badge-live">Active Delivery</span>
                                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Order #{activeOrder.id.slice(0,8)}</span>
                            </div>

                            <div className="fulfillment-steps">
                                <div className="step-group">
                                    <div className="step-icon-box active"><Package size={20} /></div>
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ margin: 0, fontWeight: 700 }}>{activeOrder.stores?.name}</h4>
                                        <p style={{ margin: '2px 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{activeOrder.stores?.location || 'Merchant Address'}</p>
                                    </div>
                                    <button className="nav-btn"><Navigation size={18} /></button>
                                </div>

                                <div className="step-connector active" />

                                <div className="step-group">
                                    <div className={`step-icon-box ${['picked_up', 'arriving', 'delivered'].includes(activeOrder.delivery_status) ? 'active' : ''}`}><MapPin size={20} /></div>
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ margin: 0, fontWeight: 700 }}>Customer Drop-off</h4>
                                        <p style={{ margin: '2px 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{activeOrder.shipping_address || 'Calculating...'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="fulfillment-actions">
                                {activeOrder.delivery_status === 'claimed' && <button onClick={() => updateStatus('at_merchant')} className="primary-btn fulfillment-btn">I'm at the Merchant</button>}
                                {activeOrder.delivery_status === 'at_merchant' && <button onClick={() => updateStatus('picked_up')} className="primary-btn fulfillment-btn">Order Picked Up</button>}
                                {activeOrder.delivery_status === 'picked_up' && <button onClick={() => updateStatus('arriving')} className="primary-btn fulfillment-btn">I'm Arriving</button>}
                                {activeOrder.delivery_status === 'arriving' && <button onClick={() => updateStatus('delivered')} className="success-btn fulfillment-btn">Mark as Delivered</button>}
                            </div>
                        </motion.div>
                    ) : !isOnDuty ? (
                        <motion.div key="offline" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="empty-logistics-state">
                            <AlertCircle size={48} opacity={0.2} />
                            <h3 style={{ margin: '1rem 0 0.5rem' }}>You're currently offline</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Go on duty to start receiving delivery requests and streaming your Zebec payroll.</p>
                        </motion.div>
                    ) : (
                        <motion.div key="available" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
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
