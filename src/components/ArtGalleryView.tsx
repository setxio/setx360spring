import React, { useState } from 'react';
import { Eye, Heart, Share2, Search, Filter, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import './ArtGalleryView.css';

const ARTWORKS = [
  { id: '1', title: 'Eternal Sunset', artist: 'Elena Rossi', image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80&w=600', price: '$2,400', views: '1.2K' },
  { id: '2', title: 'Urban Geometry', artist: 'Marcus Chen', image: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=600', price: '$1,850', views: '850' },
  { id: '3', title: 'Floral Symphony', artist: 'Sarah Jenkins', image: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&q=80&w=600', price: 'Auction', views: '3.4K' },
  { id: '4', title: 'Abstract Mind', artist: 'David K.', image: 'https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&q=80&w=600', price: '$4,200', views: '920' },
  { id: '5', title: 'Oceanic Whispers', artist: 'Maya Blue', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=600', price: '$3,100', views: '2.1K' },
  { id: '6', title: 'Golden Hour', artist: 'Leo Gold', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=600', price: '$1,200', views: '1.5K' }
];

export const ArtGalleryView: React.FC<{ user?: any; scope?: string }> = ({ user: propUser, scope = 'national' }) => {
  const [artworks, setArtworks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [escalatedScope, setEscalatedScope] = useState<string | null>(null);

  const { user: contextUser } = useApp();
  const user = propUser || contextUser;

  React.useEffect(() => {
    setIsLoading(true);
    let currentEscalation: string | null = null;
    const needsGeoFilter = user && scope !== 'national';

    let fetchedArtworks = [...ARTWORKS];

    if (needsGeoFilter) {
      if (fetchedArtworks.length < 3) {
        const escalationMap: Record<string, { nextScope: string; label: string }> = {
          city: { nextScope: 'county', label: `${user.county || 'your'} County` },
          county: { nextScope: 'state', label: user.state || 'your state' },
          state: { nextScope: 'national', label: 'nationwide' },
        };
        const esc = escalationMap[scope];
        if (esc) currentEscalation = esc.label;
      }
    }

    setTimeout(() => {
      setArtworks(fetchedArtworks);
      setEscalatedScope(currentEscalation);
      setIsLoading(false);
    }, 400);
  }, [scope, user]);
  return (
    <div className="art-gallery-container">
      <header className="art-header">
        <div className="art-title-section">
          <h1 className="art-main-title">Art Gallery</h1>
          <p className="art-subtitle">Discover curated local and global masterpieces</p>
        </div>
        <div className="art-search-bar">
          <Search size={20} />
          <input type="text" placeholder="Search artists, styles, or collections..." />
          <Filter size={20} className="filter-icon" />
        </div>
      </header>

      <div className="art-filters-chips">
        {['All Art', 'Paintings', 'Photography', 'Sculptures', 'Digital', 'Local Artists', 'Auctions'].map(chip => (
          <button key={chip} className={`art-chip ${chip === 'All Art' ? 'active' : ''}`}>{chip}</button>
        ))}
      </div>

      {escalatedScope && (
        <div style={{
          padding: '10px 16px',
          margin: '0 16px 16px',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(157,0,255,0.08))',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.82rem',
          color: 'var(--text-muted)',
          fontWeight: 500
        }}>
          <span>Expanded to <strong style={{ color: 'var(--primary)' }}>{escalatedScope}</strong> — not enough local art yet</span>
        </div>
      )}

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px', width: '100%' }}>
          <Loader2 className="animate-spin" size={32} color="var(--primary)" />
        </div>
      ) : (
      <div className="art-masonry-grid">
        {artworks.map((art: any) => (
          <div key={art.id} className="art-card">
            <div className="art-image-wrap">
              <img src={art.image} alt={art.title} className="art-image" />
              <div className="art-overlay">
                <button className="art-action-btn"><Heart size={20} /></button>
                <button className="art-action-btn"><Share2 size={20} /></button>
              </div>
              <div className="art-price-tag">{art.price}</div>
            </div>
            <div className="art-info">
              <h3 className="art-title">{art.title}</h3>
              <div className="art-meta">
                <span className="art-artist">by {art.artist}</span>
                <span className="art-views"><Eye size={14} /> {art.views}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
};
