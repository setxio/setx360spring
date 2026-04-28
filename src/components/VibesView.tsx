import React, { useState, useEffect } from 'react';
import { User, Sparkles, Heart, Compass, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './VibesView.css';

interface Post {
  id: string;
  content: string;
  category: string;
  created_at: string;
  profiles: {
    name: string;
    avatar_url: string;
  } | null;
}

export const VibesView: React.FC<{ user: any }> = ({ user }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [topCategories, setTopCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchVibes();
    }
  }, [user]);

  const fetchVibes = async () => {
    setIsLoading(true);
    
    // 1. Get user's top categories from user_vibe_scores
    const { data: scores } = await supabase
      .from('user_vibe_scores')
      .select('category')
      .eq('profile_id', user.id)
      .order('score', { ascending: false })
      .limit(3);

    const categories = scores?.map(s => s.category) || [];
    setTopCategories(categories);

    // 2. Fetch posts matching these categories (or general if none)
    const query = supabase
      .from('posts')
      .select(`
        *,
        profiles (
          name,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    if (categories.length > 0) {
      query.in('category', categories);
    }

    const { data: postData, error } = await query;

    if (!error && postData) {
      setPosts(postData as any);
    }
    setIsLoading(false);
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
      <div className="discovery-hero vibes-hero">
        <div className="hero-badge">
          <User size={14} fill="currentColor" /> Personalized for You
        </div>
        <h1>Your Vibe</h1>
        <p>Content curated based on your interactions and interests.</p>
        
        {topCategories.length > 0 && (
          <div className="vibe-tags">
            {topCategories.map(cat => (
              <span key={cat} className="vibe-tag">#{cat}</span>
            ))}
          </div>
        )}
      </div>

      <div className="vibes-feed">
        {posts.length === 0 ? (
          <div className="empty-state premium-card">
            <Compass size={48} className="empty-icon" />
            <h3>Your Vibe is Fresh</h3>
            <p>Start upvoting posts to help us understand what you like!</p>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="vibe-card premium-card">
              <div className="vibe-card-header">
                <img src={post.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${post.profiles?.name || 'User'}`} alt="Avatar" />
                <div className="vibe-meta">
                  <span className="vibe-user">{post.profiles?.name}</span>
                  <span className="vibe-cat-tag">{post.category}</span>
                </div>
                <div className="vibe-sparkle">
                  <Sparkles size={16} color="var(--primary)" />
                </div>
              </div>
              
              <div className="vibe-body">
                <p>{post.content}</p>
              </div>

              <div className="vibe-footer">
                <button className="vibe-like-btn">
                  <Heart size={18} />
                </button>
                <div className="vibe-match-badge">99% Match</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
