import React, { useState } from 'react';
import { Search, MoreVertical, Play, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './VideosView.css';

const CATEGORIES = ['All', 'Music', 'Gaming', 'Tech', 'News', 'Movies', 'Live', 'Fashion', 'Learning'];

const SAMPLE_VIDEOS = [
  {
    id: 'v1',
    thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=600',
    title: 'Future of Web Development in 2026: What you need to know',
    author: 'Code Master',
    views: '1.2M views',
    time: '2 days ago',
    duration: '15:24',
    isVerified: true
  },
  {
    id: 'v2',
    thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=600',
    title: 'Summer Music Mix 2026 | Best Deep House & Tropical Beats',
    author: 'Vibe Nation',
    views: '850K views',
    time: '5 hours ago',
    duration: '1:20:45',
    isVerified: false
  },
  {
    id: 'v3',
    thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=600',
    title: 'Top 10 Hidden Features in NextJS 16',
    author: 'Tech Guru',
    views: '45K views',
    time: '1 month ago',
    duration: '10:05',
    isVerified: true
  },
  {
    id: 'v4',
    thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=600',
    title: 'Ultimate Home Studio Setup for Content Creators',
    author: 'Creative Mind',
    views: '320K views',
    time: '3 weeks ago',
    duration: '22:18',
    isVerified: true
  }
];

export const VideosView: React.FC<{ user: any; scope: string }> = ({ user, scope = 'city' }) => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [videos, setVideos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [escalatedScope, setEscalatedScope] = useState<string | null>(null);

  React.useEffect(() => {
    fetchVideos();
  }, [scope, user]);

  const fetchVideos = async () => {
    setIsLoading(true);
    let selectString = `*, author:profiles!posts_profile_id_fkey(name, avatar_url, is_verified, community, county, state, country)`;
    const needsGeoFilter = user && scope !== 'national';
    if (needsGeoFilter) {
      selectString = `*, author:profiles!posts_profile_id_fkey!inner(name, avatar_url, is_verified, community, county, state, country)`;
    }

    let query = supabase.from('posts').select(selectString).eq('type', 'video').order('created_at', { ascending: false }).limit(20);

    if (needsGeoFilter) {
      if (scope === 'city') query = query.eq('author.community', user.community);
      else if (scope === 'county') query = query.eq('author.county', user.county);
      else if (scope === 'state') query = query.eq('author.state', user.state);
    }

    const { data, error } = await query;
    let fetchedVideos = data || [];
    let currentEscalation: string | null = null;

    if (needsGeoFilter && fetchedVideos.length < 3 && scope !== 'national') {
      const escalationMap: Record<string, { nextScope: string; filterKey: string; filterValue: string; label: string }> = {
        city: { nextScope: 'county', filterKey: 'author.county', filterValue: user.county, label: `${user.county || 'your'} County` },
        county: { nextScope: 'state', filterKey: 'author.state', filterValue: user.state, label: user.state || 'your state' },
        state: { nextScope: 'national', filterKey: '', filterValue: '', label: 'nationwide' },
      };
      const esc = escalationMap[scope];
      if (esc && esc.filterValue) {
        let escQuery = supabase.from('posts').select(`*, author:profiles!posts_profile_id_fkey!inner(name, avatar_url, is_verified, community, county, state, country)`).eq('type', 'video').order('created_at', { ascending: false }).limit(20);
        if (esc.nextScope !== 'national') escQuery = escQuery.eq(esc.filterKey, esc.filterValue);
        const { data: escData } = await escQuery;
        if (escData && escData.length > 0) {
          const existingIds = new Set(fetchedVideos.map((v: any) => v.id));
          const newVideos = escData.filter((v: any) => !existingIds.has(v.id));
          fetchedVideos = [...fetchedVideos, ...newVideos];
          currentEscalation = esc.label;
        }
      }
    }

    if (!error) {
      const mapped = fetchedVideos.map((post: any) => ({
        id: post.id,
        thumbnail: post.media_urls?.[0] || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=600',
        title: post.content || 'Local Video',
        author: post.author?.name || 'Local User',
        views: `${post.views || 0} views`,
        time: new Date(post.created_at).toLocaleDateString(),
        duration: '0:00',
        isVerified: post.author?.is_verified || false
      }));
      setVideos(mapped.length > 0 ? mapped : SAMPLE_VIDEOS);
      setEscalatedScope(currentEscalation);
    } else {
      setVideos(SAMPLE_VIDEOS);
      setEscalatedScope(null);
    }
    setIsLoading(false);
  };

  return (
    <div className="videos-container">
      <div className="v-header">
        <div className="v-search-bar">
          <Search size={18} />
          <input type="text" placeholder="Search videos..." />
        </div>
      </div>

      <div className="v-categories">
        {CATEGORIES.map(cat => (
          <button 
            key={cat} 
            className={`cat-chip ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
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
          <span>Expanded to <strong style={{ color: 'var(--primary)' }}>{escalatedScope}</strong> — not enough local videos yet</span>
        </div>
      )}

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px', width: '100%' }}>
          <Loader2 className="animate-spin" size={32} color="var(--primary)" />
        </div>
      ) : (
      <div className="v-video-grid">
        {videos.map(video => (
          <div key={video.id} className="v-video-card">
            <div className="v-thumbnail-wrap">
              <img src={video.thumbnail} alt={video.title} className="v-thumbnail" />
              <span className="v-duration">{video.duration}</span>
              <div className="v-play-overlay">
                <Play fill="#fff" size={32} />
              </div>
            </div>
            <div className="v-video-info">
              <div className="v-author-avatar-small" />
              <div className="v-text-info">
                <h3 className="v-video-title">{video.title}</h3>
                <div className="v-video-meta">
                  <span className="v-author">
                    {video.author} {video.isVerified && <CheckCircle size={12} className="v-verified" />}
                  </span>
                  <span className="v-stats">{video.views} • {video.time}</span>
                </div>
              </div>
              <button className="v-more-btn"><MoreVertical size={18} /></button>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
};
