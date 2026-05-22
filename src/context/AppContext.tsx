import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { User, StaffClearance } from '../types/user';

export type Env = 'discover' | 'search' | 'social' | 'market' | 'eats' | 'rides' | 'services' | 'events' | 'wallet' | 'care' | 'homes' | 'auto' | 'travel' | 'jobs' | 'media' | 'art' | 'faith' | 'sports' | 'news' | 'civics' | 'admin' | 'dashboard' | 'labs' | 'me';
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
  env: Env;
  theme: Theme;
  scope: Scope;
  activeTab: number;
  unreadCount: number;
  isLoading: boolean;
  isSearchOpen: boolean;
  onlineUsers: Set<string>;
  setIsSearchOpen: (open: boolean) => void;
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
      const migrated = localStorage.getItem('ecity_theme_migrated_neodark');
      if (!migrated) {
        localStorage.setItem('ecity_theme_migrated_neodark', 'true');
        const defaultTheme = isSetxIO ? 'io-dark' : 'neo-dark';
        localStorage.setItem('ecity_theme', defaultTheme);
        return defaultTheme;
      }
      const saved = localStorage.getItem('ecity_theme') as Theme;
      if (saved) return saved;
    }
    if (isSetxIO) return 'io-dark';
    return 'neo-dark';
  });
  const [layout, setLayoutState] = useState<Layout>(() => (localStorage.getItem('ecity_layout') as Layout) || 'classic');
  
  
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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

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

    setUser(userData);
    
    // Auto-switch env if just logged in or if no environment is set
    const currentEnv = localStorage.getItem('ecity_env');
    const isNewSignIn = isSignInEvent || !currentEnv;

    if (isNewSignIn) {
      if (userData.email === 'setxplatform@gmail.com' || userData.role === 'admin') {
        setEnv('admin');
        setActiveTab(0);
      } else if (isSetxIO) {
        setEnv('labs');
        setActiveTab(0);
      } else {
        setEnv('discover');
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
    env,
    theme,
    scope,
    activeTab,
    unreadCount,
    isLoading,
    isSearchOpen,
    onlineUsers,
    setIsSearchOpen,
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
    setLayout
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
