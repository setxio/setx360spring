import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Trophy, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Avatar } from '../../Avatar';
import { MAPS, TILE_SIZE } from './mapData';
import { supabase } from '../../../lib/supabase';
import { useShareScore } from '../useShareScore';
import { useGameAudio } from '../useGameAudio';
import { useGameSubmit } from '../useGameSubmit';
import './GatorChaseGame.css';

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'NONE';

interface Entity {
  x: number;
  y: number;
  gridX: number;
  gridY: number;
  dir: Direction;
  nextDir: Direction;
  speed: number;
}

interface Gator extends Entity {
  id: string;
  color: string;
  image: string;
  mode: 'chase' | 'scatter' | 'frightened' | 'eaten';
  frightenedTimer: number;
}

const DIR_VECS: Record<Direction, {dx: number, dy: number}> = {
  'UP': {dx: 0, dy: -1},
  'DOWN': {dx: 0, dy: 1},
  'LEFT': {dx: -1, dy: 0},
  'RIGHT': {dx: 1, dy: 0},
  'NONE': {dx: 0, dy: 0},
};

export const GatorChaseGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { user } = useApp();
  
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover' | 'levelcomplete'>('menu');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  const { shareScore, isSharing, shareSuccess } = useShareScore('gator_chase');
  const { playSound } = useGameAudio();
  const { submitScore, isNewBest, coinsEarned } = useGameSubmit('gator_chase');

  const fetchLeaderboard = async () => {
    const { data } = await supabase.from('game_scores').select('*, profiles(username, avatar_url)').eq('game_name', 'gator_chase').order('score', { ascending: false }).limit(5);
    if (data) setLeaderboard(data);
    setShowLeaderboard(true);
  };
  
  const playerRef = useRef<HTMLDivElement>(null);
  const gatorRefs = useRef<Record<string, HTMLDivElement | null>>({});
  
  // Game Engine State
  const engine = useRef({
    board: [] as number[][],
    score: 0,
    dotsRemaining: 0,
    player: { x: 0, y: 0, gridX: 0, gridY: 0, dir: 'NONE', nextDir: 'NONE', speed: 2 } as Entity,
    gators: [] as Gator[],
    isGameOver: false,
    level: 1,
    lastTime: 0,
    frightenedTimeRemaining: 0
  });

  // Init Level
  const initLevel = (lvl: number) => {
    const mapIndex = (lvl - 1) % MAPS.length;
    const rawMap = MAPS[mapIndex];
    const newBoard = rawMap.map(row => [...row]);
    
    let pSpawnX = 0, pSpawnY = 0;
    let gSpawnX = 0, gSpawnY = 0;
    let gSpawnTiles: {x: number, y: number}[] = [];
    let dots = 0;

    for (let y = 0; y < newBoard.length; y++) {
      for (let x = 0; x < newBoard[y].length; x++) {
        if (newBoard[y][x] === 5) {
          pSpawnX = x; pSpawnY = y;
          newBoard[y][x] = 0;
        }
        if (newBoard[y][x] === 6) {
          gSpawnTiles.push({x, y});
          newBoard[y][x] = 0; // Empty inside ghost house
        }
        if (newBoard[y][x] === 2) dots++;
      }
    }

    if (gSpawnTiles.length > 0) {
      const sumX = gSpawnTiles.reduce((acc, curr) => acc + curr.x, 0);
      gSpawnX = Math.floor(sumX / gSpawnTiles.length);
      gSpawnY = gSpawnTiles[0].y;
    }

    const pSpeed = Math.min(3, 2 + (lvl * 0.05));
    const gSpeed = Math.min(2.8, 1.8 + (lvl * 0.1));

    engine.current.board = newBoard;
    engine.current.dotsRemaining = dots;
    engine.current.player = {
      gridX: pSpawnX, gridY: pSpawnY,
      x: pSpawnX * TILE_SIZE + TILE_SIZE/2, y: pSpawnY * TILE_SIZE + TILE_SIZE/2,
      dir: 'NONE', nextDir: 'NONE', speed: pSpeed
    };

    const getSpawnPos = (index: number) => {
       if (gSpawnTiles.length === 0) return { gridX: gSpawnX, gridY: gSpawnY };
       if (index === 0 && newBoard[gSpawnY-1]?.[gSpawnX] !== 1) {
          return { gridX: gSpawnX, gridY: gSpawnY - 1 };
       }
       const tile = gSpawnTiles[index % gSpawnTiles.length];
       return { gridX: tile.x, gridY: tile.y };
    };

    const gatorProps = [
      { id: 'blinky', color: 'red', image: '/images/gator-chase/red_gator.png' },
      { id: 'pinky', color: 'pink', image: '/images/gator-chase/pink_gator.png' },
      { id: 'inky', color: 'cyan', image: '/images/gator-chase/cyan_gator.png' },
      { id: 'clyde', color: 'orange', image: '/images/gator-chase/orange_gator.png' }
    ];

    engine.current.gators = gatorProps.map((p, i) => {
      const pos = getSpawnPos(i);
      return {
        id: p.id, color: p.color, image: p.image, mode: 'scatter' as const, frightenedTimer: 0,
        gridX: pos.gridX, gridY: pos.gridY,
        x: pos.gridX * TILE_SIZE + TILE_SIZE/2, y: pos.gridY * TILE_SIZE + TILE_SIZE/2,
        dir: 'UP', nextDir: 'UP', speed: gSpeed
      };
    });
    
    setBoard(newBoard);
  };

  const loadLeaderboard = async () => {
    const { data } = await supabase.from('game_scores').select('*').eq('game_name', 'gator_chase').order('score', { ascending: false }).limit(5);
    if (data) setLeaderboard(data);
    setShowLeaderboard(true);
  };

  const [board, setBoard] = useState<number[][]>([]);

  const startGame = () => {
    setScore(0);
    setLevel(1);
    setLives(3);
    engine.current.score = 0;
    engine.current.isGameOver = false;
    initLevel(1);
    setGameState('playing');
    playSound('blip');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;
      let newDir: Direction | null = null;
      if (e.key === 'ArrowUp' || e.key === 'w') newDir = 'UP';
      if (e.key === 'ArrowDown' || e.key === 's') newDir = 'DOWN';
      if (e.key === 'ArrowLeft' || e.key === 'a') newDir = 'LEFT';
      if (e.key === 'ArrowRight' || e.key === 'd') newDir = 'RIGHT';
      
      if (newDir) {
        e.preventDefault();
        engine.current.player.nextDir = newDir;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  const touchStartRef = useRef<{x: number, y: number} | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || gameState !== 'playing') return;
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 30) {
      engine.current.player.nextDir = dx > 0 ? 'RIGHT' : 'LEFT';
    } else if (Math.abs(dy) > 30) {
      engine.current.player.nextDir = dy > 0 ? 'DOWN' : 'UP';
    }
    touchStartRef.current = null;
  };

  const handleJoystickMove = (dir: Direction) => {
    if (gameState !== 'playing') return;
    engine.current.player.nextDir = dir;
  };

  useEffect(() => {
    if (gameState !== 'playing') return;
    let reqId: number;

    const tick = (time: number) => {
      if (!engine.current.lastTime) engine.current.lastTime = time;
      const deltaTime = time - engine.current.lastTime;
      engine.current.lastTime = time;

      if (!engine.current.isGameOver) {
        updateGame(deltaTime);
      }
      reqId = requestAnimationFrame(tick);
    };

    reqId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(reqId);
  }, [gameState]);

  const addScore = (points: number) => {
    const prevScore = engine.current.score;
    engine.current.score += points;
    setScore(engine.current.score);
    
    const extraLivesEarned = Math.floor(engine.current.score / 10000) - Math.floor(prevScore / 10000);
    if (extraLivesEarned > 0) {
      setLives(l => l + extraLivesEarned);
      playSound('powerup');
    }
  };

  const updateGame = (dt: number) => {
    const e = engine.current;
    moveEntity(e.player, true);
    
    const px = Math.floor(e.player.x / TILE_SIZE);
    const py = Math.floor(e.player.y / TILE_SIZE);
    
    if (py >= 0 && py < e.board.length && px >= 0 && px < e.board[0].length) {
      if (e.board[py][px] === 2) {
        e.board[py][px] = 0;
        addScore(10);
        e.dotsRemaining--;
        playSound('blip');
        const dotEl = document.getElementById(`cell-${px}-${py}`);
        if (dotEl) dotEl.style.visibility = 'hidden';
      }
      if (e.board[py][px] === 3) {
        e.board[py][px] = 0;
        addScore(50);
        playSound('powerup');
        const dotEl = document.getElementById(`cell-${px}-${py}`);
        if (dotEl) dotEl.style.visibility = 'hidden';
        
        const fTime = Math.max(2000, 8000 - (e.level * 300));
        e.gators.forEach(g => {
          if (g.mode !== 'eaten') {
            g.mode = 'frightened';
            g.frightenedTimer = fTime;
            g.dir = getOpposite(g.dir);
          }
        });
      }
    }

    if (e.dotsRemaining <= 0) {
      e.isGameOver = true;
      setGameState('levelcomplete');
      setTimeout(() => {
        setLevel(l => l + 1);
        e.level += 1;
        initLevel(e.level);
        setGameState('playing');
        e.isGameOver = false;
      }, 2000);
      return;
    }

    e.gators.forEach(g => {
      if (g.mode === 'frightened') {
        g.frightenedTimer -= dt;
        if (g.frightenedTimer <= 0) {
          g.mode = 'chase';
        }
      }
      
      if (isAtCenter(g.x, g.y)) {
        const available = getAvailableDirs(g.gridX, g.gridY);
        const opp = getOpposite(g.dir);
        let choices = available.filter(d => d !== opp);
        if (choices.length === 0) choices = available;
        
        if (choices.length > 0) {
          g.nextDir = choices[Math.floor(Math.random() * choices.length)];
        }
      }
      
      moveEntity(g, false);
      
      const dist = Math.hypot(g.x - e.player.x, g.y - e.player.y);
      if (dist < TILE_SIZE * 0.8) {
        if (g.mode === 'frightened') {
          g.mode = 'eaten';
          addScore(200);
          playSound('powerup');
          g.x = 9 * TILE_SIZE + TILE_SIZE/2;
          g.y = 9 * TILE_SIZE + TILE_SIZE/2;
          g.gridX = 9; g.gridY = 9;
          g.mode = 'chase';
        } else if (g.mode === 'chase' || g.mode === 'scatter') {
          handleDeath();
        }
      }
    });

    if (playerRef.current) {
      playerRef.current.style.left = `${e.player.x - TILE_SIZE/2}px`;
      playerRef.current.style.top = `${e.player.y - TILE_SIZE/2}px`;
    }
    e.gators.forEach(g => {
      const gEl = gatorRefs.current[g.id];
      if (gEl) {
        gEl.style.left = `${g.x - TILE_SIZE/2}px`;
        gEl.style.top = `${g.y - TILE_SIZE/2}px`;
        
        if (g.mode === 'frightened') {
          if (g.frightenedTimer < 2000) {
            gEl.className = 'entity-gator frightened-ending';
          } else {
            gEl.className = 'entity-gator frightened';
          }
        } else {
          gEl.className = 'entity-gator moving';
        }
      }
    });
  };

  const handleDeath = () => {
    playSound('crash');
    engine.current.isGameOver = true;
    setLives(l => {
      const newL = l - 1;
      if (newL <= 0) {
        setGameState('gameover');
        submitScore(engine.current.score, engine.current.level);
      } else {
        setTimeout(() => {
          const rawMap = MAPS[(engine.current.level - 1) % MAPS.length];
          let pSpawnX = 0, pSpawnY = 0;
          let gSpawnTiles: {x: number, y: number}[] = [];
          for (let y = 0; y < rawMap.length; y++) {
            for (let x = 0; x < rawMap[y].length; x++) {
              if (rawMap[y][x] === 5) { pSpawnX = x; pSpawnY = y; }
              if (rawMap[y][x] === 6) { gSpawnTiles.push({x, y}); }
            }
          }
          
          let gSpawnX = 0, gSpawnY = 0;
          if (gSpawnTiles.length > 0) {
            const sumX = gSpawnTiles.reduce((acc, curr) => acc + curr.x, 0);
            gSpawnX = Math.floor(sumX / gSpawnTiles.length);
            gSpawnY = gSpawnTiles[0].y;
          }

          engine.current.player.x = pSpawnX * TILE_SIZE + TILE_SIZE/2;
          engine.current.player.y = pSpawnY * TILE_SIZE + TILE_SIZE/2;
          engine.current.player.gridX = pSpawnX;
          engine.current.player.gridY = pSpawnY;
          engine.current.player.dir = 'NONE';
          engine.current.player.nextDir = 'NONE';
          
          engine.current.gators.forEach((g, i) => {
            let pos = { gridX: gSpawnX, gridY: gSpawnY };
            if (gSpawnTiles.length > 0) {
              if (i === 0 && rawMap[gSpawnY-1]?.[gSpawnX] !== 1) {
                pos = { gridX: gSpawnX, gridY: gSpawnY - 1 };
              } else {
                const tile = gSpawnTiles[i % gSpawnTiles.length];
                pos = { gridX: tile.x, gridY: tile.y };
              }
            }
            g.x = pos.gridX * TILE_SIZE + TILE_SIZE/2;
            g.y = pos.gridY * TILE_SIZE + TILE_SIZE/2;
            g.gridX = pos.gridX;
            g.gridY = pos.gridY;
            g.dir = 'UP'; g.nextDir = 'UP';
          });
          engine.current.isGameOver = false;
        }, 1500);
      }
      return newL;
    });
  };


  const getOpposite = (d: Direction): Direction => {
    if (d === 'UP') return 'DOWN';
    if (d === 'DOWN') return 'UP';
    if (d === 'LEFT') return 'RIGHT';
    if (d === 'RIGHT') return 'LEFT';
    return 'NONE';
  };

  const isAtCenter = (x: number, y: number) => {
    const cx = Math.floor(x / TILE_SIZE) * TILE_SIZE + TILE_SIZE/2;
    const cy = Math.floor(y / TILE_SIZE) * TILE_SIZE + TILE_SIZE/2;
    return Math.abs(x - cx) < 2 && Math.abs(y - cy) < 2;
  };

  const getAvailableDirs = (gx: number, gy: number): Direction[] => {
    const b = engine.current.board;
    const avail: Direction[] = [];
    if (gy > 0 && b[gy-1][gx] !== 1) avail.push('UP');
    if (gy < b.length-1 && b[gy+1][gx] !== 1) avail.push('DOWN');
    if (gx > 0 && b[gy][gx-1] !== 1) avail.push('LEFT');
    if (gx < b[0].length-1 && b[gy][gx+1] !== 1) avail.push('RIGHT');
    return avail;
  };

  const moveEntity = (ent: Entity, isPlayer: boolean) => {
    if (isAtCenter(ent.x, ent.y)) {
      ent.x = Math.floor(ent.x / TILE_SIZE) * TILE_SIZE + TILE_SIZE/2;
      ent.y = Math.floor(ent.y / TILE_SIZE) * TILE_SIZE + TILE_SIZE/2;
      ent.gridX = Math.floor(ent.x / TILE_SIZE);
      ent.gridY = Math.floor(ent.y / TILE_SIZE);

      if (ent.nextDir !== 'NONE' && ent.nextDir !== ent.dir) {
        const vec = DIR_VECS[ent.nextDir];
        const nextGx = ent.gridX + vec.dx;
        const nextGy = ent.gridY + vec.dy;
        const b = engine.current.board;
        if (nextGy >= 0 && nextGy < b.length && nextGx >= 0 && nextGx < b[0].length) {
          if (b[nextGy][nextGx] !== 1 && (!isPlayer || b[nextGy][nextGx] !== 4)) {
            ent.dir = ent.nextDir;
          }
        }
      }

      const vec = DIR_VECS[ent.dir];
      const forwardGx = ent.gridX + vec.dx;
      const forwardGy = ent.gridY + vec.dy;
      const b = engine.current.board;
      if (forwardGy >= 0 && forwardGy < b.length && forwardGx >= 0 && forwardGx < b[0].length) {
        if (b[forwardGy][forwardGx] === 1 || (isPlayer && b[forwardGy][forwardGx] === 4)) {
          ent.dir = 'NONE';
        }
      } else {
        if (forwardGx < 0) { ent.x = b[0].length * TILE_SIZE; }
        if (forwardGx >= b[0].length) { ent.x = 0; }
      }
    }

    const b = engine.current.board;
    if (ent.x < 0) ent.x = b[0].length * TILE_SIZE;
    if (ent.x > b[0].length * TILE_SIZE) ent.x = 0;

    const v = DIR_VECS[ent.dir];
    let spd = ent.speed;
    if (!isPlayer && (ent as Gator).mode === 'frightened') spd *= 0.6;
    
    ent.x += v.dx * spd;
    ent.y += v.dy * spd;
  };

  return (
    <div className="gator-chase-container" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div className="gator-chase-top-bar">
        <button className="gator-chase-back-btn" onClick={onBack}>
          <ArrowLeft size={24} />
        </button>
        <div className="gator-chase-stats">
          <div className="stat-item">
            <span className="stat-label">SCORE</span>
            <span>{score}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">ROUND</span>
            <span>{level}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">LIVES</span>
            <span style={{ display: 'flex', gap: '4px' }}>
              {Array.from({ length: lives }).map((_, i) => (
                <div key={i} style={{ width: 16, height: 16, borderRadius: '50%', background: '#60a5fa' }} />
              ))}
            </span>
          </div>
        </div>
      </div>

      <div className="gator-chase-game-area">
        <div 
          className="gator-chase-board" 
          style={{ 
            width: board.length > 0 ? board[0].length * TILE_SIZE : 0, 
            height: board.length * TILE_SIZE 
          }}
        >
          {/* Static Map Grid */}
          {board.map((row, y) => (
            <div key={y} className="maze-row">
              {row.map((cell, x) => (
                <div key={`${x}-${y}`} className="maze-cell">
                  {cell === 1 && <div className="maze-wall" />}
                  {cell === 4 && <div className="maze-wall" style={{ height: '4px', background: '#f59e0b', border: 'none', alignSelf: 'flex-start' }} />}
                  {cell === 2 && (
                    <div id={`cell-${x}-${y}`} className="maze-coin" />
                  )}
                  {cell === 3 && (
                    <div id={`cell-${x}-${y}`} className="maze-crawfish" />
                  )}
                </div>
              ))}
            </div>
          ))}

          {/* Player Avatar */}
          <div ref={playerRef} className="entity-player" style={{ display: gameState === 'playing' ? 'flex' : 'none' }}>
            <Avatar url={user?.avatar_url} name={user?.name} size={TILE_SIZE} />
          </div>

          {/* Gators */}
          {engine.current.gators.map(g => (
            <div 
              key={g.id}
              ref={(el) => { gatorRefs.current[g.id] = el; }}
              className="entity-gator moving"
              style={{ backgroundImage: `url('${g.image}')`, display: gameState === 'playing' ? 'block' : 'none' }}
            />
          ))}
        </div>

        {/* Overlays */}
        {gameState === 'menu' && (
          <div className="gator-chase-overlay">
            <h1 className="overlay-title">GATOR CHASE</h1>
            <p style={{ marginBottom: 24, textAlign: 'center', maxWidth: 300, color: '#9ca3af' }}>
              Swipe or use Arrow Keys to collect SETX Coins. Avoid the Gators! Eat Crawfish for power.
            </p>
            <button className="start-btn" onClick={startGame}>PLAY NOW</button>
          </div>
        )}

        {gameState === 'levelcomplete' && (
          <div className="gator-chase-overlay">
            <h1 className="overlay-title" style={{ color: '#60a5fa' }}>ROUND CLEAR!</h1>
            <p>Get ready for Round {level + 1}...</p>
          </div>
        )}

          {gameState === 'gameover' && (
            <div className="gator-chase-overlay">
              <h1 className="overlay-title" style={{ color: '#ef4444', marginBottom: '8px' }}>GAME OVER</h1>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '200px' }}>
                <button className="start-btn" onClick={startGame}>PLAY AGAIN</button>
                <button 
                  className="start-btn" 
                  style={{ background: '#3b82f6', opacity: (isSharing || shareSuccess) ? 0.7 : 1 }} 
                  onClick={() => shareScore('Gator Chase', score)}
                  disabled={isSharing || shareSuccess}
                >
                  {shareSuccess ? 'SHARED!' : 'SHARE SCORE'}
                </button>
                <button className="start-btn" style={{ background: 'transparent', border: '1px solid #3b82f6' }} onClick={onBack}>LEAVE</button>
              </div>
            </div>
          )}
        </div>

        {/* D-Pad Controls — 4-button grid for reliable directional input on mobile */}
        {gameState === 'playing' && (
          <div className="d-pad-container">
            <div className="d-pad">
              {/* Row 1: Up */}
              <div />
              <button className="d-btn" onPointerDown={(e) => { e.preventDefault(); handleJoystickMove('UP'); }}>
                <ChevronUp size={28} />
              </button>
              <div />
              {/* Row 2: Left, Center, Right */}
              <button className="d-btn" onPointerDown={(e) => { e.preventDefault(); handleJoystickMove('LEFT'); }}>
                <ChevronLeft size={28} />
              </button>
              <div className="d-center" />
              <button className="d-btn" onPointerDown={(e) => { e.preventDefault(); handleJoystickMove('RIGHT'); }}>
                <ChevronRight size={28} />
              </button>
              {/* Row 3: Down */}
              <div />
              <button className="d-btn" onPointerDown={(e) => { e.preventDefault(); handleJoystickMove('DOWN'); }}>
                <ChevronDown size={28} />
              </button>
              <div />
            </div>
          </div>
        )}
      </div>
  );
};
