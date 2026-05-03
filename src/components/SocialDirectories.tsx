import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Users, Unlock, Plus, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { GroupCreationModal } from './GroupCreationModal';
import { getAvatarUrl } from '../lib/utils';
import './SocialDirectories.css';

export const UserDirectory: React.FC<{ scope?: 'national' | 'state' | 'county' | 'city' }> = ({ scope = 'national' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchInitialData();
  }, [scope]);

  const fetchInitialData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);

    let usersQuery = supabase.from('profiles').select('*').order('name');
    
    if (user) {
      if (scope === 'city' && user.user_metadata?.community) {
        usersQuery = usersQuery.eq('community', user.user_metadata.community);
      } else if (scope === 'county' && user.user_metadata?.county) {
        usersQuery = usersQuery.eq('county', user.user_metadata.county);
      } else if (scope === 'state' && user.user_metadata?.state) {
        usersQuery = usersQuery.eq('state', user.user_metadata.state);
      } else if (scope === 'national' && user.user_metadata?.country) {
        usersQuery = usersQuery.eq('country', user.user_metadata.country);
      }
    }

    const [usersRes, followsRes] = await Promise.all([
      usersQuery,
      user ? supabase.from('follows').select('following_id').eq('follower_id', user.id) : Promise.resolve({ data: [] })
    ]);

    if (usersRes.data) setUsers(usersRes.data);
    
    if (followsRes.data) {
      const map: Record<string, boolean> = {};
      followsRes.data.forEach(f => map[f.following_id] = true);
      setFollowingMap(map);
    }
    setLoading(false);
  };

  const handleFollow = async (targetId: string) => {
    if (!currentUser) return alert('Please sign in to follow users.');
    
    const isFollowing = followingMap[targetId];
    
    // Optimistic UI
    setFollowingMap(prev => ({ ...prev, [targetId]: !isFollowing }));

    if (isFollowing) {
      const { error } = await supabase.from('follows')
        .delete()
        .eq('follower_id', currentUser.id)
        .eq('following_id', targetId);
      if (error) {
        console.error(error);
        setFollowingMap(prev => ({ ...prev, [targetId]: true })); // Revert
      }
    } else {
      const { error } = await supabase.from('follows')
        .insert({ follower_id: currentUser.id, following_id: targetId });
      if (error) {
        console.error(error);
        setFollowingMap(prev => ({ ...prev, [targetId]: false })); // Revert
      }
    }
  };

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Suggested: non-followed users from same community (max 6)
  const suggestedUsers = !searchTerm
    ? users.filter(u => u.id !== currentUser?.id && !followingMap[u.id]).slice(0, 6)
    : [];

  return (
    <div className="directory-view">
      <div className="search-header glass">
        <div className="search-input-wrapper">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="directory-search-input"
          />
        </div>
      </div>

      {/* Suggested Users Strip */}
      {suggestedUsers.length > 0 && (
        <div style={{ padding: '12px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              👥 People in Your Area
            </span>
          </div>
          <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '8px' }}>
            {suggestedUsers.map(u => (
              <div key={u.id} style={{ flexShrink: 0, width: 100, textAlign: 'center', background: 'var(--bg-soft)', borderRadius: '16px', padding: '12px 8px', border: '1px solid var(--border)' }}>
                <img src={getAvatarUrl(u)} alt={u.name} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', marginBottom: '6px' }} />
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '8px' }}>{u.community || 'Local'}</div>
                <button
                  onClick={() => handleFollow(u.id)}
                  style={{ fontSize: '0.72rem', fontWeight: 700, padding: '4px 12px', borderRadius: '12px', border: 'none', background: 'var(--primary)', color: '#fff', cursor: 'pointer' }}
                >
                  + Follow
                </button>
              </div>
            ))}
          </div>
          <div style={{ height: '1px', background: 'var(--border)', margin: '8px 0' }} />
        </div>
      )}

      <div className="directory-list">
        {loading ? (
          <div className="loader-container"><Loader2 className="animate-spin" /></div>
        ) : filteredUsers.length > 0 ? (
          filteredUsers.map(user => (
            <div key={user.id} className="premium-card user-card">
              <img src={getAvatarUrl(user)} alt={user.name} className="user-avatar" />
              <div className="user-info">
                <h4 className="user-name">{user.name}</h4>
                <p className="user-handle">@{user.role || 'resident'}</p>
                <span className="user-mutuals">{user.community || 'SETX 360'}</span>
              </div>
              {currentUser?.id !== user.id && (
                <button 
                  className={`follow-btn ${followingMap[user.id] ? 'following' : ''}`}
                  onClick={() => handleFollow(user.id)}
                  style={followingMap[user.id] ? { background: 'var(--bg-soft)', color: 'var(--text-muted)' } : {}}
                >
                  {followingMap[user.id] ? 'Following' : <><UserPlus size={16} /> Follow</>}
                </button>
              )}
            </div>
          ))
        ) : (
          <div className="no-results premium-card">
            <p>No users found matching "{searchTerm}"</p>
          </div>
        )}
      </div>
    </div>
  );
}

export const GroupDirectory: React.FC<{ 
  scope?: 'national' | 'state' | 'county' | 'city';
  onNavigateToGroup: (groupId: string) => void;
}> = ({ scope = 'national', onNavigateToGroup }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [joinedGroupsMap, setJoinedGroupsMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchInitialData();
  }, [scope]);

  const fetchInitialData = async () => {
    setLoading(true);
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    setUser(currentUser);

    let groupsQuery = supabase.from('groups').select('*').order('created_at', { ascending: false });
    
    // Note: 'groups' currently don't have community/county filters in schema, 
    // but we can filter by the creator's location if we join profiles.
    // For now, we'll keep groups broad or filter by a hypothetical 'location' field if it existed.
    // Given the task, let's join profiles to filter groups by their creator's community/county.
    
    const [groupsRes, membersRes] = await Promise.all([
      groupsQuery,
      currentUser ? supabase.from('group_members').select('group_id').eq('profile_id', currentUser.id) : Promise.resolve({ data: [] })
    ]);

    if (groupsRes.data) setGroups(groupsRes.data);
    
    if (membersRes.data) {
      const map: Record<string, boolean> = {};
      membersRes.data.forEach(m => map[m.group_id] = true);
      setJoinedGroupsMap(map);
    }
    setLoading(false);
  };

  const handleJoinGroup = async (groupId: string) => {
    if (!user) return alert('Please sign in to join groups.');
    
    const hasJoined = joinedGroupsMap[groupId];
    
    // Optimistic UI
    setJoinedGroupsMap(prev => ({ ...prev, [groupId]: !hasJoined }));

    if (hasJoined) {
      const { error } = await supabase.from('group_members')
        .delete()
        .eq('profile_id', user.id)
        .eq('group_id', groupId);
      if (error) {
        console.error(error);
        setJoinedGroupsMap(prev => ({ ...prev, [groupId]: true })); // Revert
      }
    } else {
      const { error } = await supabase.from('group_members')
        .insert({ profile_id: user.id, group_id: groupId, role: 'member' });
      if (error) {
        console.error(error);
        setJoinedGroupsMap(prev => ({ ...prev, [groupId]: false })); // Revert
      }
    }
  };

  const categories = ['All', 'Faith', 'Recipes', 'Events', 'Hobbies', 'General', 'Community', 'Business', 'Sports'];
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredGroups = groups.filter(group => {
    const matchesSearch = group.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'All' || group.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="directory-view">
      <div className="search-header glass" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: '12px' }}>
          <div className="search-input-wrapper" style={{ flex: 1, marginRight: '16px' }}>
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Search groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="directory-search-input"
            />
          </div>
          <button className="create-group-btn" onClick={() => setIsCreating(true)} style={{ whiteSpace: 'nowrap' }}>
            <Plus size={20} /> Create Group
          </button>
        </div>
        
        {/* Category Filters */}
        <div className="directory-filters" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {categories.map(cat => (
            <button
              key={cat}
              className={`filter-chip ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '6px 16px',
                borderRadius: '20px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: activeCategory === cat ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                color: 'white',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="directory-list group-grid">
        {loading ? (
          <div className="loader-container" style={{ gridColumn: '1 / -1' }}>
            <Loader2 className="animate-spin" />
          </div>
        ) : filteredGroups.length > 0 ? (
          filteredGroups.map(group => (
            <div 
              key={group.id} 
              className="premium-card group-card"
              onClick={() => onNavigateToGroup(group.id)}
              style={{ cursor: 'pointer' }}
            >
              <div 
                className="group-banner" 
                style={{ backgroundImage: `url(${group.banner_url || 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=200&fit=crop'})` }}
              >
                <div className="group-type-badge">
                  <Unlock size={12} /> {group.category || 'Community'}
                </div>
              </div>
              <div className="group-content">
                <h4 className="group-name">{group.name}</h4>
                <div className="group-meta">
                  <Users size={14} /> <span>{group.member_count || 0} members · {joinedGroupsMap[group.id] ? 'Member ✓' : 'Join today!'}</span>
                </div>
                <button 
                  className={`join-btn ${joinedGroupsMap[group.id] ? 'joined' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleJoinGroup(group.id);
                  }}
                  style={joinedGroupsMap[group.id] ? { background: 'var(--bg-soft)', color: 'var(--text-muted)' } : {}}
                >
                  {joinedGroupsMap[group.id] ? 'Leave Group' : 'Join Group'}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="no-results premium-card" style={{ gridColumn: '1 / -1' }}>
            <p>No groups found matching "{searchTerm}"</p>
          </div>
        )}
      </div>

      {isCreating && (
        <GroupCreationModal 
          user={user} 
          onClose={() => {
            setIsCreating(false);
            fetchInitialData();
          }} 
        />
      )}
    </div>
  );
}
