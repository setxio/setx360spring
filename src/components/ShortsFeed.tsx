import React, { useState, useRef, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Music, UserPlus, MoreVertical, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import './ShortsFeed.css';

interface ShortVideo {
  id: string;
  url: string;
  author: string;
  avatar: string;
  description: string;
  likes: string;
  comments: string;
  musicName: string;
}

const SAMPLE_SHORTS: ShortVideo[] = [
  {
    id: '1',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-lighting-in-the-city-at-night-11603-large.mp4',
    author: 'NeonNight',
    avatar: 'https://i.pravatar.cc/150?u=1',
    description: 'City lights and neon vibes #nightlife #aesthetic',
    likes: '124K',
    comments: '1.2K',
    musicName: 'Neon Dreams - Lofi Beats'
  },
  {
    id: '2',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-tree-with-yellow-flowers-1173-large.mp4',
    author: 'NatureLover',
    avatar: 'https://i.pravatar.cc/150?u=2',
    description: 'Spring is finally here! Look at these colors 🌸 #nature #spring',
    likes: '85K',
    comments: '800',
    musicName: 'Morning Birdies - Acoustic'
  },
  {
    id: '3',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-waves-in-the-ocean-at-sunset-1184-large.mp4',
    author: 'OceanBreeze',
    avatar: 'https://i.pravatar.cc/150?u=3',
    description: 'The ocean is my happy place 🌊 #beach #sunset',
    likes: '250K',
    comments: '3.5K',
    musicName: 'Summer Highs - Tropical House'
  }
];

export const ShortsFeed: React.FC<{ user: any; scope: string }> = ({ user, scope = 'city' }) => {
  const { theme } = useApp();
  const isSETX = theme.startsWith('setx-');
  const [activeVideo, setActiveVideo] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [shorts, setShorts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [escalatedScope, setEscalatedScope] = useState<string | null>(null);

  useEffect(() => {
    fetchShorts();
  }, [scope, user]);

  const fetchShorts = async () => {
    setIsLoading(true);
    let selectString = `*, author:profiles!posts_profile_id_fkey(name, avatar_url, is_verified, community, county, state, country, email)`;
    const needsGeoFilter = user && scope !== 'national';
    if (needsGeoFilter) {
      selectString = `*, author:profiles!posts_profile_id_fkey!inner(name, avatar_url, is_verified, community, county, state, country, email)`;
    }

    let query = supabase.from('posts').select(selectString).eq('type', 'short').order('created_at', { ascending: false }).limit(20);

    if (needsGeoFilter) {
      if (scope === 'city') query = query.eq('author.community', user.community);
      else if (scope === 'county') query = query.eq('author.county', user.county);
      else if (scope === 'state') query = query.eq('author.state', user.state);
    }

    const { data, error } = await query;
    let fetchedShorts = data || [];
    let currentEscalation: string | null = null;

    if (needsGeoFilter && fetchedShorts.length < 3 && scope !== 'national') {
      const escalationMap: Record<string, { nextScope: string; filterKey: string; filterValue: string; label: string }> = {
        city: { nextScope: 'county', filterKey: 'author.county', filterValue: user.county, label: `${user.county || 'your'} County` },
        // Hide state/national escalation for SETX project
        ...(!isSETX ? {
          county: { nextScope: 'state', filterKey: 'author.state', filterValue: user.state, label: user.state || 'your state' },
          state: { nextScope: 'national', filterKey: '', filterValue: '', label: 'nationwide' },
        } : {}),
      };
      const esc = escalationMap[scope];
      if (esc && esc.filterValue) {
        let escQuery = supabase.from('posts').select(`*, author:profiles!posts_profile_id_fkey!inner(name, avatar_url, is_verified, community, county, state, country, email)`).eq('type', 'short').order('created_at', { ascending: false }).limit(20);
        if (esc.nextScope !== 'national') escQuery = escQuery.eq(esc.filterKey, esc.filterValue);
        const { data: escData } = await escQuery;
        if (escData && escData.length > 0) {
          const existingIds = new Set(fetchedShorts.map((v: any) => v.id));
          const newShorts = escData.filter((v: any) => !existingIds.has(v.id));
          fetchedShorts = [...fetchedShorts, ...newShorts];
          currentEscalation = esc.label;
        }
      }
    }

    if (!error) {
      const mapped = fetchedShorts.map((post: any) => ({
        id: post.id,
        url: post.media_urls?.[0] || 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-lighting-in-the-city-at-night-11603-large.mp4',
        author: post.author?.name || 'User',
        avatar: post.author?.avatar_url || 'https://i.pravatar.cc/150',
        description: post.content || '',
        likes: `${post.likes_count || 0}`,
        comments: `${post.comments_count || 0}`,
        musicName: 'Original Audio'
      }));
      setShorts(mapped.length > 0 ? mapped : SAMPLE_SHORTS);
      setEscalatedScope(currentEscalation);
    } else {
      setShorts(SAMPLE_SHORTS);
      setEscalatedScope(null);
    }
    setIsLoading(false);
  };

  const handleScroll = () => {
    if (containerRef.current) {
      const scrollPos = containerRef.current.scrollTop;
      const height = containerRef.current.clientHeight;
      const index = Math.round(scrollPos / height);
      if (index !== activeVideo) {
        setActiveVideo(index);
      }
    }
  };

  return (
    <div className="shorts-container" ref={containerRef} onScroll={handleScroll}>
      {escalatedScope && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100,
          padding: '8px 16px',
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '20px',
          color: 'white',
          fontSize: '0.85rem',
          fontWeight: 600,
          whiteSpace: 'nowrap'
        }}>
          Expanded to {escalatedScope}
        </div>
      )}
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%' }}>
          <Loader2 className="animate-spin" size={32} color="#fff" />
        </div>
      ) : (
        shorts.map((video, index) => (
          <ShortVideoItem 
            key={video.id} 
            video={video} 
            isActive={index === activeVideo} 
          />
        ))
      )}
    </div>
  );
};

const ShortVideoItem: React.FC<{ video: ShortVideo; isActive: boolean }> = ({ video, isActive }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [isActive]);

  return (
    <div className="short-item">
      <video 
        ref={videoRef}
        src={video.url}
        className="short-video"
        loop
        muted
        playsInline
        onClick={() => {
          if (videoRef.current?.paused) videoRef.current.play();
          else videoRef.current?.pause();
        }}
      />
      
      <div className="short-overlay">
        <div className="short-actions">
          <div className="action-item">
            <div className="author-avatar-wrap">
              <img src={video.avatar} alt={video.author} className="author-avatar" />
              <button className="follow-btn"><UserPlus size={14} /></button>
            </div>
          </div>
          
          <div className="action-item" onClick={() => setIsLiked(!isLiked)}>
            <Heart size={32} fill={isLiked ? "#ff2d55" : "none"} color={isLiked ? "#ff2d55" : "#fff"} />
            <span>{video.likes}</span>
          </div>
          
          <div className="action-item">
            <MessageCircle size={32} color="#fff" />
            <span>{video.comments}</span>
          </div>
          
          <div className="action-item">
            <Share2 size={32} color="#fff" />
            <span>Share</span>
          </div>

          <div className="action-item">
            <MoreVertical size={28} color="#fff" />
          </div>
          
          <div className="action-item music-disc-wrap">
            <div className="music-disc">
              <Music size={18} color="#fff" />
            </div>
          </div>
        </div>
        
        <div className="short-info">
          <h4 className="author-name">@{video.author}</h4>
          <p className="video-desc">{video.description}</p>
          <div className="music-info">
            <Music size={14} />
            <div className="marquee">
              <span>{video.musicName}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
