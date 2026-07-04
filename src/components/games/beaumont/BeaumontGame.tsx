import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../../../context/AppContext';
import { ArrowLeft, Play, RefreshCw, LogOut, Trophy, X, Zap } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Avatar } from '../../Avatar';
import { useShareScore } from '../useShareScore';
import { useGameAudio } from '../useGameAudio';
import { useGameSubmit } from '../useGameSubmit';
import './Beaumont.css';
import '../port-arthur/PortArthur.css';

interface BeaumontGameProps {
  onBack: () => void;
}

export const BeaumontGame: React.FC<BeaumontGameProps> = ({ onBack }) => {
  const { theme, user } = useApp();
  const isDark = theme.includes('dark') || theme.includes('io') || theme.includes('neo');

  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [streak, setStreak] = useState(0);       // consecutive hits
  const [bestStreak, setBestStreak] = useState(0);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [targetState, setTargetState] = useState<'normal' | 'hit' | 'miss'>('normal');
  const [dropTick, setDropTick] = useState(0);
  const [pulseSpeed, setPulseSpeed] = useState(2.0); // CSS animation seconds
  const { shareScore, isSharing, shareSuccess } = useShareScore('beaumont');
  const { playSound } = useGameAudio();
  const { submitScore, isNewBest, coinsEarned } = useGameSubmit('beaumont');

  const TARGET_CENTER_Y_PERCENT = 0.72;

  const userRef = useRef(user);
  userRef.current = user;
  const streakRef = useRef(0);

  const engine = useRef({
    drops: [] as { id: string; y: number; speed: number }[],
    score: 0,
    lives: 3,
    streak: 0,
    lastSpawn: 0,
    spawnRate: 2200,
    baseSpeed: 260,
    lastTime: 0,
    isGameOver: false,
    dropId: 0
  });


  const startGame = () => {
    setScore(0);
    setLives(3);
    setStreak(0);
    setBestStreak(0);
    setDropTick(0);
    setPulseSpeed(2.0);
    streakRef.current = 0;
    engine.current = {
      drops: [],
      score: 0,
      lives: 3,
      streak: 0,
      lastSpawn: performance.now(),
      spawnRate: 2200,
      baseSpeed: 260,
      lastTime: performance.now(),
      isGameOver: false,
      dropId: 0
    };
    setGameState('playing');
    playSound('blip');
  };

  const handleTap = () => {
    if (gameState !== 'playing' || engine.current.isGameOver) return;

    const gameH = document.documentElement.clientHeight;
    const targetY = gameH * TARGET_CENTER_Y_PERCENT;
    const hitRadius = 50;

    let hit = false;
    for (let i = 0; i < engine.current.drops.length; i++) {
      const drop = engine.current.drops[i];
      if (Math.abs(drop.y - targetY) < hitRadius) {
        hit = true;
        engine.current.drops.splice(i, 1);
        setDropTick(t => t + 1);

        // Streak logic — bonus points for consecutive hits
        engine.current.streak++;
        streakRef.current = engine.current.streak;
        const streakBonus = Math.min(engine.current.streak, 10); // cap at 10x
        const pts = 10 + (streakBonus > 2 ? (streakBonus - 2) * 5 : 0);
        engine.current.score += pts;
        setScore(engine.current.score);
        setStreak(engine.current.streak);
        setBestStreak(b => Math.max(b, engine.current.streak));

        engine.current.baseSpeed += 8;
        engine.current.spawnRate = Math.max(700, engine.current.spawnRate - 40);

        // Update pulse speed — faster drops = faster pulse
        const newPulse = Math.max(0.5, 2.0 - (engine.current.score / 300));
        setPulseSpeed(newPulse);

        if (engine.current.streak === 3 || engine.current.streak === 5) {
          playSound('powerup');
        } else {
          playSound('hit');
        }

        setTargetState('hit');
        setTimeout(() => setTargetState('normal'), 180);
        break;
      }
    }

    if (!hit) {
      playSound('crash');
      engine.current.streak = 0;
      streakRef.current = 0;
      setStreak(0);
      engine.current.lives -= 1;
      setLives(engine.current.lives);
      setTargetState('miss');
      setTimeout(() => setTargetState('normal'), 300);
      if (engine.current.lives <= 0) {
        engine.current.isGameOver = true;
        setGameState('gameover');
        submitScore(engine.current.score);
      }
    }
  };

  const loadLeaderboard = async () => {
    try {
      const { data } = await supabase
        .from('game_scores')
        .select(`score, profiles(name, avatar_url)`)
        .eq('game_name', 'beaumont')
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
        const gameH = document.documentElement.clientHeight;

        if (time - e.lastSpawn > e.spawnRate) {
          const id = `drop-${e.dropId++}`;
          e.drops.push({ id, y: -60, speed: e.baseSpeed });
          e.lastSpawn = time;
          setDropTick(t => t + 1);
        }

        for (let i = e.drops.length - 1; i >= 0; i--) {
          const drop = e.drops[i];
          drop.y += drop.speed * dt;

          if (drop.y > gameH + 40) {
            playSound('crash');
            e.drops.splice(i, 1);
            e.streak = 0;
            streakRef.current = 0;
            setStreak(0);
            e.lives -= 1;
            setLives(e.lives);
            setTargetState('miss');
            setTimeout(() => setTargetState('normal'), 300);
            setDropTick(t => t + 1);
            if (e.lives <= 0 && !e.isGameOver) {
              e.isGameOver = true;
              setGameState('gameover');
              submitScore(e.score);
            }
          }
        }

        e.drops.forEach(drop => {
          const el = document.getElementById(drop.id);
          if (el) el.style.top = `${drop.y}px`;
        });
      }

      reqId = requestAnimationFrame(tick);
    };

    reqId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(reqId);
  }, [gameState, submitScore]);

  const targetTopPercent = TARGET_CENTER_Y_PERCENT * 100;
  const streakClass = streak >= 5 ? 'on-fire' : streak >= 3 ? 'heating-up' : '';

  return (
    <div className={`pa-container ${isDark ? 'dark' : ''}`}>
      <div className="pa-ui">
        <button onClick={onBack} className="games-back-btn" style={{ background: 'rgba(255,255,255,0.8)' }}>
          <ArrowLeft size={24} color="#111" />
        </button>
        <div className="pa-score-card">Score: {score}</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
          <div className="pa-lives-card">Lives: {lives}</div>
          {streak >= 2 && (
            <div className={`beaumont-streak ${streakClass}`}>
              <Zap size={14} /> {streak}× streak!
            </div>
          )}
        </div>
      </div>

      <div className="beaumont-game-area" style={{ height: '100dvh' }}>
        {/* Hit Target — rhythm pulse synced to drop speed via CSS var */}
        <div
          className={`spindletop-target ${targetState} ${streakClass}`}
          style={{
            position: 'absolute',
            top: `${targetTopPercent}%`,
            left: '50%',
            transform: 'translate(-50%, -50%)',
            '--pulse-duration': `${pulseSpeed}s`
          } as React.CSSProperties}
        />

        {/* Falling Oil Drops */}
        {gameState === 'playing' && engine.current.drops.map(drop => (
          <div key={drop.id} id={drop.id} className="oil-drop" style={{ top: drop.y }} />
        ))}

        {/* Full-screen tap zone */}
        {gameState === 'playing' && (
          <div className="beaumont-tap-zone" onPointerDown={(e) => { e.preventDefault(); handleTap(); }}>
            <div className={`beaumont-strike-label ${streakClass}`}>
              {streak >= 5 ? '🔥 STRIKE' : streak >= 3 ? '⚡ STRIKE' : 'STRIKE'}
              {streak >= 2 && <span className="beaumont-pts-hint">+{10 + (Math.min(streak,10)-2)*5}pts</span>}
            </div>
          </div>
        )}
      </div>

      {gameState === 'start' && (
        <div className="pa-modal-overlay">
          <div className="pa-modal">
            <h2>⛏️ Spindletop Striker</h2>
            <p>Tap when the oil drop hits the glowing ring. Hit in a row for <strong>streak bonuses</strong>!</p>
            <button onClick={startGame} className="pa-modal-btn">
              <Play size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
              Drill Now
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
            <h2 style={{ fontSize: '32px', marginBottom: '8px', color: '#111827' }}>Rig Shutdown!</h2>
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
              Drill Again
            </button>
            <button 
              onClick={() => shareScore('Spindletop Striker', Math.floor(score))} 
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
