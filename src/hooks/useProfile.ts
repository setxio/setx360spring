import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryKeys } from '../lib/queryKeys';

export function useProfile(profileId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.profiles.detail(profileId ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!profileId,
    staleTime: 1000 * 60 * 5, // profiles are fresh for 5 min
  });
}

export function useFollowers(profileId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.profiles.followers(profileId ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('follows')
        .select('profiles:follower_id (id, name, avatar_url, handle, role)')
        .eq('following_id', profileId!);
      if (error) throw error;
      return (data ?? []).map((f: any) => f.profiles);
    },
    enabled: !!profileId,
  });
}

export function useFollowing(profileId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.profiles.following(profileId ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('follows')
        .select('profiles:following_id (id, name, avatar_url, handle, role)')
        .eq('follower_id', profileId!);
      if (error) throw error;
      return (data ?? []).map((f: any) => f.profiles);
    },
    enabled: !!profileId,
  });
}

export function useFollowUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      followerId,
      followingId,
      isFollowing,
    }: {
      followerId: string;
      followingId: string;
      isFollowing: boolean;
    }) => {
      if (isFollowing) {
        await supabase.from('follows').delete()
          .eq('follower_id', followerId)
          .eq('following_id', followingId);
      } else {
        await supabase.from('follows').insert({ follower_id: followerId, following_id: followingId });
      }
    },
    onSettled: (_data, _err, vars) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profiles.followers(vars.followingId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.profiles.following(vars.followerId) });
    },
  });
}
