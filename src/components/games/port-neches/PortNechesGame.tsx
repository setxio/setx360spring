import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../../../context/AppContext';
import { ArrowLeft, Play, RefreshCw, LogOut, Trophy, X } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Avatar } from '../../Avatar';
import { useShareScore } from '../useShareScore';
import { useGameAudio } from '../useGameAudio';
import { useGameSubmit } from '../useGameSubmit';
import './PortNeches.css';
import '../port-arthur/PortArthur.css';

interface PortNechesGameProps {
  onBack: () => void;
}

interface Obstacle {
  id: string;
  type: 'bench' | 'tugboat';
  x: number;
  y: number;
  width: number;
  height: number;
}

export const PortNechesGame: React.FC<PortNechesGameProps> = ({ onBack }) => {
  const { theme, user } = useApp();
  const isDark = theme.includes('dark') || theme.includes('io') || theme.includes('neo');

  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
  const [score, setScore] = useState(0);
  const [isSliding, setIsSliding] = useState(false);
  const [jumpCount, setJumpCount] = useState(0);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  const { shareScore, isSharing, shareSuccess } = useShareScore('port_neches');
  const { playSound } = useGameAudio();
  const { submitScore, isNewBest, coinsEarned } = useGameSubmit('port_neches');

  const GAME_WIDTH = typeof window !== 'undefined' ? Math.min(window.innerWidth, 800) : 800;

  const bgRef = useRef<HTMLDivElement>(null);
  const userRef = useRef(user);
  userRef.current = user;
  const swipeStartRef = useRef<{ y: number; time: number } | null>(null);

  const engine = useRef({
    score: 0,
    obstacles: [] as Obstacle[],
    baseSpeed: 300,
    bgOffset: 0,
    spawnRate: 2000,
    lastSpawn: 0,
    lastTime: 0,
    isGameOver: false,
    obsId: 0,
    playerY: 0,
    playerVy: 0,
    gravity: 1500,
    jumpForce: -680,
    jumpCount: 0,       // max 2 (double jump)
    isSliding: false,
    slideTimer: 0,      // ms remaining in slide
    SLIDE_DURATION: 600
  });



  const getGroundY = () => document.documentElement.clientHeight - 160;

  const startGame = () => {
    const groundY = getGroundY();
    setScore(0);
    setIsSliding(false);
    setJumpCount(0);
    engine.current = {
      score: 0,
      obstacles: [],
      baseSpeed: 300,
      bgOffset: 0,
      spawnRate: 2000,
      lastSpawn: performance.now(),
      lastTime: performance.now(),
      isGameOver: false,
      obsId: 0,
      playerY: groundY,
      playerVy: 0,
      gravity: 1500,
      jumpForce: -680,
      jumpCount: 0,
      isSliding: false,
      slideTimer: 0,
      SLIDE_DURATION: 600
    };
    setGameState('playing');
    playSound('blip');
  };

  // Double-jump handler
  const handleJump = useCallback(() => {
    const e = engine.current;
    if (e.isGameOver) return;
    if (e.isSliding) { // cancel slide into jump
      e.isSliding = false;
      e.slideTimer = 0;
      setIsSliding(false);
    }
    if (e.jumpCount < 2) {
      playSound('jump');
      const isSecond = e.jumpCount === 1;
      e.jumpCount++;
      e.playerVy = isSecond ? e.jumpForce * 0.85 : e.jumpForce;
      setJumpCount(e.jumpCount);
      if (!e.jumpCount || e.playerY >= getGroundY() - 5) {
        // already on ground — first jump
      }
    }
  }, []);

  // Slide handler
  const handleSlide = useCallback(() => {
    const e = engine.current;
    if (e.isGameOver || e.isSliding) return;
    // only slide when on ground
    const groundY = getGroundY();
    if (e.playerY >= groundY - 10) {
      e.isSliding = true;
      e.slideTimer = e.SLIDE_DURATION;
      setIsSliding(true);
    }
  }, []);

  // Touch: tap = jump, swipe-down = slide
  const handlePointerDown = (evt: React.PointerEvent) => {
    swipeStartRef.current = { y: evt.clientY, time: Date.now() };
  };
  const handlePointerUp = (evt: React.PointerEvent) => {
    if (!swipeStartRef.current) return;
    const dy = evt.clientY - swipeStartRef.current.y;
    const dt = Date.now() - swipeStartRef.current.time;
    swipeStartRef.current = null;
    if (dy > 60 && dt < 400) {
      // Fast swipe down → slide
      handleSlide();
    } else if (Math.abs(dy) < 30) {
      // Tap → jump
      handleJump();
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); handleJump(); }
      if (e.code === 'ArrowDown' || e.code === 'KeyS') { e.preventDefault(); handleSlide(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleJump, handleSlide]);

  const loadLeaderboard = async () => {
    try {
      const { data } = await supabase
        .from('game_scores')
        .select(`score, profiles(name, avatar_url)`)
        .eq('game_name', 'port_neches')
        .order('score', { ascending: false })
        .limit(10);
      if (data) setLeaderboard(data);
    } catch (e) { console.error(e); }
    setShowLeaderboard(true);
  };

  // Game Loop
  useEffect(() => {
    if (gameState !== 'playing') return;
    let reqId: number;

    const tick = (time: number) => {
      const e = engine.current;
      if (!e.lastTime) e.lastTime = time;
      const dt = Math.min((time - e.lastTime) / 1000, 0.05);
      e.lastTime = time;

      if (!e.isGameOver) {
        e.score += dt * 10;
        setScore(Math.floor(e.score));

        const groundY = getGroundY();
        const PLAYER_H_NORMAL = 56;
        const PLAYER_H_SLIDE = 28;
        const playerH = e.isSliding ? PLAYER_H_SLIDE : PLAYER_H_NORMAL;

        // Slide timer
        if (e.isSliding) {
          e.slideTimer -= dt * 1000;
          if (e.slideTimer <= 0) {
            e.isSliding = false;
            e.slideTimer = 0;
            setIsSliding(false);
          }
        }

        // Physics
        e.playerVy += e.gravity * dt;
        e.playerY += e.playerVy * dt;

        if (e.playerY >= groundY) {
          if (e.playerVy > 0) playSound('land'); // only play land sound if we were falling
          e.playerY = groundY;
          e.playerVy = 0;
          e.jumpCount = 0;
          setJumpCount(0);
        }

        // Difficulty
        const diffMult = 1 + Math.floor(e.score / 150) * 0.08;
        const currentSpeed = e.baseSpeed * diffMult;

        // BG scroll
        e.bgOffset -= currentSpeed * dt;
        if (e.bgOffset <= -GAME_WIDTH) e.bgOffset += GAME_WIDTH;
        if (bgRef.current) bgRef.current.style.transform = `translateX(${e.bgOffset}px)`;

        // Spawn
        const spawnRate = Math.max(1000, e.spawnRate / diffMult);
        if (time - e.lastSpawn > spawnRate) {
          const type = Math.random() > 0.55 ? 'tugboat' : 'bench';
          e.obstacles.push({
            id: `pnobs-${e.obsId++}`,
            type,
            x: GAME_WIDTH + 50,
            y: groundY,
            width: type === 'bench' ? 70 : 90,
            height: type === 'bench' ? 50 : 70
          });
          e.lastSpawn = time;
        }

        // Collision
        const px = 100;
        const py = e.playerY - playerH;
        const pw = 44;
        const ph = playerH;
        const buf = 14;

        let died = false;
        for (let i = e.obstacles.length - 1; i >= 0; i--) {
          if (died) break;
          const obs = e.obstacles[i];
          obs.x -= currentSpeed * dt;

          // Slide skips bench collisions!
          if (e.isSliding && obs.type === 'bench') {
            if (obs.x < -150) e.obstacles.splice(i, 1);
            continue;
          }

          const obsTopY = groundY - obs.height;
          if (
            px + pw - buf > obs.x + buf &&
            px + buf < obs.x + obs.width - buf &&
            py + ph - buf > obsTopY + buf &&
            py + buf < groundY + buf
          ) {
            playSound('crash');
            died = true;
            e.isGameOver = true;
            setGameState('gameover');
            submitScore(Math.floor(e.score));
          }

          if (obs.x < -150) e.obstacles.splice(i, 1);
        }

        if (!died) {
          const playerEl = document.getElementById('pn-player');
          if (playerEl) {
            playerEl.style.top = `${e.playerY - playerH}px`;
            playerEl.style.left = `${px}px`;
            playerEl.style.height = `${playerH}px`;
            playerEl.style.transform = e.isSliding ? 'rotate(90deg)' : 'none';
          }

          e.obstacles.forEach(obs => {
            const el = document.getElementById(obs.id);
            if (el) {
              el.style.left = `${obs.x}px`;
              el.style.bottom = '60px';
            }
          });
        }
      }

      reqId = requestAnimationFrame(tick);
    };

    reqId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(reqId);
  }, [gameState, submitScore]);

  return (
    <div className={`pa-container ${isDark ? 'dark' : ''}`}>
      <div className="pa-ui">
        <button onClick={onBack} className="games-back-btn" style={{ background: 'rgba(255,255,255,0.8)' }}>
          <ArrowLeft size={24} color="#111" />
        </button>
        <div className="pa-score-card">Score: {Math.floor(score)}</div>
        <div className="pa-score-card" style={{ fontSize: '12px', gap: '6px' }}>
          <span>⬆️ Jump × {2 - jumpCount}</span>
          {isSliding && <span>💨 Slide!</span>}
        </div>
      </div>

      <div
        className="port-neches-game-area"
        style={{ height: '100dvh' }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        <div ref={bgRef} className="pn-river-bg" />

        {/* Double-jump indicator dots */}
        {gameState === 'playing' && (
          <div className="pn-jump-dots">
            {[0, 1].map(i => (
              <div key={i} className={`pn-jump-dot ${i < jumpCount ? 'used' : 'available'}`} />
            ))}
          </div>
        )}

        {/* Player */}
        <div id="pn-player" className={`pn-entity-runner ${isSliding ? 'sliding' : ''}`}
          style={{ display: gameState === 'start' ? 'none' : 'block', position: 'absolute' }}>
          <Avatar url={user?.avatar_url} name={user?.name} size={56} />
        </div>

        {/* Obstacles */}
        {gameState === 'playing' && engine.current.obstacles.map(obs => (
          <div key={obs.id} id={obs.id} className={`pn-entity-${obs.type}`}
            style={{ position: 'absolute', left: obs.x, bottom: 60 }} />
        ))}

        {/* Slide hint on desktop */}
        {gameState === 'playing' && (
          <div className="pn-control-hints">
            <span>↑ / Tap = Jump (×2)</span>
            <span>↓ / Swipe Down = Slide</span>
          </div>
        )}
      </div>

      {gameState === 'start' && (
        <div className="pa-modal-overlay">
          <div className="pa-modal">
            <h2>🏃 Riverfront Runner</h2>
            <p><strong>Tap</strong> to jump (double-tap for double jump!)<br /><strong>Swipe down</strong> to slide under obstacles.</p>
            <button onClick={startGame} className="pa-modal-btn">
              <Play size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
              Start Running
            </button>
            <button onClick={loadLeaderboard} className="pa-modal-btn secondary" style={{ marginTop: '8px' }}>
              <Trophy size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
              Leaderboard
            </button>
          </div>
        </div>
      )}
      {gameState === 'gameover' && (
        <div className="pa-modal-overlay">
          <div className="pa-modal">
            <h2 style={{ fontSize: '32px', marginBottom: '8px', color: '#111827' }}>Wipeout!</h2>
            <div style={{ fontSize: '48px', fontWeight: 900, color: '#38bdf8', marginBottom: '8px' }}>
              {Math.floor(score)} pts
            </div>
            {isNewBest && (
              <div style={{ background: '#facc15', color: '#854d0e', padding: '4px 12px', borderRadius: '20px', fontSize: '14px', fontWeight: 800, marginBottom: '8px', display: 'inline-block' }}>
                🎉 NEW BEST!
              </div>
            )}
            {coinsEarned > 0 && (
              <div style={{ fontSize: '16px', color: '#10b981', fontWeight: 700, marginBottom: '24px' }}>
                +{coinsEarned} Arcade Coins Earned!
              </div>
            )}
            <button onClick={startGame} className="pa-modal-btn">
              <RefreshCw size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
              Run Again
            </button>
            <button 
              onClick={() => shareScore('Riverfront Runner', Math.floor(score))} 
              className="pa-modal-btn" 
              style={{ background: '#3b82f6', marginTop: '8px' }}
              disabled={isSharing || shareSuccess}
            >
              <Trophy size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
              {shareSuccess ? 'Shared!' : isSharing ? 'Sharing...' : 'Share Score'}
            </button>
            <button onClick={loadLeaderboard} className="pa-modal-btn secondary" style={{ marginTop: '8px', marginBottom: '12px' }}>
              <Trophy size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
              Leaderboard
            </button>
            <button onClick={onBack} className="pa-modal-btn secondary">
              <LogOut size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
              Back to Arcade
            </button>
          </div>
        </div>
      )}
      {showLeaderboard && (
        <div className="pa-modal-overlay" style={{ zIndex: 40 }}>
          <div className="pa-modal" style={{ maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ marginBottom: 0 }}><Trophy size={24} color="#eab308" style={{ verticalAlign: 'middle' }} /> All-Time Best</h2>
              <button onClick={() => setShowLeaderboard(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
                <X size={24} />
              </button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1, marginBottom: '16px', textAlign: 'left' }}>
              {leaderboard.length === 0 ? <p style={{ textAlign: 'center' }}>No scores yet!</p> : leaderboard.map((entry, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                  <div style={{ width: '30px', fontWeight: 'bold', color: '#6b7280' }}>#{idx + 1}</div>
                  <div style={{ marginRight: '12px' }}><Avatar url={entry.profiles?.avatar_url} name={entry.profiles?.name} size={32} /></div>
                  <div style={{ flex: 1, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.profiles?.name || 'Anonymous'}</div>
                  <div style={{ fontWeight: 'bold', color: '#16a34a' }}>{entry.score}</div>
                </div>
              ))}
            </div>
            <button onClick={() => setShowLeaderboard(false)} className="pa-modal-btn">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};
