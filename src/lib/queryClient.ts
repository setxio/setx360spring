import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 2 minutes — no refetch on every re-render
      staleTime: 1000 * 60 * 2,
      // Keep cached data for 10 minutes after component unmounts
      gcTime: 1000 * 60 * 10,
      // Only retry once on failure (Supabase errors are usually real)
      retry: 1,
      // Refetch when user returns to the tab
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 0,
    },
  },
});
