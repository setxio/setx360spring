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
import { VerificationModal } from './VerificationModal';
import './MePortal.css';

export const MePortal: React.FC = () => {
    const { user, setEnv, setActiveTab, userPages, setUserPages, setActiveContext } = useApp();
    const [driverStatus, setDriverStatus] = useState<string>('none');
    const [wallet, setWallet] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
    const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
    const [newWorkspace, setNewWorkspace] = useState({ name: '', page_type: 'business', contact_email: '' });

    useEffect(() => {
        if (user) fetchDriverStatus();
    }, [user]);

    const handleCreateWorkspace = async () => {
        setIsCreatingWorkspace(true);
        const { data, error } = await supabase.from('pages').insert({
            owner_id: user.id,
            name: newWorkspace.name,
            page_type: newWorkspace.page_type,
            contact_email: newWorkspace.contact_email,
            is_verified: false
        }).select().single();

        if (!error && data) {
            await supabase.from('page_members').insert({
                page_id: data.id,
                user_id: user.id,
                access_level: 'admin'
            });

            // Provision a commerce store if applicable
            if (['retail', 'restaurant', 'service'].includes(newWorkspace.page_type)) {
                let storeCategory = 'Retail';
                if (newWorkspace.page_type === 'restaurant') storeCategory = 'Restaurant';
                if (newWorkspace.page_type === 'service') storeCategory = 'Services';
                
                await supabase.from('stores').insert({
                    id: data.id, // Direct ID link to page
                    owner_id: user.id,
                    name: newWorkspace.name,
                    category: storeCategory,
                    status: 'active'
                });
            }

            setUserPages([...(userPages || []), data]);
            setShowCreateWorkspace(false);
            setNewWorkspace({ name: '', page_type: 'retail', contact_email: '' });
        } else {
            console.error(error);
            alert('Error creating workspace: ' + error?.message);
        }
        setIsCreatingWorkspace(false);
    };

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

        const hasProfessionalProfile = userPages?.some(p => p.page_type === 'professional');

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
        { 
            id: 'professional-profile', 
            label: hasProfessionalProfile ? 'Pro Profile' : 'Setup Pro Profile', 
            icon: <Briefcase size={24} />, 
            color: '#06b6d4', 
            onClick: () => { 
                if (hasProfessionalProfile) {
                    const proPage = userPages?.find(p => p.page_type === 'professional');
                    if (proPage) {
                        setActiveContext(proPage);
                        setEnv('dashboard');
                        setActiveTab(0);
                    }
                } else {
                    setNewWorkspace({ name: `${user.name} - Professional`, page_type: 'professional', contact_email: user.email });
                    setShowCreateWorkspace(true);
                }
            } 
        },
        { id: 'wallet', label: 'Wallet', icon: <Wallet size={24} />, color: '#8b5cf6', onClick: () => { setEnv('wallet'); setActiveTab(0); } },
        { id: 'saved', label: 'Saved', icon: <Bookmark size={24} />, color: '#ec4899', onClick: () => { setEnv('me'); setActiveTab(4); } },
        { id: 'settings', label: 'Settings', icon: <Settings size={24} />, color: '#64748b', onClick: () => { setEnv('me'); setActiveTab(6); } },
        { id: 'edit-profile', label: 'Edit Profile', icon: <User size={24} />, color: '#3b82f6', onClick: () => { setEnv('social'); setActiveTab(9); } },
        { id: 'verification', label: 'Get Verified', icon: <ShieldCheck size={24} />, color: '#ef4444', onClick: () => setShowVerificationModal(true) },
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
                        <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>{user.community || 'SETX Resident'} · {user.role.toUpperCase()}</p>
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

            {/* Workspaces & Entities */}
            <section className="portal-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 className="section-title" style={{ margin: 0 }}>My Workspaces</h3>
                    <button 
                        className="ghost-btn" 
                        style={{ padding: '4px 12px', fontSize: '0.8rem', background: 'var(--bg-card)' }}
                        onClick={() => setShowCreateWorkspace(true)}
                    >
                        + Create New
                    </button>
                </div>
                <div className="workspace-grid" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {userPages?.length === 0 ? (
                        <div className="premium-card" style={{ textAlign: 'center', padding: '24px', opacity: 0.7 }}>
                            <Briefcase size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                            <p style={{ fontSize: '0.9rem', margin: 0 }}>You don't manage any professional workspaces yet.</p>
                        </div>
                    ) : (
                        userPages?.map(page => (
                            <div key={page.id} className="premium-card workspace-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div className="workspace-avatar" style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {page.avatar_url ? <img src={page.avatar_url} style={{ width: '100%', height: '100%', borderRadius: 8, objectFit: 'cover' }} alt="Workspace Logo" /> : <Building2 size={20} color="var(--primary)" />}
                                    </div>
                                    <div>
                                        <h4 style={{ margin: 0, fontWeight: 700 }}>{page.name}</h4>
                                        <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.6, textTransform: 'capitalize' }}>{page.page_type.replace('_', ' ')}</p>
                                    </div>
                                </div>
                                <button 
                                    className="primary-btn" 
                                    style={{ padding: '6px 16px', fontSize: '0.85rem' }}
                                    onClick={() => {
                                        setActiveContext(page);
                                        setEnv('dashboard');
                                        setActiveTab(0);
                                    }}
                                >
                                    Dashboard <ChevronRight size={16} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </section>

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

            {/* Verification Modal */}
            {showVerificationModal && (
                <VerificationModal
                    user={user}
                    onClose={() => setShowVerificationModal(false)}
                />
            )}
            {/* Create Workspace Modal */}
            <AnimatePresence>
                {showCreateWorkspace && (
                    <div className="modal-overlay" onClick={() => setShowCreateWorkspace(false)}>
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="apply-modal"
                            onClick={e => e.stopPropagation()}
                            style={{ width: '90%', maxWidth: '400px' }}
                        >
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>Create Workspace</h3>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Create a dynamic entity to manage a business, artist profile, or organization.</p>
                            
                            <div className="form-inputs" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                                <div className="input-group">
                                    <label>Workspace Name</label>
                                    <input type="text" placeholder="e.g. Acme Corp" value={newWorkspace.name} onChange={e => setNewWorkspace({...newWorkspace, name: e.target.value})} />
                                </div>
                                <div className="input-group">
                                    <label>Entity Type</label>
                                    <select value={newWorkspace.page_type} onChange={e => setNewWorkspace({...newWorkspace, page_type: e.target.value})}>
                                        <option value="retail">Retail Store</option>
                                        <option value="restaurant">Restaurant / Food</option>
                                        <option value="service">Local Services</option>
                                        <option value="artist">Artist / Creator</option>
                                        <option value="non_profit">Non-Profit</option>
                                        <option value="venue">Venue</option>
                                        <option value="official">Government / Official</option>
                                        <option value="chamber">Chamber of Commerce</option>
                                        <option value="media">Media / News</option>
                                        <option value="church">Church / Ministry</option>
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label>Public Contact Email</label>
                                    <input type="email" placeholder="hello@acmecorp.com" value={newWorkspace.contact_email} onChange={e => setNewWorkspace({...newWorkspace, contact_email: e.target.value})} />
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>This email will be public on your social page.</span>
                                </div>
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                                <button onClick={handleCreateWorkspace} className="primary-btn" style={{ width: '100%' }} disabled={isCreatingWorkspace || !newWorkspace.name}>
                                    {isCreatingWorkspace ? <Loader2 className="animate-spin" /> : 'Create Workspace'}
                                </button>
                                <button onClick={() => setShowCreateWorkspace(false)} className="ghost-btn" disabled={isCreatingWorkspace}>Cancel</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
