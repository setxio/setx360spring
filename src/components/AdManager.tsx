import type { User } from '../types/user';
import React, { useState, useEffect } from 'react';
import { 
  Megaphone, 
  Plus, 
  Loader2, 
  Sparkles, 
  Image as ImageIcon,
  CheckCircle,
  Clock,
  XCircle,
  BarChart3,
  ExternalLink,
  DollarSign,
  TrendingUp,
  Award
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AdCreationModal } from './AdCreationModal';
import { processTransfer } from '../lib/payments';
import './AdManager.css';

interface AdManagerProps {
  user: User;
  products?: any[];
  currentStore?: any;
  storeWallet?: any;
  onWalletUpdate?: () => void;
}

export const AdManager: React.FC<AdManagerProps> = ({ 
  user, 
  products = [], 
  currentStore = null, 
  storeWallet = null,
  onWalletUpdate 
}) => {
  const [activeTab, setActiveTab] = useState<'banner' | 'boost' | 'flash'>('banner');
  
  // Banner Ad State
  const [ads, setAds] = useState<any[]>([]);
  const [credits, setCredits] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Sponsored Product Bidding State
  const [sponsoredCampaigns, setSponsoredCampaigns] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [adBudget, setAdBudget] = useState<string>('');
  const [durationDays, setDurationDays] = useState<number>(7);
  const [isBiddingSubmitLoading, setIsBiddingSubmitLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Flash Liquidations State
  const [flashLiquidations, setFlashLiquidations] = useState<any[]>([]);
  const [flashProductId, setFlashProductId] = useState<string>('');
  const [flashDiscount, setFlashDiscount] = useState<number>(30);
  const [flashDuration, setFlashDuration] = useState<number>(30); // minutes
  const [isFlashLoading, setIsFlashLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAdData();
      if (currentStore) {
        fetchSponsoredCampaigns();
        fetchFlashLiquidations();
      }
    }
  }, [user, currentStore]);

  const fetchFlashLiquidations = async () => {
    if (!currentStore) return;
    const { data } = await supabase
      .from('flash_liquidations')
      .select('*, products(name)')
      .eq('store_id', currentStore.id)
      .order('created_at', { ascending: false });
    if (data) setFlashLiquidations(data);
  };

  const handleCreateFlashLiquidation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flashProductId) return;
    setIsFlashLoading(true);
    const { error } = await supabase.from('flash_liquidations').insert([{
      store_id: currentStore.id,
      product_id: flashProductId,
      discount_percentage: flashDiscount,
      duration_minutes: flashDuration,
      status: 'active'
    }]);
    setIsFlashLoading(false);
    if (error) {
      alert('Failed to launch flash liquidation: ' + error.message);
    } else {
      alert('Flash liquidation launched! Toast notification sent to local network.');
      setFlashProductId('');
      fetchFlashLiquidations();
    }
  };

  const fetchAdData = async () => {
    setIsLoading(true);
    try {
      // Fetch credits
      const { data: profile } = await supabase
        .from('profiles')
        .select('ad_credits')
        .eq('id', user.id)
        .single();

      if (profile) setCredits(profile.ad_credits || 0);

      // Fetch banner ads
      const { data: adData } = await supabase
        .from('ads')
        .select('*')
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false });

      if (adData) setAds(adData);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSponsoredCampaigns = async () => {
    if (!currentStore) return;
    const { data, error } = await supabase
      .from('platform_ads')
      .select('*, products:content_id(*)')
      .eq('store_id', currentStore.id)
      .eq('content_type', 'product')
      .order('created_at', { ascending: false });
    
    if (data) {
      setSponsoredCampaigns(data);
    }
  };

  const handleCreateSponsoredCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsBiddingSubmitLoading(true);

    try {
      if (!selectedProductId) {
        throw new Error('Please select a product to promote.');
      }
      const budgetNum = parseFloat(adBudget);
      if (isNaN(budgetNum) || budgetNum <= 0) {
        throw new Error('Please enter a valid advertising budget.');
      }
      if (!storeWallet) {
        throw new Error('Business wallet not initialized. Please configure your wallet first.');
      }
      if (budgetNum > storeWallet.balance) {
        throw new Error(`Insufficient wallet balance. You need $${budgetNum.toFixed(2)} but only have $${Number(storeWallet.balance).toFixed(2)}.`);
      }

      const product = products.find(p => p.id === selectedProductId);
      if (!product) {
        throw new Error('Selected product could not be found.');
      }

      // Deduct budget via processTransfer to platform revenue system wallet (11111111-1111-1111-1111-111111111111)
      const transferResult = await processTransfer({
        senderWalletId: storeWallet.id,
        receiverWalletId: '11111111-1111-1111-1111-111111111111',
        amount: budgetNum,
        type: 'fee',
        description: `Sponsored Product Promotion: ${product.name}`
      });

      if (!transferResult.success) {
        throw new Error(transferResult.error || 'Transaction failed. Could not process wallet payment.');
      }

      // Calculate end date based on durationDays
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + durationDays);

      // Insert active campaign record into platform_ads table
      const { error: insertError } = await supabase
        .from('platform_ads')
        .insert([{
          store_id: currentStore.id,
          content_type: 'product',
          content_id: selectedProductId,
          budget: budgetNum,
          status: 'active',
          start_date: new Date().toISOString(),
          end_date: endDate.toISOString()
        }]);

      if (insertError) {
        throw new Error(insertError.message || 'Payment processed successfully, but campaign creation failed. Contact support.');
      }

      setSuccessMessage(`Successfully sponsored "${product.name}" for $${budgetNum.toFixed(2)}!`);
      setSelectedProductId('');
      setAdBudget('');
      
      // Update wallet balance and refresh tables
      if (onWalletUpdate) onWalletUpdate();
      await fetchSponsoredCampaigns();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create sponsored ad campaign.');
    } finally {
      setIsBiddingSubmitLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle size={16} className="text-success" />;
      case 'pending': return <Clock size={16} className="text-warning" />;
      case 'rejected': return <XCircle size={16} className="text-danger" />;
      default: return <Clock size={16} />;
    }
  };

  if (isLoading) {
    return (
      <div className="ad-manager-loading">
        <Loader2 className="animate-spin" size={32} />
        <p>Loading your campaigns...</p>
      </div>
    );
  }

  return (
    <div className="ad-manager-container">
      {/* Dual Tab Switcher */}
      {currentStore && (
        <div className="ad-tab-switcher" style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
          <button 
            className={`tab-btn ${activeTab === 'banner' ? 'active' : ''}`}
            onClick={() => setActiveTab('banner')}
            style={{
              background: activeTab === 'banner' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
              color: '#fff',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            <Megaphone size={16} /> Platform Banner Ads
          </button>
          <button 
            className={`tab-btn ${activeTab === 'boost' ? 'active' : ''}`}
            onClick={() => setActiveTab('boost')}
            style={{
              background: activeTab === 'boost' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
              color: '#fff',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            <Sparkles size={16} /> Boost Products (Sponsored Listings)
          </button>
          <button 
            className={`tab-btn ${activeTab === 'flash' ? 'active' : ''}`}
            onClick={() => setActiveTab('flash')}
            style={{
              background: activeTab === 'flash' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
              color: '#fff',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            <Clock size={16} /> Flash Liquidations
          </button>
        </div>
      )}

      {activeTab === 'banner' ? (
        <>
          <div className="ad-manager-header premium-card">
            <div className="header-info">
              <h2>General Banner Campaigns</h2>
              <p>Manage your general platform advertisement banners using credits.</p>
            </div>
            <div className="credit-balance glass">
              <div className="credit-icon"><Sparkles size={24} color="#818cf8" /></div>
              <div className="credit-details">
                <span className="credit-label">Available Credits</span>
                <span className="credit-amount">{credits}</span>
              </div>
              <button className="buy-credits-btn" onClick={() => alert('Feature coming soon: Buy more credits via Stripe')}>
                Buy More
              </button>
            </div>
          </div>

          <div className="ad-manager-toolbar">
            <h3>Your Campaigns ({ads.length})</h3>
            <button className="primary-btn new-ad-btn" onClick={() => setIsCreateModalOpen(true)}>
              <Plus size={18} /> Create New Ad
            </button>
          </div>

          {ads.length === 0 ? (
            <div className="empty-ads-state premium-card">
              <Megaphone size={48} className="empty-icon" />
              <h3>No Active Campaigns</h3>
              <p>You haven't created any ads yet. Use your credits to promote your business, events, or content to the entire community!</p>
              <button className="primary-btn" onClick={() => setIsCreateModalOpen(true)}>
                Start Your First Campaign
              </button>
            </div>
          ) : (
            <div className="ad-list">
              {ads.map(ad => (
                <div key={ad.id} className="ad-manager-card premium-card">
                  <div className="ad-card-main">
                    {ad.image_url ? (
                      <img src={ad.image_url} alt={ad.title} className="ad-thumbnail" />
                    ) : (
                      <div className="ad-thumbnail-placeholder"><ImageIcon size={24} /></div>
                    )}
                    <div className="ad-details">
                      <h4>{ad.title}</h4>
                      <p className="ad-content-preview">{ad.content}</p>
                      <div className="ad-meta">
                        <span className={`ad-status-badge ${ad.status}`}>
                          {getStatusIcon(ad.status)} {ad.status.charAt(0).toUpperCase() + ad.status.slice(1)}
                        </span>
                        <span className="ad-date">Created: {new Date(ad.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="ad-actions">
                    <div className="ad-stats">
                      <div className="stat-item">
                        <BarChart3 size={16} />
                        <span>{ad.views || 0} Views</span>
                      </div>
                      {ad.target_url && (
                        <a href={ad.target_url} target="_blank" rel="noopener noreferrer" className="stat-item link">
                          <ExternalLink size={16} />
                          <span>Target Link</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {isCreateModalOpen && (
            <AdCreationModal 
              onClose={() => {
                setIsCreateModalOpen(false);
                fetchAdData();
              }} 
            />
          )}
        </>
      ) : activeTab === 'boost' ? (
        /* Boost Products Tab Content */
        <div className="boost-products-section fade-in">
          <div className="ad-manager-header premium-card" style={{ marginBottom: '24px' }}>
            <div className="header-info">
              <h2>Sponsored Product Bidding</h2>
              <p>Promote your products directly in the search results and lanes as "Sponsored". Paid from your store wallet.</p>
            </div>
            <div className="credit-balance glass">
              <div className="credit-icon"><DollarSign size={24} color="#fbbf24" /></div>
              <div className="credit-details">
                <span className="credit-label">Store Wallet Balance</span>
                <span className="credit-amount">${storeWallet ? Number(storeWallet.balance).toFixed(2) : '0.00'}</span>
              </div>
            </div>
          </div>

          <div className="bidding-panel-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', alignItems: 'start' }}>
            
            {/* Promotion Creation Form */}
            <div className="elite-widget premium-card" style={{ padding: '24px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={20} color="var(--primary)" /> Promote a Listing
              </h3>

              {errorMessage && (
                <div className="error-alert" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.875rem' }}>
                  {errorMessage}
                </div>
              )}

              {successMessage && (
                <div className="success-alert" style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)', color: '#22c55e', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.875rem' }}>
                  {successMessage}
                </div>
              )}

              <form onSubmit={handleCreateSponsoredCampaign}>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.875rem' }}>Select Product</label>
                  <select 
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="glass-input"
                    style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    required
                  >
                    <option value="" style={{ background: '#111', color: '#888' }}>-- Choose Product --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id} style={{ background: '#111', color: '#fff' }}>
                        {p.name} (${Number(p.price).toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.875rem' }}>Campaign Budget ($)</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>$</span>
                    <input 
                      type="number"
                      step="0.01"
                      min="1.00"
                      placeholder="e.g. 50.00"
                      value={adBudget}
                      onChange={(e) => setAdBudget(e.target.value)}
                      className="glass-input"
                      style={{ width: '100%', padding: '10px 10px 10px 28px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      required
                    />
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                    Funds will be instantly transferred from your business wallet.
                  </span>
                </div>

                <div className="form-group" style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.875rem' }}>Duration (Days)</label>
                  <select 
                    value={durationDays}
                    onChange={(e) => setDurationDays(Number(e.target.value))}
                    className="glass-input"
                    style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  >
                    <option value={3} style={{ background: '#111' }}>3 Days</option>
                    <option value={7} style={{ background: '#111' }}>7 Days</option>
                    <option value={14} style={{ background: '#111' }}>14 Days</option>
                    <option value={30} style={{ background: '#111' }}>30 Days</option>
                  </select>
                </div>

                <button 
                  type="submit"
                  disabled={isBiddingSubmitLoading}
                  className="primary-btn"
                  style={{ width: '100%', padding: '12px', background: 'var(--primary)', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                >
                  {isBiddingSubmitLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} /> Processing...
                    </>
                  ) : (
                    <>
                      <Plus size={18} /> Launch Sponsored Campaign
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Campaigns Table */}
            <div className="elite-widget premium-card" style={{ padding: '24px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={20} color="#fbbf24" /> Active Product Ads ({sponsoredCampaigns.length})
              </h3>

              {sponsoredCampaigns.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
                  <Megaphone size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
                  <p style={{ margin: 0 }}>No sponsored product listings found.</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem' }}>Select a product to boost it to the front page.</p>
                </div>
              ) : (
                <div className="table-responsive" style={{ overflowX: 'auto' }}>
                  <table className="crm-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Product</th>
                        <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Budget</th>
                        <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Imps</th>
                        <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Clicks</th>
                        <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Status</th>
                        <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Ends On</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sponsoredCampaigns.map((camp: any) => (
                        <tr key={camp.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '12px 8px', fontWeight: 600 }}>{camp.products?.name || 'Unknown product'}</td>
                          <td style={{ padding: '12px 8px' }}>${Number(camp.budget).toFixed(2)}</td>
                          <td style={{ padding: '12px 8px' }}>{camp.impressions || 0}</td>
                          <td style={{ padding: '12px 8px' }}>{camp.clicks || 0}</td>
                          <td style={{ padding: '12px 8px' }}>
                            <span 
                              className={`status-badge ${camp.status}`}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.75rem',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                background: camp.status === 'active' ? 'rgba(34,197,94,0.1)' : 'rgba(251,191,36,0.1)',
                                color: camp.status === 'active' ? '#22c55e' : '#fbbf24',
                                textTransform: 'capitalize'
                              }}
                            >
                              {getStatusIcon(camp.status)} {camp.status}
                            </span>
                          </td>
                          <td style={{ padding: '12px 8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            {camp.end_date ? new Date(camp.end_date).toLocaleDateString() : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Flash Liquidations Tab Content */
        <div className="flash-liquidations-section fade-in">
          <div className="ad-manager-header premium-card" style={{ marginBottom: '24px', border: '1px solid rgba(239, 68, 68, 0.3)', background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, transparent 100%)' }}>
            <div className="header-info">
              <h2 style={{ color: '#ef4444' }}>Zero-Waste Flash Liquidations</h2>
              <p>Instantly liquidate expiring inventory. Blasts a real-time push notification to all local users within a 5-mile radius.</p>
            </div>
          </div>

          <div className="bidding-panel-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', alignItems: 'start' }}>
            
            {/* Flash Creation Form */}
            <div className="elite-widget premium-card" style={{ padding: '24px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }}>
                <Clock size={20} /> Trigger Flash Sale
              </h3>

              <form onSubmit={handleCreateFlashLiquidation}>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.875rem' }}>Product to Liquidate</label>
                  <select 
                    value={flashProductId}
                    onChange={(e) => setFlashProductId(e.target.value)}
                    className="glass-input"
                    style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    required
                  >
                    <option value="" style={{ background: '#111', color: '#888' }}>-- Choose Product --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id} style={{ background: '#111', color: '#fff' }}>
                        {p.name} (${Number(p.price).toFixed(2)} - {p.stock_quantity || 0} in stock)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.875rem' }}>Discount Percentage (%)</label>
                  <input 
                    type="number"
                    min="10"
                    max="99"
                    value={flashDiscount}
                    onChange={(e) => setFlashDiscount(Number(e.target.value))}
                    className="glass-input"
                    style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.875rem' }}>Duration (Minutes)</label>
                  <select 
                    value={flashDuration}
                    onChange={(e) => setFlashDuration(Number(e.target.value))}
                    className="glass-input"
                    style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  >
                    <option value={15} style={{ background: '#111' }}>15 Minutes</option>
                    <option value={30} style={{ background: '#111' }}>30 Minutes</option>
                    <option value={60} style={{ background: '#111' }}>1 Hour</option>
                    <option value={120} style={{ background: '#111' }}>2 Hours</option>
                  </select>
                </div>

                <button 
                  type="submit"
                  disabled={isFlashLoading}
                  className="primary-btn"
                  style={{ width: '100%', padding: '12px', background: '#ef4444', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                >
                  {isFlashLoading ? <Loader2 className="animate-spin" size={18} /> : <><Megaphone size={18} /> Blast to Network</>}
                </button>
              </form>
            </div>

            {/* Flash History Table */}
            <div className="elite-widget premium-card" style={{ padding: '24px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={20} color="#fbbf24" /> Liquidation History
              </h3>

              {flashLiquidations.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
                  <p style={{ margin: 0 }}>No liquidations launched yet.</p>
                </div>
              ) : (
                <div className="table-responsive" style={{ overflowX: 'auto' }}>
                  <table className="crm-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Date</th>
                        <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Product</th>
                        <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Discount</th>
                        <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {flashLiquidations.map((flash: any) => (
                        <tr key={flash.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '12px 8px', fontSize: '0.85rem' }}>{new Date(flash.created_at).toLocaleString()}</td>
                          <td style={{ padding: '12px 8px', fontWeight: 600 }}>{flash.products?.name || 'Unknown'}</td>
                          <td style={{ padding: '12px 8px', color: '#ef4444', fontWeight: 700 }}>{flash.discount_percentage}% OFF</td>
                          <td style={{ padding: '12px 8px' }}>
                            <span 
                              className={`status-badge ${flash.status}`}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.75rem',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                background: flash.status === 'active' ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.1)',
                                color: flash.status === 'active' ? '#22c55e' : '#888',
                                textTransform: 'capitalize'
                              }}
                            >
                              {flash.status === 'active' ? <Clock size={12} className="animate-pulse" /> : null} {flash.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
