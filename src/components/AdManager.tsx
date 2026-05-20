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
  ExternalLink
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AdCreationModal } from './AdCreationModal';
import './AdManager.css';

interface AdManagerProps {
  user: User;
}

export const AdManager: React.FC<AdManagerProps> = ({ user }) => {
  const [ads, setAds] = useState<any[]>([]);
  const [credits, setCredits] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAdData();
    }
  }, [user]);

  const fetchAdData = async () => {
    setIsLoading(true);

    // Fetch credits
    const { data: profile } = await supabase
      .from('profiles')
      .select('ad_credits')
      .eq('id', user.id)
      .single();

    if (profile) setCredits(profile.ad_credits || 0);

    // Fetch ads
    const { data: adData } = await supabase
      .from('ads')
      .select('*')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false });

    if (adData) setAds(adData);

    setIsLoading(false);
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
      <div className="ad-manager-header premium-card">
        <div className="header-info">
          <h2>Ad Campaigns</h2>
          <p>Manage your sponsored content across the network.</p>
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
                {/* Pause/Resume buttons would go here in future */}
              </div>
            </div>
          ))}
        </div>
      )}

      {isCreateModalOpen && (
        <AdCreationModal 
          onClose={() => {
            setIsCreateModalOpen(false);
            fetchAdData(); // Refresh after closing
          }} 
        />
      )}
    </div>
  );
};
