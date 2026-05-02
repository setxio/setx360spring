import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getGradientAvatar } from '../utils/avatar';
import { 
  MapPin, 
  Calendar, 
  Image as ImageIcon,
  Camera,
  Grid,
  Heart,
  ShieldCheck,
  Briefcase,
  ShoppingBag,
  Globe,
  Building2,
  Loader2,
  Play
} from 'lucide-react';
import { SocialFeed } from './SocialFeed';
import { PostCard } from './PostCard';
import './ProfilePage.css';

import { isProfessional as checkProfessional, isVendor as checkVendor, isOfficial as checkOfficial } from '../utils/roles';

interface ProfilePageProps {
  user: any;
  profileId?: string;
  onNavigate: (tab: number) => void;
  onNavigateToPost?: (postId: string, commentId?: string) => void;
  onNavigateToProfile?: (profileId: string) => void;
}

// ─── Likes Tab ────────────────────────────────────────────────────────────────
const LikesTab: React.FC<{ userId: string; onNavigateToPost?: (id: string) => void; onNavigateToProfile?: (id: string) => void }> = ({
  userId, onNavigateToPost, onNavigateToProfile
}) => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLikedPosts = async () => {
      setLoading(true);
      // Fetch post IDs the user has upvoted
      const { data: votes } = await supabase
        .from('post_votes')
        .select('post_id')
        .eq('user_id', userId)
        .eq('vote_type', 1)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!votes || votes.length === 0) { setLoading(false); return; }

      const postIds = votes.map(v => v.post_id);

      const { data: likedPosts } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles!posts_profile_id_fkey(id, name, avatar_url, role, community, is_verified, email),
          comments(id)
        `)
        .in('id', postIds)
        .neq('moderation_status', 'hidden');

      // Preserve the vote-order (most recently liked first)
      if (likedPosts) {
        const ordered = postIds
          .map(id => likedPosts.find((p: any) => p.id === id))
          .filter(Boolean);
        setPosts(ordered as any[]);
      }
      setLoading(false);
    };
    fetchLikedPosts();
  }, [userId]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
      <Loader2 className="animate-spin" size={32} color="var(--primary)" />
    </div>
  );

  if (posts.length === 0) return (
    <div className="empty-state" style={{ textAlign: 'center', padding: '48px 24px' }}>
      <Heart size={40} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
      <p style={{ color: 'var(--text-muted)' }}>No liked posts yet.</p>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Posts you upvote will appear here.</p>
    </div>
  );

  return (
    <div style={{ padding: '8px 0' }}>
      {posts.map(post => (
        <PostCard
          key={post.id}
          post={post}
          userVote={1}
          onPollVote={() => {}}
          onDelete={() => {}}
          onRepost={() => {}}
          onShare={() => {}}
          onNavigateToPost={onNavigateToPost}
          onNavigateToProfile={onNavigateToProfile}
        />
      ))}
    </div>
  );
};

// ─── Media Tab ────────────────────────────────────────────────────────────────
const MediaTab: React.FC<{ userId: string; onNavigateToPost?: (id: string) => void }> = ({
  userId, onNavigateToPost
}) => {
  const [mediaItems, setMediaItems] = useState<{ postId: string; url: string; isVideo: boolean }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMedia = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('posts')
        .select('id, media_urls')
        .eq('profile_id', userId)
        .not('media_urls', 'is', null)
        .neq('moderation_status', 'hidden')
        .order('created_at', { ascending: false })
        .limit(100);

      if (data) {
        const items: { postId: string; url: string; isVideo: boolean }[] = [];
        data.forEach((post: any) => {
          if (Array.isArray(post.media_urls)) {
            post.media_urls.forEach((url: string) => {
              items.push({
                postId: post.id,
                url,
                isVideo: /\.(mp4|webm|ogg)$/i.test(url),
              });
            });
          }
        });
        setMediaItems(items);
      }
      setLoading(false);
    };
    fetchMedia();
  }, [userId]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
      <Loader2 className="animate-spin" size={32} color="var(--primary)" />
    </div>
  );

  if (mediaItems.length === 0) return (
    <div className="empty-state" style={{ textAlign: 'center', padding: '48px 24px' }}>
      <ImageIcon size={40} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
      <p style={{ color: 'var(--text-muted)' }}>No photos or videos yet.</p>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Media from your posts will appear here.</p>
    </div>
  );

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '2px',
        padding: '2px',
      }}
    >
      {mediaItems.map((item, idx) => (
        <div
          key={idx}
          onClick={() => onNavigateToPost?.(item.postId)}
          style={{
            position: 'relative',
            aspectRatio: '1',
            overflow: 'hidden',
            background: 'rgba(255,255,255,0.05)',
            cursor: 'pointer',
          }}
        >
          {item.isVideo ? (
            <>
              <video
                src={item.url}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                muted
                playsInline
                preload="metadata"
              />
              <div
                style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(0,0,0,0.3)',
                }}
              >
                <Play size={24} color="white" fill="white" />
              </div>
            </>
          ) : (
            <img
              src={item.url}
              alt={`Media ${idx + 1}`}
              loading="lazy"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          )}
          {/* Hover overlay */}
          <div
            style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0)',
              transition: 'background 0.2s ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.2)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0)')}
          />
        </div>
      ))}
    </div>
  );
};

// ─── Main ProfilePage ─────────────────────────────────────────────────────────
export const ProfilePage: React.FC<ProfilePageProps> = ({ 
  user, 
  profileId, 
  onNavigate, 
  onNavigateToPost,
  onNavigateToProfile
}) => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('Posts');

  const targetId = profileId || user.id;
  const isOwnProfile = !profileId || profileId === user.id;

  const currentRole = profile?.role || user.role;
  const isOfficial = checkOfficial(currentRole);
  const isVendor = checkVendor(currentRole);
  const isProfessional = checkProfessional(currentRole);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetId)
        .single();
      
      if (data) setProfile(data);
      setLoading(false);
    };

    fetchProfile();
  }, [user.id, profileId]);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>, bucket: 'avatars' | 'banners') => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      console.error(uploadError);
      alert('Error uploading image');
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    const updateColumn = bucket === 'avatars' ? 'avatar_url' : 'banner_url';
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ [updateColumn]: publicUrl })
      .eq('id', user.id);

    if (!updateError) {
      setProfile({ ...profile, [updateColumn]: publicUrl });
    }
    setUploading(false);
  };

  if (loading) {
    return <div className="profile-loading">Loading Profile...</div>;
  }

  const avatarBg = profile?.avatar_url ? `url(${profile.avatar_url})` : getGradientAvatar(user.name);
  const bannerBg = profile?.banner_url ? `url(${profile.banner_url})` : 'linear-gradient(to right, #1e293b, #334155)';

  return (
    <div className="profile-page">
      {/* Banner Section */}
      <div className="profile-banner-container" style={{ background: bannerBg, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        {isOwnProfile && (
          <>
            <input 
              type="file" 
              id="banner-upload" 
              accept="image/*" 
              style={{ display: 'none' }} 
              onChange={(e) => handleUpload(e, 'banners')} 
              disabled={uploading}
            />
            <label htmlFor="banner-upload" className="edit-banner-btn" style={{ cursor: uploading ? 'default' : 'pointer' }}>
              <Camera size={16} /> {uploading ? 'Uploading...' : 'Edit Banner'}
            </label>
          </>
        )}
      </div>

      {/* Profile Header */}
      <div className="profile-header-main">
        <div className="avatar-overlap">
          <div 
            className="profile-avatar-large" 
            style={{ 
              background: profile?.avatar_url ? 'none' : avatarBg, 
              backgroundImage: profile?.avatar_url ? `url(${profile.avatar_url})` : 'none',
              backgroundSize: 'cover'
            }}
          >
            {!profile?.avatar_url && user.name.charAt(0)}
          </div>
          {isOwnProfile && (
            <>
              <input 
                type="file" 
                id="avatar-upload" 
                accept="image/*" 
                style={{ display: 'none' }} 
                onChange={(e) => handleUpload(e, 'avatars')}
                disabled={uploading}
              />
              <label htmlFor="avatar-upload" className="edit-avatar-badge" style={{ cursor: uploading ? 'default' : 'pointer' }}>
                <Camera size={18} />
              </label>
            </>
          )}
        </div>

        <div className="profile-actions">
          {isOwnProfile ? (
            <button className="edit-profile-btn" onClick={() => onNavigate(10)}>Edit Profile</button>
          ) : (
            <button className="edit-profile-btn primary">Follow</button>
          )}
        </div>
      </div>

      <div className="profile-info-section">
        <div className="name-and-badge">
          <h1 className="profile-name">{profile?.company || profile?.name || user.name}</h1>
          {profile?.is_verified && <ShieldCheck className="verified-tick" size={20} />}
          <span className={`role-badge-tag ${profile?.role || user.role}`}>
            {(profile?.role || user.role).replace(/_/g, ' ').toUpperCase()}
          </span>
        </div>
        
        <p className="profile-handle">@{profile?.handle || (profile?.company || profile?.name || user.name).toLowerCase().replace(/\s/g, '')}</p>
        
        <div className="profile-meta-grid">
          <div className="meta-item">
            <MapPin size={16} />
            <span>{profile?.community || user.location || 'Southeast Texas'}</span>
          </div>
          
          {isOfficial && profile?.department && (
            <div className="meta-item official-meta">
              <Building2 size={16} />
              <span>{profile.department} • {profile.position}</span>
            </div>
          )}

          {isVendor && profile?.business_category && (
            <div className="meta-item vendor-meta">
              <ShoppingBag size={16} />
              <span>{profile.business_category}</span>
            </div>
          )}

          {!isOfficial && !isVendor && profile?.occupation && (
            <div className="meta-item">
              <Briefcase size={16} />
              <span>{profile.occupation}</span>
            </div>
          )}

          <div className="meta-item">
            <Calendar size={16} />
            <span>Joined {new Date(profile?.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
          </div>

          {profile?.website && (
            <div className="meta-item">
              <Globe size={16} />
              <a href={profile.website} target="_blank" rel="noopener noreferrer">{profile.website.replace(/^https?:\/\//, '')}</a>
            </div>
          )}
        </div>

        {/* Role-Specific Detail Card */}
        {(isOfficial || isProfessional) && (
          <div className="profile-special-details glass">
            {isOfficial && profile?.jurisdiction && (
              <div className="special-detail-row">
                <strong>Jurisdiction:</strong> <span>{profile.jurisdiction}</span>
              </div>
            )}
            {!isVendor && !isOfficial && profile?.credentials && (
              <div className="special-detail-row">
                <strong>Credentials:</strong> <p>{profile.credentials}</p>
              </div>
            )}
            {isVendor && profile?.return_policy && (
              <div className="special-detail-row">
                <strong>Policy:</strong> <p>{profile.return_policy}</p>
              </div>
            )}
          </div>
        )}

        <p className="profile-bio">{profile?.bio || (isVendor ? "Welcome to our store! We're proud to serve the community." : "Proud member of the SETX 360 community.")}</p>
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        <button className={`tab-item ${activeTab === 'Posts' ? 'active' : ''}`} onClick={() => setActiveTab('Posts')}>
          <Grid size={18} /> Posts
        </button>
        <button className={`tab-item ${activeTab === 'Likes' ? 'active' : ''}`} onClick={() => setActiveTab('Likes')}>
          <Heart size={18} /> Likes
        </button>
        <button className={`tab-item ${activeTab === 'Media' ? 'active' : ''}`} onClick={() => setActiveTab('Media')}>
          <ImageIcon size={18} /> Media
        </button>
      </div>

      {/* Tab Content */}
      <div className="profile-content-scroll">
        {activeTab === 'Posts' && (
          <SocialFeed 
            showFilters={false} 
            showFAB={false} 
            user={user} 
            filterUserId={targetId}
            onNavigateToPost={onNavigateToPost}
            onNavigateToProfile={onNavigateToProfile}
          />
        )}

        {activeTab === 'Likes' && (
          <LikesTab
            userId={targetId}
            onNavigateToPost={onNavigateToPost}
            onNavigateToProfile={onNavigateToProfile}
          />
        )}

        {activeTab === 'Media' && (
          <MediaTab
            userId={targetId}
            onNavigateToPost={onNavigateToPost}
          />
        )}
      </div>
    </div>
  );
};
