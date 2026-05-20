import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryKeys } from '../lib/queryKeys';
import type { Scope } from '../context/AppContext';
import type { User } from '../types/user';

const PAGE_SIZE = 20;

async function fetchPosts({
  scope,
  userId,
  pageParam = 0,
}: {
  scope: Scope;
  userId: string;
  pageParam: number;
}) {
  // Build location filter based on scope
  const { data: profile } = await supabase
    .from('profiles')
    .select('county, state, community')
    .eq('id', userId)
    .single();

  let query = supabase
    .from('posts')
    .select(`
      *,
      profiles:profile_id (id, name, avatar_url, role, handle, is_verified),
      likes (profile_id),
      comments (count),
      bookmarks (profile_id)
    `)
    .order('created_at', { ascending: false })
    .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1);

  if (scope === 'county' && profile?.county) {
    query = query.eq('county', profile.county);
  } else if (scope === 'city' && profile?.community) {
    query = query.eq('community', profile.community);
  } else if (scope === 'state' && profile?.state) {
    query = query.eq('state', profile.state);
  }
  // 'national' = no location filter

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export function useSocialFeed({ scope, user }: { scope: Scope; user: User }) {
  return useInfiniteQuery({
    queryKey: queryKeys.posts.list(scope, 'social'),
    queryFn: ({ pageParam }) => fetchPosts({ scope, userId: user.id, pageParam: pageParam as number }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.length : undefined,
    enabled: !!user?.id,
  });
}

export function useLikePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, userId, liked }: { postId: string; userId: string; liked: boolean }) => {
      if (liked) {
        await supabase.from('likes').delete().eq('post_id', postId).eq('profile_id', userId);
      } else {
        await supabase.from('likes').insert({ post_id: postId, profile_id: userId });
      }
    },
    onMutate: async ({ postId, userId, liked }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.posts.all });

      // Optimistically update every cached feed that contains this post
      queryClient.setQueriesData({ queryKey: queryKeys.posts.all }, (old: any) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page: any[]) =>
            page.map((post: any) => {
              if (post.id !== postId) return post;
              const likes: any[] = post.likes ?? [];
              return {
                ...post,
                likes: liked
                  ? likes.filter((l: any) => l.profile_id !== userId)
                  : [...likes, { profile_id: userId }],
              };
            })
          ),
        };
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
    },
  });
}
