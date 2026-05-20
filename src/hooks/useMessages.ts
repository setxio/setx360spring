import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryKeys } from '../lib/queryKeys';

export function useConversations(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.messages.conversations(userId ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          participants:conversation_participants (
            profiles:profile_id (id, name, avatar_url, handle, show_online_status)
          ),
          last_message:messages (content, created_at, sender_id)
        `)
        .order('updated_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userId,
    staleTime: 1000 * 30,
  });
}

export function useMessages(conversationId: string | null) {
  return useQuery({
    queryKey: queryKeys.messages.thread(conversationId ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*, profiles:sender_id (id, name, avatar_url)')
        .eq('conversation_id', conversationId!)
        .order('created_at', { ascending: true })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!conversationId,
    staleTime: 1000 * 15, // messages go stale fast
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      senderId,
      content,
    }: {
      conversationId: string;
      senderId: string;
      content: string;
    }) => {
      const { data, error } = await supabase
        .from('messages')
        .insert({ conversation_id: conversationId, sender_id: senderId, content })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.thread(vars.conversationId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.all });
    },
  });
}
