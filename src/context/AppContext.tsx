import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { User, StaffClearance } from '../types/user';

export type Env = 'home' | 'discover' | 'search' | 'social' | 'market' | 'eats' | 'rides' | 'services' | 'events' | 'wallet' | 'care' | 'homes' | 'auto' | 'travel' | 'jobs' | 'gigs' | 'videos' | 'music' | 'art' | 'faith' | 'sports' | 'news' | 'civics' | 'admin' | 'dashboard' | 'labs' | 'me' | 'apps' | 'contacts' | 'phone' | 'messages' | 'classifieds' | 'notifications' | 'admin_messages' | 'proplus' | 'crowdfund' | 'charity' | 'page_creator' | 'page_manager';
export type Theme =
  | 'io-light' | 'io-dark'
  | 'civic-classic-light' | 'civic-classic-dark'
  | 'setx-light' | 'setx-dark'
  | 'neo-light' | 'neo-dark'
  | 'neo-ii-light' | 'neo-ii-dark'
  | 'twilight-light' | 'twilight-dark'
  | 'twilight-ii-light' | 'twilight-ii-dark'
  | 'efutura-light' | 'efutura-dark'
  | 'porch' | 'spring' | 'summer' | 'autumn' | 'winter' | 'dynamic' | 'custom';
export type Layout = 'classic' | 'minimal' | 'setx-v1';

import { getSeasonalTheme, applyCustomThemeVariables, clearCustomThemeVariables } from '../lib/theme';

export type Scope = 'national' | 'state' | 'county' | 'city';

interface AppContextType {
  user: User | null;
  userPages: import('../types/user').Page[];
  setUserPages: (pages: import('../types/user').Page[]) => void;
  activeContext: import('../types/user').Page | null; // null means personal user context
  setActiveContext: (page: import('../types/user').Page | null) => void;
  env: Env;
  theme: Theme;
  scope: Scope;
  activeTab: number;
  unreadCount: number;
  isLoading: boolean;
  localSearchQuery: string;
  masterSearchQuery: string;
  onlineUsers: Set<string>;
  setLocalSearchQuery: (query: string) => void;
  setMasterSearchQuery: (query: string) => void;
  setEnv: (env: Env) => void;
  setTheme: (theme: Theme) => void;
  setScope: (scope: Scope) => void;
  setActiveTab: (tab: number) => void;
  toggleTheme: () => void;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  refreshUser: () => Promise<void>;
  isSetxDomain: boolean;
  isSetxIO: boolean;
  isSetx360: boolean;
  projectSlug: string | null;
  layout: Layout;
  setLayout: (layout: Layout) => void;
  currentSong: any;
  isPlaying: boolean;
  playSong: (song: any, contextQueue?: any[]) => void;
  togglePlay: () => void;
  setIsPlaying: (playing: boolean) => void;
  isQueueModalOpen: boolean;
  setIsQueueModalOpen: (open: boolean) => void;
  queue: any[];
  queueIndex: number;
  playNext: () => void;
  playPrevious: () => void;
  // Music View State Persistence
  musicSearchQuery: string;
  setMusicSearchQuery: (q: string) => void;
  musicIsSearchActive: boolean;
  setMusicIsSearchActive: (a: boolean) => void;
  musicActiveArtist: any | null;
  setMusicActiveArtist: (a: any | null) => void;
  musicActivePlaylist: any | null;
  setMusicActivePlaylist: (p: any | null) => void;
  translationLanguage: string;
  setTranslationLanguage: (lang: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  // Default to true for this codebase unless explicitly on an efutura domain
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const isSetxIO = hostname.toLowerCase().includes('setx.io') || params?.get('project') === 'io';
  const isSetx360 = hostname.toLowerCase().includes('setx360.com') || params?.get('project') === '360';
  const isSetxDomain = !hostname.includes('efutura.com') || hostname.includes('setx360') || hostname.includes('setxio') || hostname.includes('setx.io') || params?.get('project') !== null;

  // Detect Project Slug (e.g. setx.io/my-business)
  const pathParts = pathname.split('/').filter(Boolean);
  const projectSlug = (isSetxIO && pathParts.length > 0) ? pathParts[0] : null;

  const [env, setEnvState] = useState<Env>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const envParam = urlParams.get('env');
      if (envParam) return envParam as Env;
      if (isSetxIO) return 'market';
    }
    return (localStorage.getItem('ecity_env') as Env) || 'me';
  });

  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const migrated = localStorage.getItem('ecity_theme_migrated_civic_dark_default');
      if (!migrated) {
        localStorage.setItem('ecity_theme_migrated_civic_dark_default', 'true');
        const defaultTheme = 'civic-classic-dark';
        localStorage.setItem('ecity_theme', defaultTheme);
        return defaultTheme;
      }
      const saved = localStorage.getItem('ecity_theme') as Theme;
      if (saved) return saved;
    }
    return 'civic-classic-dark';
  });
  const [layout, setLayoutState] = useState<Layout>(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ecity_layout', 'minimal');
    }
    return 'minimal';
  });
  
  
  const [activeTab, setActiveTabState] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlTab = params.get('tab');
      if (urlTab !== null) {
        localStorage.setItem('ecity_tab', urlTab);
        return Number(urlTab);
      }
      if (isSetxIO) return 0;
    }
    return Number(localStorage.getItem('ecity_tab')) || 0;
  });
  const [scope, setScopeState] = useState<Scope>(() => {
    return (localStorage.getItem('ecity_scope') as Scope) || 'county';
  });
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [masterSearchQuery, setMasterSearchQuery] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  // Pages Architecture State
  const [userPages, setUserPages] = useState<import('../types/user').Page[]>([]);
  const [activeContext, setActiveContext] = useState<import('../types/user').Page | null>(null);

  const [isQueueModalOpen, setIsQueueModalOpen] = useState(false);

  // Global Audio State
  const [currentSong, setCurrentSong] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('setx_last_played_song');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return null;
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState<any[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);

  // Music UI State Persistence
  const [musicSearchQuery, setMusicSearchQuery] = useState('');
  const [musicIsSearchActive, setMusicIsSearchActive] = useState(false);
  const [musicActiveArtist, setMusicActiveArtist] = useState<any | null>(null);
  const [musicActivePlaylist, setMusicActivePlaylist] = useState<any | null>(null);

  const [translationLanguage, setTranslationLanguageState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ecity_translation_language') || 'en';
    }
    return 'en';
  });

  const setTranslationLanguage = (val: string) => {
    setTranslationLanguageState(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ecity_translation_language', val);
      
      const domain = window.location.hostname;
      // Clear old cookies to be safe
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=${domain}; path=/;`;
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=.${domain}; path=/;`;

      if (val !== 'en') {
        const cookieVal = `/en/${val}`;
        document.cookie = `googtrans=${cookieVal}; path=/`;
        document.cookie = `googtrans=${cookieVal}; domain=${domain}; path=/`;
        document.cookie = `googtrans=${cookieVal}; domain=.${domain}; path=/`;
      }
    }
  };

  const playSong = useCallback((song: any, contextQueue?: any[]) => {
    setCurrentSong(song);
    setIsPlaying(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('setx_last_played_song', JSON.stringify(song));
    }
    if (contextQueue && contextQueue.length > 0) {
      setQueue(contextQueue);
      const idx = contextQueue.findIndex(s => s.id === song.id);
      setQueueIndex(idx !== -1 ? idx : 0);
    } else {
      setQueue([song]);
      setQueueIndex(0);
    }
  }, []);

  const playNext = useCallback(() => {
    if (queue.length > 0 && queueIndex < queue.length - 1) {
      const nextIndex = queueIndex + 1;
      setQueueIndex(nextIndex);
      setCurrentSong(queue[nextIndex]);
      setIsPlaying(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('setx_last_played_song', JSON.stringify(queue[nextIndex]));
      }
    } else {
      setIsPlaying(false);
    }
  }, [queue, queueIndex]);

  const playPrevious = useCallback(() => {
    if (queue.length > 0 && queueIndex > 0) {
      const prevIndex = queueIndex - 1;
      setQueueIndex(prevIndex);
      setCurrentSong(queue[prevIndex]);
      setIsPlaying(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('setx_last_played_song', JSON.stringify(queue[prevIndex]));
      }
    }
  }, [queue, queueIndex]);

  const togglePlay = useCallback(() => {
    if (currentSong) {
      setIsPlaying(prev => !prev);
    }
  }, [currentSong]);

  // Persistence wrappers
  const setEnv = (val: Env) => {
    setEnvState(val);
    localStorage.setItem('ecity_env', val);
  };

  const setTheme = (val: Theme) => {
    setThemeState(val);
    localStorage.setItem('ecity_theme', val);
    document.documentElement.setAttribute('data-theme', val);
    

    if (val === 'custom') {
      const primary = localStorage.getItem('tx-custom-primary') || '#7000f4';
      const accent = localStorage.getItem('tx-custom-accent') || '#22d3ee';
      const tertiary = localStorage.getItem('tx-custom-tertiary') || primary;
      const buttonStyle = localStorage.getItem('tx-custom-button-style') || 'flat';
      applyCustomThemeVariables(primary, accent, tertiary, buttonStyle);
    } else if (val === 'dynamic') {
      const seasonal = getSeasonalTheme() as Theme;
      document.documentElement.setAttribute('data-theme', seasonal);
      clearCustomThemeVariables();
    } else {
      clearCustomThemeVariables();
    }
  };

  const setLayout = (val: Layout) => {
    setLayoutState(val);
    localStorage.setItem('ecity_layout', val);
  };

  const setActiveTab = (val: number) => {
    setActiveTabState(val);
    localStorage.setItem('ecity_tab', val.toString());
  };

  const setScope = (val: Scope) => {
    // Prevent changing scope if SETX theme is active (unless we want to allow it internally)
    // For now, let's just let it happen but UI will be hidden
    setScopeState(val);
    localStorage.setItem('ecity_scope', val);
  };

  const toggleTheme = () => {
    setThemeState(prev => {
      let next: Theme;
      if (prev === 'io-light') next = 'io-dark';
      else if (prev === 'io-dark') next = 'io-light';
      else if (prev.endsWith('-light')) next = prev.replace('-light', '-dark') as Theme;
      else if (prev.endsWith('-dark')) next = prev.replace('-dark', '-light') as Theme;
      else next = prev.includes('dark') ? 'io-light' : 'io-dark';
      
      localStorage.setItem('ecity_theme', next);
      document.documentElement.setAttribute('data-theme', next);

      return next;
    });
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setEnv('market');
    setActiveTab(0);
  };

  const handleAuth = useCallback(async (supabaseUser: any, isSignInEvent: boolean = false) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', supabaseUser.id)
      .single();

    const userData: User = {
      id: supabaseUser.id,
      name: profile?.name || `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || supabaseUser.user_metadata?.name || supabaseUser.email.split('@')[0],
      first_name: profile?.first_name || supabaseUser.user_metadata?.first_name,
      last_name: profile?.last_name || supabaseUser.user_metadata?.last_name,
      email: supabaseUser.email,
      role: profile?.role || supabaseUser.user_metadata?.role || 'resident',
      location: profile?.location || supabaseUser.user_metadata?.location || 'Visitor',
      community: profile?.community || supabaseUser.user_metadata?.community,
      county: profile?.county || supabaseUser.user_metadata?.county,
      state: profile?.state || supabaseUser.user_metadata?.state || 'Texas',
      country: profile?.country || supabaseUser.user_metadata?.country || 'USA',
      avatar_url: profile?.avatar_url,
      banner_url: profile?.banner_url,
      birth_month: profile?.birth_month || supabaseUser.user_metadata?.birth_month,
      birth_day: profile?.birth_day || supabaseUser.user_metadata?.birth_day,
      birth_year: profile?.birth_year || supabaseUser.user_metadata?.birth_year,
      translation_language: profile?.translation_language || supabaseUser.user_metadata?.translation_language || 'en',
      clearances: [] as StaffClearance[]
    };

    // Fetch staff clearances
    const { data: clearances } = await supabase
      .from('staff_clearance')
      .select('*')
      .eq('profile_id', supabaseUser.id);
    
    if (clearances) {
      userData.clearances = clearances;
    }

    // Fetch user pages
    const { data: pages } = await supabase
      .from('pages')
      .select('*')
      .eq('owner_id', supabaseUser.id);

    setUserPages(pages || []);
    setUser(userData);
    if (userData.translation_language) {
      setTranslationLanguage(userData.translation_language);
    }
    
    // Auto-switch env if just logged in or if no environment is set
    const currentEnv = localStorage.getItem('ecity_env');
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const envParam = urlParams?.get('env');
    
    const isAuthenticatingFromPublic = currentEnv === 'market' || currentEnv === 'search' || !currentEnv;

    if (isSignInEvent && isAuthenticatingFromPublic && !envParam) {
      if (userData.email === 'setxplatform@gmail.com' || userData.role === 'admin') {
        setEnv('admin');
        setActiveTab(0);
      } else {
        setLayout('minimal');
        setEnv('home');
        setActiveTab(0);
      }
    } else if (!currentEnv && !envParam) {
      if (userData.email === 'setxplatform@gmail.com' || userData.role === 'admin') {
        setEnv('admin');
        setActiveTab(0);
      } else if (isSetxIO) {
        setEnv('labs');
        setActiveTab(0);
      } else {
        const currentLayout = localStorage.getItem('ecity_layout') || 'minimal';
        setEnv(currentLayout === 'minimal' ? 'home' : 'search');
        setActiveTab(0);
      }
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await handleAuth(session.user, false);
      }
      setIsLoading(false);
    };
    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        handleAuth(session.user, event === 'SIGNED_IN');
      } else {
        setUser(null);
        setEnv('market');
        setActiveTab(0);
      }
    });

    // Handle Initial Theme Logic
    const savedTheme = localStorage.getItem('ecity_theme') as Theme;
    if (savedTheme === 'custom') {
      const primary = localStorage.getItem('tx-custom-primary') || '#7000f4';
      const accent = localStorage.getItem('tx-custom-accent') || '#22d3ee';
      const tertiary = localStorage.getItem('tx-custom-tertiary') || primary;
      const buttonStyle = localStorage.getItem('tx-custom-button-style') || 'flat';
      applyCustomThemeVariables(primary, accent, tertiary, buttonStyle);
    } else if (savedTheme === 'dynamic') {
      const seasonal = getSeasonalTheme() as Theme;
      document.documentElement.setAttribute('data-theme', seasonal);
    }

    return () => subscription.unsubscribe();
  }, [handleAuth]);

  // Handle Dynamic Branding (Title & Favicon)
  useEffect(() => {
    const favicon = document.getElementById('favicon') as HTMLLinkElement;
    if (isSetxIO) {
      document.title = 'SETX.IO | Regional WaaS Platform';
      if (favicon) favicon.href = '/bolt.png';
    } else if (isSetx360) {
      document.title = 'SETX 360 | The Regional Super-App';
      if (favicon) favicon.href = '/favicon.png';
    } else {
      document.title = 'SETX 360';
      if (favicon) favicon.href = '/favicon.png';
    }
  }, [isSetxIO, isSetx360]);

  // Notifications Sync
  useEffect(() => {
    if (user) {
      const fetchUnreadCount = async () => {
        const { count } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('recipient_id', user.id)
          .eq('is_read', false);
        setUnreadCount(count || 0);
      };
      fetchUnreadCount();

      const channel = supabase
        .channel('app-notifications-global')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${user.id}`
        }, () => setUnreadCount(prev => prev + 1))
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [user]);

  // Online Presence Sync
  useEffect(() => {
    if (user && user.show_online_status !== false) {
      const presenceChannel = supabase.channel('global-online-presence', {
        config: { presence: { key: user.id } }
      });

      presenceChannel.on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const activeIds = new Set<string>();
        Object.keys(state).forEach(key => activeIds.add(key));
        setOnlineUsers(activeIds);
      });

      presenceChannel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ online_at: new Date().toISOString() });
        }
      });

      return () => { supabase.removeChannel(presenceChannel); };
    } else {
      setOnlineUsers(new Set());
    }
  }, [user]);

  // Sync data-env/theme attributes and URL
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-env', env);
    
    // Update URL without reloading
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('env', env);
      url.searchParams.set('tab', activeTab.toString());
      window.history.replaceState({}, '', url.toString());
    }
  }, [theme, env, activeTab]);

  const value = {
    user,
    userPages,
    setUserPages,
    activeContext,
    setActiveContext,
    env,
    theme,
    scope,
    activeTab,
    unreadCount,
    isLoading,
    localSearchQuery,
    masterSearchQuery,
    onlineUsers,
    setLocalSearchQuery,
    setMasterSearchQuery,
    setEnv,
    setTheme,
    setScope,
    setActiveTab,
    toggleTheme,
    logout,
    updateUser: (data: Partial<User>) => setUser((prev: User | null) => prev ? { ...prev, ...data } : prev),
    refreshUser: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await handleAuth(session.user);
      }
    },
    isSetxDomain,
    isSetxIO,
    isSetx360,
    projectSlug,
    layout,
    setLayout,
    currentSong,
    isPlaying,
    playSong,
    togglePlay,
    setIsPlaying,
    isQueueModalOpen,
    setIsQueueModalOpen,
    queue,
    queueIndex,
    playNext,
    playPrevious,
    musicSearchQuery,
    setMusicSearchQuery,
    musicIsSearchActive,
    setMusicIsSearchActive,
    musicActiveArtist,
    setMusicActiveArtist,
    musicActivePlaylist,
    setMusicActivePlaylist,
    translationLanguage,
    setTranslationLanguage
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
