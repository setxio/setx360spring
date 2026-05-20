/**
 * Centralized query key factory.
 * Using objects instead of arrays lets us invalidate whole namespaces easily:
 *   queryClient.invalidateQueries({ queryKey: queryKeys.posts.all })
 */
export const queryKeys = {
  // Social feed
  posts: {
    all: ['posts'] as const,
    list: (scope: string, env: string) => ['posts', 'list', scope, env] as const,
    detail: (id: string) => ['posts', 'detail', id] as const,
    byUser: (userId: string) => ['posts', 'byUser', userId] as const,
  },

  // Profiles
  profiles: {
    all: ['profiles'] as const,
    detail: (id: string) => ['profiles', 'detail', id] as const,
    followers: (id: string) => ['profiles', 'followers', id] as const,
    following: (id: string) => ['profiles', 'following', id] as const,
  },

  // Notifications
  notifications: {
    all: ['notifications'] as const,
    list: (userId: string) => ['notifications', 'list', userId] as const,
    unreadCount: (userId: string) => ['notifications', 'unreadCount', userId] as const,
  },

  // Market
  stores: {
    all: ['stores'] as const,
    list: (scope: string) => ['stores', 'list', scope] as const,
    detail: (id: string) => ['stores', 'detail', id] as const,
    products: (storeId: string) => ['stores', 'products', storeId] as const,
  },

  // Events
  events: {
    all: ['events'] as const,
    list: (scope: string) => ['events', 'list', scope] as const,
    detail: (id: string) => ['events', 'detail', id] as const,
  },

  // Messages / Conversations
  messages: {
    all: ['messages'] as const,
    conversations: (userId: string) => ['messages', 'conversations', userId] as const,
    thread: (conversationId: string) => ['messages', 'thread', conversationId] as const,
  },

  // Admin
  admin: {
    users: (filter: string) => ['admin', 'users', filter] as const,
    stats: () => ['admin', 'stats'] as const,
  },
} as const;
