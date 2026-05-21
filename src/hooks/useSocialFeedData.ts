import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { weightByCounty, SETX_COUNTY_LIST } from '../utils/geo';
import { queryKeys } from '../lib/queryKeys';

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

export const useSocialFeedData = (
  user: any,
  filterUserId: string | undefined,
  filterGroupId: string | undefined,
  scope: string,
  activeCategory: string,
  activeType: string,
  theme: string
) => {
  const fetchContent = async () => {
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

    const roleBasedCategories = ['Official', 'Events', 'Services', 'Non Profit'];
    const needsInnerJoin = (user && !filterUserId && (scope === 'county' || scope === 'state')) || roleBasedCategories.includes(activeCategory);

    if (needsInnerJoin) {
      selectString = selectString.replace('author:profiles!posts_profile_id_fkey', 'author:profiles!posts_profile_id_fkey!inner');
    }

    let query = supabase
      .from('posts')
      .select(selectString)
      .neq('moderation_status', 'hidden');

    if (user) {
      const { data: blocks } = await supabase.from('blocks').select('blocked_id').eq('blocker_id', user.id);
      const blockedIds = blocks?.map((b: any) => b.blocked_id) || [];
      if (blockedIds.length > 0) {
        query = query.not('profile_id', 'in', `(${blockedIds.join(',')})`);
      }
    }

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

    if (user && !isMinor && user.role !== 'admin') {
      query = query.lte('author.birth_year', currentYear - 18);
    }

    if (!filterUserId && (activeCategory === 'Hot' || activeCategory === 'Everybody')) {
      query = query.is('group_id', null)
        .order('priority', { ascending: false })
        .order('hot_score', { ascending: false });
    } else {
      query = query
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });
    }

    if (filterUserId) {
      query = query.eq('profile_id', filterUserId);
    } else if (filterGroupId) {
      query = query.eq('group_id', filterGroupId);
    } else if (activeCategory === 'Following' && user) {
      const { data: following } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);
      const followingIds = following?.map((f: any) => f.following_id) || [];
      query = query.in('profile_id', followingIds);
    } 
    else if (activeCategory === 'Groups' && user) {
      const { data: userGroups } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('profile_id', user.id);
      
      const groupIds = userGroups?.map((g: any) => g.group_id) || [];
      query = query.in('group_id', groupIds);
    }
    else if (activeCategory === 'News') {
      query = query.or(`category.eq.News,type.eq.news`)
                   .filter('author.role', 'in', '(media,news,journalist,v_media,v_news,v_journalist,admin)');
    }
    else if (activeCategory === 'Events') {
      query = query.or(`category.eq.Events,type.eq.event`);
      query = query.filter('author.role', 'in', '(venue,v_venue,non_profit,v_non_profit,church,v_church,official,v_official,admin)');
    }
    else if (activeCategory === 'Faith') {
      query = query.or(`category.eq.Faith,type.in.(prayer_request,bible_verse,testament,bible_question)`);
    }
    else if (activeCategory === 'Official') {
      query = query.filter('author.role', 'in', '(official,v_official,admin)');
    }
    else if (activeCategory === 'Civic') {
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
      query = query.eq('type', 'sale');
    }
    else if (activeCategory === 'Services') {
      query = query.filter('author.role', 'in', '(business,v_business)').eq('type', 'announcement');
    }
    else if (activeCategory === 'Non Profit') {
      query = query.filter('author.role', 'in', '(non_profit,v_non_profit)');
    }
    else if (activeCategory === 'AI Picks') {
      query = query.in('ai_category', ['community_news', 'event_sharing', 'question'])
                   .order('created_at', { ascending: false });
    }
    else if (activeCategory === 'Hiring') {
      query = query.eq('ai_category', 'job_posting')
                   .order('created_at', { ascending: false });
    }
    else if (activeCategory === 'Emergency') {
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

    if (user && !filterUserId) {
      const isSETX = theme.startsWith('setx-');

      if (scope === 'national') {
      } else if (scope === 'state' && user.state) {
        query = query.or(`author_state.eq.${user.state},visibility_scope.eq.national`);
      } else if (scope === 'county') {
        if (isSETX) {
          query = query.in('author_county', SETX_COUNTY_LIST).limit(50);
        } else if (user.county) {
          query = query.or(`author_county.eq.${user.county},visibility_scope.eq.national`);
        }
      } else if (scope === 'city' && user.community) {
        query = query.eq('author_community', user.community).limit(50);
      }
    }

    const { data: postData, error: postError } = await query;

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
      resolvedAds = activeAds.map((ad: any) => ({
        ...ad,
        title: ad.content_post?.title || ad.content_product?.name || ad.store?.name,
        content: ad.content_post?.content || ad.content_product?.description || "Check out our latest offerings!",
        image_url: ad.content_post?.media_urls?.[0] || ad.content_product?.image_url || ad.store?.logo_url,
        target_url: ad.content_product ? `/?product=${ad.content_id}` : `/?post=${ad.content_id}`
      }));
    }

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
      throw postError;
    }

    let filteredPosts = weightByCounty(
      (postData as any[]) || [],
      user?.county,
      'author.county'
    );
    
    if (activeType !== 'all') {
      filteredPosts = filteredPosts.filter((post: any) => {
        const hasMedia = post.media_urls && post.media_urls.length > 0;
        if (activeType === 'text') {
          return !hasMedia;
        } else if (activeType === 'media') {
          return hasMedia;
        }
        return true;
      });
    }

    // MOCK: Inject linked_products to test Shoppable Feed UI
    filteredPosts = filteredPosts.map((p: any, i: number) => {
      // Pick the first couple posts with media to have a shoppable product overlay
      if (i < 3 && p.media_urls?.length > 0) {
        return {
          ...p,
          linked_products: [{
            id: 'mock-123',
            name: 'Local Artisan Coffee Blend',
            price: 14.99,
            image_urls: ['https://images.unsplash.com/photo-1559525839-b184a4d698c7?w=200'],
            eligible_for_sameday: true,
            store_name: 'Beaumont Roasters'
          }]
        };
      }
      return p;
    });

    let currentEscalation = null;

    if (filteredPosts.length < 5 && user && activeCategory !== 'Following' && activeCategory !== 'Groups') {
      const scopeEscalation = [
        { level: 'county', value: user.county, label: 'Nearby Counties' },
        { level: 'state', value: user.state, label: `${user.state} Posts` },
        { level: 'national', value: 'US', label: 'Trending Nationally' }
      ];

      for (const esc of scopeEscalation) {
        if (filteredPosts.length >= 10) break;

        if (
          (scope === 'city' && esc.level === 'county') ||
          (scope === 'county' && esc.level === 'state') ||
          (scope === 'state' && esc.level === 'national')
        ) {
          let escQuery = supabase.from('posts').select(selectString)
            .neq('moderation_status', 'hidden')
            .order('priority', { ascending: false })
            .order('hot_score', { ascending: false })
            .limit(10);
            
          if (esc.level === 'county' && user.county) {
            escQuery = escQuery.eq('author_county', user.county);
          } else if (esc.level === 'state' && user.state) {
            escQuery = escQuery.eq('author_state', user.state);
          }

          const { data: escPosts } = await escQuery;
          if (escPosts && escPosts.length > 0) {
            const existingIds = new Set(filteredPosts.map((p: any) => p.id));
            const newPosts = escPosts.filter((p: any) => !existingIds.has(p.id));
            filteredPosts = [...filteredPosts, ...newPosts];
            currentEscalation = esc.label;
          }
        }
      }
    }

    if (user && (activeCategory === 'Hot' || activeCategory === 'Everybody')) {
      filteredPosts = filteredPosts.sort((a: any, b: any) => {
        const weightA = currentFollowWeights[a.profile_id] || 1;
        const weightB = currentFollowWeights[b.profile_id] || 1;
        
        if ((a.priority || 0) !== (b.priority || 0)) {
          return (b.priority || 0) - (a.priority || 0);
        }
        
        const scoreA = (a.hot_score || 0) * (1 + (weightA * 0.1));
        const scoreB = (b.hot_score || 0) * (1 + (weightB * 0.1));
        
        return scoreB - scoreA;
      });
    }

    let userVotesMap: Record<string, number> = {};
    let userPollVotesMap: Record<string, number> = {};
    let userBookmarksList: string[] = [];

    if (user && filteredPosts.length > 0) {
      const pIds = filteredPosts.map((p: any) => p.id);
      
      const { data: pVotes } = await supabase
        .from('poll_votes').select('post_id, option_index')
        .eq('profile_id', user.id).in('post_id', pIds);
      if (pVotes) pVotes.forEach((v: any) => userPollVotesMap[v.post_id] = v.option_index);

      const { data: votes } = await supabase
        .from('post_votes').select('post_id, vote_type')
        .eq('user_id', user.id).in('post_id', pIds);
      if (votes) votes.forEach((v: any) => userVotesMap[v.post_id] = v.vote_type);

      const { data: bookmarks } = await supabase
        .from('bookmarks').select('post_id')
        .eq('profile_id', user.id).in('post_id', pIds);
      if (bookmarks) userBookmarksList = bookmarks.map((b: any) => b.post_id);
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
  };

  return useQuery({
    queryKey: queryKeys.posts.list(scope, activeCategory),
    queryFn: fetchContent,
  });
};
