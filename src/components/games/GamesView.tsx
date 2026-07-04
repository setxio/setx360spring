import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, Star, Gamepad2, Info, Share2, MoreVertical } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SlingoGame } from './SlingoGame';
import { GatorChaseGame } from './gator-chase/GatorChaseGame';
import { PecanCatchGame } from './pecan-catch/PecanCatchGame';
import { PortArthurGame } from './port-arthur/PortArthurGame';
import { BeaumontGame } from './beaumont/BeaumontGame';
import { NederlandGame } from './nederland/NederlandGame';
import { PortNechesGame } from './port-neches/PortNechesGame';
import { CityLeaderboard } from './CityLeaderboard';
import { ArcadeShop } from './ArcadeShop';
import { Trophy, Store } from 'lucide-react';
import './GamesView.css';

export const GamesView: React.FC = () => {
  const { setEnv, theme } = useApp();
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  
  const isDark = theme.includes('dark') || theme.includes('io') || theme.includes('neo');

  if (activeGame === 'slingo') {
    return <SlingoGame onBack={() => setActiveGame(null)} />;
  }

  if (activeGame === 'gator_chase') {
    return <GatorChaseGame onBack={() => setActiveGame(null)} />;
  }

  if (activeGame === 'pecan_catch') {
    return <PecanCatchGame onBack={() => setActiveGame(null)} />;
  }

  if (activeGame === 'port_arthur') {
    return <PortArthurGame onBack={() => setActiveGame(null)} />;
  }

  if (activeGame === 'beaumont') {
    return <BeaumontGame onBack={() => setActiveGame(null)} />;
  }

  if (activeGame === 'nederland') {
    return <NederlandGame onBack={() => setActiveGame(null)} />;
  }

  if (activeGame === 'port_neches') {
    return <PortNechesGame onBack={() => setActiveGame(null)} />;
  }

  if (activeGame === 'city_leaderboard') {
    return <CityLeaderboard onBack={() => setActiveGame(null)} />;
  }

  if (activeGame === 'arcade_shop') {
    return <ArcadeShop onBack={() => setActiveGame(null)} />;
  }

  const handlePlayNow = (gameId: string) => {
    setSelectedGame(null);
    setActiveGame(gameId);
  };

  return (
    <div className={`games-view-container ${isDark ? 'dark' : ''}`}>
      {/* Google Play Style Header */}
      <div className="games-header">
        <div className="games-header-inner">
          <button 
            onClick={() => setEnv('home')}
            className="games-back-btn"
          >
            <ArrowLeft size={24} />
          </button>
          
          <div className="games-search-bar">
            <Search size={20} className="games-search-icon" color="var(--text-muted, #6b7280)" />
            <input 
              type="text" 
              placeholder="Search for games" 
              className="games-search-input"
            />
          </div>
          
          <div className="games-user-avatar" />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="games-content">
        <div className="games-content-inner">

          {/* City Leaderboard Banner */}
          <div 
            className="games-leaderboard-banner"
            onClick={() => setActiveGame('city_leaderboard')}
            style={{
              background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
              borderRadius: '16px',
              padding: '20px',
              margin: '0 20px 24px 20px',
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              color: 'white',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
            }}
          >
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '12px', borderRadius: '50%', marginRight: '16px' }}>
              <Trophy size={28} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 800 }}>City Pride Leaderboard</h3>
              <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>Check which SETX city has the highest score!</p>
            </div>
          </div>
          
          {/* Arcade Shop Banner */}
          <div 
            className="games-leaderboard-banner"
            onClick={() => setActiveGame('arcade_shop')}
            style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              borderRadius: '16px',
              padding: '20px',
              margin: '0 20px 24px 20px',
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              color: 'white',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
            }}
          >
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '12px', borderRadius: '50%', marginRight: '16px' }}>
              <Store size={28} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 800 }}>Arcade Badge Shop</h3>
              <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>Spend your Arcade Coins on profile badges!</p>
            </div>
          </div>
          
          {/* Section: Recommended for you */}
          <div className="games-section">
            <div className="games-section-header">
              <h2 className="games-section-title">Recommended for you</h2>
              <button className="games-section-link">See all</button>
            </div>
            
            <div className="games-carousel">
              {/* Slingo App Icon Card */}
              <div 
                className="games-app-card"
                onClick={() => setSelectedGame('slingo')}
              >
                <div className="games-app-icon-wrapper">
                  <img src="/slingo-icon.png" alt="SETX Slingo" />
                </div>
                <h3 className="games-app-title">SETX Slingo</h3>
                <p className="games-app-category">Casino • Multiplayer</p>
                <div className="games-app-rating">
                  <span>4.8</span>
                  <Star size={10} fill="currentColor" />
                </div>
              </div>

              {/* Gator Chase App Card */}
              <div 
                className="games-app-card"
                onClick={() => setSelectedGame('gator_chase')}
              >
                <div className="games-app-icon-wrapper" style={{ background: '#000a14', border: '1px solid #1e3a8a' }}>
                  <img src="/images/gator-chase/cyan_gator.png" alt="Gator Chase" style={{ transform: 'scale(1.5)', marginTop: '12px' }} />
                </div>
                <h3 className="games-app-title">Gator Chase</h3>
                <p className="games-app-category">Arcade • Action</p>
                <div className="games-app-rating">
                  <span>5.0</span>
                  <Star size={10} fill="currentColor" />
                </div>
              </div>

              {/* Pecan Catch App Card */}
              <div 
                className="games-app-card"
                onClick={() => setSelectedGame('pecan_catch')}
              >
                <div className="games-app-icon-wrapper" style={{ background: '#87CEEB', border: '1px solid #38bdf8' }}>
                  <img src="/images/pecan-catch/pecan.png" alt="Groves Pecan Catch" style={{ transform: 'scale(1.2)', marginTop: '8px' }} />
                </div>
                <h3 className="games-app-title">Groves Pecan Catch</h3>
                <p className="games-app-category">Arcade • Casual</p>
                <div className="games-app-rating">
                  <span>4.9</span>
                  <Star size={10} fill="currentColor" />
                </div>
              </div>

              {/* Port Arthur App Card */}
              <div 
                className="games-app-card"
                onClick={() => setSelectedGame('port_arthur')}
              >
                <div className="games-app-icon-wrapper" style={{ background: '#1e3a8a', border: '1px solid #3b82f6' }}>
                  <img src="/images/port-arthur/boat.png" alt="Gulf Coast Skipper" style={{ transform: 'scale(1.2)', marginTop: '8px' }} />
                </div>
                <h3 className="games-app-title">Gulf Coast Skipper</h3>
                <p className="games-app-category">Arcade • Action</p>
                <div className="games-app-rating">
                  <span>4.9</span>
                  <Star size={10} fill="currentColor" />
                </div>
              </div>

              {/* Beaumont App Card */}
              <div className="games-app-card" onClick={() => setSelectedGame('beaumont')}>
                <div className="games-app-icon-wrapper" style={{ background: '#0f172a', border: '1px solid #fff' }}>
                  <img src="/images/beaumont/bg.png" alt="Spindletop Striker" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <h3 className="games-app-title">Spindletop Striker</h3>
                <p className="games-app-category">Arcade • Rhythm</p>
                <div className="games-app-rating">
                  <span>4.7</span>
                  <Star size={10} fill="currentColor" />
                </div>
              </div>

              {/* Nederland App Card */}
              <div className="games-app-card" onClick={() => setSelectedGame('nederland')}>
                <div className="games-app-icon-wrapper" style={{ background: '#22c55e', border: '1px solid #16a34a' }}>
                  <img src="/images/nederland/bg.png" alt="Windmill Defender" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <h3 className="games-app-title">Windmill Defender</h3>
                <p className="games-app-category">Arcade • Tap</p>
                <div className="games-app-rating">
                  <span>4.8</span>
                  <Star size={10} fill="currentColor" />
                </div>
              </div>

              {/* Port Neches App Card */}
              <div className="games-app-card" onClick={() => setSelectedGame('port_neches')}>
                <div className="games-app-icon-wrapper" style={{ background: '#38bdf8', border: '1px solid #0284c7' }}>
                  <img src="/images/port-neches/tugboat.png" alt="Riverfront Runner" style={{ transform: 'scale(1.2)', marginTop: '8px' }} />
                </div>
                <h3 className="games-app-title">Riverfront Runner</h3>
                <p className="games-app-category">Arcade • Action</p>
                <div className="games-app-rating">
                  <span>4.9</span>
                  <Star size={10} fill="currentColor" />
                </div>
              </div>

              {/* Coming Soon Placeholders */}
              {[1].map((i) => (
                <div key={i} className="games-app-card disabled">
                  <div className="games-app-icon-wrapper dashed">
                    <Gamepad2 color="var(--text-muted, #6b7280)" />
                  </div>
                  <h3 className="games-app-title">Coming Soon</h3>
                  <p className="games-app-category">Arcade</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Casino & Cards */}
          <div className="games-section">
            <div className="games-section-header">
              <h2 className="games-section-title">Casino & Cards</h2>
            </div>
            
            <div className="games-row-list">
              {/* Slingo Row Listing */}
              <div 
                className="games-row-item"
                onClick={() => setSelectedGame('slingo')}
              >
                <img src="/slingo-icon.png" alt="SETX Slingo" className="games-row-icon" />
                <div className="games-row-info">
                  <h3 className="games-row-title">SETX Slingo</h3>
                  <p className="games-row-desc">The classic game with a swampy twist.</p>
                  <div className="games-row-stats">
                    <span className="games-row-stats-item">4.8 <Star size={12} fill="currentColor" /></span>
                    <span>10K+ Plays</span>
                  </div>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); handlePlayNow('slingo'); }}
                  className="games-play-btn"
                >
                  Play
                </button>
              </div>
            </div>
          </div>
          
        </div>
      </div>

      {/* App Details Modal (Google Play Style) */}
      <AnimatePresence>
        {selectedGame && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`games-modal-overlay ${isDark ? 'dark' : ''}`}
          >
            {/* Modal Header */}
            <div className="games-modal-header">
              <button 
                onClick={() => setSelectedGame(null)}
                className="games-modal-btn"
              >
                <ArrowLeft size={24} />
              </button>
              <div className="games-modal-header-actions">
                <button className="games-modal-btn">
                  <Share2 size={20} />
                </button>
                <button className="games-modal-btn">
                  <MoreVertical size={20} />
                </button>
              </div>
            </div>

            <div className="games-modal-content">
              <div className="games-modal-content-inner">
                
                {/* App Identity */}
                <div className="games-modal-identity">
                  <div className="games-modal-icon" style={{ background: selectedGame === 'gator_chase' ? '#000a14' : selectedGame === 'pecan_catch' ? '#87CEEB' : selectedGame === 'port_arthur' ? '#1e3a8a' : selectedGame === 'nederland' ? '#22c55e' : selectedGame === 'port_neches' ? '#38bdf8' : 'transparent', border: selectedGame === 'gator_chase' ? '1px solid #1e3a8a' : selectedGame === 'pecan_catch' ? '1px solid #38bdf8' : selectedGame === 'port_arthur' ? '1px solid #3b82f6' : 'none' }}>
                    <img 
                      src={selectedGame === 'slingo' ? "/slingo-icon.png" : selectedGame === 'pecan_catch' ? "/images/pecan-catch/pecan.png" : selectedGame === 'port_arthur' ? "/images/port-arthur/boat.png" : selectedGame === 'beaumont' ? "/images/beaumont/bg.png" : selectedGame === 'nederland' ? "/images/nederland/bg.png" : selectedGame === 'port_neches' ? "/images/port-neches/tugboat.png" : "/images/gator-chase/cyan_gator.png"} 
                      alt={selectedGame} 
                      style={{ width: selectedGame === 'beaumont' || selectedGame === 'nederland' ? '100%' : 'auto', height: selectedGame === 'beaumont' || selectedGame === 'nederland' ? '100%' : 'auto', objectFit: selectedGame === 'beaumont' || selectedGame === 'nederland' ? 'cover' : 'contain' }}
                    />
                  </div>
                  <div className="games-modal-title-group">
                    <h1 className="games-modal-title">
                      {selectedGame === 'slingo' ? 'SETX Slingo' : selectedGame === 'pecan_catch' ? 'Groves Pecan Catch' : selectedGame === 'port_arthur' ? 'Gulf Coast Skipper' : selectedGame === 'beaumont' ? 'Spindletop Striker' : selectedGame === 'nederland' ? 'Windmill Defender' : selectedGame === 'port_neches' ? 'Riverfront Runner' : 'Gator Chase'}
                    </h1>
                    <p className="games-modal-developer">SETX 360 Games</p>
                    <p className="games-modal-tags">Contains ads • In-app purchases</p>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="games-modal-stats">
                  <div className="games-modal-stat-col">
                    <p className="games-modal-stat-value">
                      {selectedGame === 'slingo' ? '4.8' : '5.0'} <Star size={16} fill="currentColor" />
                    </p>
                    <p className="games-modal-stat-label">
                      {selectedGame === 'slingo' ? '2K reviews' : '150 reviews'}
                    </p>
                  </div>
                  <div className="games-modal-stat-col">
                    <p className="games-modal-stat-value">
                      {selectedGame === 'slingo' ? '10K+' : '500+'}
                    </p>
                    <p className="games-modal-stat-label">Downloads</p>
                  </div>
                  <div className="games-modal-stat-col">
                    <p className="games-modal-stat-value"><Gamepad2 size={24} /></p>
                    <p className="games-modal-stat-label">
                      {selectedGame === 'slingo' ? 'Casino' : 'Arcade'}
                    </p>
                  </div>
                </div>

                {/* Play Button */}
                <div className="games-modal-about">
                  <button 
                    onClick={() => handlePlayNow(selectedGame)}
                    className="games-modal-install-btn"
                  >
                    Play
                  </button>
                </div>

                {/* About this game */}
                <div className="games-modal-about">
                  <div className="games-modal-section-header">
                    <h2 className="games-modal-section-title">About this game</h2>
                    <ArrowLeft size={20} color="#16a34a" style={{ transform: 'rotate(180deg)' }} />
                  </div>
                  <p className="games-modal-about-text">
                    {selectedGame === 'slingo' ? (
                      <>
                        Match the numbers on your 5x5 grid with the numbers that spin below in this fast-paced hybrid of slots and bingo!
                        <br/><br/>
                        Watch out for the Gator who wants to steal your points, and hope the Pelican comes to save the day! Strike oil with the Golden Derrick, or use the Crawfish Joker to mark any number you need. 
                        <br/><br/>
                        Features a live chatroom so you can talk trash with other SETX locals while you play.
                      </>
                    ) : selectedGame === 'pecan_catch' ? (
                      <>
                        A classic catch game with a regional twist paying homage to the city of Groves!
                        <br/><br/>
                        Control your avatar and try to catch as many falling pecans as you can before they hit the ground. The squirrel above gets faster and faster as your score climbs!
                      </>
                    ) : selectedGame === 'port_arthur' ? (
                      <>
                        Steer your boat through the Port Arthur channel! Dodge buoys and sandbars in this 2.5D endless runner.
                      </>
                    ) : selectedGame === 'beaumont' ? (
                      <>
                        Beaumont, 1901! Experience the Spindletop oil boom in this rhythm/timing game. Tap the STRIKE button right as the oil drop hits the crosshair.
                      </>
                    ) : selectedGame === 'nederland' ? (
                      <>
                        Nederland, Texas! Defend the classic Dutch windmill from flying debris. Tap the rocks and branches before they hit the center.
                      </>
                    ) : selectedGame === 'port_neches' ? (
                      <>
                        Run through the beautiful Neches Riverfront park! Tap to jump over park benches and splashing tugboats in this endless runner.
                      </>
                    ) : (
                      <>
                        Run through the SETX swamp in this fast-paced arcade classic! 
                        <br/><br/>
                        Collect all the SETX Coins while avoiding the dangerous alligators. Grab a Crawfish to turn the tables and chomp on those gators for massive points. 
                        <br/><br/>
                        Can you survive all 20 rounds?
                      </>
                    )}
                  </p>
                </div>
                
                {/* Developer contact */}
                <div className="games-modal-about">
                  <h2 className="games-modal-section-title" style={{ marginBottom: '16px' }}>Developer contact</h2>
                  <div className="games-modal-dev-contact">
                    <div className="games-modal-dev-icon">
                      <Info size={20} color="var(--text-muted, #6b7280)" />
                    </div>
                    <div className="games-modal-dev-info">
                      <p className="games-modal-dev-name">Website</p>
                      <p className="games-modal-dev-url">setx360.com</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
