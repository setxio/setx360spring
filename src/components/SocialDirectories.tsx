import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { Search, UserPlus, Users, Unlock, Plus, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { GroupCreationModal } from './GroupCreationModal';
import { getAvatarUrl } from '../lib/utils';
import './SocialDirectories.css';

export const UserDirectory: React.FC<{ 
  scope?: 'national' | 'state' | 'region' | 'county' | 'city';
  onNavigateToProfile?: (id: string) => void;
}> = ({ scope = 'state', onNavigateToProfile }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  
  // New Friend Request States
  const [activeTab, setActiveTab] = useState<'directory' | 'friends' | 'requests'>('directory');
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  const [friendsMap, setFriendsMap] = useState<Record<string, boolean>>({});
  const [sentRequestsMap, setSentRequestsMap] = useState<Record<string, boolean>>({});
  
  const { info } = useToast();

  useEffect(() => {
    fetchInitialData();
  }, [scope, activeTab]);

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
      } else if (scope === 'state' && user.user_metadata?.country) {
        usersQuery = usersQuery.eq('country', user.user_metadata.country);
      }
    }

    const [usersRes, followsRes, requestsRes] = await Promise.all([
      usersQuery,
      user ? supabase.from('follows').select('following_id').eq('follower_id', user.id) : Promise.resolve({ data: [] }),
      user ? supabase.from('friend_requests').select('*, sender:sender_id(*), receiver:receiver_id(*)').or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`) : Promise.resolve({ data: [] })
    ]);

    if (usersRes.data) setUsers(usersRes.data);
    
    if (followsRes.data) {
      const map: Record<string, boolean> = {};
      followsRes.data.forEach(f => map[f.following_id] = true);
      setFollowingMap(map);
    }
    
    if (requestsRes.data) {
      const fMap: Record<string, boolean> = {};
      const sMap: Record<string, boolean> = {};
      
      requestsRes.data.forEach(req => {
        if (req.status === 'accepted') {
          fMap[req.sender_id === user?.id ? req.receiver_id : req.sender_id] = true;
        } else if (req.status === 'pending') {
          if (req.sender_id === user?.id) {
            sMap[req.receiver_id] = true;
          }
        }
      });
      setFriendsMap(fMap);
      setSentRequestsMap(sMap);
      setFriendRequests(requestsRes.data);
    }
    setLoading(false);
  };

  const handleFollow = async (targetId: string) => {
    if (!currentUser) return info('Please sign in to follow users.');
    const isFollowing = followingMap[targetId];
    setFollowingMap(prev => ({ ...prev, [targetId]: !isFollowing }));
    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', currentUser.id).eq('following_id', targetId);
    } else {
      await supabase.from('follows').insert({ follower_id: currentUser.id, following_id: targetId });
    }
  };

  const handleFriendRequest = async (targetId: string, action: 'send' | 'accept' | 'decline' | 'remove') => {
    if (!currentUser) return info('Please sign in first.');
    
    if (action === 'send') {
      setSentRequestsMap(prev => ({ ...prev, [targetId]: true }));
      await supabase.from('friend_requests').insert({ sender_id: currentUser.id, receiver_id: targetId });
      info('Friend request sent!');
    } else if (action === 'accept') {
      // Find the pending request
      const req = friendRequests.find(r => r.sender_id === targetId && r.receiver_id === currentUser.id && r.status === 'pending');
      if (req) {
        setFriendsMap(prev => ({ ...prev, [targetId]: true }));
        await supabase.from('friend_requests').update({ status: 'accepted' }).eq('id', req.id);
        // Automatically follow them back
        if (!followingMap[targetId]) {
          await handleFollow(targetId);
        }
        info('Friend request accepted!');
        fetchInitialData();
      }
    } else if (action === 'decline' || action === 'remove') {
      // For both decline and remove, we just delete the request record to keep it clean
      const req = friendRequests.find(r => 
        (r.sender_id === targetId && r.receiver_id === currentUser.id) || 
        (r.sender_id === currentUser.id && r.receiver_id === targetId)
      );
      if (req) {
        setFriendsMap(prev => ({ ...prev, [targetId]: false }));
        setSentRequestsMap(prev => ({ ...prev, [targetId]: false }));
        await supabase.from('friend_requests').delete().eq('id', req.id);
        info(action === 'decline' ? 'Request declined' : 'Friend removed');
        fetchInitialData();
      }
    }
  };

  const handleUserClick = (targetId: string) => {
    if (currentUser?.id && currentUser.id !== targetId) {
      supabase.rpc('log_social_interaction', { actor_id: currentUser.id, target_id: targetId, boost_amount: 1 });
    }
    onNavigateToProfile?.(targetId);
  };

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayedUsers = activeTab === 'directory' 
    ? filteredUsers
    : activeTab === 'friends' 
      ? filteredUsers.filter(u => friendsMap[u.id])
      : []; // Requests are handled separately below

  const pendingIncomingRequests = friendRequests.filter(r => r.receiver_id === currentUser?.id && r.status === 'pending');

  return (
    <div className="directory-view">
      <div className="search-header glass" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
        <div className="search-input-wrapper" style={{ marginBottom: '12px' }}>
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="directory-search-input"
          />
        </div>
        
        <div className="directory-filters" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {(['directory', 'friends', 'requests'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '6px 16px',
                borderRadius: '20px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: activeTab === tab ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                color: 'white',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {tab === 'directory' && 'Directory'}
              {tab === 'friends' && 'Friends'}
              {tab === 'requests' && <>Requests {pendingIncomingRequests.length > 0 && <span style={{ background: '#ef4444', color: 'white', borderRadius: '10px', padding: '0 6px', fontSize: '0.7rem' }}>{pendingIncomingRequests.length}</span>}</>}
            </button>
          ))}
        </div>
      </div>

      <div className="directory-list">
        {loading ? (
          <div className="loader-container"><Loader2 className="animate-spin" /></div>
        ) : activeTab === 'requests' ? (
          pendingIncomingRequests.length > 0 ? (
            pendingIncomingRequests.map(req => (
              <div key={req.id} className="premium-card user-card" style={{ cursor: 'pointer' }} onClick={() => handleUserClick(req.sender.id)}>
                <img src={getAvatarUrl(req.sender)} alt={req.sender.name} className="user-avatar" />
                <div className="user-info">
                  <h4 className="user-name">{req.sender.name}</h4>
                  <p className="user-handle">Wants to be friends</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <button onClick={(e) => { e.stopPropagation(); handleFriendRequest(req.sender.id, 'accept'); }} style={{ padding: '6px 12px', borderRadius: '8px', background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Accept</button>
                  <button onClick={(e) => { e.stopPropagation(); handleFriendRequest(req.sender.id, 'decline'); }} style={{ padding: '6px 12px', borderRadius: '8px', background: 'var(--bg-soft)', color: 'var(--text)', border: '1px solid var(--border)', cursor: 'pointer', fontWeight: 600 }}>Decline</button>
                </div>
              </div>
            ))
          ) : (
            <div className="no-results premium-card"><p>No pending friend requests</p></div>
          )
        ) : displayedUsers.length > 0 ? (
          displayedUsers.map(user => (
            <div key={user.id} className="premium-card user-card" style={{ cursor: 'pointer' }} onClick={() => handleUserClick(user.id)}>
              <img src={getAvatarUrl(user)} alt={user.name} className="user-avatar" />
              <div className="user-info">
                <h4 className="user-name">{user.name}</h4>
                <p className="user-handle">@{user.role || 'resident'}</p>
                <span className="user-mutuals">{user.community || 'SETX 360'}</span>
              </div>
              {currentUser?.id !== user.id && (
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <button 
                    className={`follow-btn ${followingMap[user.id] ? 'following' : ''}`}
                    onClick={(e) => { e.stopPropagation(); handleFollow(user.id); }}
                    style={followingMap[user.id] ? { background: 'var(--bg-soft)', color: 'var(--text-muted)' } : {}}
                  >
                    {followingMap[user.id] ? 'Following' : 'Follow'}
                  </button>
                  
                  {friendsMap[user.id] ? (
                    <button onClick={(e) => { e.stopPropagation(); handleFriendRequest(user.id, 'remove'); }} style={{ padding: '6px 12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-soft)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                      Friends ✓
                    </button>
                  ) : sentRequestsMap[user.id] ? (
                    <button disabled style={{ padding: '6px 12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-soft)', color: 'var(--text-muted)', cursor: 'not-allowed', fontSize: '0.8rem', fontWeight: 600 }}>
                      Requested
                    </button>
                  ) : (
                    <button onClick={(e) => { e.stopPropagation(); handleFriendRequest(user.id, 'send'); }} style={{ padding: '6px 12px', borderRadius: '12px', border: 'none', background: 'var(--primary)', color: 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                      Add Friend
                    </button>
                  )}
                </div>
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
  scope?: 'national' | 'state' | 'region' | 'county' | 'city';
  onNavigateToGroup: (groupId: string) => void;
}> = ({ scope = 'state', onNavigateToGroup }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [joinedGroupsMap, setJoinedGroupsMap] = useState<Record<string, boolean>>({});
  const { info } = useToast();

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
    if (!user) return info('Please sign in to join groups.');
    
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
