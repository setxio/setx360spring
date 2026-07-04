import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../../../context/AppContext';
import { Avatar } from '../../Avatar';
import { useShareScore } from '../useShareScore';
import { useGameAudio } from '../useGameAudio';
import { useGameSubmit } from '../useGameSubmit';
import { ArrowLeft, ArrowRight, Play, RefreshCw, LogOut, Trophy, X, Anchor } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import './PortArthur.css';

interface PortArthurGameProps {
  onBack: () => void;
}

interface Obstacle {
  id: string;
  type: 'buoy' | 'sandbar';
  x: number;
  y: number;
  speed: number;
  width: number;
  height: number;
}

export const PortArthurGame: React.FC<PortArthurGameProps> = ({ onBack }) => {
  const { theme, user } = useApp();
  const isDark = theme.includes('dark') || theme.includes('io') || theme.includes('neo');
  
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  const { shareScore, isSharing, shareSuccess } = useShareScore('port_arthur');
  const { playSound } = useGameAudio();
  const { submitScore, isNewBest, coinsEarned } = useGameSubmit('port_arthur');
  
  const GAME_WIDTH = typeof window !== 'undefined' ? Math.min(window.innerWidth, 600) : 600;
  const GAME_HEIGHT = typeof window !== 'undefined' ? document.documentElement.clientHeight : 800;

  const userRef = useRef(user);
  userRef.current = user;
  
  const playerRef = useRef<{ x: number }>({ x: GAME_WIDTH / 2 });
  const playerElRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  
  const engine = useRef({
    score: 0,
    lives: 3,
    obstacles: [] as Obstacle[],
    baseSpeed: 5,
    bgOffset: 0,
    spawnRate: 1500, // ms between spawns
    lastSpawnTime: 0,
    lastTime: 0,
    isGameOver: false,
    obsIdCounter: 0
  });

  const getDifficultyMultiplier = (currentScore: number) => {
    return 1 + Math.floor(currentScore / 100) * 0.1;
  };

  const startGame = () => {
    setScore(0);
    setLives(3);
    engine.current = {
      score: 0,
      lives: 3,
      obstacles: [],
      baseSpeed: 5,
      bgOffset: 0,
      spawnRate: 1500,
      lastSpawnTime: performance.now(),
      lastTime: performance.now(),
      isGameOver: false,
      obsIdCounter: 0
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
    } else {
      // Clear obstacles on hit to give a chance to recover
      engine.current.obstacles = [];
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
        .eq('game_name', 'port_arthur')
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
    const boatWidth = 60; // hitbox width
    const boatHeight = 80;

    const tick = (time: number) => {
      if (!engine.current.lastTime) engine.current.lastTime = time;
      const dt = Math.min((time - engine.current.lastTime) / 1000, 0.05);
      engine.current.lastTime = time;

      const e = engine.current;

      if (!e.isGameOver) {
        // Score passive generation
        e.score += dt * 10;
        setScore(Math.floor(e.score));

        // Player Movement (Keyboard)
        let moved = false;
        if (keys.current['ArrowLeft'] || keys.current['a']) {
          playerRef.current.x = Math.max(boatWidth/2 + 10, playerRef.current.x - playerSpeed);
          moved = true;
        }
        if (keys.current['ArrowRight'] || keys.current['d']) {
          playerRef.current.x = Math.min(GAME_WIDTH - boatWidth/2 - 10, playerRef.current.x + playerSpeed);
          moved = true;
        }

        if (moved && Math.random() < 0.1) {
          // Occasional engine sounds when actively steering
          playSound('land');
        }

        // Difficulty scaling
        const diffMult = getDifficultyMultiplier(Math.floor(e.score));
        const currentSpeed = e.baseSpeed * diffMult;

        // Background scrolling
        e.bgOffset += currentSpeed;
        if (e.bgOffset > 200) e.bgOffset -= 200; // tile size is 200px
        
        if (bgRef.current) {
          bgRef.current.style.transform = `translateY(${e.bgOffset}px)`;
        }

        // Spawn Obstacles
        const currentSpawnRate = Math.max(600, e.spawnRate / diffMult);
        if (time - e.lastSpawnTime > currentSpawnRate) {
          const type = Math.random() > 0.8 ? 'sandbar' : 'buoy';
          e.obstacles.push({
            id: `obs-${e.obsIdCounter++}`,
            type,
            x: Math.random() * (GAME_WIDTH - 100) + 50,
            y: -100,
            speed: currentSpeed,
            width: type === 'sandbar' ? 100 : 40,
            height: type === 'sandbar' ? 80 : 40
          });
          e.lastSpawnTime = time;
        }

        // The player Y is fixed near the bottom (moved up to avoid mobile controls)
        const playerY = GAME_HEIGHT - 180;
        
        // Update Obstacles & Collisions
        let died = false;
        for (let i = e.obstacles.length - 1; i >= 0; i--) {
          if (died) break; // prevent double-death
          const obs = e.obstacles[i];
          obs.y += obs.speed * dt * 16; // keep same feel as original deltaTime/16 but using proper dt seconds

          // Collision Check (AABB)
          const px = playerRef.current.x;
          const py = playerY;

          const buf = 12;
          if (
            px - boatWidth/3 + buf < obs.x + obs.width/3 &&
            px + boatWidth/3 - buf > obs.x - obs.width/3 &&
            py - boatHeight/3 + buf < obs.y + obs.height/3 &&
            py + boatHeight/3 - buf > obs.y - obs.height/3
          ) {
            // Hit!
            playSound('crash');
            e.obstacles.splice(i, 1);
            died = true;
            e.lives -= 1;
            setLives(e.lives);
            if (e.lives <= 0) {
              e.isGameOver = true;
              setGameState('gameover');
              submitScore(e.score);
            } else {
              e.obstacles = []; // clear screen on hit
            }
            break;
          }

          // Off screen
          if (obs.y > GAME_HEIGHT + 100) {
            e.obstacles.splice(i, 1);
          }
        }

        // Render DOM Updates
        if (playerElRef.current) {
          playerElRef.current.style.left = `${playerRef.current.x}px`;
          playerElRef.current.style.top = `${playerY}px`;
        }
        
        e.obstacles.forEach(obs => {
          const el = document.getElementById(obs.id);
          if (el) {
            el.style.top = `${obs.y}px`;
            el.style.left = `${obs.x}px`;
          }
        });
      }

      reqId = requestAnimationFrame(tick);
    };

    reqId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(reqId);
  }, [gameState]);

  return (
    <div className={`pa-container ${isDark ? 'dark' : ''}`}>
      
      {/* UI Overlay */}
      <div className="pa-ui">
        <button onClick={onBack} className="games-back-btn" style={{ background: 'rgba(255,255,255,0.8)' }}>
          <ArrowLeft size={24} color="#111" />
        </button>
        <div className="pa-score-card">
          Score: {Math.floor(score)}
        </div>
        <div className="pa-lives-card">
          {Array.from({ length: Math.max(0, lives) }).map((_, i) => (
            <Anchor key={i} size={18} color="#3b82f6" />
          ))}
        </div>
      </div>

      {/* Game Area */}
      <div className="pa-game-area" style={{ height: GAME_HEIGHT }}>
        <div ref={bgRef} className="pa-water-bg" />
        
        {/* Obstacles */}
        {gameState === 'playing' && engine.current.obstacles.map(obs => (
          <div key={obs.id} id={obs.id} className={`pa-entity-${obs.type}`} style={{ top: obs.y, left: obs.x }} />
        ))}

        {/* Player Boat */}
        <div ref={playerElRef} className="pa-entity-boat" style={{ display: gameState === 'start' ? 'none' : 'block' }}>
          {/* We can put an avatar over the boat cabin */}
          <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)' }}>
            <Avatar url={user?.avatar_url} name={user?.name} size={24} />
          </div>
        </div>

        {/* Invisible Zone Steering: left half = go left, right half = go right */}
        {gameState === 'playing' && (
          <>
            <div
              className="pa-zone-left"
              onPointerDown={(e) => { e.preventDefault(); (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); keys.current['ArrowLeft'] = true; }}
              onPointerUp={(e) => { e.preventDefault(); keys.current['ArrowLeft'] = false; }}
              onPointerCancel={(e) => { e.preventDefault(); keys.current['ArrowLeft'] = false; }}
            >
              <div className="pa-zone-hint">◀</div>
            </div>
            <div
              className="pa-zone-right"
              onPointerDown={(e) => { e.preventDefault(); (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); keys.current['ArrowRight'] = true; }}
              onPointerUp={(e) => { e.preventDefault(); keys.current['ArrowRight'] = false; }}
              onPointerCancel={(e) => { e.preventDefault(); keys.current['ArrowRight'] = false; }}
            >
              <div className="pa-zone-hint">▶</div>
            </div>
          </>
        )}
      </div>

      {/* Start Modal */}
      {gameState === 'start' && (
        <div className="pa-modal-overlay">
          <div className="pa-modal">
            <h2>Port Arthur: Gulf Coast Skipper</h2>
            <p>Navigate your cargo ship down the Neches River channel! Dodge the buoys and sandbars.</p>
            <button onClick={startGame} className="pa-modal-btn">
              <Play size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
              Set Sail
            </button>
            <button onClick={loadLeaderboard} className="pa-modal-btn secondary" style={{ marginTop: '8px' }}>
              <Trophy size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
              Leaderboard
            </button>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      {gameState === 'gameover' && (
        <div className="pa-modal-overlay">
          <div className="pa-modal">
            <h2 style={{ fontSize: '32px', marginBottom: '8px', color: '#111827' }}>Shipwrecked!</h2>
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
              Sail Again
            </button>
            <button 
              onClick={() => shareScore('Gulf Coast Skipper', Math.floor(score))} 
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

      {/* Leaderboard Modal */}
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
            
            <button onClick={() => setShowLeaderboard(false)} className="pa-modal-btn">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
