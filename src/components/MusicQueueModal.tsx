import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { X, Play, Pause, SkipForward, SkipBack, Music } from 'lucide-react';
import './MusicQueueModal.css';

export const MusicQueueModal: React.FC = () => {
  const { isQueueModalOpen, setIsQueueModalOpen, currentSong, isPlaying, togglePlay, playSong, queue, queueIndex, playNext, playPrevious } = useApp();
  const handleClose = () => setIsQueueModalOpen(false);
  const handleSongSelect = (song: any, index: number) => {
    // We want to jump to this index in the queue.
    // Since playSong resets the queue if context isn't provided, we pass the current queue.
    playSong(song, queue);
  };
  
  const upcomingSongs = queue && queue.length > 0 ? queue.slice(queueIndex + 1) : [];

  return (
    <AnimatePresence>
      {isQueueModalOpen && (
        <motion.div 
          className="music-queue-overlay" 
          onClick={handleClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="music-queue-modal"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            onClick={(e: any) => e.stopPropagation()}
          >
            <div className="queue-drag-handle" />
            <button className="queue-close-btn" onClick={handleClose} style={{ zIndex: 50 }}>
              <X size={24} />
            </button>

            <div className="queue-now-playing">
              <div className={`queue-cover-container ${isPlaying ? 'spinning' : ''}`}>
                {currentSong?.cover ? (
                  <img src={currentSong.cover} alt={currentSong.title} className="queue-cover" />
                ) : (
                  <div className="queue-cover-placeholder">
                    <Music size={48} />
                  </div>
                )}
              </div>
              <h2 className="queue-title">{currentSong?.title || 'No track playing'}</h2>
              <p className="queue-artist">{currentSong?.artist || 'Unknown Artist'}</p>

              <div className="queue-controls">
                <button className="queue-control-btn" onClick={playPrevious}><SkipBack size={28} fill="currentColor" /></button>
                <button className="queue-play-btn" onClick={togglePlay}>
                  {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" />}
                </button>
                <button className="queue-control-btn" onClick={playNext}><SkipForward size={28} fill="currentColor" /></button>
              </div>
            </div>

            <div className="queue-upcoming-section">
              <h3 className="queue-upcoming-title">Upcoming</h3>
              <div className="queue-list">
                {upcomingSongs.length === 0 && <div style={{ textAlign: 'center', opacity: 0.5, marginTop: '20px' }}>No upcoming tracks</div>}
                {upcomingSongs.map((song, idx) => (
                  <div 
                    key={`${song.id}-${idx}`} 
                    className="queue-item"
                    onClick={() => handleSongSelect(song, queueIndex + 1 + idx)}
                  >
                    <img src={song.cover} alt={song.title} className="queue-item-cover" />
                    <div className="queue-item-info">
                      <h4 className="queue-item-title">{song.title}</h4>
                      <p className="queue-item-artist">{song.artist}</p>
                    </div>
                    <span className="queue-item-duration">{song.duration || '3:45'}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
