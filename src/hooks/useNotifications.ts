import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryKeys } from '../lib/queryKeys';

export function useNotifications(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.notifications.list(userId ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*, profiles:sender_id (id, name, avatar_url)')
        .eq('recipient_id', userId!)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userId,
    staleTime: 1000 * 30, // notifications go stale faster
  });
}

export function useUnreadCount(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(userId ?? ''),
    queryFn: async () => {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', userId!)
        .eq('is_read', false);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!userId,
    staleTime: 1000 * 30,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ notificationId, userId }: { notificationId: string; userId: string }) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      if (error) throw error;
    },
    onMutate: async ({ notificationId, userId }) => {
      // Optimistically drop the unread count
      queryClient.setQueryData(
        queryKeys.notifications.unreadCount(userId),
        (old: number) => Math.max(0, (old ?? 1) - 1)
      );
      // Mark it read in the list
      queryClient.setQueryData(
        queryKeys.notifications.list(userId),
        (old: any[]) => old?.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    },
    onSettled: (_data, _err, vars) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list(vars.userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount(vars.userId) });
    },
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('recipient_id', userId)
        .eq('is_read', false);
      if (error) throw error;
    },
    onMutate: async (userId) => {
      queryClient.setQueryData(queryKeys.notifications.unreadCount(userId), 0);
      queryClient.setQueryData(
        queryKeys.notifications.list(userId),
        (old: any[]) => old?.map(n => ({ ...n, is_read: true }))
      );
    },
    onSettled: (_data, _err, userId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list(userId) });
    },
  });
}
