import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, MessageCircle, Trophy, ChevronDown, Clock, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameChat } from './GameChat';
import { Avatar } from '../Avatar';
import { supabase } from '../../lib/supabase';
import { useApp } from '../../context/AppContext';
import './SlingoGame.css';

interface SlingoGameProps {
  onBack: () => void;
}

type Cell = {
  id: string;
  value: number | 'FREE';
  marked: boolean;
  col: number;
  row: number;
};

type SpinResult = {
  type: 'number' | 'gator' | 'pelican' | 'crawfish' | 'derrick' | 'empty';
  value?: number;
  used: boolean;
};

type PlayerPresence = {
  user_id: string;
  user_name: string;
  avatar_url?: string;
  score: number;
  spins_left: number;
  is_finished: boolean;
};

const RANGES = [
  { min: 1, max: 15 },
  { min: 16, max: 30 },
  { min: 31, max: 45 },
  { min: 46, max: 60 },
  { min: 61, max: 75 },
];

export const SlingoGame: React.FC<SlingoGameProps> = ({ onBack }) => {
  const { user } = useApp();
  
  // Game State
  const [board, setBoard] = useState<Cell[]>([]);
  const [spinsLeft, setSpinsLeft] = useState(0);
  const [score, setScore] = useState(0);
  const [slots, setSlots] = useState<SpinResult[]>(Array(5).fill({ type: 'empty', used: true }));
  const [isSpinning, setIsSpinning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [message, setMessage] = useState('');
  const [activeCrawfishCol, setActiveCrawfishCol] = useState<number | null>(null);
  
  // Multiplayer State
  const [players, setPlayers] = useState<PlayerPresence[]>([]);
  const [gameState, setGameState] = useState<'lobby' | 'playing'>('playing');
  const [phase, setPhase] = useState<'spin' | 'match'>('spin');
  const [actionTimer, setActionTimer] = useState<number>(10);
  const [lobbyTimer, setLobbyTimer] = useState<number>(30);
  
  const channelRef = useRef<any>(null);
  const spinsLeftRef = useRef(spinsLeft);
  const gameOverRef = useRef(gameOver);
  const phaseRef = useRef(phase);
  const actionTimerRef = useRef(actionTimer);
  const gameStateRef = useRef(gameState);
  const slotsRef = useRef(slots);

  // Sync refs
  useEffect(() => { spinsLeftRef.current = spinsLeft; }, [spinsLeft]);
  useEffect(() => { gameOverRef.current = gameOver; }, [gameOver]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { actionTimerRef.current = actionTimer; }, [actionTimer]);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { slotsRef.current = slots; }, [slots]);

  // Action Timer Logic (Local Pacing)
  useEffect(() => {
    const interval = setInterval(() => {
      if (gameStateRef.current === 'lobby') {
        setLobbyTimer(prev => {
          if (prev <= 1) {
            startNewGame(20);
            return 30;
          }
          return prev - 1;
        });
      } else if (gameStateRef.current === 'playing' && spinsLeftRef.current >= 0 && !gameOverRef.current) {
        // If spinsLeft is 0, we can still be in match phase and timer ticks.
        // If spinsLeft is 0 and phase is spin, timer stops ticking (game over tracked).
        if (spinsLeftRef.current === 0 && phaseRef.current === 'spin') return;
        
        setActionTimer(prev => {
          if (prev <= 1) {
            handleTimeout();
            return 0; // will be reset by handleTimeout
          }
          return prev - 1;
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleTimeout = () => {
    if (phaseRef.current === 'spin') {
      // Forfeit spin
      setSpinsLeft(prev => prev - 1);
      showMessage("Spin forfeited! Too slow.");
      setSlots(Array(5).fill({ type: 'empty', used: true }));
      setActiveCrawfishCol(null);
      if (spinsLeftRef.current - 1 <= 0) {
        setGameOver(true);
      } else {
        setActionTimer(10);
      }
    } else if (phaseRef.current === 'match') {
      // Match time over
      setSlots(slotsRef.current.map(s => ({ ...s, used: true })));
      setActiveCrawfishCol(null);
      if (spinsLeftRef.current <= 0) {
        setGameOver(true);
        setPhase('spin');
      } else {
        setPhase('spin');
        setActionTimer(10);
      }
    }
  };

  // Supabase Presence
  useEffect(() => {
    const channel = supabase.channel('slingo-room', {
      config: { presence: { key: user?.id || Math.random().toString() } }
    });

    channel.on('presence', { event: 'sync' }, () => {
      const newState = channel.presenceState();
      const parsedPlayers: PlayerPresence[] = [];
      Object.keys(newState).forEach(key => {
        const presences = newState[key] as any[];
        if (presences.length > 0) {
          parsedPlayers.push(presences[0]);
        }
      });
      parsedPlayers.sort((a, b) => b.score - a.score);
      setPlayers(parsedPlayers);

      // Check lobby transition
      if (parsedPlayers.length > 0) {
        const allFinished = parsedPlayers.every(p => p.is_finished || p.spins_left === 0);
        if (allFinished && gameStateRef.current === 'playing') {
           setGameState('lobby');
           setLobbyTimer(30);
           setGameOver(true);
           
           const winner = parsedPlayers[0];
           if (winner.user_id === user?.id) {
             showMessage('Round Over! YOU WON!');
           } else {
             showMessage(`Round Over! ${winner.user_name} won!`);
           }
        }
      }
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        const state = channel.presenceState();
        let allFinished = true;
        let anyPlayers = false;
        Object.values(state).forEach((presences: any[]) => {
           if (presences.length > 0) {
             anyPlayers = true;
             if (!presences[0].is_finished && presences[0].spins_left > 0) allFinished = false;
           }
        });
        
        const isLobby = (anyPlayers && allFinished);
        const startingSpins = isLobby ? 0 : 20;
        
        await channel.track({
          user_id: user?.id || 'anon',
          user_name: user?.first_name ? `${user.first_name} ${user.last_name || ''}` : 'Anonymous',
          avatar_url: user?.avatar_url,
          score: 0,
          spins_left: startingSpins,
          is_finished: isLobby
        });

        if (isLobby) {
          setGameState('lobby');
          setGameOver(true);
          // Wait for timer from existing room members to trip startNewGame
        } else {
          startNewGame(20);
        }
      }
    });

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Sync state to presence
  useEffect(() => {
    if (channelRef.current && channelRef.current.state === 'joined') {
      const isActuallyFinished = gameOver || (spinsLeft === 0 && phase === 'spin');
      channelRef.current.track({
        user_id: user?.id || 'anon',
        user_name: user?.first_name ? `${user.first_name} ${user.last_name || ''}` : 'Anonymous',
        avatar_url: user?.avatar_url,
        score: score,
        spins_left: spinsLeft,
        is_finished: isActuallyFinished
      });
    }
  }, [score, spinsLeft, gameOver, phase, user]);

  const startNewGame = (startingSpins = 20) => {
    const newBoard: Cell[] = [];
    for (let c = 0; c < 5; c++) {
      const colNumbers = new Set<number>();
      while (colNumbers.size < 5) {
        const num = Math.floor(Math.random() * (RANGES[c].max - RANGES[c].min + 1)) + RANGES[c].min;
        colNumbers.add(num);
      }
      const nums = Array.from(colNumbers);
      for (let r = 0; r < 5; r++) {
        if (c === 2 && r === 2) {
          newBoard.push({ id: `c2r2`, value: 'FREE', marked: true, col: 2, row: 2 });
        } else {
          newBoard.push({ id: `c${c}r${r}`, value: nums[r], marked: false, col: c, row: r });
        }
      }
    }
    setBoard(newBoard);
    setSpinsLeft(startingSpins);
    setScore(0);
    setGameOver(false);
    setMessage(startingSpins > 0 ? 'Game Started! Good Luck!' : '');
    setSlots(Array(5).fill({ type: 'empty', used: true }));
    setActiveCrawfishCol(null);
    setGameState('playing');
    setPhase('spin');
    setActionTimer(10);
  };

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleSpinClick = () => {
    // Manual skip/finish during match phase
    if (phase === 'match') {
      setSlots(slots.map(s => ({ ...s, used: true })));
      setActiveCrawfishCol(null);
      setPhase('spin');
      setActionTimer(10);
      if (spinsLeft === 0) {
        setGameOver(true); // Manually finished last spin
        return;
      }
      // If spinsLeft > 0, we intentionally fall through to trigger the next spin immediately!
    }
    
    if (spinsLeft <= 0 || isSpinning || gameOver || activeCrawfishCol !== null || gameState === 'lobby') return;
    
    setIsSpinning(true);
    setSpinsLeft(prev => prev - 1);
    
    setTimeout(() => {
      const newSlots: SpinResult[] = [];
      let gatorAppeared = false;
      let pelicanAppeared = false;
      let derrickCount = 0;

      for (let c = 0; c < 5; c++) {
        const rand = Math.random();
        if (rand < 0.05) { 
          newSlots.push({ type: 'gator', used: false });
          gatorAppeared = true;
        } else if (rand < 0.10) { 
          newSlots.push({ type: 'pelican', used: false });
          pelicanAppeared = true;
        } else if (rand < 0.15) { 
          newSlots.push({ type: 'crawfish', used: false });
        } else if (rand < 0.20) { 
          newSlots.push({ type: 'derrick', used: false });
          derrickCount++;
        } else {
          const num = Math.floor(Math.random() * (RANGES[c].max - RANGES[c].min + 1)) + RANGES[c].min;
          newSlots.push({ type: 'number', value: num, used: false });
        }
      }

      setSlots(newSlots);
      setIsSpinning(false);
      setPhase('match');
      setActionTimer(30);
      processSpinResults(newSlots, gatorAppeared, pelicanAppeared, derrickCount);
    }, 800);
  };

  const processSpinResults = (currentSlots: SpinResult[], gatorAppeared: boolean, pelicanAppeared: boolean, derrickCount: number) => {
    let newScore = score;
    let msg = '';

    if (gatorAppeared) {
      if (pelicanAppeared) {
        msg = "Pelican saved you!";
      } else {
        msg = "Gator attack! Points halved!";
        newScore = Math.floor(newScore / 2);
      }
    } else if (pelicanAppeared) {
       msg = "Pelican Bonus! +500";
       newScore += 500;
    }

    if (derrickCount > 0) {
      const bonus = derrickCount * 1000;
      newScore += bonus;
      msg = msg ? `${msg} | Derrick! +${bonus}` : `Derrick Bonus! +${bonus}`;
    }

    setScore(newScore);
    if (msg) showMessage(msg);

    let crawfishColToActivate: number | null = null;

    currentSlots.forEach((slot, c) => {
      if (slot.type === 'crawfish' && !slot.used && crawfishColToActivate === null) {
        crawfishColToActivate = c;
      }
    });
    
    setSlots(currentSlots);

    if (crawfishColToActivate !== null) {
      setActiveCrawfishCol(crawfishColToActivate);
      showMessage("Select a number in the highlighted column!");
    }
  };

  const handleCellClick = (cellIndex: number) => {
    const cell = board[cellIndex];
    if (cell.marked) return;

    // Handle crawfish click
    if (activeCrawfishCol !== null) {
      if (cell.col === activeCrawfishCol) {
        const newBoard = [...board];
        newBoard[cellIndex].marked = true;
        setBoard(newBoard);
        setScore(prev => prev + 200);
        
        const newSlots = [...slots];
        newSlots[activeCrawfishCol].used = true;
        setSlots(newSlots);
        
        const nextCrawfish = newSlots.findIndex((s, i) => i > activeCrawfishCol! && s.type === 'crawfish' && !s.used);
        if (nextCrawfish !== -1) {
          setActiveCrawfishCol(nextCrawfish);
          showMessage("Select a number in the highlighted column!");
        } else {
          setActiveCrawfishCol(null);
        }
      }
      return;
    }

    // Handle normal number click
    const slot = slots[cell.col];
    if (slot && slot.type === 'number' && !slot.used && slot.value === cell.value) {
      const newBoard = [...board];
      newBoard[cellIndex].marked = true;
      setBoard(newBoard);
      setScore(prev => prev + 200);
      
      const newSlots = [...slots];
      newSlots[cell.col].used = true;
      setSlots(newSlots);
    }
  };

  const getSpinBtnStateClass = () => {
    if (gameState === 'lobby') return 'game-over-state';
    if (isSpinning || activeCrawfishCol !== null || gameOver || (spinsLeft === 0 && phase === 'spin')) return 'disabled-state';
    return 'active-state';
  };

  const myRank = players.findIndex(p => p.user_id === user?.id) + 1;

  return (
    <div className="slingo-container">
      
      <div className="slingo-main">
        
        {/* Game Area */}
        <div className="slingo-game-area">
          <div className="slingo-game-content">

            {/* Slim Mobile Top Bar */}
            <div className="slingo-slim-top-bar">
              <button onClick={onBack} className="slingo-back-btn">
                <ArrowLeft size={20} />
              </button>
              <div className="slingo-header-status">
                <Clock size={16} />
                <span>
                  {gameState === 'lobby' 
                    ? `Next: ${lobbyTimer}s` 
                    : `Time: ${actionTimer}s`}
                </span>
              </div>
              <div className="slingo-mobile-rank">
                <Trophy size={16} color="#eab308" />
                <span>#{myRank > 0 ? myRank : '-'}</span>
              </div>
            </div>
            
            <div className="slingo-hud">
              <div className="slingo-stat-box score">
                <p className="slingo-stat-label">Score</p>
                <p className="slingo-stat-value">{score.toLocaleString()}</p>
              </div>

              <div className="slingo-toast-container">
                <AnimatePresence>
                  {message && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.9 }}
                      className="slingo-toast"
                    >
                      {message}
                    </motion.div>
                  )}
                  {gameState === 'lobby' && !message && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="slingo-toast bg-blue-900 border-blue-500"
                    >
                      Game starts in {lobbyTimer}s
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="slingo-stat-box spins">
                <p className="slingo-stat-label">Spins</p>
                <p className="slingo-stat-value">{spinsLeft}</p>
              </div>
            </div>

            <div className="slingo-board-wrapper">
              <div className="slingo-board">
                <div className="slingo-columns-header">
                  {['T','E','X','A','S'].map((letter, idx) => {
                    return (
                      <div key={idx} className={`slingo-header-ball col-${idx}`}>
                        <span className="slingo-header-letter">{letter}</span>
                      </div>
                    );
                  })}
                </div>
                
                <div className="slingo-grid">
                  {board.map((cell, index) => {
                    const isHighlighted = activeCrawfishCol === cell.col && !cell.marked;
                    const isMatchable = activeCrawfishCol === null && 
                                        !cell.marked && 
                                        slots[cell.col]?.type === 'number' && 
                                        !slots[cell.col].used && 
                                        slots[cell.col].value === cell.value;
                    const canClick = isHighlighted || isMatchable;

                    return (
                      <div 
                        key={cell.id} 
                        onClick={() => canClick && handleCellClick(index)}
                        className={`slingo-cell ${cell.marked ? 'marked' : 'unmarked'} ${canClick ? 'highlighted' : ''}`}
                      >
                        {cell.marked && cell.value !== 'FREE' && (
                          <div className="slingo-cell-star-bg"><span>★</span></div>
                        )}
                        <span className="slingo-cell-content">{cell.value === 'FREE' ? '★' : cell.value}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="slingo-slots">
                  {slots.map((slot, i) => (
                    <div key={i} className={`slingo-slot ${activeCrawfishCol === i ? 'active-crawfish' : ''} ${slot.used ? (slot.type === 'empty' ? 'used empty' : 'used') : ''}`}>
                      {isSpinning ? (
                        <motion.div animate={{ y: [0, -30, 0] }} transition={{ repeat: Infinity, duration: 0.1, ease: "linear" }} className="slingo-slot-spinner">
                          ?
                        </motion.div>
                      ) : (
                        <div className="slingo-slot-content">
                          {slot.type === 'number' && <span className="slingo-slot-number">{slot.value}</span>}
                          {slot.type === 'gator' && <span title="Gator" className="slingo-slot-emoji">🐊</span>}
                          {slot.type === 'pelican' && <span title="Pelican" className="slingo-slot-emoji">🦤</span>}
                          {slot.type === 'crawfish' && <span title="Crawfish" className="slingo-slot-emoji">🦞</span>}
                          {slot.type === 'derrick' && <span title="Derrick" className="slingo-slot-emoji">🗼</span>}
                        </div>
                      )}
                      <div className="slingo-slot-glass" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="slingo-desktop-spin-wrapper relative">
                <button 
                  onClick={handleSpinClick}
                  disabled={getSpinBtnStateClass() === 'disabled-state'}
                  className={`slingo-spin-btn desktop ${getSpinBtnStateClass()}`}
                >
                  <span className="slingo-spin-btn-text">
                    {gameState === 'lobby' ? 'WAIT' : (spinsLeft === 0 && phase === 'match' ? 'FINISH' : 'SPIN')}
                  </span>
                  {getSpinBtnStateClass() === 'active-state' && (
                    <div className="slingo-spin-btn-glass" />
                  )}
                </button>
                {gameState === 'playing' && !gameOver && (
                  <div className="slingo-spin-timer-badge">
                    {actionTimer}s
                  </div>
                )}
              </div>
            </div>

            <div className="slingo-mobile-spin-wrapper relative">
              <button 
                  onClick={handleSpinClick}
                  disabled={getSpinBtnStateClass() === 'disabled-state'}
                  className={`slingo-spin-btn mobile ${getSpinBtnStateClass()}`}
                >
                  <span className="slingo-spin-btn-text">
                    {gameState === 'lobby' ? 'WAITING FOR ROUND' : (spinsLeft === 0 && phase === 'match' ? 'FINISH' : 'SPIN')}
                  </span>
                  {getSpinBtnStateClass() === 'active-state' && (
                    <div className="slingo-spin-btn-glass" />
                  )}
              </button>
              {gameState === 'playing' && !gameOver && (
                <div className="slingo-spin-timer-bar-wrapper">
                  <motion.div 
                    initial={{ width: '100%' }}
                    animate={{ width: `${(actionTimer / (phase === 'match' ? 30 : 10)) * 100}%` }}
                    transition={{ duration: 1, ease: "linear" }}
                    className="slingo-spin-timer-bar"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar / Bottom Content */}
        <div className="slingo-sidebar-panel">
          <div className="slingo-sidebar-content">
            <div className="slingo-sidebar-tab-content leaderboard-panel">
              <div className="slingo-leaderboard-header">
                <Trophy size={16} color="#eab308" /> Leaderboard
              </div>
              <div className="slingo-leaderboard-list">
                {players.length === 0 && (
                  <div className="slingo-leaderboard-empty">No players in room.</div>
                )}
                {players.map((p, i) => (
                  <div key={p.user_id} className={`slingo-leaderboard-row ${p.user_id === user?.id ? 'is-me' : ''}`}>
                    <div className="rank">#{i + 1}</div>
                    <Avatar url={p.avatar_url} name={p.user_name} size={32} />
                    <div className="info">
                      <div className="name">{p.user_name}</div>
                      <div className="status">{p.is_finished ? 'Finished' : `${p.spins_left} spins left`}</div>
                    </div>
                    <div className="score">{p.score.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="slingo-sidebar-tab-content chat-panel">
              <div className="slingo-chat-header mobile-only">
                <MessageCircle size={16} color="#3b82f6" /> Live Chat
              </div>
              <GameChat />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
