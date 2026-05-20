import type { User } from '../types/user';
import { useToast } from '../context/ToastContext';
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, Shield, Share2, Plus, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { SocialFeed } from './SocialFeed';
import { CreatePostModal } from './CreatePostModal';
import './GroupDetailView.css';

interface GroupDetailViewProps {
  groupId: string;
  user: User;
  onBack: () => void;
  onNavigateToPost: (postId: string, commentId?: string) => void;
  onNavigateToProfile: (profileId: string) => void;
}

export const GroupDetailView: React.FC<GroupDetailViewProps> = ({ 
  groupId, 
  user, 
  onBack,
  onNavigateToPost,
  onNavigateToProfile
}) => {
  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const { success, info } = useToast();

  useEffect(() => {
    fetchGroupData();
  }, [groupId]);

  const fetchGroupData = async () => {
    setLoading(true);
    
    // Fetch group info
    const { data: groupData, error } = await supabase
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single();

    if (error) {
      console.error('Error fetching group:', error);
      onBack();
      return;
    }

    setGroup(groupData);

    // Check membership
    if (user) {
      const { data: memberData } = await supabase
        .from('group_members')
        .select('role')
        .eq('group_id', groupId)
        .eq('profile_id', user.id)
        .single();

      setIsMember(!!memberData);
      setIsAdmin(memberData?.role === 'admin');
    }

    setLoading(false);
  };

  const handleJoin = async () => {
    if (!user) return info('Please sign in to join groups.');

    if (isMember) {
      if (!window.confirm('Are you sure you want to leave this group?')) return;
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('profile_id', user.id);
      
      if (!error) setIsMember(false);
    } else {
      const { error } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          profile_id: user.id,
          role: 'member'
        });
      
      if (!error) setIsMember(true);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/group/${groupId}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: group.name,
          text: group.description,
          url
        });
      } catch (err) {}
    } else {
      navigator.clipboard.writeText(url);
      success('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="view-loading">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="group-detail-view">
      <div className="view-header glass">
        <button onClick={onBack} className="back-btn">
          <ArrowLeft size={24} />
        </button>
        <h2>{group.name}</h2>
        <button onClick={handleShare} className="share-btn">
          <Share2 size={20} />
        </button>
      </div>

      <div className="group-hero">
        <div 
          className="group-banner-large" 
          style={{ backgroundImage: `url(${group.banner_url || 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&h=400&fit=crop'})` }}
        />
        <div className="group-info-card glass">
          <div className="group-avatar-large" style={{ backgroundImage: `url(${group.avatar_url})` }} />
          <div className="group-text-info">
            <div className="group-title-row">
              <h1>{group.name}</h1>
              <span className="category-tag">{group.category}</span>
            </div>
            <p className="group-description">{group.description}</p>
            <div className="group-stats">
              <span className="stat-item"><Users size={16} /> Community Group</span>
              {isAdmin && <span className="stat-item admin-tag"><Shield size={16} /> Administrator</span>}
            </div>
          </div>
          <button 
            className={`action-join-btn ${isMember ? 'joined' : ''}`}
            onClick={handleJoin}
          >
            {isMember ? 'Leave Group' : 'Join Group'}
          </button>
        </div>
      </div>

      {group.rules && (
        <div className="group-rules-card glass">
          <h3>Group Rules</h3>
          <p>{group.rules}</p>
        </div>
      )}

      <div className="group-feed-container">
        <div className="feed-header">
          <h3>Group Conversation</h3>
          {isMember && (
            <button className="post-to-group-btn" onClick={() => setIsPosting(true)}>
              <Plus size={18} /> New Post
            </button>
          )}
        </div>

        <SocialFeed 
          user={user}
          filterGroupId={groupId}
          showFilters={false}
          showFAB={false}
          onNavigateToPost={onNavigateToPost}
          onNavigateToProfile={onNavigateToProfile}
        />
      </div>

      {isPosting && (
        <CreatePostModal 
          user={user}
          groupId={groupId}
          onClose={() => {
            setIsPosting(false);
          }}
        />
      )}
    </div>
  );
};
