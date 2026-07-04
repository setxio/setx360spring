import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Coins, Check, AlertCircle } from 'lucide-react';

interface ArcadeShopProps {
  onBack: () => void;
}

const BADGES = [
  { id: 'gator_hunter', name: 'Gator Hunter', icon: '🐊', cost: 500, description: 'Survived the swamp.' },
  { id: 'gulf_coast_skipper', name: 'Gulf Skipper', icon: '🚢', cost: 800, description: 'Navigated the shipping channels.' },
  { id: 'spindletop_tycoon', name: 'Spindletop Tycoon', icon: '🛢️', cost: 1000, description: 'Struck oil in Beaumont.' },
  { id: 'windmill_defender', name: 'Windmill Guard', icon: '🌷', cost: 1200, description: 'Protected Nederland.' },
  { id: 'golden_pecan', name: 'Golden Pecan', icon: '🌰', cost: 2000, description: 'Master of the Groves harvest.' }
];

export const ArcadeShop: React.FC<ArcadeShopProps> = ({ onBack }) => {
  const { user, refreshUser, theme } = useApp();
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isDark = theme.includes('dark') || theme.includes('io') || theme.includes('neo');
  const userCoins = user?.arcade_coins || 0;
  const userBadges = user?.arcade_badges || [];

  const handlePurchase = async (badgeId: string, cost: number) => {
    if (!user) return;
    setError(null);
    setSuccess(null);
    
    if (userCoins < cost) {
      setError('Not enough coins!');
      return;
    }

    setPurchasing(badgeId);
    
    try {
      const { error: rpcError } = await supabase.rpc('purchase_arcade_badge', {
        badge_name: badgeId,
        cost: cost
      });

      if (rpcError) throw rpcError;
      
      setSuccess(`Successfully purchased ${BADGES.find(b => b.id === badgeId)?.name}!`);
      await refreshUser(); // Fetch updated profile from AppContext
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to purchase badge.');
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <div className={`games-view-container ${isDark ? 'dark' : ''}`} style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="games-header">
        <div className="games-header-inner">
          <button onClick={onBack} className="games-back-btn">
            <ArrowLeft size={24} />
          </button>
          <div style={{ flex: 1, textAlign: 'center', fontSize: '20px', fontWeight: 800 }}>
            Arcade Shop
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, color: '#facc15' }}>
            <Coins size={20} />
            {userCoins}
          </div>
        </div>
      </div>

      <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>Profile Badges</h2>
          <p style={{ color: 'var(--text-muted, #6b7280)' }}>Show off your gaming achievements across SETX!</p>
        </div>

        {error && (
          <div style={{ padding: '12px', background: '#fef2f2', color: '#ef4444', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={20} /> {error}
          </div>
        )}

        {success && (
          <div style={{ padding: '12px', background: '#ecfdf5', color: '#10b981', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Check size={20} /> {success}
          </div>
        )}

        <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {BADGES.map((badge) => {
            const isOwned = userBadges.includes(badge.id);
            const canAfford = userCoins >= badge.cost;
            const isPurchasing = purchasing === badge.id;

            return (
              <div 
                key={badge.id}
                style={{
                  background: isDark ? '#1e293b' : 'white',
                  borderRadius: '16px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  border: isOwned ? '2px solid #10b981' : '2px solid transparent'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  <div style={{ fontSize: '48px', lineHeight: 1 }}>{badge.icon}</div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 700 }}>{badge.name}</h3>
                    <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted, #6b7280)' }}>{badge.description}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => handlePurchase(badge.id, badge.cost)}
                  disabled={isOwned || !canAfford || isPurchasing}
                  style={{
                    padding: '12px',
                    borderRadius: '12px',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: (isOwned || (!canAfford && !isOwned)) ? 'not-allowed' : 'pointer',
                    background: isOwned ? '#ecfdf5' : canAfford ? '#3b82f6' : '#f3f4f6',
                    color: isOwned ? '#10b981' : canAfford ? 'white' : '#9ca3af',
                    transition: 'all 0.2s'
                  }}
                >
                  {isOwned ? (
                    <>
                      <Check size={20} /> Equipped
                    </>
                  ) : isPurchasing ? (
                    'Purchasing...'
                  ) : (
                    <>
                      <Coins size={18} /> {badge.cost} Coins
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
