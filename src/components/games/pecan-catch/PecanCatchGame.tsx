import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../../context/AppContext';
import { Avatar } from '../../Avatar';
import { useShareScore } from '../useShareScore';
import { useGameAudio } from '../useGameAudio';
import { useGameSubmit } from '../useGameSubmit';
import { ArrowLeft, ArrowRight, Play, RefreshCw, LogOut, Trophy, X } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import './PecanCatch.css';

interface PecanCatchProps {
  onBack: () => void;
}

interface Pecan {
  id: string;
  x: number;
  y: number;
  speed: number;
}

export const PecanCatchGame: React.FC<PecanCatchProps> = ({ onBack }) => {
  const { theme, user } = useApp();
  const isDark = theme.includes('dark') || theme.includes('io') || theme.includes('neo');
  
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  const { shareScore, isSharing, shareSuccess } = useShareScore('pecan_catch');
  const { playSound } = useGameAudio();
  const { submitScore, isNewBest, coinsEarned } = useGameSubmit('pecan_catch');
  
  const GAME_WIDTH = typeof window !== 'undefined' ? Math.min(window.innerWidth, 600) : 600;
  const GAME_HEIGHT = typeof window !== 'undefined' ? document.documentElement.clientHeight : 800;
  
  const playerRef = useRef<{ x: number }>({ x: GAME_WIDTH / 2 });
  const playerElRef = useRef<HTMLDivElement>(null);
  
  const engine = useRef({
    score: 0,
    lives: 3,
    pecans: [] as Pecan[],
    squirrelX: GAME_WIDTH / 2,
    squirrelDir: 1, // 1 for right, -1 for left
    squirrelSpeed: 3,
    baseFallSpeed: 2.5,
    spawnRate: 2500, // ms between spawns
    lastSpawnTime: 0,
    lastTime: 0,
    isGameOver: false,
    pecanIdCounter: 0
  });

  const getDifficultyMultiplier = (currentScore: number) => {
    // Every 50 points, increase difficulty
    return 1 + Math.floor(currentScore / 50) * 0.15;
  };

  const startGame = () => {
    setScore(0);
    setLives(3);
    engine.current = {
      score: 0,
      lives: 3,
      pecans: [],
      squirrelX: GAME_WIDTH / 2,
      squirrelDir: 1,
      squirrelSpeed: 3,
      baseFallSpeed: 2.5,
      spawnRate: 2500,
      lastSpawnTime: performance.now(),
      lastTime: performance.now(),
      isGameOver: false,
      pecanIdCounter: 0
    };
    playerRef.current.x = GAME_WIDTH / 2;
    setGameState('playing');
    playSound('blip');
  };

  const handleDeath = () => {
    engine.current.lives -= 1;
    setLives(engine.current.lives);
    if (engine.current.lives <= 0) {
      engine.current.isGameOver = true;
      setGameState('gameover');
      submitScore(engine.current.score);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('game_scores')
        .select(`
          score,
          profiles ( name, avatar_url )
        `)
        .eq('game_name', 'pecan_catch')
        .order('score', { ascending: false })
        .limit(10);
      
      if (!error && data) {
        setLeaderboard(data);
      }
    } catch (e) {
      console.error(e);
    }
    setShowLeaderboard(true);
  };

  // Input Handling
  const keys = useRef<{ [key: string]: boolean }>({});
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { keys.current[e.key] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys.current[e.key] = false; };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Main Game Loop
  useEffect(() => {
    if (gameState !== 'playing') return;
    let reqId: number;
    const playerSpeed = 8;
    const playerRadius = 32; // 64px width / 2
    const pecanRadius = 20; // 40px width / 2

    const tick = (time: number) => {
      if (!engine.current.lastTime) engine.current.lastTime = time;
      const deltaTime = time - engine.current.lastTime;
      engine.current.lastTime = time;

      const e = engine.current;

      if (!e.isGameOver) {
        // Player Movement (Keyboard)
        let moved = false;
        if (keys.current['ArrowLeft'] || keys.current['a']) {
          playerRef.current.x = Math.max(playerRadius, playerRef.current.x - playerSpeed);
          moved = true;
        }
        if (keys.current['ArrowRight'] || keys.current['d']) {
          playerRef.current.x = Math.min(GAME_WIDTH - playerRadius, playerRef.current.x + playerSpeed);
          moved = true;
        }
        if (moved && Math.random() < 0.1) playSound('land');

        // Difficulty scaling
        const diffMult = getDifficultyMultiplier(e.score);

        // Squirrel Movement
        e.squirrelX += e.squirrelSpeed * e.squirrelDir * diffMult * (deltaTime / 16);
        if (e.squirrelX <= 30) {
          e.squirrelX = 30;
          e.squirrelDir = 1;
        } else if (e.squirrelX >= GAME_WIDTH - 30) {
          e.squirrelX = GAME_WIDTH - 30;
          e.squirrelDir = -1;
        }

        // Spawn Pecans
        const currentSpawnRate = Math.max(400, e.spawnRate / diffMult);
        if (time - e.lastSpawnTime > currentSpawnRate) {
          e.pecans.push({
            id: `pecan-${e.pecanIdCounter++}`,
            x: e.squirrelX,
            y: 80, // Drop from below squirrel
            speed: e.baseFallSpeed * diffMult
          });
          e.lastSpawnTime = time;
          
          // Random chance for squirrel to change direction
          if (Math.random() < 0.3) {
            e.squirrelDir *= -1;
          }
        }

        // Update Pecans & Collisions
        const playerY = document.querySelector('.pecan-catch-game-area')?.clientHeight || 800;
        // The player bottom is 20px, height is 64px, so center Y is approx containerHeight - 52
        const pY = playerY - 52;
        
        for (let i = e.pecans.length - 1; i >= 0; i--) {
          const p = e.pecans[i];
          p.y += p.speed * (deltaTime / 16);

          // Collision Check
          const dist = Math.hypot(p.x - playerRef.current.x, p.y - pY);
          if (dist < playerRadius + pecanRadius - 10) { // Slight forgiveness
            // Caught!
            playSound('coin');
            e.score += 10;
            setScore(e.score);
            e.pecans.splice(i, 1);
            if (e.score % 50 === 0) playSound('powerup');
            continue;
          }

          // Missed (Hit floor)
          if (p.y > playerY + 40) {
            playSound('hit');
            e.pecans.splice(i, 1);
            handleDeath();
          }
        }

        // Render DOM Updates
        if (playerElRef.current) {
          playerElRef.current.style.left = `${playerRef.current.x}px`;
        }
        
        const squirrelEl = document.getElementById('pecan-squirrel');
        if (squirrelEl) {
          squirrelEl.style.left = `${e.squirrelX}px`;
        }

        e.pecans.forEach(p => {
          const el = document.getElementById(p.id);
          if (el) {
            el.style.top = `${p.y}px`;
            el.style.left = `${p.x}px`;
          }
        });
      }

      reqId = requestAnimationFrame(tick);
    };

    reqId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(reqId);
  }, [gameState]);

  return (
    <div className={`pecan-catch-container ${isDark ? 'dark' : ''}`}>
      
      {/* UI Overlay */}
      <div className="pecan-catch-ui">
        <button onClick={onBack} className="games-back-btn" style={{ background: 'rgba(255,255,255,0.8)' }}>
          <ArrowLeft size={24} color="#111" />
        </button>
        <div className="pecan-catch-score-card">
          Score: {score}
        </div>
        <div className="pecan-catch-lives-card">
          {Array.from({ length: Math.max(0, lives) }).map((_, i) => (
            <span key={i}>🌰</span>
          ))}
        </div>
      </div>

      {/* Game Area */}
      <div className="pecan-catch-game-area" style={{ height: GAME_HEIGHT }}>
        
        {/* Squirrel */}
        {(gameState === 'playing' || gameState === 'gameover') && (
          <div id="pecan-squirrel" className="entity-squirrel" />
        )}

        {/* Falling Pecans */}
        {gameState === 'playing' && engine.current.pecans.map(p => (
          <div key={p.id} id={p.id} className="entity-pecan" style={{ top: p.y, left: p.x }} />
        ))}

        {/* Player Avatar */}
        <div ref={playerElRef} className="entity-player" style={{ display: gameState === 'start' ? 'none' : 'flex' }}>
          <Avatar url={user?.avatar_url} name={user?.name} size={64} />
        </div>

        {/* Full-screen drag overlay: player follows your horizontal finger — one-thumb steering */}
        {gameState === 'playing' && (
          <div
            className="pecan-drag-zone"
            onPointerMove={(ev) => {
              const rect = ev.currentTarget.getBoundingClientRect();
              const relX = ev.clientX - rect.left;
              // Clamp to keep avatar within bounds
              playerRef.current.x = Math.max(32, Math.min(GAME_WIDTH - 32, relX));
            }}
            onPointerDown={(ev) => {
              (ev.currentTarget as HTMLElement).setPointerCapture(ev.pointerId);
              const rect = ev.currentTarget.getBoundingClientRect();
              const relX = ev.clientX - rect.left;
              playerRef.current.x = Math.max(32, Math.min(GAME_WIDTH - 32, relX));
            }}
          />
        )}

        {/* Hint label on first load (desktop) */}
        {gameState === 'playing' && (
          <div className="pecan-drag-hint">← Arrow keys or drag finger →</div>
        )}
      </div>

      {/* Start Modal */}
      {gameState === 'start' && (
        <div className="pecan-modal-overlay">
          <div className="pecan-modal">
            <h2>Groves Pecan Catch</h2>
            <p>Catch the falling pecans before they hit the ground. The squirrel gets faster as you score!</p>
            <button onClick={startGame} className="pecan-modal-btn">
              <Play size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
              Play Now
            </button>
            <button onClick={loadLeaderboard} className="pecan-modal-btn secondary" style={{ marginTop: '8px' }}>
              <Trophy size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
              Leaderboard
            </button>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      {gameState === 'gameover' && (
        <div className="pecan-modal-overlay">
          <div className="pecan-modal">
            <h2 style={{ fontSize: '32px', marginBottom: '8px', color: '#111827' }}>Game Over!</h2>
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
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={startGame} className="pecan-modal-btn">
                <RefreshCw size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
                Try Again
              </button>
            </div>
            <button 
              onClick={() => shareScore('Groves Pecan Catch', Math.floor(score))} 
              className="pecan-modal-btn" 
              style={{ background: '#3b82f6', marginTop: '8px' }}
              disabled={isSharing || shareSuccess}
            >
              <Trophy size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
              {shareSuccess ? 'Shared!' : isSharing ? 'Sharing...' : 'Share Score'}
            </button>
            <button onClick={loadLeaderboard} className="pecan-modal-btn secondary" style={{ marginTop: '8px', marginBottom: '12px' }}>
              <Trophy size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
              Leaderboard
            </button>
            <button onClick={onBack} className="pecan-modal-btn secondary">
              <LogOut size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
              Quit Game
            </button>
          </div>
        </div>
      )}

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <div className="pecan-modal-overlay" style={{ zIndex: 30 }}>
          <div className="pecan-modal" style={{ maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ marginBottom: 0 }}><Trophy size={24} color="#eab308" style={{ verticalAlign: 'middle' }} /> All-Time Best</h2>
              <button onClick={() => setShowLeaderboard(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
                <X size={24} />
              </button>
            </div>
            
            <div style={{ overflowY: 'auto', flex: 1, marginBottom: '16px', textAlign: 'left' }}>
              {leaderboard.length === 0 ? (
                <p style={{ textAlign: 'center' }}>No scores yet!</p>
              ) : (
                leaderboard.map((entry, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                    <div style={{ width: '30px', fontWeight: 'bold', color: '#6b7280' }}>#{idx + 1}</div>
                    <div style={{ marginRight: '12px' }}>
                      <Avatar url={entry.profiles?.avatar_url} name={entry.profiles?.name} size={32} />
                    </div>
                    <div style={{ flex: 1, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {entry.profiles?.name || 'Anonymous'}
                    </div>
                    <div style={{ fontWeight: 'bold', color: '#16a34a' }}>
                      {entry.score}
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <button onClick={() => setShowLeaderboard(false)} className="pecan-modal-btn">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
