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
  Play,
  Pin,
  X
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
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [pinnedPost, setPinnedPost] = useState<any>(null);
  const [isFollowingProfile, setIsFollowingProfile] = useState(false);
  const [showFollowersList, setShowFollowersList] = useState(false);
  const [showFollowingList, setShowFollowingList] = useState(false);
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [followWeight, setFollowWeight] = useState(1);
  const [showWeightSelector, setShowWeightSelector] = useState(false);

  const targetId = profileId || user.id;
  const isOwnProfile = !profileId || profileId === user.id;

  const currentRole = profile?.role || user.role;
  const isOfficial = checkOfficial(currentRole);
  const isVendor = checkVendor(currentRole);
  const isProfessional = checkProfessional(currentRole);

  useEffect(() => {
    const fetchProfile = async () => {
      const [profileRes, followersRes, followingRes, followingMeRes, pinnedRes, followersData, followingData] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', targetId).single(),
        supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', targetId),
        supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', targetId),
        user.id !== targetId
          ? supabase.from('follows').select('id').eq('follower_id', user.id).eq('following_id', targetId).maybeSingle()
          : Promise.resolve({ data: null }),
        supabase.from('posts').select(`*, author:profiles!posts_profile_id_fkey(id,name,avatar_url,role,community,is_verified,email)`)
          .eq('profile_id', targetId).eq('is_pinned', true).maybeSingle(),
        supabase.from('follows').select('*, profiles:follower_id(*)').eq('following_id', targetId),
        supabase.from('follows').select('*, profiles:following_id(*)').eq('follower_id', targetId)
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      setFollowerCount(followersRes.count || 0);
      setFollowingCount(followingRes.count || 0);
      setIsFollowingProfile(!!followingMeRes.data);
      if (pinnedRes.data) setPinnedPost(pinnedRes.data);
      if (followersData.data) setFollowers(followersData.data);
      if (followingData.data) setFollowing(followingData.data);
      setLoading(false);

      // Log interaction if viewing someone else's profile
      if (user.id !== targetId) {
        supabase.rpc('log_social_interaction', { 
          actor_id: user.id, 
          target_id: targetId,
          boost_amount: 1 
        }).then(({ error }) => {
          if (error) console.error('Interaction log failed:', error);
        });
      }
    };
    fetchProfile();
  }, [user.id, profileId]);

  const handleFollowToggle = async () => {
    if (!user || isOwnProfile) return;
    
    if (!isFollowingProfile) {
      setShowWeightSelector(true);
    } else {
      setIsFollowingProfile(false);
      setFollowerCount(c => Math.max(0, c - 1));
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', targetId);
    }
  };

  const confirmFollow = async () => {
    setIsFollowingProfile(true);
    setFollowerCount(c => c + 1);
    setShowWeightSelector(false);
    await supabase.from('follows').insert({ 
      follower_id: user.id, 
      following_id: targetId,
      weight: followWeight
    });
  };

  const handlePinPost = async (postId: string, currentlyPinned: boolean) => {
    // Unpin all first, then pin the selected
    await supabase.from('posts').update({ is_pinned: false }).eq('profile_id', user.id);
    if (!currentlyPinned) {
      await supabase.from('posts').update({ is_pinned: true }).eq('id', postId);
      const { data } = await supabase.from('posts').select(`*, author:profiles!posts_profile_id_fkey(id,name,avatar_url,role,community,is_verified,email)`).eq('id', postId).single();
      setPinnedPost(data);
    } else {
      setPinnedPost(null);
    }
  };

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
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button
                className={`edit-profile-btn ${isFollowingProfile ? '' : 'primary'}`}
                onClick={handleFollowToggle}
              >
                {isFollowingProfile ? 'Following ✓' : 'Follow'}
              </button>
              
              {showWeightSelector && (
                <div className="weight-popover glass" style={{ position: 'absolute', top: '100%', right: 0, zIndex: 100, padding: 16, width: 240, marginTop: 10 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: 10 }}>Influence Weight: {followWeight}x</div>
                  <input 
                    type="range" min="1" max="10" step="1" 
                    value={followWeight} 
                    onChange={(e) => setFollowWeight(parseInt(e.target.value))}
                    style={{ width: '100%', marginBottom: 12, accentColor: 'var(--primary)' }}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="edit-profile-btn primary" style={{ flex: 1, padding: '6px' }} onClick={confirmFollow}>Confirm</button>
                    <button className="edit-profile-btn" style={{ flex: 1, padding: '6px' }} onClick={() => setShowWeightSelector(false)}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
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

        {/* Follower / Following Counts */}
        <div style={{ display: 'flex', gap: '24px', marginTop: '12px' }}>
          {(isOwnProfile || profile?.show_followers) && (
            <div style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => setShowFollowersList(true)}>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text)' }}>{followerCount.toLocaleString()}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Followers</div>
            </div>
          )}
          {(isOwnProfile || profile?.show_following) && (
            <div style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => setShowFollowingList(true)}>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text)' }}>{followingCount.toLocaleString()}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Following</div>
            </div>
          )}
        </div>
      </div>

      {/* Follower/Following Modals */}
      {(showFollowersList || showFollowingList) && (
        <div className="modal-overlay" onClick={() => { setShowFollowersList(false); setShowFollowingList(false); }}>
          <div className="admin-card glass" style={{ maxWidth: 400, width: '90%', maxHeight: '70vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <div className="card-header">
              <h3>{showFollowersList ? 'Followers' : 'Following'}</h3>
              <button className="icon-btn" onClick={() => { setShowFollowersList(false); setShowFollowingList(false); }}><X size={18} /></button>
            </div>
            <div style={{ padding: '0 16px 16px', overflowY: 'auto' }}>
              {(showFollowersList ? followers : following).map((f: any) => {
                const fUser = showFollowersList ? f.profiles : f.profiles; // both are named profiles because of join
                return (
                  <div key={f.id} className="follow-list-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div className="user-avatar" style={{ width: 32, height: 32, fontSize: '0.8rem' }}>{fUser?.name?.[0]}</div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{fUser?.name}</div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>Influence Weight: {f.weight || 1}x</div>
                      </div>
                    </div>
                    <button className="icon-btn" style={{ width: 'auto', padding: '0 12px', fontSize: '0.7rem' }} onClick={() => { onNavigateToProfile?.(fUser.id); setShowFollowersList(false); setShowFollowingList(false); }}>View</button>
                  </div>
                );
              })}
              {(showFollowersList ? followers : following).length === 0 && (
                <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No users found.</p>
              )}
            </div>
          </div>
        </div>
      )}

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
          <>
            {/* Pinned Post */}
            {pinnedPost && (
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px 4px', fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>
                  <Pin size={12} /> Pinned Post
                </div>
                <PostCard
                  post={pinnedPost}
                  user={user}
                  onPollVote={() => {}}
                  onDelete={() => {}}
                  onRepost={() => {}}
                  onShare={() => {}}
                  onNavigateToPost={onNavigateToPost}
                  onNavigateToProfile={onNavigateToProfile}
                />
                {isOwnProfile && (
                  <button
                    onClick={() => handlePinPost(pinnedPost.id, true)}
                    title="Unpin post"
                    style={{ position: 'absolute', top: 8, right: 16, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '8px', padding: '4px 10px', fontSize: '0.72rem', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Unpin
                  </button>
                )}
                <div style={{ height: '1px', background: 'var(--border)', margin: '4px 16px 8px' }} />
              </div>
            )}
            <SocialFeed 
              showFilters={false} 
              showFAB={false} 
              user={user} 
              filterUserId={targetId}
              onNavigateToPost={onNavigateToPost}
              onNavigateToProfile={onNavigateToProfile}
            />
          </>
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
