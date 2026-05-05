import React, { useState, Suspense } from 'react';
import { 
  Menu,
  X,
  Search as SearchIcon,
  Bell,
  LogOut,
  Moon,
  Sun,
  Loader2,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp, type Env } from '../context/AppContext';
import { Avatar } from './Avatar';
import { SignUpFlow } from './SignUpFlow';
import { TevisChat } from './TevisChat';
import { GlobalChatBubbles } from './GlobalChatBubbles';

interface MinimalLayoutProps {
  renderView: () => React.ReactNode;
  SearchOverlay: React.ComponentType<any>;
  setActivePostId: (id: string | null) => void;
  setActiveStoreId: (id: string | null) => void;
  setActiveProfileId: (id: string | null) => void;
  setActiveCommentId: (id: string | null) => void;
  updateAvailable: boolean;
  onUpdate: () => void;
}

export const MinimalLayout: React.FC<MinimalLayoutProps> = ({ 
  renderView, 
  SearchOverlay,
  setActivePostId,
  setActiveStoreId,
  setActiveProfileId,
  setActiveCommentId,
  updateAvailable,
  onUpdate
}) => {
  const { 
    user, env, theme, unreadCount, isSearchOpen,
    setEnv, setActiveTab, setIsSearchOpen, toggleTheme, logout, isSetxIO
  } = useApp();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isTevisOpen, setIsTevisOpen] = useState(false);

  const navigation = [
    { id: 'discover', label: 'Discover', icon: <SearchIcon size={20} /> },
    { id: 'social',   label: 'Social',   icon: <SearchIcon size={20} /> },
    { id: 'market',   label: 'Market',   icon: <SearchIcon size={20} /> },
    { id: 'events',   label: 'Events',   icon: <SearchIcon size={20} /> },
    { id: 'news',     label: 'News',     icon: <SearchIcon size={20} /> },
    { id: 'faith',    label: 'Faith',    icon: <SearchIcon size={20} /> },
  ];

  const handleNavClick = (id: Env) => {
    setEnv(id);
    setActiveTab(0);
    setIsMenuOpen(false);
    setActivePostId(null);
    setActiveStoreId(null);
    setActiveProfileId(null);
    setActiveCommentId(null);
  };

  return (
    <div className="minimal-layout" style={{ 
      minHeight: '100vh', 
      background: 'var(--bg-main)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Top Header */}
      {!isSetxIO && (
        <header style={{
          height: '64px',
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid var(--glass-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text)', cursor: 'pointer' }}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: theme.includes('light') ? '#000' : '#fff' }}>
              SETX <span style={{ 
                color: theme.startsWith('io-') ? '#7000f4' : (
                  env === 'discover' ? '#06b6d4' : 
                  env === 'social'   ? '#3b82f6' : 
                  env === 'events'   ? '#facc15' : 
                  env === 'news'     ? '#1e40af' : 
                  env === 'faith'    ? '#8b5cf6' : 
                  env === 'market'   ? '#10b981' : 
                  env === 'eats'     ? '#f97316' : 
                  env === 'services' ? '#334155' : 
                  env === 'jobs'     ? '#172554' : 
                  'var(--primary)'
                ),
                transition: 'color 0.3s ease'
              }}>360</span>
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button 
              onClick={() => setIsSearchOpen(true)}
              style={{ background: 'var(--glass-bg-strong)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)', cursor: 'pointer' }}
            >
              <SearchIcon size={20} />
            </button>
            
            {user && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ position: 'relative' }}>
                  <Bell size={22} color="var(--text-muted)" />
                  {unreadCount > 0 && <span style={{ position: 'absolute', top: -2, right: -2, background: 'red', color: 'white', fontSize: '10px', borderRadius: '50%', width: '14px', height: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{unreadCount}</span>}
                </div>
                <Avatar url={user.avatar_url} name={user.name} size={36} />
              </div>
            )}
          </div>
        </header>
      )}

      {/* Mobile/Side Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            style={{
              position: 'fixed',
              top: '64px',
              left: 0,
              bottom: 0,
              width: '280px',
              background: 'var(--bg-card)',
              zIndex: 99,
              padding: '24px',
              boxShadow: '10px 0 30px rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Navigation</p>
              {navigation.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id as Env)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: 'none',
                    background: env === item.id ? 'var(--primary-light)' : 'transparent',
                    color: env === item.id ? 'var(--primary)' : 'var(--text)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
              <button 
                onClick={toggleTheme}
                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: 'none', background: 'var(--glass-bg-strong)', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', cursor: 'pointer' }}
              >
                {theme.includes('light') ? <Moon size={20} /> : <Sun size={20} />}
                {theme.includes('light') ? 'Dark Mode' : 'Light Mode'}
              </button>
              <button 
                onClick={logout}
                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: 'none', background: 'transparent', color: '#ff4444', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
              >
                <LogOut size={20} />
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '20px' }}>
        {(user || isSetxIO || env === 'labs') ? (
          <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}><Loader2 className="animate-spin" size={32} color="var(--primary)" /></div>}>
            {renderView()}
          </Suspense>
        ) : (
          <SignUpFlow />
        )}
      </main>

      {/* Overlay to close menu */}
      {isMenuOpen && <div onClick={() => setIsMenuOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 98, top: '64px' }} />}

      <AnimatePresence>
        {updateAvailable && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="update-toast glass" style={{ position: 'fixed', bottom: '100px', left: '20px', right: '20px', zIndex: 2000, padding: '16px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(112, 0, 244, 0.9)', color: 'white', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Sparkles size={20} />
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>A new version of SETX 360 is ready!</span>
            </div>
            <button onClick={onUpdate} style={{ background: 'white', color: '#7000f4', border: 'none', padding: '8px 16px', borderRadius: '12px', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}>Update Now</button>
          </motion.div>
        )}
      </AnimatePresence>

      <Suspense fallback={null}>
        <SearchOverlay 
          isOpen={isSearchOpen} 
          onClose={() => setIsSearchOpen(false)}
          onNavigate={(newEnv: string, newTab: number, params?: Record<string, string>) => {
            setEnv(newEnv as any);
            setActiveTab(newTab);
            if (params?.userId) setActiveProfileId(params.userId);
            if (params?.storeId) setActiveStoreId(params.storeId);
            if (params?.postId) { setActivePostId(params.postId); setActiveCommentId(null); }
          }}
          user={user}
        />
      </Suspense>

      <TevisChat user={user} isOpen={isTevisOpen} onClose={() => setIsTevisOpen(false)} />
      <GlobalChatBubbles user={user} />
      
      {/* Floating Action Button for Tevis */}
      {!isSetxIO && user && (
        <button 
          onClick={() => setIsTevisOpen(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'var(--primary)',
            color: 'white',
            border: 'none',
            boxShadow: '0 8px 24px rgba(var(--primary-rgb), 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 1000
          }}
        >
          <Avatar url="/logo-neo.png" size={40} />
        </button>
      )}
    </div>
  );
};
