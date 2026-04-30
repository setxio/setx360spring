import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Loader2, Megaphone, MapPin, TrendingUp, Rss } from 'lucide-react';
import { FeedFilters } from './FeedFilters';
import { CreatePostModal } from './CreatePostModal';
import { AdCreationModal } from './AdCreationModal';
import { PostCard } from './PostCard';
import { AdCard } from './AdCard';
import { EmptyState } from './EmptyState';
import { supabase } from '../lib/supabase';
import './SocialFeed.css';

interface SocialFeedProps {
  showFilters?: boolean;
  showFAB?: boolean;
  user?: any;
  filterUserId?: string;
  scope?: 'national' | 'state' | 'county' | 'city';
  onNavigateToPost?: (postId: string, commentId?: string) => void;
}

export const SocialFeed: React.FC<SocialFeedProps> = ({ 
  showFilters = true, 
  showFAB = true, 
  user, 
  filterUserId, 
  scope = 'national',
  onNavigateToPost
}) => {
  const { theme } = useApp();
  const [activeCategory, setActiveCategory] = useState('Hot');
  const [activeType, setActiveType] = useState('all');
  const [isPosting, setIsPosting] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [trendingTopics, setTrendingTopics] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userVotes, setUserVotes] = useState<Record<string, number>>({});
  const [userPollVotes, setUserPollVotes] = useState<Record<string, number>>({});
  const [userBookmarks, setUserBookmarks] = useState<Set<string>>(new Set());
  const [escalatedScope, setEscalatedScope] = useState<string | null>(null);
  const [hasActiveAlert, setHasActiveAlert] = useState(false);

  // Check if user is allowed to post ads
  const canPromote = user && ['admin', 'business', 'v_business', 'venue', 'v_venue', 'non_profit', 'v_non_profit'].includes(user.role);

  useEffect(() => {
    fetchContent();
  }, [activeCategory, activeType, scope]);

  const calculateAge = (m: number, d: number, y: number) => {
    if (!m || !d || !y) return 0;
    const today = new Date();
    const birthDate = new Date(y, m - 1, d);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const fetchContent = async () => {
    setIsLoading(true);
    
    let selectString = `
      *,
      ai_confidence,
      author:profiles!posts_profile_id_fkey (
        id,
        name,
        avatar_url,
        role,
        community,
        county,
        state,
        country,
        is_public,
        is_verified,
        birth_year
      ),
      original_post:original_post_id (
        *,
        ai_confidence,
        author:profiles!posts_profile_id_fkey (
          id,
          name,
          avatar_url,
          role,
          community,
          county,
          state,
          country,
          is_public,
          is_verified,
          birth_year
        ),
        comments:comments (
          id,
          content,
          created_at,
          profiles:profile_id (
            id,
            name,
            avatar_url
          )
        )
      ),
      comments:comments (
        id,
        content,
        created_at,
        profiles:profile_id (
          id,
          name,
          avatar_url
        )
      )
    `;

    // 1a. Build dynamic inner join for geographic filtering if needed
    if (user && !filterUserId) {
      if (scope === 'county' && user.county) {
        selectString = selectString.replace('author:profiles!posts_profile_id_fkey', 'author:profiles!posts_profile_id_fkey!inner');
      } else if (scope === 'state' && user.state) {
        selectString = selectString.replace('author:profiles!posts_profile_id_fkey', 'author:profiles!posts_profile_id_fkey!inner');
      }
    }

    let query = supabase
      .from('posts')
      .select(selectString)
      .neq('moderation_status', 'hidden');

    // ENFORCE TOWN BOUNDARY (Privacy Mode for Minors)
    const userAge = user ? calculateAge(user.birth_month, user.birth_day, user.birth_year) : 0;
    const isMinor = userAge > 0 && userAge < 18;
    const currentYear = new Date().getFullYear();

    if (user && isMinor && user.role !== 'admin') {
      if (user.community) {
        query = query.eq('community', user.community);
      } else if (user.county) {
        query = query.eq('county', user.county);
      }
    }

    // PROTECT MINORS FROM ADULT DISCOVERY
    if (user && !isMinor && user.role !== 'admin') {
      // Adults should only see posts from users born 18+ years ago
      // This hides minor posts from the general discovery/feed for adults
      query = query.lte('author.birth_year', currentYear - 18);
    }

    // DEFAULT SORT: HOT vs LATEST
    if (!filterUserId && (activeCategory === 'Hot' || activeCategory === 'Everybody')) {
      query = query.is('group_id', null).order('hot_score', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // APPLY PROFILE FILTER OR CATEGORY MAPPING
    if (filterUserId) {
      query = query.eq('profile_id', filterUserId);
    } else if (activeCategory === 'Following' && user) {
      const { data: following } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);
      const followingIds = following?.map(f => f.following_id) || [];
      query = query.in('profile_id', followingIds);
    } 
    else if (activeCategory === 'Groups' && user) {
      // Groups that user is in
      const { data: userGroups } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('profile_id', user.id);
      
      const groupIds = userGroups?.map(g => g.group_id) || [];
      query = query.in('group_id', groupIds);
    }
    else if (activeCategory === 'News') {
      // News comes from Media roles
      query = query.filter('author.role', 'in', '(media,v_media)');
    }
    else if (activeCategory === 'Events') {
      // Events from Venue, Non-Profit, Church + type event
      query = query
        .eq('type', 'event')
        .filter('author.role', 'in', '(venue,v_venue,non_profit,v_non_profit,church,v_church)');
    }
    else if (activeCategory === 'Faith') {
      // Faith from Church roles OR specific post types
      if (user) {
        query = query.or(`type.in.(prayer_request,bible_verse),author.role.in.(church,v_church)`);
      } else {
        query = query.or(`type.in.(prayer_request,bible_verse)`);
      }
    }
    else if (activeCategory === 'Official') {
      // Official feed - from officials and admins
      query = query.filter('author.role', 'in', '(official,v_official,admin)');
    }
    else if (activeCategory === 'Civic') {
      // Civic feed - Fetch from civic_incidents instead of generic posts
      const { data: incidentData } = await supabase
        .from('civic_incidents')
        .select('*, author:profiles!civic_incidents_reporter_id_fkey(*)')
        .order('upvote_count', { ascending: false });
      
      if (incidentData) {
        setPosts(incidentData.map(inc => ({
          ...inc,
          content: inc.description,
          type: 'civic',
          metadata: { civic_type: inc.type, civic_status: inc.status }
        })));
        setIsLoading(false);
        return; // Exit early since we've already set the posts
      }
    }
    else if (activeCategory === 'Shopping') {
      // Shopping - sale type posts
      query = query.eq('type', 'sale');
    }
    else if (activeCategory === 'Services') {
      // Services - announcements from businesses
      query = query.filter('author.role', 'in', '(business,v_business)').eq('type', 'announcement');
    }
    else if (activeCategory === 'Non Profit') {
      // Non Profit feed
      query = query.filter('author.role', 'in', '(non_profit,v_non_profit)');
    }
    else if (activeCategory === 'AI Picks') {
      // AI-classified high-value community content
      query = query.in('ai_category', ['community_news', 'event_sharing', 'question'])
                   .order('created_at', { ascending: false });
    }
    else if (activeCategory === 'Hiring') {
      // AI-classified job postings
      query = query.eq('ai_category', 'job_posting')
                   .order('created_at', { ascending: false });
    }
    else if (activeCategory === 'Emergency') {
      // Emergency mode — bypass geo scope, show all official + community alerts
      query = supabase
        .from('posts')
        .select(selectString)
        .in('ai_category', ['official_alert', 'community_alert'])
        .neq('moderation_status', 'hidden')
        .order('created_at', { ascending: false })
        .limit(50);
    }

    // Check for any active alerts in last 24h (drives Emergency chip pulse)
    const { data: activeAlerts } = await supabase
      .from('posts')
      .select('id')
      .in('ai_category', ['official_alert', 'community_alert'])
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .limit(1);
    setHasActiveAlert(!!(activeAlerts && activeAlerts.length > 0));

    // 1b. APPLY HIERARCHICAL GEOGRAPHIC SCOPE FILTERING (Trickle-Down Logic)
    console.log(`SocialFeed Logic Version: 4.1 (Hierarchical Trickle-Down: ${scope}, Theme: ${theme})`);
    
    if (user && !filterUserId) {
      const isSETX = theme.startsWith('setx-');

      if (scope === 'national') {
        // National View: Only National Posts
        query = query.eq('visibility_scope', 'national');
      } else if (scope === 'state' && user.state) {
        // State View: State Posts for this state OR National Posts
        query = query.or(`and(visibility_scope.eq.state,author_state.eq.${user.state}),visibility_scope.eq.national`);
      } else if (scope === 'county') {
        if (isSETX) {
          // SETX Region View: Jefferson & Orange Counties ONLY (Hide State/National logic for now)
          query = query.or(`and(visibility_scope.eq.county,author_county.in.("Jefferson","Orange","Jefferson County","Orange County"))`);
        } else if (user.county) {
          // Standard County View
          query = query.or(`and(visibility_scope.eq.county,author_county.eq.${user.county}),and(visibility_scope.eq.state,author_state.eq.${user.state}),visibility_scope.eq.national`);
        }
      } else if (scope === 'city' && user.community) {
        // City View: City Posts (this city) OR County (this county) OR State (this state) OR National
        query = query.or(`and(visibility_scope.eq.city,author_community.eq.${user.community}),and(visibility_scope.eq.county,author_county.eq.${user.county}),and(visibility_scope.eq.state,author_state.eq.${user.state}),visibility_scope.eq.national`);
      }
    }

    const { data: postData, error: postError } = await query;

    // 2. Fetch Active Ads — prefer category-targeted, high quality score
    // Map feed categories to ad target_category values
    const categoryMap: Record<string, string> = {
      'Shopping': 'selling', 'Services': 'buying_intent', 'Hiring': 'job_posting',
      'Events': 'event_sharing', 'News': 'community_news', 'AI Picks': 'community_news',
    };
    const targetCat = categoryMap[activeCategory];

    let adsQuery = supabase.from('ads').select('*').eq('status', 'active').order('quality_score', { ascending: false });
    if (targetCat) {
      // Prefer targeted ads for this category
      const { data: targetedAds } = await adsQuery.eq('target_category', targetCat).limit(5);
      const { data: fallbackAds } = await supabase.from('ads').select('*').eq('status','active').neq('target_category', targetCat).order('quality_score', { ascending: false }).limit(5);
      setAds([...(targetedAds || []), ...(fallbackAds || [])]);
    } else {
      const { data: adData } = await adsQuery;
      setAds(adData || []);
    }

    // 3. Fetch trending topics for user's notch
    if (user?.community) {
      const { data: trending } = await supabase
        .from('trending_topics')
        .select('*')
        .eq('community', user.community)
        .order('score', { ascending: false })
        .limit(4);
      setTrendingTopics(trending || []);
    }

    if (postError) {
      console.error('Error fetching posts:', postError);
      
      // Handle missing columns or schema mismatches gracefully
      if (postError.message.includes('column') || postError.message.includes('profiles')) {
        console.warn('Database schema mismatch detected. This usually means the "is_public" or "allow_dms" columns are missing from the profiles table.');
        alert(`Feed error: ${postError.message}\n\nPlease ensure all database migrations have been applied.`);
      } else {
        alert("Failed to load feed. Please check your connection and try again.");
      }
    } else {
      let filteredPosts = (postData as any[]) || [];
      
      // Post Type Filtering (Text, Images, Videos)
      if (activeType !== 'all') {
        filteredPosts = filteredPosts.filter((post: any) => {
          const hasMedia = post.media_urls && post.media_urls.length > 0;
          if (activeType === 'text') {
            return !hasMedia;
          } else if (activeType === 'images') {
            // Check if any media url implies an image
            return hasMedia && post.media_urls.some((url: string) => !url.match(/\.(mp4|webm|ogg)$/i));
          } else if (activeType === 'videos') {
            return hasMedia && post.media_urls.some((url: string) => url.match(/\.(mp4|webm|ogg)$/i));
          }
          return true;
        });
      }

      // Privacy Filtering
      if (user) {
        // Fetch current user's follow list to know who they are allowed to see
        const { data: follows } = await supabase.from('follows').select('following_id').eq('follower_id', user.id);
        const followingIds = new Set(follows?.map(f => f.following_id) || []);
        
        filteredPosts = filteredPosts.filter(p => {
          const isOwnPost = p.profile_id === user.id;
          const isFollowing = followingIds.has(p.profile_id);
          const isPublic = p.author?.is_public !== false; // Use aliased 'author'
          return isPublic || isOwnPost || isFollowing;
        });
      } else {
        // Unauthenticated guests only see public posts
        filteredPosts = filteredPosts.filter(p => p.author?.is_public !== false);
      }

      // ══════════════════════════════════════════════════
      // NOTCH ZOOM: Quiet-feed escalation
      // If local scope has < 3 posts, escalate to next tier
      // ══════════════════════════════════════════════════
      const MIN_POSTS = 3;
      let currentEscalation: string | null = null;

      if (user && !filterUserId && filteredPosts.length < MIN_POSTS && scope !== 'national') {
        const isSETX = theme.startsWith('setx-');
        const escalationMap: Record<string, { nextScope: string; filterKey: string; filterValue: string; label: string }> = {
          city: { nextScope: 'county', filterKey: 'author_county', filterValue: user.county, label: `${user.county || 'your'} County` },
          // Hide state/national escalation for SETX project
          ...(!isSETX ? {
            county: { nextScope: 'state', filterKey: 'author_state', filterValue: user.state, label: user.state || 'your state' },
            state: { nextScope: 'national', filterKey: '', filterValue: '', label: 'nationwide' },
          } : {}),
        };

        const esc = escalationMap[scope];
        if (esc && esc.filterValue) {
          let escQuery = supabase.from('posts').select(selectString);
          if (activeCategory === 'Hot' || activeCategory === 'Everybody') {
            escQuery = escQuery.order('hot_score', { ascending: false });
          } else {
            escQuery = escQuery.order('created_at', { ascending: false });
          }

          if (esc.nextScope !== 'national') {
            escQuery = escQuery.eq(esc.filterKey, esc.filterValue);
          }

          const { data: escPosts } = await escQuery;
          if (escPosts && escPosts.length > 0) {
            // Merge: keep local posts first, then add escalated ones (deduped)
            const existingIds = new Set(filteredPosts.map(p => p.id));
            const newPosts = escPosts.filter((p: any) => !existingIds.has(p.id));
            filteredPosts = [...filteredPosts, ...newPosts];
            currentEscalation = esc.label;
          }
        }
      }

      setEscalatedScope(currentEscalation);
      setPosts(filteredPosts);

      // 4. Fetch User Context (Poll Votes & Post Votes)
      if (user && filteredPosts.length > 0) {
        const pIds = filteredPosts.map(p => p.id);
        
        // Fetch Poll Votes
        const { data: pVotes } = await supabase
          .from('poll_votes')
          .select('post_id, option_index')
          .eq('profile_id', user.id)
          .in('post_id', pIds);
        
        if (pVotes) {
          const pollMap: Record<string, number> = {};
          pVotes.forEach(v => pollMap[v.post_id] = v.option_index);
          setUserPollVotes(pollMap);
        }

        // Fetch Post Votes (Up/Down)
        const { data: votes } = await supabase
          .from('post_votes')
          .select('post_id, vote_type')
          .eq('user_id', user.id)
          .in('post_id', pIds);
          
        if (votes) {
          const voteMap: Record<string, number> = {};
          votes.forEach(v => voteMap[v.post_id] = v.vote_type);
          setUserVotes(voteMap);
        }

        // Fetch Bookmarks
        const { data: bookmarks } = await supabase
          .from('bookmarks')
          .select('post_id')
          .eq('profile_id', user.id)
          .in('post_id', pIds);
        
        if (bookmarks) {
          setUserBookmarks(new Set(bookmarks.map(b => b.post_id)));
        }
      }
    }
    setIsLoading(false);
  };

  // handleLike is removed in favor of VoteButtons component logic


  const handleRepost = async (originalPostId: string) => {
    if (!user) {
      alert("Please log in to repost.");
      return;
    }
    if (!window.confirm("Repost this to your timeline?")) return;
    
    // Increment reposts count (Optimistic or rely on DB depending on needs, but let's just insert here)
    const { error } = await supabase.from('posts').insert({
      profile_id: user.id,
      type: 'repost',
      original_post_id: originalPostId,
      content: ''
    });

    if (error) {
      console.error("Repost failed", error);
      alert("Failed to repost.");
    } else {
      fetchContent();
    }
  };

  const handleDelete = async (postId: string) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (error) {
      console.error("Failed to delete post:", error);
      alert("Failed to delete post.");
    } else {
      setPosts(posts.filter(p => p.id !== postId));
    }
  };

  const handleShare = async (postId: string) => {
    const shareData = {
      title: 'Check out this post on Efutura',
      text: 'Found something interesting on Efutura!',
      url: `${window.location.origin}/post/${postId}`
    };

    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error("Share failed", err);
        }
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(shareData.url);
        alert("Link copied to clipboard!");
      } catch (err) {
        console.error("Failed to copy link:", err);
      }
    }
  };

  const handlePollVote = async (post: any, optionIndex: number) => {
    if (!user) return alert("Please sign in to vote.");
    
    // Call the RPC for atomic vote handling
    const { data: newPollData, error } = await supabase.rpc('cast_poll_vote', {
      p_post_id: post.id,
      p_option_index: optionIndex
    });

    if (error) {
      console.error("Poll vote failed", error);
      return alert("Failed to cast vote.");
    }

    // Update local state
    setUserPollVotes(prev => ({ ...prev, [post.id]: optionIndex }));
    setPosts(posts.map(p => {
      if (p.id === post.id) return { ...p, poll_data: newPollData };
      if (p.original_post_id === post.id && p.original_post) {
        return { ...p, original_post: { ...p.original_post, poll_data: newPollData } };
      }
      return p;
    }));
  };

  const handleToggleBookmark = async (postId: string) => {
    if (!user) return alert("Please sign in to save posts.");

    const isBookmarked = userBookmarks.has(postId);
    
    if (isBookmarked) {
      // Unsave
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('profile_id', user.id)
        .eq('post_id', postId);
      
      if (!error) {
        setUserBookmarks(prev => {
          const next = new Set(prev);
          next.delete(postId);
          return next;
        });
      }
    } else {
      // Save
      const { error } = await supabase
        .from('bookmarks')
        .insert({
          profile_id: user.id,
          post_id: postId
        });
      
      if (!error) {
        setUserBookmarks(prev => {
          const next = new Set(prev);
          next.add(postId);
          return next;
        });
      }
    }
  };

  const renderFeedContent = () => {
    const feedItems: React.ReactNode[] = [];
    let adIndex = 0;

    posts.forEach((post, index) => {
      const contentPost = post.type === 'repost' && post.original_post ? post.original_post : post;
      
      feedItems.push(
        <PostCard
          key={`post-${post.id}`}
          post={post}
          user={user}
          userVote={userVotes[contentPost.id]}
          userPollVote={userPollVotes[contentPost.id]}
          isBookmarked={userBookmarks.has(contentPost.id)}
          onPollVote={handlePollVote}
          onToggleBookmark={handleToggleBookmark}
          onDelete={handleDelete}
          onRepost={handleRepost}
          onShare={handleShare}
          onNavigateToPost={onNavigateToPost} 
        />
      );

      // Inject Ad every 5th post (Persistent Slotting)
      if ((index + 1) % 5 === 0) {
        if (ads.length > 0) {
          const ad = ads[adIndex % ads.length];
          feedItems.push(
            <AdCard 
              key={`ad-${ad.id}-${index}`} 
              ad={ad} 
              onPromote={() => setIsPromoting(true)} 
            />
          );
          adIndex++;
        } else {
          // Injection placeholder if no ads available
          feedItems.push(
            <AdCard 
              key={`ad-placeholder-${index}`} 
              isPlaceholder={true} 
              onPromote={() => setIsPromoting(true)} 
              user={user} 
            />
          );
        }
      }
    });

    return feedItems;
  };

  return (
    <div className="social-feed">
      {showFilters && (
        <FeedFilters 
          activeCategory={activeCategory} 
          onCategoryChange={setActiveCategory}
          hasActiveAlert={hasActiveAlert}
          userRole={user?.role}
          activeType={activeType}
          onTypeChange={setActiveType}
        />
      )}
      
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <Loader2 className="animate-spin" size={32} color="var(--primary)" />
        </div>
      ) : posts.length === 0 ? (
        <EmptyState 
          icon={Rss}
          title="The Feed is Quiet"
          message={`No posts found in this ${scope} yet. Be the first to start the conversation!`}
          action={{
            label: "Create Post",
            onClick: () => setIsPosting(true)
          }}
        />
      ) : (
        <>
          {/* Trending Bar — shows AI-detected hot topics in user's community */}
          {trendingTopics.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', padding: '0 0 12px', scrollbarWidth: 'none' }}>
              <TrendingUp size={14} color="#f59e0b" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: 700, flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Trending</span>
              {trendingTopics.map(t => (
                <span key={t.topic} style={{ whiteSpace: 'nowrap', fontSize: '0.72rem', padding: '3px 10px', borderRadius: '12px', background: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontWeight: 600, flexShrink: 0 }}>
                  {t.topic.replace(/_/g, ' ')} · {t.post_count}
                </span>
              ))}
            </div>
          )}
          {escalatedScope && (
            <div style={{
              padding: '10px 16px',
              marginBottom: '12px',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(157,0,255,0.08))',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.82rem',
              color: 'var(--text-muted)',
              fontWeight: 500
            }}>
              <MapPin size={14} color="var(--primary)" />
              <span>Expanded to <strong style={{ color: 'var(--primary)' }}>{escalatedScope}</strong> — not enough local posts yet</span>
            </div>
          )}
          {renderFeedContent()}
        </>
      )}
      
      {showFAB && (
        <>
          <div className="fab-group">
            {canPromote && (
              <button 
                className="social-fab promote-fab" 
                onClick={() => setIsPromoting(true)}
                title="Promote with Ads"
                style={{ bottom: '90px', background: 'var(--secondary)' }}
              >
                <Megaphone size={24} />
              </button>
            )}
            <button className="social-fab" onClick={() => setIsPosting(true)}>
              <Plus size={28} />
            </button>
          </div>

          {isPosting && (
            <CreatePostModal 
              user={user}
              activeCategory={activeCategory}
              currentScope={scope}
              onClose={() => {
                setIsPosting(false);
                fetchContent();
              }} 
            />
          )}

          {isPromoting && (
            <AdCreationModal 
              onClose={() => {
                setIsPromoting(false);
                fetchContent();
              }} 
            />
          )}
        </>
      )}
    </div>
  );
};
