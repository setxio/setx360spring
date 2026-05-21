import React, { useState } from 'react';
import { useToast } from '../context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { Plus, Loader2, MapPin, TrendingUp, Rss } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';
import { FeedFilters } from './FeedFilters';
import { RepostModal } from './RepostModal';
import { CreatePostModal } from './CreatePostModal';
import { AdCreationModal } from './AdCreationModal';
import { PostCard } from './PostCard';
import { AdCard } from './AdCard';
import { EmptyState } from './EmptyState';
import { supabase } from '../lib/supabase';
import { weightByCounty, SETX_COUNTY_LIST } from '../utils/geo';
import './SocialFeed.css';

interface SocialFeedProps {
  showFilters?: boolean;
  showFAB?: boolean;
  user?: any;
  filterUserId?: string;
  filterGroupId?: string;
  scope?: 'national' | 'state' | 'county' | 'city';
  onNavigateToPost?: (postId: string, commentId?: string) => void;
  onNavigateToProfile?: (profileId: string) => void;
}

export const SocialFeed: React.FC<SocialFeedProps> = ({ 
  showFilters = true, 
  showFAB = true, 
  user, 
  filterUserId, 
  filterGroupId,
  scope = 'national',
  onNavigateToPost,
  onNavigateToProfile
}) => {
  const { theme } = useApp();
  const [activeCategory, setActiveCategory] = useState('Hot');
  const [activeType, setActiveType] = useState('all');
  const [isPosting, setIsPosting] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false);
  const [repostTarget, setRepostTarget] = useState<any>(null);
  const [userVotes, setUserVotes] = useState<Record<string, number>>({});
  const { success, error: toastError, info, warning } = useToast();
  const [userPollVotes, setUserPollVotes] = useState<Record<string, number>>({});
  const [userBookmarks, setUserBookmarks] = useState<Set<string>>(new Set());


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

    // Fetch follow weights for the current user to personalize the feed
    let currentFollowWeights: Record<string, number> = {};
    if (user) {
      const { data: weights } = await supabase
        .from('follows')
        .select('following_id, weight')
        .eq('follower_id', user.id);
      
      if (weights) {
        weights.forEach(w => {
          currentFollowWeights[w.following_id] = w.weight || 1;
        });
      }
    }
    
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
        birth_year,
        email
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
          birth_year,
          email
        ),
        comments:comments (
          id,
          content,
          created_at,
          profiles:profile_id (
            id,
            name,
            avatar_url,
            email
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
          avatar_url,
          email
        )
      )
    `;

    // 1a. Build dynamic inner join for geographic or role-based filtering
    const roleBasedCategories = ['Official', 'Events', 'Services', 'Non Profit'];
    const needsInnerJoin = (user && !filterUserId && (scope === 'county' || scope === 'state')) || roleBasedCategories.includes(activeCategory);

    if (needsInnerJoin) {
      selectString = selectString.replace('author:profiles!posts_profile_id_fkey', 'author:profiles!posts_profile_id_fkey!inner');
    }

    let query = supabase
      .from('posts')
      .select(selectString)
      .neq('moderation_status', 'hidden');

    // EXCLUDE BLOCKED USERS
    if (user) {
      const { data: blocks } = await supabase.from('blocks').select('blocked_id').eq('blocker_id', user.id);
      const blockedIds = blocks?.map(b => b.blocked_id) || [];
      if (blockedIds.length > 0) {
        query = query.not('profile_id', 'in', `(${blockedIds.join(',')})`);
      }
    }

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
      query = query.is('group_id', null)
        .order('priority', { ascending: false })
        .order('hot_score', { ascending: false });
    } else {
      query = query
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });
    }

    // APPLY PROFILE FILTER OR CATEGORY MAPPING
    if (filterUserId) {
      query = query.eq('profile_id', filterUserId);
    } else if (filterGroupId) {
      query = query.eq('group_id', filterGroupId);
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
      // News comes from verified media roles OR posts explicitly marked as news
      // Added journalists and media outlets
      query = query.or(`category.eq.News,type.eq.news`)
                   .filter('author.role', 'in', '(media,news,journalist,v_media,v_news,v_journalist,admin)');
    }
    else if (activeCategory === 'Events') {
      // Events explicitly tagged or type event from specific roles
      query = query.or(`category.eq.Events,type.eq.event`);
      query = query.filter('author.role', 'in', '(venue,v_venue,non_profit,v_non_profit,church,v_church,official,v_official,admin)');
    }
    else if (activeCategory === 'Faith') {
      // Faith content: Explicitly tagged OR specific faith types
      query = query.or(`category.eq.Faith,type.in.(prayer_request,bible_verse,testament,bible_question)`);
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
        return {
          posts: incidentData.map((inc: any) => ({
            ...inc,
            content: inc.description,
            type: 'civic',
            metadata: { civic_type: inc.type, civic_status: inc.status }
          })),
          ads: [],
          trending: [],
          escalatedScope: null,
          hasActiveAlert: false,
          userVotes: {},
          userPollVotes: {},
          userBookmarks: [],
        };
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
      // Emergency mode — isolate emergencies based on environment
      query = supabase
        .from('posts')
        .select(selectString)
        .in('ai_category', ['official_alert', 'community_alert'])
        .neq('moderation_status', 'hidden');
        
      if (theme.startsWith('setx-')) {
        query = query.or('author_county.in.("Jefferson","Orange","Hardin","Jasper","Jefferson County","Orange County","Hardin County","Jasper County")');
      } else if (user?.state) {
        query = query.eq('author_state', user.state);
      }
      
      query = query.order('created_at', { ascending: false }).limit(50);
    }

    // Check for any active alerts in last 24h (drives Emergency chip pulse)
    let alertQuery = supabase
      .from('posts')
      .select('id')
      .in('ai_category', ['official_alert', 'community_alert'])
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
      
    if (theme.startsWith('setx-')) {
      alertQuery = alertQuery.or('author_county.in.("Jefferson","Orange","Hardin","Jasper","Jefferson County","Orange County","Hardin County","Jasper County")');
    } else if (user?.state) {
      alertQuery = alertQuery.eq('author_state', user.state);
    }
    
    const { data: activeAlerts } = await alertQuery.limit(1);
    const hasActiveAlert = !!(activeAlerts && activeAlerts.length > 0);

    // 1b. APPLY HIERARCHICAL GEOGRAPHIC SCOPE FILTERING (Trickle-Down Logic)
    console.log(`SocialFeed Logic Version: 4.1 (Hierarchical Trickle-Down: ${scope}, Theme: ${theme})`);
    
    if (user && !filterUserId) {
      const isSETX = theme.startsWith('setx-');

      if (scope === 'national') {
        // National View: Show EVERYTHING (broadest view)
      } else if (scope === 'state' && user.state) {
        // State View: show this state's posts + national
        query = query.or(`author_state.eq.${user.state},visibility_scope.eq.national`);
      } else if (scope === 'county') {
        if (isSETX) {
          // SETX Region: all 4 counties — use .in() for reliable PostgREST filtering
          query = query.in('author_county', SETX_COUNTY_LIST).limit(50);
        } else if (user.county) {
          // Non-SETX: user's own county + national visibility
          query = query.or(`author_county.eq.${user.county},visibility_scope.eq.national`);
        }
      } else if (scope === 'city' && user.community) {
        // City View: user's community first, falls back to county/state/national via escalation
        query = query.eq('author_community', user.community).limit(50);
      }
    }

    const { data: postData, error: postError } = await query;

    // 2. Fetch Active Ads from Regional Ad Engine
    const { data: activeAds } = await supabase
      .from('platform_ads')
      .select(`
        *,
        store:stores(name, logo_url),
        content_post:posts!content_id(*),
        content_product:products!content_id(*)
      `)
      .eq('status', 'active')
      .order('budget', { ascending: false });

    let resolvedAds: any[] = [];
    if (activeAds) {
      resolvedAds = activeAds.map(ad => ({
        ...ad,
        title: ad.content_post?.title || ad.content_product?.name || ad.store?.name,
        content: ad.content_post?.content || ad.content_product?.description || "Check out our latest offerings!",
        image_url: ad.content_post?.media_urls?.[0] || ad.content_product?.image_url || ad.store?.logo_url,
        target_url: ad.content_product ? `/?product=${ad.content_id}` : `/?post=${ad.content_id}`
      }));
    }

    // 3. Fetch trending topics for user's notch
    let trending: any[] = [];
    if (user?.community) {
      const { data: trendData } = await supabase
        .from('trending_topics')
        .select('*')
        .eq('community', user.community)
        .order('score', { ascending: false })
        .limit(4);
      trending = trendData || [];
    }

    if (postError) {
      console.error('Error fetching posts:', postError);
      
      // Handle missing columns or schema mismatches gracefully
      if (postError.message.includes('column') || postError.message.includes('profiles')) {
        console.warn('Database schema mismatch detected. This usually means the "is_public" or "allow_dms" columns are missing from the profiles table.');
        toastError(`Feed error: ${postError.message}`);
      } else {
        toastError("Failed to load feed. Please check your connection and try again.");
      }
    } else {
      // Apply county weighting: user's home county floats to top
      let filteredPosts = weightByCounty(
        (postData as any[]) || [],
        user?.county,
        'author.county'
      );
      
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
            const hasVideoFile = hasMedia && post.media_urls.some((url: string) => url.match(/\.(mp4|webm|ogg)$/i));
            return hasVideoFile || post.type === 'video';
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


      // Final Step: Sort by Influence Weight for Hot/Everybody categories
      if (user && (activeCategory === 'Hot' || activeCategory === 'Everybody')) {
        filteredPosts = filteredPosts.sort((a, b) => {
          const weightA = currentFollowWeights[a.profile_id] || 1;
          const weightB = currentFollowWeights[b.profile_id] || 1;
          
          // 1. Priority Boost (Admin/Official)
          if ((a.priority || 0) !== (b.priority || 0)) {
            return (b.priority || 0) - (a.priority || 0);
          }
          
          // 2. Weighted Hot Score
          // Formula: hot_score * (1 + 0.1 * weight)
          // A 10x weight gives a 2x total score multiplier
          const scoreA = (a.hot_score || 0) * (1 + (weightA * 0.1));
          const scoreB = (b.hot_score || 0) * (1 + (weightB * 0.1));
          
          return scoreB - scoreA;
        });
      }


      // 4. Fetch User Context (Poll Votes & Post Votes)
      let userVotesMap: Record<string, number> = {};
      let userPollVotesMap: Record<string, number> = {};
      let userBookmarksList: string[] = [];

      if (user && filteredPosts.length > 0) {
        const pIds = filteredPosts.map(p => p.id);
        
        const { data: pVotes } = await supabase
          .from('poll_votes').select('post_id, option_index')
          .eq('profile_id', user.id).in('post_id', pIds);
        if (pVotes) pVotes.forEach(v => userPollVotesMap[v.post_id] = v.option_index);

        const { data: votes } = await supabase
          .from('post_votes').select('post_id, vote_type')
          .eq('user_id', user.id).in('post_id', pIds);
        if (votes) votes.forEach(v => userVotesMap[v.post_id] = v.vote_type);

        const { data: bookmarks } = await supabase
          .from('bookmarks').select('post_id')
          .eq('profile_id', user.id).in('post_id', pIds);
        if (bookmarks) userBookmarksList = bookmarks.map(b => b.post_id);
      }

      if (postError) {
        console.error('Error fetching posts:', postError);
        if (postError.message.includes('column') || postError.message.includes('profiles')) {
          console.warn('Database schema mismatch detected.');
        }
        throw postError;
      }

      return {
        posts: filteredPosts,
        ads: resolvedAds,
        trending,
        escalatedScope: currentEscalation,
        hasActiveAlert,
        userVotes: userVotesMap,
        userPollVotes: userPollVotesMap,
        userBookmarks: userBookmarksList,
      };
    } // close else block (postError check)
  }; // close fetchContent

  const { data: feedData, isLoading, refetch: refetchFeed } = useQuery({
    queryKey: queryKeys.posts.list(scope, activeCategory),
    queryFn: fetchContent,
  });

  const posts: any[] = feedData?.posts ?? [];
  const ads: any[] = feedData?.ads ?? [];
  const trendingTopics: any[] = feedData?.trending ?? [];
  const escalatedScope: string | null = feedData?.escalatedScope ?? null;
  const hasActiveAlert: boolean = feedData?.hasActiveAlert ?? false;

  // Sync per-user interaction state from cached query result
  React.useEffect(() => {
    if (feedData?.userVotes) setUserVotes(feedData.userVotes);
    if (feedData?.userPollVotes) setUserPollVotes(feedData.userPollVotes);
    if (feedData?.userBookmarks) setUserBookmarks(new Set(feedData.userBookmarks));
  }, [feedData]);

  // handleLike is removed in favor of VoteButtons component logic


  const handleRepost = (originalPost: any) => {
    if (!user) return info("Please log in to repost.");
    setRepostTarget(originalPost);
  };

  const handleRepostSuccess = () => {
    setRepostTarget(null);
    // Show a subtle toast
    const toastEl = document.createElement('div');
    toastEl.textContent = '✓ Shared to your timeline';
    Object.assign(toastEl.style, {
      position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)',
      background: 'var(--primary)', color: '#fff', padding: '10px 20px',
      borderRadius: '24px', fontSize: '0.9rem', fontWeight: '600',
      zIndex: '9999', boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      animation: 'fadeInUp 0.3s ease'
    });
    document.body.appendChild(toastEl);
    setTimeout(() => toastEl.remove(), 2500);
    refetchFeed();
  };

  const handleDelete = async (postId: string) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (error) {
      console.error("Failed to delete post:", error);
      toastError("Failed to delete post.");
    } else {
      refetchFeed();
    }
  };

  const handleShare = async (postId: string) => {
    const shareData = {
      title: 'Check out this post on SETX 360',
      text: 'Found something interesting on SETX 360!',
      url: `${window.location.origin}/?post=${postId}`
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
        success("Link copied to clipboard!");
      } catch (err) {
        console.error("Failed to copy link:", err);
      }
    }
  };

  const handlePollVote = async (post: any, optionIndex: number) => {
    if (!user) return info("Please sign in to vote.");
    
    // Call the RPC for atomic vote handling
    const { data: newPollData, error } = await supabase.rpc('cast_poll_vote', {
      p_post_id: post.id,
      p_option_index: optionIndex
    });

    if (error) {
      console.error("Poll vote failed", error);
      return toastError("Failed to cast vote.");
    }

    // Update optimistic local state
    setUserPollVotes(prev => ({ ...prev, [post.id]: optionIndex }));
    // Refetch to get updated poll counts from DB
    refetchFeed();
  };

  const handleToggleBookmark = async (postId: string) => {
    if (!user) return info("Please sign in to save posts.");

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
          onRepost={() => handleRepost(contentPost)}
          onShare={handleShare}
          onNavigateToPost={onNavigateToPost}
          onNavigateToProfile={onNavigateToProfile}
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
      
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}
          >
            <Loader2 className="animate-spin" size={32} color="var(--primary)" />
          </motion.div>
        ) : posts.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <EmptyState 
              icon={Rss}
              title="The Feed is Quiet"
              message={`No posts found in this ${scope} yet. Be the first to start the conversation!`}
              action={{
                label: "Create Post",
                onClick: () => setIsPosting(true)
              }}
            />
          </motion.div>
        ) : (
          <motion.div 
            key={activeCategory}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            <>
              {/* Trending Bar — shows AI-detected hot topics in user's community */}
              {trendingTopics.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', padding: '0 0 12px', scrollbarWidth: 'none' }}>
                  <TrendingUp size={14} color="#f59e0b" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: 700, flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Trending</span>
                  {trendingTopics.map(t => (
                    <button
                      key={t.topic}
                      onClick={() => setActiveCategory('AI Picks')}
                      title={`Filter to ${t.topic.replace(/_/g, ' ')} posts`}
                      style={{ whiteSpace: 'nowrap', fontSize: '0.72rem', padding: '3px 10px', borderRadius: '12px', background: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontWeight: 600, flexShrink: 0, border: '1px solid rgba(245,158,11,0.3)', cursor: 'pointer', transition: 'all 0.15s ease' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(245,158,11,0.3)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(245,158,11,0.15)')}
                    >
                      {t.topic.replace(/_/g, ' ')} · {t.post_count}
                    </button>
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
          </motion.div>
        )}
      </AnimatePresence>
      
      {showFAB && (
        <>
          <div className="fab-group">
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

          {repostTarget && (
            <RepostModal 
              post={repostTarget}
              user={user}
              onClose={() => setRepostTarget(null)}
              onSuccess={handleRepostSuccess}
            />
          )}
        </>
      )}
    </div>
  );
};
