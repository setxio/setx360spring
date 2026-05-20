import type { User } from '../types/user';
import React, { useState } from 'react';
import { Play, SkipBack, SkipForward, Repeat, Shuffle, ListMusic, Mic2, Volume2, Heart } from 'lucide-react';
import './MusicView.css';

const RECENT_ALBUMS = [
  { id: 'a1', title: 'Midnight Pulse', artist: 'Neo Waves', cover: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=300' },
  { id: 'a2', title: 'Urban Jungle', artist: 'Street Spirit', cover: 'https://images.unsplash.com/photo-1514525253361-bee8d40026bc?auto=format&fit=crop&q=80&w=300' },
  { id: 'a3', title: 'Lofi Horizons', artist: 'Chill Bound', cover: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&q=80&w=300' },
  { id: 'a4', title: 'Electric Dreams', artist: 'Synth Soul', cover: 'https://images.unsplash.com/photo-1459749411177-042180ce673c?auto=format&fit=crop&q=80&w=300' }
];

const TOP_SONGS = [
  { id: 's1', title: 'Starlight Runner', artist: 'Neo Waves', duration: '3:45' },
  { id: 's2', title: 'Concrete Garden', artist: 'Street Spirit', duration: '4:12' },
  { id: 's3', title: 'Golden Hour', artist: 'Chill Bound', duration: '2:58' },
  { id: 's4', title: 'Cyber City', artist: 'Synth Soul', duration: '3:20' },
  { id: 's5', title: 'Neon Nightscape', artist: 'Vibe Logic', duration: '5:02' }
];

export const MusicView: React.FC<{ user: User; scope: string }> = () => {
  const [currentSong, setCurrentSong] = useState(TOP_SONGS[0]);
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="music-container">
      <div className="music-header">
        <h2 className="music-title">Listen Now</h2>
        <div className="music-user-actions">
          <Heart size={24} className="music-fav-icon" />
          <ListMusic size={24} />
        </div>
      </div>

      <section className="music-section">
        <h3 className="section-subtitle">Recommended Albums</h3>
        <div className="album-scroll">
          {RECENT_ALBUMS.map(album => (
            <div key={album.id} className="album-card">
              <div className="album-cover-wrap">
                <img src={album.cover} alt={album.title} className="album-cover" />
                <button className="album-play-btn"><Play size={20} fill="#fff" /></button>
              </div>
              <h4 className="album-title">{album.title}</h4>
              <p className="album-artist">{album.artist}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="music-section">
        <h3 className="section-subtitle">Trending Songs</h3>
        <div className="song-list">
          {TOP_SONGS.map((song, index) => (
            <div 
              key={song.id} 
              className={`song-row ${currentSong.id === song.id ? 'active' : ''}`}
              onClick={() => setCurrentSong(song)}
            >
              <span className="song-index">{index + 1}</span>
              <div className="song-info">
                <h4 className="song-name">{song.title}</h4>
                <p className="song-artist">{song.artist}</p>
              </div>
              <span className="song-duration">{song.duration}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Mini Player */}
      <div className="mini-player glass">
        <div className="player-song-info">
          <img src={RECENT_ALBUMS[0].cover} alt="Now Playing" className="player-cover" />
          <div className="player-text">
            <h4 className="player-song-name">{currentSong.title}</h4>
            <p className="player-artist-name">{currentSong.artist}</p>
          </div>
        </div>

        <div className="player-controls">
          <button className="control-btn"><Shuffle size={18} /></button>
          <button className="control-btn"><SkipBack size={24} fill="#fff" /></button>
          <button 
            className="control-btn play-pause-btn"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? <div className="pause-icon" /> : <Play size={24} fill="#fff" />}
          </button>
          <button className="control-btn"><SkipForward size={24} fill="#fff" /></button>
          <button className="control-btn"><Repeat size={18} /></button>
        </div>

        <div className="player-extra">
          <button className="control-btn"><Mic2 size={18} /></button>
          <button className="control-btn"><Volume2 size={18} /></button>
        </div>
        
        <div className="player-progress-bar">
          <div className="progress-fill" style={{ width: '35%' }} />
        </div>
      </div>
    </div>
  );
};
