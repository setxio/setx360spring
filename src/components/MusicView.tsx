/* c:\Users\montg\OneDrive\Desktop\SETX 360 Final\src\components\MusicView.tsx */
import type { User } from '../types/user';
import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { Play, Search, Cast, UserCircle, MoreVertical, Music2, Headphones, Activity, ArrowLeft, X, Plus, ListMusic, Lock, Globe, Users } from 'lucide-react';
import './MusicView.css';

const MOODS = [
  { name: 'Workout', color: 'linear-gradient(135deg, #FF416C 0%, #FF4B2B 100%)' },
  { name: 'Chill', color: 'linear-gradient(135deg, #1fa2ff 0%, #12d8fa 50%, #a6ffcb 100%)' },
  { name: 'Focus', color: 'linear-gradient(135deg, #5f2c82 0%, #49a09d 100%)' },
  { name: 'Commute', color: 'linear-gradient(135deg, #FDC830 0%, #F37335 100%)' },
  { name: 'Sleep', color: 'linear-gradient(135deg, #141E30 0%, #243B55 100%)' },
  { name: 'Party', color: 'linear-gradient(135deg, #8A2387 0%, #E94057 50%, #F27121 100%)' }
];

const RECENT_ALBUMS = [
  { id: 'a1', title: 'Midnight Pulse', artist: 'Neo Waves', cover: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=300' },
  { id: 'a2', title: 'Urban Jungle', artist: 'Street Spirit', cover: 'https://images.unsplash.com/photo-1514525253361-bee8d40026bc?auto=format&fit=crop&q=80&w=300' },
  { id: 'a3', title: 'Lofi Horizons', artist: 'Chill Bound', cover: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&q=80&w=300' },
  { id: 'a4', title: 'Electric Dreams', artist: 'Synth Soul', cover: 'https://images.unsplash.com/photo-1459749411177-042180ce673c?auto=format&fit=crop&q=80&w=300' },
  { id: 'a5', title: 'Neon Nightscape', artist: 'Vibe Logic', cover: 'https://images.unsplash.com/photo-1621360811013-c76831f162cb?auto=format&fit=crop&q=80&w=300' }
];

const MIXES = [
  { id: 'm1', title: 'My Supermix', artist: 'Neo Waves, Street Spirit', cover: 'https://images.unsplash.com/photo-1514525253361-bee8d40026bc?auto=format&fit=crop&q=80&w=300' },
  { id: 'm2', title: 'Discover Mix', artist: 'Synth Soul, Vibe Logic', cover: 'https://images.unsplash.com/photo-1459749411177-042180ce673c?auto=format&fit=crop&q=80&w=300' },
  { id: 'm3', title: 'New Release Mix', artist: 'Chill Bound, Neo Waves', cover: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&q=80&w=300' }
];

const TOP_SONGS = [
  { id: 's1', title: 'Starlight Runner', artist_name: 'Neo Waves', duration: '6:12', cover: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=300', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', isExplicit: true },
  { id: 's2', title: 'Concrete Garden', artist_name: 'Street Spirit', duration: '7:05', cover: 'https://images.unsplash.com/photo-1514525253361-bee8d40026bc?auto=format&fit=crop&q=80&w=300', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', isExplicit: false },
  { id: 's3', title: 'Golden Hour', artist_name: 'Chill Bound', duration: '5:44', cover: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&q=80&w=300', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', isExplicit: false },
  { id: 's4', title: 'Cyber City', artist_name: 'Synth Soul', duration: '5:02', cover: 'https://images.unsplash.com/photo-1459749411177-042180ce673c?auto=format&fit=crop&q=80&w=300', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', isExplicit: true },
  { id: 's5', title: 'Neon Nightscape', artist_name: 'Vibe Logic', duration: '5:53', cover: 'https://images.unsplash.com/photo-1621360811013-c76831f162cb?auto=format&fit=crop&q=80&w=300', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', isExplicit: false }
];

type MusicTab = 'home' | 'explore' | 'library';

export const MusicView: React.FC<{ user: User; scope: string }> = ({ user }) => {
  const { 
    currentSong, playSong, activeTab: globalActiveTab, setActiveTab: setGlobalActiveTab,
    musicSearchQuery: searchQuery, setMusicSearchQuery: setSearchQuery,
    musicIsSearchActive: isSearchActive, setMusicIsSearchActive: setIsSearchActive,
    musicActiveArtist: activeArtist, setMusicActiveArtist: setActiveArtist,
    musicActivePlaylist: activePlaylist, setMusicActivePlaylist: setActivePlaylist
  } = useApp();
  
  const [activeTab, setActiveTab] = useState<MusicTab>('home');
  const [activeFilter, setActiveFilter] = useState('All');
  const [tracks, setTracks] = useState<any[]>([]);

  // Phase 3 Playlist State
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPlaylistTitle, setNewPlaylistTitle] = useState('');
  const [newPlaylistVisibility, setNewPlaylistVisibility] = useState('private');
  
  const [optionsSong, setOptionsSong] = useState<any | null>(null);
  const [isAddToPlaylistOpen, setIsAddToPlaylistOpen] = useState(false);
  
  const [playlistTracks, setPlaylistTracks] = useState<any[]>([]);

  useEffect(() => {
    if (globalActiveTab === 0) setActiveTab('home');
    if (globalActiveTab === 1) setActiveTab('explore');
    if (globalActiveTab === 2) setActiveTab('library');
  }, [globalActiveTab]);

  useEffect(() => {
    fetchTracks();
    if (user?.id) fetchPlaylists();
  }, [user]);

  const fetchTracks = async () => {
    const { data } = await supabase.from('media_tracks').select('*').order('created_at', { ascending: false });
    if (data && data.length > 0) {
      setTracks(data.map(d => ({
        ...d,
        artist_name: d.artist_name || d.artist || 'Unknown Artist',
        cover: d.cover || 'https://images.unsplash.com/photo-1459749411177-042180ce673c?auto=format&fit=crop&q=80&w=300'
      })));
    } else {
      setTracks(TOP_SONGS);
    }
  };

  const fetchPlaylists = async () => {
    if (!user?.id) return;
    const { data } = await supabase.from('media_playlists').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (data) setPlaylists(data);
  };

  const loadPlaylistDetails = async (playlist: any) => {
    setActivePlaylist(playlist);
    const { data: mappings } = await supabase.from('media_playlist_tracks').select('track_id').eq('playlist_id', playlist.id);
    if (mappings && mappings.length > 0) {
      const trackIds = mappings.map(m => m.track_id);
      const pt = tracks.filter(t => trackIds.includes(t.id));
      setPlaylistTracks(pt);
    } else {
      setPlaylistTracks([]);
    }
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistTitle.trim() || !user?.id) return;
    const { data, error } = await supabase.from('media_playlists').insert({
      user_id: user.id,
      title: newPlaylistTitle.trim(),
      visibility: newPlaylistVisibility
    }).select().single();
    
    if (!error && data) {
      setPlaylists([data, ...playlists]);
      setIsCreateModalOpen(false);
      setNewPlaylistTitle('');
      setNewPlaylistVisibility('private');
    }
  };

  const handleAddSongToPlaylist = async (playlistId: string) => {
    if (!optionsSong) return;
    await supabase.from('media_playlist_tracks').insert({
      playlist_id: playlistId,
      track_id: optionsSong.id
    });
    
    // Attempt to update playlist cover with song cover if empty
    const playlist = playlists.find(p => p.id === playlistId);
    if (playlist && !playlist.cover_url) {
      await supabase.from('media_playlists').update({ cover_url: optionsSong.cover }).eq('id', playlistId);
      fetchPlaylists();
    }
    
    setIsAddToPlaylistOpen(false);
    setOptionsSong(null);
  };

  const handleSongSelect = (song: any, contextQueue?: any[]) => {
    playSong({ ...song, artist: song.artist_name }, contextQueue?.map(s => ({ ...s, artist: s.artist_name })));
  };

  // ─── Aggregations ───
  const artistTracks = useMemo(() => {
    if (!activeArtist) return [];
    return tracks.filter(t => t.artist_name.toLowerCase() === activeArtist.toLowerCase());
  }, [tracks, activeArtist]);

  const artistAlbums = useMemo(() => {
    if (!activeArtist) return [];
    const uniqueCovers = new Set();
    const albums: any[] = [];
    artistTracks.forEach(t => {
      if (!uniqueCovers.has(t.cover)) {
        uniqueCovers.add(t.cover);
        albums.push({ title: t.title, artist: t.artist_name, cover: t.cover, id: t.id });
      }
    });
    return albums;
  }, [artistTracks, activeArtist]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return { songs: [], artists: [] };
    const lowerQuery = searchQuery.toLowerCase();
    const matchedSongs = tracks.filter(t => t.title?.toLowerCase().includes(lowerQuery));
    const artistMap = new Map();
    tracks.forEach(t => {
      if (t.artist_name?.toLowerCase().includes(lowerQuery) && !artistMap.has(t.artist_name)) {
        artistMap.set(t.artist_name, { name: t.artist_name, cover: t.cover });
      }
    });
    return {
      songs: matchedSongs.slice(0, 8),
      artists: Array.from(artistMap.values()).slice(0, 4)
    };
  }, [tracks, searchQuery]);

  // ─── Views ───
  const renderHome = () => (
    <div className="music-content">
      <div className="filter-chips">
        {['Relax', 'Workout', 'Podcasts', 'Commute'].map(f => (
          <button key={f} className="filter-chip">{f}</button>
        ))}
      </div>

      <section className="music-section">
        <div className="section-header">
          <div>
            <p className="section-subtitle">Start Radio From a Song</p>
            <h3 className="section-title">Quick Picks</h3>
          </div>
        </div>
        <div className="list-grid">
          {tracks.slice(0, 12).map((song) => (
            <div 
              key={song.id} 
              className={`song-row ${currentSong?.id === song.id ? 'active' : ''}`}
              onClick={() => handleSongSelect(song, tracks)}
            >
              <div className="song-row-cover-wrap">
                <img src={song.cover} alt={song.title} className="song-row-cover" />
                <div className="song-row-play">
                  <Play size={20} fill="#fff" color="#fff" />
                </div>
              </div>
              <div className="song-row-info">
                <h4 className="song-row-title">{song.title}</h4>
                <p 
                  className="song-row-artist" 
                  onClick={(e) => { e.stopPropagation(); setActiveArtist(song.artist_name); }}
                  style={{ cursor: 'pointer' }}
                >
                  {song.isExplicit && <span className="explicit-badge">E</span>}
                  <span style={{ transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}>
                    {song.artist_name}
                  </span>
                </p>
              </div>
              <button className="song-row-action" onClick={(e) => { e.stopPropagation(); setOptionsSong(song); setIsAddToPlaylistOpen(true); }}>
                <Plus size={18} />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="music-section">
        <div className="section-header">
          <h3 className="section-title">Listen again</h3>
          <button className="section-more-btn">More</button>
        </div>
        <div className="horizontal-scroll">
          {RECENT_ALBUMS.map(album => (
            <div key={album.id} className="album-card">
              <div className="album-cover-wrap">
                <img src={album.cover} alt={album.title} className="album-cover" />
                <button className="album-play-btn"><Play size={24} fill="#fff" color="#fff" /></button>
              </div>
              <div>
                <h4 className="album-title">{album.title}</h4>
                <p className="album-artist">{album.artist}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="music-section">
        <div className="section-header">
          <h3 className="section-title">Mixed for you</h3>
        </div>
        <div className="horizontal-scroll">
          {MIXES.map(mix => (
            <div key={mix.id} className="album-card">
              <div className="album-cover-wrap">
                <img src={mix.cover} alt={mix.title} className="album-cover" />
                <button className="album-play-btn"><Play size={24} fill="#fff" color="#fff" /></button>
              </div>
              <div>
                <h4 className="album-title">{mix.title}</h4>
                <p className="album-artist">{mix.artist}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );

  const renderExplore = () => (
    <div className="music-content">
      <div className="horizontal-scroll" style={{ paddingBottom: '24px' }}>
        <div className="album-card" style={{ width: 'auto', gap: 16, flexDirection: 'row', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '16px 24px', borderRadius: 12 }}>
          <Music2 size={32} color="var(--primary)" />
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>New Releases</h3>
        </div>
        <div className="album-card" style={{ width: 'auto', gap: 16, flexDirection: 'row', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '16px 24px', borderRadius: 12 }}>
          <Activity size={32} color="#f43f5e" />
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Charts</h3>
        </div>
      </div>

      <section className="music-section">
        <div className="section-header">
          <h3 className="section-title">Moods & Genres</h3>
        </div>
        <div className="moods-grid">
          {MOODS.map(mood => (
            <div key={mood.name} className="mood-card" style={{ background: mood.color }}>
              <h4 className="mood-title">{mood.name}</h4>
            </div>
          ))}
        </div>
      </section>
    </div>
  );

  const renderLibrary = () => (
    <div className="music-content">
      <div className="filter-chips">
        {['Playlists', 'Songs', 'Albums', 'Artists'].map(f => (
          <button 
            key={f} 
            className={`filter-chip ${activeFilter === f ? 'active' : ''}`}
            onClick={() => setActiveFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      <section className="music-section" style={{ marginTop: 16 }}>
        <div className="section-header" style={{ marginBottom: 12 }}>
          <button className="music-create-btn" onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={20} /> New Playlist
          </button>
        </div>

        <div className="horizontal-scroll">
          <div className="album-card">
            <div className="album-cover-wrap" style={{ background: 'linear-gradient(135deg, #111, #333)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Play size={48} color="rgba(255,255,255,0.2)" />
            </div>
            <div>
              <h4 className="album-title">Your Likes</h4>
              <p className="album-artist">Auto playlist</p>
            </div>
          </div>
          
          {playlists.map(pl => (
            <div key={pl.id} className="album-card" onClick={() => loadPlaylistDetails(pl)}>
              <div className="album-cover-wrap" style={{ background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {pl.cover_url ? (
                  <img src={pl.cover_url} alt={pl.title} className="album-cover" />
                ) : (
                  <Music2 size={40} color="rgba(255,255,255,0.2)" />
                )}
              </div>
              <h4 className="album-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {pl.title}
                {pl.visibility === 'private' && <Lock size={12} color="rgba(255,255,255,0.5)" />}
                {pl.visibility === 'friends' && <Users size={12} color="rgba(255,255,255,0.5)" />}
                {pl.visibility === 'public' && <Globe size={12} color="rgba(255,255,255,0.5)" />}
              </h4>
              <p className="album-artist">Playlist</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );

  // ─── Artist Overlay ───
  const renderArtistOverlay = () => {
    if (!activeArtist) return null;
    return (
      <div className="music-overlay">
        <button className="overlay-back-btn" onClick={() => setActiveArtist(null)}>
          <ArrowLeft size={24} />
        </button>
        
        <div className="artist-hero" style={{ '--artist-bg': `url(${artistAlbums[0]?.cover})` } as any}>
          <h1 className="artist-hero-title">{activeArtist}</h1>
          <p className="artist-hero-subtitle">{artistTracks.length} tracks • {artistAlbums.length} albums</p>
        </div>

        <div className="music-content" style={{ padding: '24px 0' }}>
          <section className="music-section">
            <div className="section-header">
              <h3 className="section-title">Top Songs</h3>
            </div>
            <div className="song-list" style={{ padding: '0 24px' }}>
              {artistTracks.slice(0, 5).map((song, idx) => (
                <div key={song.id} className={`song-row ${currentSong?.id === song.id ? 'active' : ''}`} onClick={() => handleSongSelect(song, artistTracks.slice(0, 5))} style={{ width: '100%' }}>
                  <span style={{ width: 24, fontSize: 13, color: 'rgba(255,255,255,0.5)', textAlign: 'right', paddingRight: 12 }}>{idx + 1}</span>
                  <div className="song-row-cover-wrap" style={{ width: 40, height: 40 }}>
                    <img src={song.cover} alt={song.title} className="song-row-cover" />
                  </div>
                  <div className="song-row-info">
                    <h4 className="song-row-title">{song.title}</h4>
                  </div>
                  <button className="song-row-action" onClick={(e) => { e.stopPropagation(); setOptionsSong(song); setIsAddToPlaylistOpen(true); }}>
                    <Plus size={18} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="music-section" style={{ marginTop: 24 }}>
            <div className="section-header">
              <h3 className="section-title">Albums & Singles</h3>
            </div>
            <div className="horizontal-scroll">
              {artistAlbums.map((album, idx) => (
                <div key={idx} className="album-card">
                  <div className="album-cover-wrap">
                    <img src={album.cover} alt={album.title} className="album-cover" />
                    <button className="album-play-btn"><Play size={24} fill="#fff" color="#fff" /></button>
                  </div>
                  <div>
                    <h4 className="album-title">{album.title}</h4>
                    <p className="album-artist">Single • 2024</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    );
  };

  // ─── Playlist Detail Overlay ───
  const renderPlaylistOverlay = () => {
    if (!activePlaylist) return null;
    return (
      <div className="music-overlay">
        <button className="overlay-back-btn" onClick={() => setActivePlaylist(null)}>
          <ArrowLeft size={24} />
        </button>
        
        <div className="artist-hero" style={{ '--artist-bg': activePlaylist.cover_url ? `url(${activePlaylist.cover_url})` : 'linear-gradient(135deg, #FF416C 0%, #FF4B2B 100%)' } as any}>
          <h1 className="artist-hero-title">{activePlaylist.title}</h1>
          <p className="artist-hero-subtitle">Playlist • {playlistTracks.length} tracks</p>
        </div>

        <div className="music-content" style={{ padding: '24px 0' }}>
          {playlistTracks.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', marginTop: 40 }}>
              <ListMusic size={48} style={{ opacity: 0.5, marginBottom: 16 }} />
              <p>This playlist is empty.<br/>Search for songs to add them.</p>
            </div>
          ) : (
            <section className="music-section">
              <div className="song-list" style={{ padding: '0 24px' }}>
                {playlistTracks.map((song, idx) => (
                  <div key={idx} className={`song-row ${currentSong?.id === song.id ? 'active' : ''}`} onClick={() => handleSongSelect(song, playlistTracks)} style={{ width: '100%' }}>
                    <span style={{ width: 24, fontSize: 13, color: 'rgba(255,255,255,0.5)', textAlign: 'right', paddingRight: 12 }}>{idx + 1}</span>
                    <div className="song-row-cover-wrap" style={{ width: 40, height: 40 }}>
                      <img src={song.cover} alt={song.title} className="song-row-cover" />
                    </div>
                    <div className="song-row-info">
                      <h4 className="song-row-title">{song.title}</h4>
                      <p className="song-row-artist">{song.artist_name}</p>
                    </div>
                    <button className="song-row-action" onClick={(e) => { e.stopPropagation(); setOptionsSong(song); setIsAddToPlaylistOpen(true); }}>
                      <Plus size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    );
  };

  // ─── Search Overlay ───
  const renderSearchOverlay = () => {
    if (!isSearchActive) return null;
    return (
      <div className="music-overlay" style={{ background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(30px)' }}>
        <div className="music-search-input-wrap">
          <button style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex' }} onClick={() => setIsSearchActive(false)}>
            <ArrowLeft size={24} />
          </button>
          <input 
            autoFocus
            type="text" 
            className="music-search-input" 
            placeholder="Search songs, artists, and playlists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex' }} onClick={() => setSearchQuery('')}>
              <X size={20} />
            </button>
          )}
        </div>

        <div className="music-content" style={{ padding: '24px 0' }}>
          {!searchQuery && (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', marginTop: 100 }}>
              <Search size={48} style={{ opacity: 0.5, marginBottom: 16 }} />
              <p>Type to start exploring your music</p>
            </div>
          )}

          {searchQuery && searchResults.artists.length > 0 && (
            <section className="music-section">
              <div className="section-header"><h3 className="section-title">Artists</h3></div>
              <div className="horizontal-scroll">
                {searchResults.artists.map((artist, idx) => (
                  <div key={idx} className="album-card" style={{ width: 140 }} onClick={() => { setActiveArtist(artist.name); setIsSearchActive(false); setSearchQuery(''); }}>
                    <div className="album-cover-wrap rounded" style={{ width: 140, height: 140 }}>
                      <img src={artist.cover} alt={artist.name} className="album-cover" />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <h4 className="album-title">{artist.name}</h4>
                      <p className="album-artist">Artist</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {searchQuery && searchResults.songs.length > 0 && (
            <section className="music-section">
              <div className="section-header"><h3 className="section-title">Songs</h3></div>
              <div className="song-list" style={{ padding: '0 24px' }}>
                {searchResults.songs.map((song) => (
                  <div key={song.id} className={`song-row ${currentSong?.id === song.id ? 'active' : ''}`} onClick={() => handleSongSelect(song, searchResults.songs)} style={{ width: '100%' }}>
                    <div className="song-row-cover-wrap">
                      <img src={song.cover} alt={song.title} className="song-row-cover" />
                      <div className="song-row-play"><Play size={20} fill="#fff" color="#fff" /></div>
                    </div>
                    <div className="song-row-info">
                      <h4 className="song-row-title">{song.title}</h4>
                      <p className="song-row-artist">{song.artist_name}</p>
                    </div>
                    <button className="song-row-action" onClick={(e) => { e.stopPropagation(); setOptionsSong(song); setIsAddToPlaylistOpen(true); }}>
                      <Plus size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    );
  };

  // ─── Utilities / Modals ───
  return (
    <div className="music-container">
      {/* Header & Tabs */}
      <nav className="music-navbar">
        <div className="music-logo">
          <Headphones size={28} />
          <span>SETX Music</span>
        </div>
        
        <div className="music-tabs">
          {(['home', 'explore', 'library'] as MusicTab[]).map(tab => (
            <button 
              key={tab}
              className={`music-tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(tab);
                if (tab === 'home') setGlobalActiveTab(0);
                if (tab === 'explore') setGlobalActiveTab(1);
                if (tab === 'library') setGlobalActiveTab(2);
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="music-nav-actions">
          <Search size={22} className="music-action-icon" onClick={() => setIsSearchActive(true)} />
          <Cast size={22} className="music-action-icon" />
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="Profile" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', cursor: 'pointer' }} />
          ) : (
            <UserCircle size={26} className="music-action-icon" />
          )}
        </div>
      </nav>

      {/* Render Active View */}
      {activeTab === 'home' && renderHome()}
      {activeTab === 'explore' && renderExplore()}
      {activeTab === 'library' && renderLibrary()}
      
      {/* Absolute Overlays */}
      {renderArtistOverlay()}
      {renderPlaylistOverlay()}
      {renderSearchOverlay()}

      {/* Create Playlist Modal */}
      {isCreateModalOpen && (
        <div className="music-modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
          <div className="music-modal" onClick={e => e.stopPropagation()}>
            <h3>New Playlist</h3>
            <input 
              autoFocus
              type="text" 
              placeholder="Playlist name..." 
              value={newPlaylistTitle} 
              onChange={e => setNewPlaylistTitle(e.target.value)} 
            />
            <select 
              value={newPlaylistVisibility}
              onChange={e => setNewPlaylistVisibility(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff',
                padding: '12px 16px',
                borderRadius: '12px',
                marginBottom: '16px',
                outline: 'none',
                fontSize: '16px'
              }}
            >
              <option value="private" style={{ color: '#000' }}>🔒 Private (Only you)</option>
              <option value="friends" style={{ color: '#000' }}>👥 Friends Only</option>
              <option value="public" style={{ color: '#000' }}>🌍 Public</option>
            </select>
            <div className="music-modal-actions">
              <button className="music-modal-btn cancel" onClick={() => setIsCreateModalOpen(false)}>Cancel</button>
              <button className="music-modal-btn primary" onClick={handleCreatePlaylist} disabled={!newPlaylistTitle.trim()}>Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Options Menu Bottom Sheet */}
      {optionsSong && !isAddToPlaylistOpen && (
        <div className="music-modal-overlay" onClick={() => setOptionsSong(null)}>
          <div className="music-options-menu" onClick={e => e.stopPropagation()}>
            <div className="music-options-header">
              <img src={optionsSong.cover} alt="" style={{ width: 48, height: 48, borderRadius: 4, marginRight: 12 }} />
              <div>
                <h4 style={{ margin: 0, fontSize: 16 }}>{optionsSong.title}</h4>
                <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>{optionsSong.artist_name}</p>
              </div>
            </div>
            <div className="music-options-item" onClick={() => setIsAddToPlaylistOpen(true)}>
              <ListMusic size={20} />
              <span>Add to playlist</span>
            </div>
          </div>
        </div>
      )}

      {/* Add to Playlist Selection Menu */}
      {optionsSong && isAddToPlaylistOpen && (
        <div className="music-modal-overlay" onClick={() => { setIsAddToPlaylistOpen(false); setOptionsSong(null); }}>
          <div className="music-options-menu" onClick={e => e.stopPropagation()} style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            <div className="music-options-header" style={{ justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0 }}>Add to Playlist</h3>
              <button className="music-create-btn" style={{ padding: '6px 12px' }} onClick={() => { setIsAddToPlaylistOpen(false); setIsCreateModalOpen(true); }}>
                <Plus size={16} /> New
              </button>
            </div>
            {playlists.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                You don't have any playlists yet.
              </div>
            ) : (
              playlists.map(pl => (
                <div key={pl.id} className="music-options-item" onClick={() => handleAddSongToPlaylist(pl.id)}>
                  <div style={{ width: 40, height: 40, background: '#333', borderRadius: 4, overflow: 'hidden' }}>
                    {pl.cover_url ? <img src={pl.cover_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                  </div>
                  <span>{pl.title}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

    </div>
  );
};
