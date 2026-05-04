import React, { useState, useEffect } from 'react';
import { TrendingUp, Flame, MessageSquare, Heart, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { weightByCounty, SETX_COUNTY_LIST } from '../utils/geo';
import { useApp } from '../context/AppContext';
import './TrendingView.css';

interface TrendingPost {
  id: string;
  content: string;
  created_at: string;
  hot_score: number;
  category: string;
  author_name: string;
  author_avatar: string;
  media_urls?: string[];
  upvote_count?: number;
  comments_count?: number;
}

interface TrendingViewProps {
  user?: any;
  scope?: 'national' | 'state' | 'county' | 'city';
}

export const TrendingView: React.FC<TrendingViewProps> = ({ user, scope = 'national' }) => {
  const { theme } = useApp();
  const [posts, setPosts] = useState<TrendingPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTrending();
  }, [scope]);

  const fetchTrending = async () => {
    setIsLoading(true);
    try {
      const isSETX = theme.startsWith('setx-');
      let query = supabase.from('trending_content').select('*').limit(50);

      if (isSETX && (scope === 'county' || scope === 'city')) {
        // SETX 4-county region — use .in() for reliable filtering
        query = query.in('county', SETX_COUNTY_LIST);
      } else if (user && scope !== 'national') {
        if (scope === 'city') query = query.or(`location.eq.${user.community},community.eq.${user.community}`);
        else if (scope === 'county') query = query.eq('county', user.county);
        else if (scope === 'state') query = query.eq('state', user.state);
      }

      const { data, error } = await query;
      if (error) throw error;
      if (data) {
        const weighted = weightByCounty(data, user?.county, 'county');
        setPosts(weighted.slice(0, 20));
      }
    } catch (err) {
      console.error('Error fetching trending:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="discovery-loading">
        <Loader2 className="animate-spin" size={40} color="var(--primary)" />
      </div>
    );
  }

  return (
    <div className="discovery-view-content animate-fade-in">
      <div className="discovery-hero trending-hero">
        <div className="hero-badge">
          <TrendingUp size={14} /> Trending Now
        </div>
        <h1>What's Hot in E City</h1>
        <p>Real-time engagement velocity across the ecosystem.</p>
      </div>

      <div className="trending-grid">
        {posts.map((post, index) => (
          <div key={post.id} className="trending-card premium-card">
            <div className="trending-rank">#{index + 1}</div>
            
            <div className="trending-card-header">
              <img src={post.author_avatar} alt={post.author_name} className="author-avatar" />
              <div className="author-info">
                <span className="author-name">{post.author_name}</span>
                <span className="post-category-tag">{post.category}</span>
              </div>
              <div className="hot-velocity">
                <Flame size={14} color="#f97316" />
                <span>{Math.round(post.hot_score)}</span>
              </div>
            </div>

            <div className="trending-card-body">
              <p>{post.content.length > 150 ? post.content.substring(0, 150) + '...' : post.content}</p>
              {post.media_urls && post.media_urls.length > 0 && (
                <div className="trending-image-preview">
                  <img src={post.media_urls[0]} alt="Post preview" />
                </div>
              )}
            </div>

            <div className="trending-card-footer">
              <div className="stat">
                <Heart size={16} /> <span>{post.upvote_count || 0}</span>
              </div>
              <div className="stat">
                <MessageSquare size={16} /> <span>{post.comments_count || 0}</span>
              </div>
              <button className="trending-action-btn">
                View Story
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
