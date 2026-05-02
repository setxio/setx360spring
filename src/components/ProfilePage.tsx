import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getGradientAvatar } from '../utils/avatar';
import { 
  MapPin, 
  Settings as SettingsIcon, 
  Calendar, 
  Image as ImageIcon,
  Camera,
  Grid,
  Heart,
  ShieldCheck,
  Briefcase,
  ShoppingBag,
  Globe,
  Building2
} from 'lucide-react';
import { SocialFeed } from './SocialFeed';
import { useApp } from '../context/AppContext';
import './ProfilePage.css';

import { isProfessional as checkProfessional, isVendor as checkVendor, isOfficial as checkOfficial } from '../utils/roles';

interface ProfilePageProps {
  user: any;
  profileId?: string;
  onNavigate: (tab: number) => void;
  onNavigateToPost?: (postId: string, commentId?: string) => void;
  onNavigateToProfile?: (profileId: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ 
  user, 
  profileId, 
  onNavigate, 
  onNavigateToPost,
  onNavigateToProfile
}) => {
  const { startDirectMessage } = useApp();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('Posts');

  const currentRole = profile?.role || user.role;
  const isOfficial = checkOfficial(currentRole);
  const isVendor = checkVendor(currentRole);
  const isProfessional = checkProfessional(currentRole);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId || user.id)
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
    
    // Upload to bucket
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      console.error(uploadError);
      alert('Error uploading image');
      setUploading(false);
      return;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    // Update profile
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
        </div>

        <div className="profile-actions">
          {(!profileId || profileId === user.id) ? (
            <>
              <button className="settings-circle-btn" onClick={() => onNavigate(10)}><SettingsIcon size={20} /></button>
              <button className="edit-profile-btn" onClick={() => onNavigate(10)}>Edit Profile</button>
            </>
          ) : (
            <>
              <button className="edit-profile-btn primary" onClick={() => startDirectMessage(profile.id, profile.name, profile.avatar_url)}>Message</button>
              <button className="edit-profile-btn" style={{ marginLeft: '8px' }}>Follow</button>
            </>
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
            <span>{profile?.community || user.location || 'E City Local'}</span>
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

        <p className="profile-bio">{profile?.bio || (isVendor ? "Welcome to our store! We're proud to serve the community." : "Welcome to my E City profile! Proud member of the community.")}</p>
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        <button className={`tab-item ${activeTab === 'Posts' ? 'active' : ''}`} onClick={() => setActiveTab('Posts')}><Grid size={18} /> Posts</button>
        <button className={`tab-item ${activeTab === 'Likes' ? 'active' : ''}`} onClick={() => setActiveTab('Likes')}><Heart size={18} /> Likes</button>
        <button className={`tab-item ${activeTab === 'Media' ? 'active' : ''}`} onClick={() => setActiveTab('Media')}><ImageIcon size={18} /> Media</button>
      </div>

      {/* Content Placeholder */}
      <div className="profile-content-scroll">
        {activeTab === 'Posts' && (
          <SocialFeed 
            showFilters={false} 
            showFAB={false} 
            user={user} 
            filterUserId={profileId || user.id} 
            onNavigateToPost={onNavigateToPost}
            onNavigateToProfile={onNavigateToProfile}
          />
        )}
        
        {activeTab !== 'Posts' && (
          <div className="empty-state">
            <p>No content available for {activeTab} yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};
