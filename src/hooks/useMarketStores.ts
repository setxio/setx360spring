import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryKeys } from '../lib/queryKeys';
import type { Scope } from '../context/AppContext';

export function useMarketStores(scope: Scope, userId?: string) {
  return useQuery({
    queryKey: queryKeys.stores.list(scope),
    queryFn: async () => {
      let query = supabase
        .from('stores')
        .select('*, profiles:owner_id (id, name, avatar_url, county, state)')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(40);

      // Scope filtering: fetch user's location then filter
      if (userId && scope !== 'national') {
        const { data: profile } = await supabase
          .from('profiles')
          .select('county, state, community')
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

export function useStoreProducts(storeId: string | null) {
  return useQuery({
    queryKey: queryKeys.stores.products(storeId ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bridge_items')
        .select('*')
        .eq('store_id', storeId!)
        .eq('is_available', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!storeId,
  });
}

export function useStore(storeId: string | null) {
  return useQuery({
    queryKey: queryKeys.stores.detail(storeId ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stores')
        .select('*, profiles:owner_id (*)')
        .eq('id', storeId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!storeId,
  });
}
