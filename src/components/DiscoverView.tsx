import React from 'react';
import { TrendingUp, Zap, Sparkles } from 'lucide-react';
import { SocialFeed } from './SocialFeed';
import { MarketHome } from './MarketHome';


export const DiscoverView: React.FC<{ user: any; scope?: 'national' | 'state' | 'county' | 'city' }> = ({ user, scope = 'national' }) => {
  return (
    <div className="discover-view">
      {/* ... Hero Banner ... */}
      <div className="premium-card discover-hero" style={{ 
        background: 'linear-gradient(135deg, var(--primary), var(--discover-secondary))',
        color: 'white',
        marginBottom: '24px',
        border: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Sparkles size={24} />
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800 }}>SETX 360 Radar</h3>
        </div>
        <p style={{ opacity: 0.9 }}>Your local pulse on Jefferson & Orange County—from social buzz to hot marketplace finds.</p>
      </div>

      <div className="discover-grid">
        <section style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <TrendingUp size={20} color="var(--primary)" />
            <h4 style={{ fontWeight: 700 }}>Top Post</h4>
          </div>
          <SocialFeed user={user} showFilters={false} showFAB={false} scope={scope} />
        </section>

        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Zap size={20} color="var(--secondary)" />
            <h4 style={{ fontWeight: 700 }}>Hot Items</h4>
          </div>
          <MarketHome user={user} scope={scope} />
        </section>
      </div>
    </div>
  );
};
