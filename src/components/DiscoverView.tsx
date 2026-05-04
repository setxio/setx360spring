import React, { useState, useEffect } from 'react';
import { TrendingUp, Zap, Sparkles, Heart, MessageSquare, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { weightByCounty, SETX_COUNTY_LIST, isSETXTheme } from '../utils/geo';
import { useApp } from '../context/AppContext';
import './DiscoverView.css';

interface Post {
  id: string;
  content: string;
  media_urls?: string[];
  created_at: string;
  upvote_count?: number;
  comments_count?: number;
  author?: {
    id: string;
    name: string;
    avatar_url?: string;
    county?: string;
    community?: string;
  };
}

interface MarketListing {
  id: string;
  title: string;
  price?: number;
  media_urls?: string[];
}

const CAROUSEL_LIMIT = 10;

export const DiscoverView: React.FC<{ user: any; scope?: 'national' | 'state' | 'county' | 'city' }> = ({ user, scope = 'national' }) => {
  const { theme } = useApp();
  const [topPosts, setTopPosts] = useState<Post[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<Post[]>([]);
  const [marketItems, setMarketItems] = useState<MarketListing[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isLoadingTrending, setIsLoadingTrending] = useState(true);
  const [isLoadingMarket, setIsLoadingMarket] = useState(true);

  const isSETX = isSETXTheme(theme);

  useEffect(() => {
    fetchTopPosts();
    fetchTrendingPosts();
    fetchMarketItems();
  }, [scope, theme]);

  const fetchTopPosts = async () => {
    setIsLoadingPosts(true);
    try {
      let query = supabase
        .from('posts')
        .select(`
          id, content, media_urls, created_at, upvote_count, comments_count,
          author:profiles!posts_profile_id_fkey(id, name, avatar_url, county, community)
        `)
        .neq('moderation_status', 'hidden')
        .is('group_id', null)
        .order('hot_score', { ascending: false })
        .limit(50); // Fetch more, weight & slice

      // Apply scope filter
      if (isSETX && (scope === 'county' || scope === 'city')) {
        query = query.in('author_county', SETX_COUNTY_LIST);
      } else if (scope === 'state' && user?.state) {
        query = query.eq('author_state', user.state);
      } else if (scope === 'city' && user?.community) {
        query = query.eq('author_community', user.community);
      }

      const { data } = await query;
      if (data) {
        const weighted = weightByCounty(data as any[], user?.county, 'author.county');
        setTopPosts(weighted.slice(0, CAROUSEL_LIMIT) as unknown as Post[]);
      }
    } catch (err) {
      console.error('DiscoverView fetchTopPosts:', err);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  const fetchTrendingPosts = async () => {
    setIsLoadingTrending(true);
    try {
      let query = supabase
        .from('posts')
        .select(`
          id, content, media_urls, created_at, upvote_count, comments_count,
          author:profiles!posts_profile_id_fkey(id, name, avatar_url, county, community)
        `)
        .neq('moderation_status', 'hidden')
        .is('group_id', null)
        .order('upvote_count', { ascending: false })
        .limit(50);

      if (isSETX && (scope === 'county' || scope === 'city')) {
        query = query.in('author_county', SETX_COUNTY_LIST);
      } else if (scope === 'state' && user?.state) {
        query = query.eq('author_state', user.state);
      }

      const { data } = await query;
      if (data) {
        const weighted = weightByCounty(data as any[], user?.county, 'author.county');
        setTrendingPosts(weighted.slice(0, CAROUSEL_LIMIT) as unknown as Post[]);
      }
    } catch (err) {
      console.error('DiscoverView fetchTrendingPosts:', err);
    } finally {
      setIsLoadingTrending(false);
    }
  };

  const fetchMarketItems = async () => {
    setIsLoadingMarket(true);
    try {
      const { data } = await supabase
        .from('listings')
        .select('id, title, price, media_urls')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(CAROUSEL_LIMIT);
      setMarketItems(data || []);
    } catch (err) {
      console.error('DiscoverView fetchMarketItems:', err);
    } finally {
      setIsLoadingMarket(false);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  return (
    <div className="discover-view">

      {/* Hero Banner */}
      <div className="premium-card discover-hero" style={{
        background: 'linear-gradient(135deg, var(--primary), var(--discover-secondary, var(--secondary)))',
        color: 'white',
        marginBottom: '28px',
        border: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Sparkles size={22} />
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>SETX 360 Radar</h3>
        </div>
        <p style={{ opacity: 0.88, fontSize: '0.9rem' }}>
          {isSETX
            ? `Your local pulse — Jefferson, Orange, Hardin & Jasper Counties`
            : `Discover what's trending in your community`}
        </p>
      </div>

      {/* Top Posts Carousel */}
      <div className="discover-carousel-section">
        <div className="discover-section-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} color="var(--primary)" />
            <h4>Top Posts</h4>
          </div>
          {user?.county && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <MapPin size={12} /> {user.county}
            </span>
          )}
        </div>

        {isLoadingPosts ? (
          <div className="discover-skeleton">
            {[1,2,3].map(i => <div key={i} className="discover-skeleton-card" />)}
          </div>
        ) : topPosts.length === 0 ? (
          <div className="discover-empty">No posts yet — be the first to share something!</div>
        ) : (
          <div className="discover-carousel">
            {topPosts.map(post => {
              const hasImage = post.media_urls && post.media_urls.length > 0 &&
                !post.media_urls[0].match(/\.(mp4|webm|ogg)$/i);
              return (
                <div key={post.id} className={`discover-carousel-card ${hasImage ? '' : 'text-only'}`}>
                  {hasImage && (
                    <img
                      className="discover-carousel-card-img"
                      src={post.media_urls![0]}
                      alt=""
                      loading="lazy"
                    />
                  )}
                  <div className="discover-carousel-card-body">
                    <div className="discover-carousel-card-meta">
                      {post.author?.avatar_url ? (
                        <img src={post.author.avatar_url} alt={post.author.name} />
                      ) : (
                        <div style={{
                          width: 24, height: 24, borderRadius: '50%',
                          background: 'var(--primary)', opacity: 0.4, flexShrink: 0
                        }} />
                      )}
                      <span>{post.author?.name || 'Community'}</span>
                      <span style={{ marginLeft: 'auto', flexShrink: 0 }}>{formatTimeAgo(post.created_at)}</span>
                    </div>
                    <div className="discover-carousel-card-content">{post.content}</div>
                    <div className="discover-carousel-card-stats">
                      <span><Heart size={12} /> {post.upvote_count || 0}</span>
                      <span><MessageSquare size={12} /> {post.comments_count || 0}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Trending Posts Carousel */}
      <div className="discover-carousel-section">
        <div className="discover-section-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={18} color="var(--secondary)" />
            <h4>Trending Now</h4>
          </div>
        </div>

        {isLoadingTrending ? (
          <div className="discover-skeleton">
            {[1,2,3].map(i => <div key={i} className="discover-skeleton-card" />)}
          </div>
        ) : trendingPosts.length === 0 ? (
          <div className="discover-empty">Nothing trending yet — check back soon!</div>
        ) : (
          <div className="discover-carousel">
            {trendingPosts.map(post => (
              <div key={post.id} className="discover-carousel-card text-only">
                <div className="discover-carousel-card-body">
                  <div className="discover-carousel-card-meta">
                    {post.author?.avatar_url ? (
                      <img src={post.author.avatar_url} alt={post.author.name} />
                    ) : (
                      <div style={{
                        width: 24, height: 24, borderRadius: '50%',
                        background: 'var(--secondary)', opacity: 0.4, flexShrink: 0
                      }} />
                    )}
                    <span>{post.author?.name || 'Community'}</span>
                    <span style={{ marginLeft: 'auto', flexShrink: 0 }}>{formatTimeAgo(post.created_at)}</span>
                  </div>
                  <div className="discover-carousel-card-content">{post.content}</div>
                  <div className="discover-carousel-card-stats">
                    <span><Heart size={12} /> {post.upvote_count || 0}</span>
                    <span><MessageSquare size={12} /> {post.comments_count || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hot Market Items Carousel */}
      <div className="discover-carousel-section">
        <div className="discover-section-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="#f97316" />
            <h4>Hot on Market</h4>
          </div>
        </div>

        {isLoadingMarket ? (
          <div className="discover-skeleton">
            {[1,2,3,4].map(i => (
              <div key={i} className="discover-skeleton-card" style={{ flex: '0 0 200px', height: 180 }} />
            ))}
          </div>
        ) : marketItems.length === 0 ? (
          <div className="discover-empty">No listings yet — open Market to post one!</div>
        ) : (
          <div className="discover-market-carousel">
            {marketItems.map(item => (
              <div key={item.id} className="discover-market-card">
                {item.media_urls && item.media_urls[0] ? (
                  <img src={item.media_urls[0]} alt={item.title} loading="lazy" />
                ) : (
                  <div style={{
                    width: '100%', height: 120,
                    background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                    opacity: 0.2
                  }} />
                )}
                <div className="discover-market-card-info">
                  <h5>{item.title}</h5>
                  {item.price != null && (
                    <div className="discover-market-card-price">${item.price.toFixed(2)}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
