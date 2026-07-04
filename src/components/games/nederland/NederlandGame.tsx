import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../../../context/AppContext';
import { ArrowLeft, Play, RefreshCw, LogOut, Trophy, X } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Avatar } from '../../Avatar';
import { useShareScore } from '../useShareScore';
import { useGameAudio } from '../useGameAudio';
import { useGameSubmit } from '../useGameSubmit';
import './Nederland.css';
import '../port-arthur/PortArthur.css';

interface NederlandGameProps {
  onBack: () => void;
}

interface Debris {
  id: string;
  type: 'rock' | 'branch';
  x: number;
  y: number;
  angle: number;
  speed: number;
}

// Point-to-line-segment distance for swipe intersection
function distToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

export const NederlandGame: React.FC<NederlandGameProps> = ({ onBack }) => {
  const { theme, user } = useApp();
  const isDark = theme.includes('dark') || theme.includes('io') || theme.includes('neo');

  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [debrisTick, setDebrisTick] = useState(0);

  const { shareScore, isSharing, shareSuccess } = useShareScore('nederland');
  const { playSound } = useGameAudio();
  const { submitScore, isNewBest, coinsEarned } = useGameSubmit('nederland');

  const floatingContainerRef = useRef<HTMLDivElement>(null);
  const slashContainerRef = useRef<HTMLDivElement>(null);
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const userRef = useRef(user);
  userRef.current = user;

  const engine = useRef({
    debris: [] as Debris[],
    score: 0,
    lives: 3,
    lastSpawn: 0,
    spawnRate: 1400,
    baseSpeed: 90,
    lastTime: 0,
    isGameOver: false,
    debrisId: 0,
  });


  const startGame = () => {
    setScore(0);
    setLives(3);
    setDebrisTick(0);
    engine.current = {
      debris: [],
      score: 0,
      lives: 3,
      lastSpawn: performance.now(),
      spawnRate: 1400,
      baseSpeed: 90,
      lastTime: performance.now(),
      isGameOver: false,
      debrisId: 0,
    };
    setGameState('playing');
    playSound('blip');
  };

  // Draw a slash effect via DOM
  const drawSlash = useCallback((ax: number, ay: number, bx: number, by: number) => {
    if (!slashContainerRef.current) return;
    const el = document.createElement('div');
    const len = Math.hypot(bx - ax, by - ay);
    const angle = Math.atan2(by - ay, bx - ax) * (180 / Math.PI);
    el.style.cssText = `
      position: absolute;
      left: ${ax}px;
      top: ${ay}px;
      width: ${len}px;
      height: 3px;
      background: linear-gradient(90deg, rgba(255,255,255,0.9), rgba(96,165,250,0.5));
      border-radius: 2px;
      transform-origin: 0 50%;
      transform: rotate(${angle}deg);
      pointer-events: none;
      animation: slashFade 0.4s ease-out forwards;
    `;
    slashContainerRef.current.appendChild(el);
    setTimeout(() => el.remove(), 400);
  }, []);

  // Tap individual debris
  const handleTapDebris = useCallback((id: string, tapX: number, tapY: number) => {
    const e = engine.current;
    if (e.isGameOver) return;
    const index = e.debris.findIndex(d => d.id === id);
    if (index === -1) return;
    playSound('hit');
    e.debris.splice(index, 1);
    e.score += 10;
    setScore(e.score);
    setDebrisTick(t => t + 1);
    e.baseSpeed += 1.5;
    e.spawnRate = Math.max(450, e.spawnRate - 18);

    if (floatingContainerRef.current) {
      const el = document.createElement('div');
      el.className = 'nederland-floating-score';
      el.textContent = '+10';
      el.style.left = `${tapX}px`;
      el.style.top = `${tapY}px`;
      floatingContainerRef.current.appendChild(el);
      setTimeout(() => el.remove(), 900);
    }
  }, []);

  // Swipe to destroy all debris along the swipe path
  const handleSwipe = useCallback((ax: number, ay: number, bx: number, by: number) => {
    const e = engine.current;
    if (e.isGameOver) return;
    const SWIPE_RADIUS = 48;
    let destroyed = 0;

    for (let i = e.debris.length - 1; i >= 0; i--) {
      const d = e.debris[i];
      const dist = distToSegment(d.x, d.y, ax, ay, bx, by);
      if (dist < SWIPE_RADIUS) {
        e.debris.splice(i, 1);
        destroyed++;
        if (floatingContainerRef.current) {
          const el = document.createElement('div');
          el.className = 'nederland-floating-score';
          el.textContent = '+10';
          el.style.left = `${d.x}px`;
          el.style.top = `${d.y}px`;
          floatingContainerRef.current.appendChild(el);
          setTimeout(() => el.remove(), 900);
        }
      }
    }

    if (destroyed > 0) {
      playSound('swipe');
      e.score += destroyed * 10;
      setScore(e.score);
      setDebrisTick(t => t + 1);
      drawSlash(ax, ay, bx, by);
      // Bonus for multi-destroy
      if (destroyed > 1 && floatingContainerRef.current) {
        const bonus = document.createElement('div');
        bonus.className = 'nederland-floating-score';
        bonus.textContent = `${destroyed}x COMBO!`;
        bonus.style.cssText += `font-size: 20px; color: #fbbf24; left: ${(ax+bx)/2}px; top: ${(ay+by)/2 - 30}px;`;
        floatingContainerRef.current.appendChild(bonus);
        setTimeout(() => bonus.remove(), 1200);
      }
    }
  }, [drawSlash]);

  const loadLeaderboard = async () => {
    try {
      const { data } = await supabase
        .from('game_scores')
        .select(`score, profiles(name, avatar_url)`)
        .eq('game_name', 'nederland')
        .order('score', { ascending: false })
        .limit(10);
      if (data) setLeaderboard(data);
    } catch (e) { console.error(e); }
    setShowLeaderboard(true);
  };

  useEffect(() => {
    if (gameState !== 'playing') return;
    let reqId: number;

    const tick = (time: number) => {
      const e = engine.current;
      if (!e.lastTime) e.lastTime = time;
      const dt = Math.min((time - e.lastTime) / 1000, 0.05);
      e.lastTime = time;

      if (!e.isGameOver) {
        const W = window.innerWidth;
        const H = window.innerHeight;
        const centerX = Math.min(W, 600) / 2;
        const centerY = H / 2;
        const coreRadius = 52;

        if (time - e.lastSpawn > e.spawnRate) {
          const spawnAngle = Math.random() * Math.PI * 2;
          const spawnRadius = Math.max(W, H) / 2 + 120;
          e.debris.push({
            id: `debris-${e.debrisId++}`,
            type: Math.random() > 0.5 ? 'rock' : 'branch',
            x: centerX + Math.cos(spawnAngle) * spawnRadius,
            y: centerY + Math.sin(spawnAngle) * spawnRadius,
            angle: spawnAngle + Math.PI,
            speed: e.baseSpeed + Math.random() * 40
          });
          e.lastSpawn = time;
          setDebrisTick(t => t + 1);
        }

        for (let i = e.debris.length - 1; i >= 0; i--) {
          const d = e.debris[i];
          d.x += Math.cos(d.angle) * d.speed * dt;
          d.y += Math.sin(d.angle) * d.speed * dt;

          const dist = Math.hypot(d.x - centerX, d.y - centerY);
          if (dist < coreRadius) {
            playSound('crash');
            e.debris.splice(i, 1);
            e.lives -= 1;
            setLives(e.lives);
            if (e.lives <= 0) {
              e.isGameOver = true;
              setGameState('gameover');
              submitScore(e.score);
            }
            setDebrisTick(t => t + 1);
          }
        }

        e.debris.forEach(d => {
          const el = document.getElementById(d.id);
          if (el) {
            el.style.left = `${d.x}px`;
            el.style.top = `${d.y}px`;
            if (d.type === 'branch') {
              el.style.transform = `translate(-50%, -50%) rotate(${d.angle}rad)`;
            }
          }
        });
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
        <div className="pa-score-card">Score: {score}</div>
        <div className="pa-lives-card">Lives: {lives}</div>
      </div>

      <div
        className="nederland-game-area"
        style={{ height: '100dvh' }}
        onPointerDown={(e) => {
          swipeStartRef.current = { x: e.clientX, y: e.clientY };
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        }}
        onPointerUp={(e) => {
          if (!swipeStartRef.current) return;
          const dx = e.clientX - swipeStartRef.current.x;
          const dy = e.clientY - swipeStartRef.current.y;
          const swipeLen = Math.hypot(dx, dy);
          if (swipeLen > 40) {
            // Swipe gesture — destroy debris along the path
            handleSwipe(swipeStartRef.current.x, swipeStartRef.current.y, e.clientX, e.clientY);
          }
          swipeStartRef.current = null;
        }}
      >
        {/* Windmill Core — player avatar */}
        <div className="windmill-core">
          <Avatar url={user?.avatar_url} name={user?.name} size={68} />
        </div>

        {/* Debris */}
        {gameState === 'playing' && engine.current.debris.map(d => (
          <div
            key={d.id}
            id={d.id}
            className={`debris-${d.type}`}
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation(); // prevent swipe from firing
              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
              handleTapDebris(d.id, rect.left + rect.width / 2, rect.top + rect.height / 2);
            }}
          />
        ))}

        {/* Floating scores rendered imperatively */}
        <div ref={floatingContainerRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 30 }} />
        {/* Slash effects */}
        <div ref={slashContainerRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 29 }} />

        {/* Swipe hint */}
        {gameState === 'playing' && (
          <div className="nederland-swipe-hint">Tap debris • Swipe to slash multiple!</div>
        )}
      </div>

      {gameState === 'start' && (
        <div className="pa-modal-overlay">
          <div className="pa-modal">
            <h2>🌷 Windmill Defender</h2>
            <p><strong>Tap</strong> debris to destroy it.<br /><strong>Swipe</strong> across multiple pieces for a combo!</p>
            <button onClick={startGame} className="pa-modal-btn">
              <Play size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
              Defend Now
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
            <h2 style={{ fontSize: '32px', marginBottom: '8px', color: '#111827' }}>Core Destroyed!</h2>
            <div style={{ fontSize: '48px', fontWeight: 900, color: '#38bdf8', marginBottom: '8px' }}>
              {score} pts
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
              Defend Again
            </button>
            <button 
              onClick={() => shareScore('Windmill Defender', Math.floor(score))} 
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
