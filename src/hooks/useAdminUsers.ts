import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryKeys } from '../lib/queryKeys';

type AdminUserFilter = 'all' | 'pending_verification' | 'suspended' | 'business' | 'official';

export function useAdminUsers(filter: AdminUserFilter = 'all') {
  return useQuery({
    queryKey: queryKeys.admin.users(filter),
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (filter === 'pending_verification') {
        query = query.eq('verification_requested', true).eq('is_verified', false);
      } else if (filter === 'suspended') {
        query = query.not('suspended_until', 'is', null);
      } else if (filter === 'business') {
        query = query.in('role', ['business', 'vendor', 'restaurant']);
      } else if (filter === 'official') {
        query = query.in('role', ['official', 'chamber', 'city_worker', 'city_manager']);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 1000 * 60, // admin data: 1 min cache
  });
}

export function useAdminStats() {
  return useQuery({
    queryKey: queryKeys.admin.stats(),
    queryFn: async () => {
      const [users, posts, stores, reports] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('posts').select('*', { count: 'exact', head: true }),
        supabase.from('stores').select('*', { count: 'exact', head: true }),
        supabase.from('civic_incidents').select('*', { count: 'exact', head: true }).eq('status', 'open'),
      ]);
      return {
        totalUsers: users.count ?? 0,
        totalPosts: posts.count ?? 0,
        totalStores: stores.count ?? 0,
        openReports: reports.count ?? 0,
      };
    },
    staleTime: 1000 * 60 * 5,
  });
}
