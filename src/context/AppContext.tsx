import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export type Env = 'discover' | 'social' | 'market' | 'eats' | 'rides' | 'services' | 'events' | 'wallet' | 'care' | 'homes' | 'auto' | 'travel' | 'jobs' | 'media' | 'art' | 'faith' | 'sports' | 'news' | 'civics' | 'admin' | 'dashboard';
export type Theme =
  | 'light' | 'dark'
  | 'civic-classic-light' | 'civic-classic-dark'
  | 'setx-light' | 'setx-dark'
  | 'neo-light' | 'neo-dark'
  | 'neo-ii-light' | 'neo-ii-dark'
  | 'twilight-light' | 'twilight-dark'
  | 'twilight-ii-light' | 'twilight-ii-dark'
  | 'efutura-light' | 'efutura-dark'
  | 'porch' | 'spring' | 'summer' | 'autumn' | 'winter' | 'dynamic' | 'custom';

import { getSeasonalTheme, applyCustomThemeVariables, clearCustomThemeVariables } from '../lib/theme';

export type Scope = 'national' | 'state' | 'county' | 'city';

interface AppContextType {
  user: any;
  env: Env;
  theme: Theme;
  scope: Scope;
  activeTab: number;
  unreadCount: number;
  isLoading: boolean;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  setEnv: (env: Env) => void;
  setTheme: (theme: Theme) => void;
  setScope: (scope: Scope) => void;
  setActiveTab: (tab: number) => void;
  toggleTheme: () => void;
  logout: () => Promise<void>;
  updateUser: (data: any) => void;
  refreshUser: () => Promise<void>;
  isSetxDomain: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isSetxDomain = hostname.includes('setx360.com');

  const [env, setEnvState] = useState<Env>(() => (localStorage.getItem('ecity_env') as Env) || 'social');
  const [theme, setThemeState] = useState<Theme>(() => (localStorage.getItem('ecity_theme') as Theme) || 'setx-dark');
  const [activeTab, setActiveTabState] = useState(() => Number(localStorage.getItem('ecity_tab')) || 0);
  const [scope, setScopeState] = useState<Scope>(() => {
    return (localStorage.getItem('ecity_scope') as Scope) || 'county';
  });
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

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
      if (prev === 'light') next = 'dark';
      else if (prev === 'dark') next = 'light';
      else if (prev.endsWith('-light')) next = prev.replace('-light', '-dark') as Theme;
      else if (prev.endsWith('-dark')) next = prev.replace('-dark', '-light') as Theme;
      else next = prev.includes('dark') ? 'light' : 'dark';
      
      localStorage.setItem('ecity_theme', next);
      document.documentElement.setAttribute('data-theme', next);

      
      return next;
    });
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setEnv('discover');
    setActiveTab(0);
  };

  const handleAuth = useCallback(async (supabaseUser: any) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', supabaseUser.id)
      .single();

    const userData = {
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
      clearances: [] as any[]
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
    
    // Auto-switch env if just logged in and in discover
    if (localStorage.getItem('ecity_env') === 'discover' || !localStorage.getItem('ecity_env')) {
      if (userData.role === 'admin') {
        setEnv('admin');
        setActiveTab(0);
      } else {
        setEnv('social');
        setActiveTab(0);
      }
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await handleAuth(session.user);
      }
      setIsLoading(false);
    };
    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        handleAuth(session.user);
      } else {
        setUser(null);
        setEnv('social');
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

  // Sync data-env/theme attributes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-env', env);
  }, [theme, env]);

  const value = {
    user,
    env,
    theme,
    scope,
    activeTab,
    unreadCount,
    isLoading,
    isSearchOpen,
    setIsSearchOpen,
    setEnv,
    setTheme,
    setScope,
    setActiveTab,
    toggleTheme,
    logout,
    updateUser: (data: any) => setUser((prev: any) => ({ ...prev, ...data })),
    refreshUser: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await handleAuth(session.user);
      }
    },
    isSetxDomain
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
