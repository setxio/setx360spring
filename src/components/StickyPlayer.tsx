import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Heart, SkipBack, Play, Pause, SkipForward, ChevronDown, Volume2, List } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';

export const StickyPlayer: React.FC = () => {
  const { user, currentSong, isPlaying, togglePlay, setIsPlaying, env, setIsQueueModalOpen, playNext, playPrevious } = useApp();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [progress, setProgress] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  // Sticky Player State
  const [showStickyPlayer, setShowStickyPlayer] = useState(false);
  const isLocalPauseRef = useRef(false);

  useEffect(() => {
    if (!user?.id || !currentSong?.id) {
      setIsLiked(false);
      return;
    }
    const checkLiked = async () => {
      const { data: likedPlaylist } = await supabase.from('media_playlists')
        .select('id').eq('user_id', user.id).eq('title', 'Liked Songs').single();
      if (!likedPlaylist) { setIsLiked(false); return; }
      
      const { data: mapping } = await supabase.from('media_playlist_tracks')
        .select('track_id').eq('playlist_id', likedPlaylist.id).eq('track_id', currentSong.id).single();
      setIsLiked(!!mapping);
    };
    checkLiked();
  }, [user, currentSong]);

  const handleToggleLike = async () => {
    if (!user?.id || !currentSong?.id) return;
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);

    let { data: likedPlaylist } = await supabase.from('media_playlists')
      .select('id').eq('user_id', user.id).eq('title', 'Liked Songs').single();
      
    if (!likedPlaylist) {
      const { data: newPlaylist } = await supabase.from('media_playlists').insert({
        user_id: user.id, title: 'Liked Songs', visibility: 'private'
      }).select().single();
      likedPlaylist = newPlaylist;
    }
    
    if (!likedPlaylist) return;

    if (newLikedState) {
      await supabase.from('media_playlist_tracks').insert({
        playlist_id: likedPlaylist.id, track_id: currentSong.id
      });
    } else {
      await supabase.from('media_playlist_tracks').delete()
        .eq('playlist_id', likedPlaylist.id).eq('track_id', currentSong.id);
    }
  };

  useEffect(() => {
    if (isPlaying) {
      setShowStickyPlayer(true);
    } else {
      if (!isLocalPauseRef.current) {
        setShowStickyPlayer(false);
      }
      isLocalPauseRef.current = false;
    }
  }, [isPlaying]);

  useEffect(() => {
    if (showStickyPlayer && env !== 'home') {
      document.documentElement.style.setProperty('--sticky-player-offset', '90px');
      document.body.classList.add('has-sticky-player');
    } else {
      document.documentElement.style.setProperty('--sticky-player-offset', '0px');
      document.body.classList.remove('has-sticky-player');
    }
  }, [showStickyPlayer, env]);

  const handleStickyPlayPause = () => {
    isLocalPauseRef.current = true;
    togglePlay();
  };

  const handleDragEnd = (e: any, { offset }: any) => {
    if (offset.x > 100) {
      setShowStickyPlayer(false);
      if (isPlaying) {
        setIsPlaying(false);
      }
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.log('Audio playback prevented:', e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentSong]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const total = audioRef.current.duration;
      setProgress((current / total) * 100 || 0);
    }
  };

  // Derive a dominant color from cover (or use purple fallback)
  const accentColor = currentSong?.accentColor || '#8b5cf6';

  return (
    <>
      {/* Global Audio Element */}
      <audio 
        ref={audioRef}
        src={currentSong?.audioUrl || currentSong?.audio_url}
        onTimeUpdate={handleTimeUpdate}
        onEnded={playNext}
      />

      {/* ─── Full-Screen Immersive Player ─── */}
      <AnimatePresence>
        {isFullScreen && currentSong && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 200 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 99999,
              display: 'flex', flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Blurred ambient background */}
            <div style={{
              position: 'absolute', inset: 0,
              background: `radial-gradient(ellipse at 50% 30%, ${accentColor}88 0%, #0a0a0f 70%)`,
              filter: 'blur(0px)',
            }} />
            {/* Moving ambient orbs */}
            <div style={{ position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', background: `${accentColor}44`, filter: 'blur(80px)', top: '-60px', left: '-60px', animation: 'ambientFloat 8s ease-in-out infinite' }} />
            <div style={{ position: 'absolute', width: '200px', height: '200px', borderRadius: '50%', background: `${accentColor}33`, filter: 'blur(60px)', bottom: '120px', right: '-40px', animation: 'ambientFloat 11s ease-in-out infinite reverse' }} />

            <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%', padding: '0 24px' }}>
              {/* Top bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '56px', marginBottom: '32px' }}>
                <button onClick={() => setIsFullScreen(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(10px)' }}>
                  <ChevronDown size={22} color="#fff" />
                </button>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>Now Playing</p>
                </div>
                <button onClick={() => setIsQueueModalOpen(true)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(10px)' }}>
                  <List size={20} color="#fff" />
                </button>
              </div>

              {/* Vinyl / Album Art */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px' }}>
                <motion.div
                  animate={{ rotate: isPlaying ? 360 : 0 }}
                  transition={{ duration: 12, repeat: Infinity, ease: 'linear', repeatType: 'loop' }}
                  style={{
                    width: '240px', height: '240px', borderRadius: '50%',
                    background: currentSong.cover
                      ? `url(${currentSong.cover}) center/cover`
                      : `conic-gradient(from 0deg, #111, #222, ${accentColor}, #111)`,
                    boxShadow: `0 0 60px ${accentColor}88, 0 20px 60px rgba(0,0,0,0.6)`,
                    border: '4px solid rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative',
                    flexShrink: 0,
                  }}
                >
                  {/* Center hole */}
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#111', border: '3px solid rgba(255,255,255,0.1)', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.8)' }} />
                </motion.div>
              </div>

              {/* Track Info */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <h2 style={{ margin: '0 0 4px', fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>{currentSong.title}</h2>
                  <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '1rem' }}>{currentSong.artist}</p>
                </div>
                <button onClick={handleToggleLike} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}>
                  <Heart size={28} color={isLiked ? '#f43f5e' : 'rgba(255,255,255,0.5)'} fill={isLiked ? '#f43f5e' : 'none'} />
                </button>
              </div>

              {/* Progress Bar */}
              <div style={{ marginBottom: '32px' }}>
                <div
                  style={{ height: '4px', background: 'rgba(255,255,255,0.15)', borderRadius: '2px', marginBottom: '8px', cursor: 'pointer', position: 'relative' }}
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const pct = (e.clientX - rect.left) / rect.width;
                    if (audioRef.current && audioRef.current.duration) {
                      audioRef.current.currentTime = pct * audioRef.current.duration;
                    }
                  }}
                >
                  <div style={{ height: '100%', width: `${progress}%`, background: `linear-gradient(90deg, ${accentColor}, #fff)`, borderRadius: '2px', transition: 'width 0.1s linear' }} />
                  <div style={{ position: 'absolute', top: '50%', left: `${progress}%`, transform: 'translate(-50%, -50%)', width: '12px', height: '12px', borderRadius: '50%', background: '#fff', boxShadow: '0 0 8px rgba(0,0,0,0.4)' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                  <span>0:00</span>
                  <span>3:45</span>
                </div>
              </div>

              {/* Controls */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <button onClick={playPrevious} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}>
                  <SkipBack size={32} color="rgba(255,255,255,0.8)" />
                </button>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleStickyPlayPause}
                  style={{ width: 72, height: 72, borderRadius: '50%', background: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: `0 0 30px ${accentColor}88` }}
                >
                  {isPlaying ? <Pause size={32} color="#111" /> : <Play size={32} color="#111" style={{ marginLeft: '4px' }} />}
                </motion.button>
                <button onClick={playNext} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}>
                  <SkipForward size={32} color="rgba(255,255,255,0.8)" />
                </button>
              </div>

              {/* Volume */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Volume2 size={18} color="rgba(255,255,255,0.4)" />
                <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.15)', borderRadius: '2px' }}>
                  <div style={{ width: '70%', height: '100%', background: 'rgba(255,255,255,0.5)', borderRadius: '2px' }} />
                </div>
              </div>
            </div>

            <style>{`
              @keyframes ambientFloat {
                0%, 100% { transform: translateY(0px) scale(1); }
                50% { transform: translateY(-30px) scale(1.1); }
              }
            `}</style>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Sticky Mini Player ─── */}
      <AnimatePresence>
        {currentSong && showStickyPlayer && env !== 'home' && !isFullScreen && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1, x: 0 }}
            exit={{ y: 100, opacity: 0 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            style={{
              position: 'fixed',
              bottom: '16px',
              left: '16px',
              right: '16px',
              background: 'var(--glass-bg-strong)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              zIndex: 9999,
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
            }}
          >
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden', flex: 1, minWidth: 0, cursor: 'pointer' }}
              onClick={() => setIsFullScreen(true)}
            >
              <div style={{ position: 'relative', width: 40, height: 40, borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                {currentSong.cover ? (
                  <img src={currentSong.cover} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Music size={20} color="#fff" />
                  </div>
                )}
              </div>
              <div style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
                <p style={{ margin: '0 0 4px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{currentSong.title}</p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{currentSong.artist}</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
              <button style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex' }}>
                <Heart size={20} color={isLiked ? '#f43f5e' : 'var(--text-muted)'} fill={isLiked ? '#f43f5e' : 'none'} onClick={handleToggleLike} />
              </button>
              <button onClick={playPrevious} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex' }}>
                <SkipBack size={20} color="var(--text)" />
              </button>
              <button 
                onClick={handleStickyPlayPause}
                style={{ background: 'var(--primary)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                {isPlaying ? <Pause size={18} color="#fff" /> : <Play size={18} color="#fff" style={{ marginLeft: '2px' }} />}
              </button>
              <button onClick={playNext} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex' }}>
                <SkipForward size={20} color="var(--text)" />
              </button>
            </div>

            {/* Mini Progress Bar */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: 'var(--border-color)', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: 'var(--primary)', transition: 'width 0.1s linear' }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
