import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryKeys } from '../lib/queryKeys';
import type { Scope } from '../context/AppContext';

export function useEvents(scope: Scope, userId?: string) {
  return useQuery({
    queryKey: queryKeys.events.list(scope),
    queryFn: async () => {
      let query = supabase
        .from('events')
        .select('*, profiles:organizer_id (id, name, avatar_url)')
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(30);

      if (userId && scope !== 'national') {
        const { data: profile } = await supabase
          .from('profiles')
          .select('county, state')
          .eq('id', userId)
          .single();

        if (scope === 'county' && profile?.county) {
          query = query.eq('county', profile.county);
        } else if (scope === 'state' && profile?.state) {
          query = query.eq('state', profile.state);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useEvent(eventId: string | null) {
  return useQuery({
    queryKey: queryKeys.events.detail(eventId ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*, profiles:organizer_id (*)')
        .eq('id', eventId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });
}
