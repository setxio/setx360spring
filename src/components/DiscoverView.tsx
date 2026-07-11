import type { User } from '../types/user';
import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, Zap, Sparkles, Heart, MessageSquare, MapPin, Camera, ShoppingBag, Tag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { weightByCounty, SETX_COUNTY_LIST, isSETXTheme } from '../utils/geo';
import { useApp } from '../context/AppContext';
import { ARDiscoveryMode } from './ARDiscoveryMode';
import './DiscoverView.css';

interface Post {
  id: string;
  content: string;
  media_urls?: string[];
  created_at: string;
  upvote_count?: number;
  comments_count?: number;
  _feedType?: 'post' | 'trending' | 'market';
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

type FeedItem = (Post | MarketListing) & { _feedType: 'post' | 'trending' | 'market' };

const FETCH_LIMIT = 12;

export const DiscoverView: React.FC<{ user: User; scope?: 'national' | 'state' | 'region' | 'county' | 'city'; onNavigate?: (env: string) => void }> = ({ user, scope = 'state', onNavigate }) => {
  const { theme } = useApp();
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isARModeOpen, setIsARModeOpen] = useState(false);

  // Swipe logic
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEndX(null);
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStartX || !touchEndX || !onNavigate) return;
    const distance = touchStartX - touchEndX;
    const isLeftSwipe = distance > minSwipeDistance; // touchStartX > touchEndX (finger moved left)
    if (isLeftSwipe) {
      onNavigate('home');
    }
  };

  const isSETX = isSETXTheme(theme);

  useEffect(() => {
    buildFeed();
  }, [scope, theme]);

  const buildFeed = async () => {
    setIsLoading(true);
    try {
      // Fetch posts, trending, and market items in parallel
      const [postsRes, trendingRes, marketRes] = await Promise.all([
        fetchTopPosts(),
        fetchTrendingPosts(),
        fetchMarketItems(),
      ]);

      // Interleave: post, post, market, trending, post, post, market, trending...
      const merged: FeedItem[] = [];
      const maxLen = Math.max(postsRes.length, trendingRes.length, marketRes.length);
      let pIdx = 0, tIdx = 0, mIdx = 0;

      for (let i = 0; i < maxLen * 3; i++) {
        const slot = i % 4;
        if (slot === 0 && pIdx < postsRes.length) {
          merged.push({ ...postsRes[pIdx++], _feedType: 'post' });
        } else if (slot === 1 && pIdx < postsRes.length) {
          merged.push({ ...postsRes[pIdx++], _feedType: 'post' });
        } else if (slot === 2 && mIdx < marketRes.length) {
          merged.push({ ...marketRes[mIdx++], _feedType: 'market' });
        } else if (slot === 3 && tIdx < trendingRes.length) {
          merged.push({ ...trendingRes[tIdx++], _feedType: 'trending' });
        }
      }

      setFeedItems(merged.filter(Boolean));
    } catch (err) {
      console.error('DiscoverView buildFeed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTopPosts = async (): Promise<Post[]> => {
    let query = supabase
      .from('posts')
      .select(`id, content, media_urls, created_at, upvote_count, comments_count,
        author:profiles!posts_profile_id_fkey(id, name, avatar_url, county, community)`)
      .neq('moderation_status', 'hidden')
      .is('group_id', null)
      .order('hot_score', { ascending: false })
      .limit(FETCH_LIMIT);

    if (isSETX && (scope === 'county' || scope === 'city')) {
      query = query.in('author_county', SETX_COUNTY_LIST);
    } else if (scope === 'region' && user?.state) {
      query = query.eq('author_state', user.state);
    } else if (scope === 'city' && user?.community) {
      query = query.eq('author_community', user.community);
    }

    const { data } = await query;
    if (!data) return [];
    return weightByCounty(data as any[], user?.county, 'author.county') as unknown as Post[];
  };

  const fetchTrendingPosts = async (): Promise<Post[]> => {
    let query = supabase
      .from('posts')
      .select(`id, content, media_urls, created_at, upvote_count, comments_count,
        author:profiles!posts_profile_id_fkey(id, name, avatar_url, county, community)`)
      .neq('moderation_status', 'hidden')
      .is('group_id', null)
      .order('upvote_count', { ascending: false })
      .limit(FETCH_LIMIT);

    if (isSETX && (scope === 'county' || scope === 'city')) {
      query = query.in('author_county', SETX_COUNTY_LIST);
    } else if (scope === 'region' && user?.state) {
      query = query.eq('author_state', user.state);
    }

    const { data } = await query;
    if (!data) return [];
    return weightByCounty(data as any[], user?.county, 'author.county') as unknown as Post[];
  };

  const fetchMarketItems = async (): Promise<MarketListing[]> => {
    const { data } = await supabase
      .from('listings')
      .select('id, title, price, media_urls')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(FETCH_LIMIT);
    return data || [];
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  const renderPostCard = (item: Post, type: 'post' | 'trending') => {
    const hasImage = item.media_urls && item.media_urls.length > 0 &&
      !item.media_urls[0].match(/\.(mp4|webm|ogg)$/i);
    const accentColor = type === 'trending' ? 'var(--secondary)' : 'var(--primary)';

    return (
      <div key={`${type}-${item.id}`} className="discover-feed-card glass">
        <div className="dfc-label" style={{ color: accentColor }}>
          {type === 'trending' ? <><Zap size={12} /> Trending</> : <><TrendingUp size={12} /> Hot</>}
        </div>
        {hasImage && (
          <img
            className="dfc-image"
            src={item.media_urls![0]}
            alt=""
            loading="lazy"
          />
        )}
        <div className="dfc-body">
          <div className="dfc-meta">
            {item.author?.avatar_url ? (
              <img src={item.author.avatar_url} alt={item.author.name} className="dfc-avatar" />
            ) : (
              <div className="dfc-avatar-placeholder" style={{ background: accentColor }} />
            )}
            <span className="dfc-author">{item.author?.name || 'Community'}</span>
            {item.author?.county && (
              <span className="dfc-location"><MapPin size={10} /> {item.author.county}</span>
            )}
            <span className="dfc-time">{formatTimeAgo(item.created_at)}</span>
          </div>
          <p className="dfc-content">{item.content}</p>
          <div className="dfc-stats">
            <span><Heart size={13} /> {item.upvote_count || 0}</span>
            <span><MessageSquare size={13} /> {item.comments_count || 0}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderMarketCard = (item: MarketListing) => (
    <div key={`market-${item.id}`} className="discover-feed-card discover-market-card-v glass">
      <div className="dfc-label" style={{ color: '#f97316' }}>
        <Sparkles size={12} /> Hot on Market
      </div>
      {item.media_urls && item.media_urls[0] ? (
        <img className="dfc-image" src={item.media_urls[0]} alt={item.title} loading="lazy" />
      ) : (
        <div className="dfc-market-placeholder" />
      )}
      <div className="dfc-body">
        <div className="dfc-market-info">
          <ShoppingBag size={16} color="#f97316" />
          <div>
            <h4 className="dfc-market-title">{item.title}</h4>
            {item.price != null && (
              <div className="dfc-market-price"><Tag size={12} /> ${item.price.toFixed(2)}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div 
      className="discover-view"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Hero Banner */}
      <div className="premium-card discover-hero" style={{
        background: 'linear-gradient(135deg, var(--primary), var(--discover-secondary, var(--secondary)))',
        color: 'white',
        marginBottom: '24px',
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
        <button
          onClick={() => setIsARModeOpen(true)}
          style={{
            marginTop: '8px',
            background: 'rgba(255, 255, 255, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.4)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '20px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            width: 'fit-content',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.85rem'
          }}
        >
          <Camera size={16} /> Enter AR Discovery
        </button>
      </div>

      {/* Infinite Vertical Feed */}
      <div className="discover-vertical-feed">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="dfc-skeleton glass" style={{ animationDelay: `${i * 0.08}s` }} />
          ))
        ) : feedItems.length === 0 ? (
          <div className="discover-empty">Nothing to discover yet — check back soon!</div>
        ) : (
          feedItems.map(item => {
            if (item._feedType === 'market') {
              return renderMarketCard(item as MarketListing);
            }
            return renderPostCard(item as Post, item._feedType as 'post' | 'trending');
          })
        )}
      </div>

      {isARModeOpen && (
        <ARDiscoveryMode onClose={() => setIsARModeOpen(false)} />
      )}
    </div>
  );
};
