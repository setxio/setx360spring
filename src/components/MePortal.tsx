import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Truck, 
    MapPin, 
    Wallet, 
    Bookmark, 
    Settings, 
    Globe, 
    Building2, 
    Anchor, 
    Zap,
    ChevronRight,
    Loader2,
    ShieldCheck,
    Briefcase,
    User,
    ArrowUpRight,
    ArrowDownLeft
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import { getOrCreateWallet } from '../lib/payments';
import './MePortal.css';

export const MePortal: React.FC = () => {
    const { user, setEnv, setActiveTab } = useApp();
    const [driverStatus, setDriverStatus] = useState<string>('none');
    const [wallet, setWallet] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showApplyModal, setShowApplyModal] = useState(false);

    useEffect(() => {
        if (user) fetchDriverStatus();
    }, [user]);

    const fetchDriverStatus = async () => {
        const { data } = await supabase.from('profiles').select('driver_application_status, role').eq('id', user.id).single();
        if (data?.role === 'driver') {
            setDriverStatus('approved');
        } else {
            setDriverStatus(data?.driver_application_status || 'none');
        }

        // Fetch Wallet
        const userWallet = await getOrCreateWallet(user.id, 'personal');
        if (userWallet) setWallet(userWallet);
        
        setIsLoading(false);
    };

    const handleApply = async () => {
        setIsLoading(true);
        const { error } = await supabase.from('profiles').update({ 
            driver_application_status: 'pending',
            driver_application_data: { requested_at: new Date().toISOString() }
        }).eq('id', user.id);
        
        if (!error) {
            setDriverStatus('pending');
            setShowApplyModal(false);
        }
        setIsLoading(false);
    };

    const cityShortcuts = [
        { name: 'Beaumont', icon: <Building2 />, url: 'https://beaumonttexas.gov', color: '#3b82f6' },
        { name: 'Port Arthur', icon: <Anchor />, url: 'https://www.portarthurtx.gov', color: '#06b6d4' },
        { name: 'Orange', icon: <MapPin />, url: 'https://orangetexas.gov', color: '#f97316' },
    ];

    const portalIcons = [
        { 
            id: 'driver', 
            label: driverStatus === 'approved' ? 'Driver Portal' : (driverStatus === 'pending' ? 'Application Pending' : 'Become a Driver'), 
            icon: driverStatus === 'approved' ? <Truck size={24} /> : <Briefcase size={24} />, 
            color: driverStatus === 'approved' ? '#10b981' : (driverStatus === 'pending' ? '#f59e0b' : 'var(--primary)'),
            onClick: () => {
                if (driverStatus === 'approved') {
                    setEnv('dashboard');
                    setActiveTab(0);
                } else if (driverStatus === 'none') {
                    setShowApplyModal(true);
                }
            }
        },
        { id: 'wallet', label: 'Wallet', icon: <Wallet size={24} />, color: '#8b5cf6', onClick: () => { setEnv('wallet'); setActiveTab(0); } },
        { id: 'saved', label: 'Saved', icon: <Bookmark size={24} />, color: '#ec4899', onClick: () => { setEnv('me'); setActiveTab(2); } },
        { id: 'settings', label: 'Settings', icon: <Settings size={24} />, color: '#64748b', onClick: () => { setEnv('me'); setActiveTab(4); } },
    ];

    if (isLoading) return <div style={{ height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 className="animate-spin" size={32} color="var(--primary)" /></div>;

    return (
        <div className="me-portal">
            {/* Profile Header */}
            <header className="me-header">
                <div className="me-profile-row">
                    <div className="me-avatar-wrapper">
                        {user.avatar_url ? <img src={user.avatar_url} /> : <User size={32} />}
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.1rem' }}>Hi, {user.name.split(' ')[0]}</h2>
                        <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>{user.community || 'SETX Citizen'} · {user.role.toUpperCase()}</p>
                    </div>
                </div>

                {/* Unified Wallet Card */}
                <div className="me-wallet-card glass" onClick={() => { setEnv('wallet'); setActiveTab(0); }}>
                    <div className="w-label">Available Balance</div>
                    <div className="w-balance">
                        <span className="w-currency">SEC</span>
                        <span className="w-value">{Number(wallet?.balance || 0).toFixed(2)}</span>
                    </div>
                    <div className="w-actions">
                        <button className="w-action-btn"><ArrowUpRight size={16} /> Pay</button>
                        <button className="w-action-btn"><ArrowDownLeft size={16} /> Top Up</button>
                    </div>
                </div>
            </header>

            {/* Quick Actions Grid */}
            <section className="portal-section">
                <h3 className="section-title">My Shortcuts</h3>
                <div className="portal-grid">
                    {portalIcons.map(item => (
                        <button key={item.id} className="portal-card" onClick={item.onClick}>
                            <div className="portal-icon-box" style={{ color: item.color, background: `${item.color}15` }}>
                                {item.icon}
                            </div>
                            <span className="portal-label">{item.label}</span>
                        </button>
                    ))}
                </div>
            </section>

            {/* City Connections */}
            <section className="portal-section">
                <h3 className="section-title">City Websites</h3>
                <div className="city-grid">
                    {cityShortcuts.map(city => (
                        <a key={city.name} href={city.url} target="_blank" rel="noopener noreferrer" className="city-card">
                            <div className="city-icon" style={{ color: city.color }}>{city.icon}</div>
                            <span>{city.name}</span>
                            <Globe size={14} style={{ marginLeft: 'auto', opacity: 0.3 }} />
                        </a>
                    ))}
                </div>
            </section>

            {/* Region Impact Card */}
            <div className="impact-card">
                <div className="impact-content">
                    <Zap size={24} color="#f59e0b" />
                    <div>
                        <h4 style={{ margin: 0, fontWeight: 800 }}>Local Impact</h4>
                        <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.8 }}>You've supported 12 local merchants this month.</p>
                    </div>
                </div>
                <ChevronRight size={20} opacity={0.5} />
            </div>

            {/* Application Modal */}
            <AnimatePresence>
                {showApplyModal && (
                    <div className="modal-overlay" onClick={() => setShowApplyModal(false)}>
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="apply-modal"
                            onClick={e => e.stopPropagation()}
                        >
                            <ShieldCheck size={48} color="var(--primary)" style={{ marginBottom: '1.5rem' }} />
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>Join the SETX Fleet</h3>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Apply to become a verified regional driver and start earning by delivering local goods to your neighbors.</p>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                                <button onClick={handleApply} className="primary-btn" style={{ width: '100%' }}>Submit Application</button>
                                <button onClick={() => setShowApplyModal(false)} className="ghost-btn">Maybe Later</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
