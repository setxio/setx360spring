import type { User } from '../types/user';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { Play, Search, Cast, UserCircle, MoreVertical, Music2, Headphones, Activity, ArrowLeft, X, Plus, ListMusic, Lock, Globe, Users, Calendar, ChevronLeft } from 'lucide-react';
import './MusicView.css';

const TRADITIONAL_GENRES = [
  { name: 'Rock', color: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
  { name: 'Metal', color: 'linear-gradient(135deg, #000000 0%, #434343 100%)' },
  { name: 'Rap', color: 'linear-gradient(135deg, #f12711 0%, #f5af19 100%)' },
  { name: 'R&B', color: 'linear-gradient(135deg, #654ea3 0%, #eaafc8 100%)' },
  { name: 'Yacht Rock', color: 'linear-gradient(135deg, #2980B9 0%, #6DD5FA 50%, #FFFFFF 100%)' },
  { name: 'Cajun', color: 'linear-gradient(135deg, #ff9966 0%, #ff5e62 100%)' },
  { name: 'Country', color: 'linear-gradient(135deg, #F09819 0%, #EDDE5D 100%)' },
  { name: 'Blues', color: 'linear-gradient(135deg, #005C97 0%, #363795 100%)' },
  { name: 'Jazz', color: 'linear-gradient(135deg, #0F2027 0%, #203A43 50%, #2C5364 100%)' },
  { name: 'Hip-Hop', color: 'linear-gradient(135deg, #8A2387 0%, #E94057 50%, #F27121 100%)' },
  { name: 'Punk', color: 'linear-gradient(135deg, #FF416C 0%, #FF4B2B 100%)' },
  { name: 'Electronic', color: 'linear-gradient(135deg, #12c2e9 0%, #c471ed 50%, #f64f59 100%)' },
  { name: 'Rockabilly', color: 'linear-gradient(135deg, #cb2d3e 0%, #ef473a 100%)' },
  { name: 'Indie & Alternative', color: 'linear-gradient(135deg, #4b6cb7 0%, #182848 100%)' }
];

const MASTER_MOODS = [
  { name: 'Chill', color: 'linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)' },
  { name: 'Focus', color: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
  { name: 'Workout', color: 'linear-gradient(135deg, #f12711 0%, #f5af19 100%)' },
  { name: 'Party', color: 'linear-gradient(135deg, #8A2387 0%, #E94057 50%, #F27121 100%)' },
  { name: 'Late Night', color: 'linear-gradient(135deg, #0F2027 0%, #203A43 50%, #2C5364 100%)' },
  { name: 'Upbeat', color: 'linear-gradient(135deg, #FF4E50 0%, #F9D423 100%)' },
  { name: 'Melancholy', color: 'linear-gradient(135deg, #654ea3 0%, #eaafc8 100%)' },
  { name: 'Aggressive', color: 'linear-gradient(135deg, #000000 0%, #434343 100%)' }
];

const PODCASTS = [
  { id: 'p1', title: 'The Daily Tech', host: 'Tech Network', cover: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&q=80&w=300' },
  { id: 'p2', title: 'True Crime Uncovered', host: 'Crime Network', cover: 'https://images.unsplash.com/photo-1588693959661-d7037f4014d5?auto=format&fit=crop&q=80&w=300' },
  { id: 'p3', title: 'Mindful Mornings', host: 'Wellness Co.', cover: 'https://images.unsplash.com/photo-1512438248247-f0f2a5a8b7f0?auto=format&fit=crop&q=80&w=300' }
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
  { id: 's1', title: 'Starlight Runner', artist_name: 'Neo Waves', duration: '6:12', cover: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=300', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', isExplicit: true, genre: 'Hip-Hop' },
  { id: 's2', title: 'Concrete Garden', artist_name: 'Street Spirit', duration: '7:05', cover: 'https://images.unsplash.com/photo-1514525253361-bee8d40026bc?auto=format&fit=crop&q=80&w=300', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', isExplicit: false, genre: 'Pop' },
  { id: 's3', title: 'Golden Hour', artist_name: 'Chill Bound', duration: '5:44', cover: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&q=80&w=300', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', isExplicit: false, genre: 'Country' },
  { id: 's4', title: 'Cyber City', artist_name: 'Synth Soul', duration: '5:02', cover: 'https://images.unsplash.com/photo-1459749411177-042180ce673c?auto=format&fit=crop&q=80&w=300', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', isExplicit: true, genre: 'Rock' },
  { id: 's5', title: 'Neon Nightscape', artist_name: 'Vibe Logic', duration: '5:53', cover: 'https://images.unsplash.com/photo-1621360811013-c76831f162cb?auto=format&fit=crop&q=80&w=300', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', isExplicit: false, genre: 'R&B' }
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
  
  const [activeExploreView, setActiveExploreView] = useState<'none' | 'new-releases' | 'charts'>('none');
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

  const [gigPopup, setGigPopup] = useState<any | null>(null);

  // Artist Overlay State
  const [artistActiveTab, setArtistActiveTab] = useState<'music' | 'shows'>('music');
  const [artistEvents, setArtistEvents] = useState<any[]>([]);
  const [selectedEventPopup, setSelectedEventPopup] = useState<any | null>(null);

  // User Listening History State
  const [listeningHistory, setListeningHistory] = useState<any[]>([]);
  const [genrePreferences, setGenrePreferences] = useState<Record<string, number>>({});

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem('music_listening_history');
      if (storedHistory) setListeningHistory(JSON.parse(storedHistory));

      const storedGenres = localStorage.getItem('music_genre_preferences');
      if (storedGenres) setGenrePreferences(JSON.parse(storedGenres));
    } catch (e) {
      console.error('Failed to parse listening history', e);
    }
  }, []);

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
    if (!newPlaylistTitle.trim() || !user) return;
    
    const trackToAdd = optionsSong; // Capture before clearing

    // Create the playlist
    const { data: newPlaylist, error } = await supabase.from('media_playlists').insert({
      user_id: user.id,
      title: newPlaylistTitle.trim(),
      visibility: newPlaylistVisibility
    }).select().single();

    if (newPlaylist) {
      // If we came from adding a song, add it now
      if (trackToAdd) {
        await handleAddSongToPlaylist(newPlaylist.id, trackToAdd);
      } else {
        await fetchPlaylists();
      }
      
      setIsCreateModalOpen(false);
      setNewPlaylistTitle('');
      setNewPlaylistVisibility('private');
      setOptionsSong(null);
    }
  };

  const handleAddSongToPlaylist = async (playlistId: string, track: any = optionsSong) => {
    if (!track) return;
    await supabase.from('media_playlist_tracks').insert({
      playlist_id: playlistId,
      track_id: track.id
    });
    
    // Attempt to update playlist cover with song cover if empty
    // We fetch it fresh to avoid closure staleness
    const { data: pl } = await supabase.from('media_playlists').select('*').eq('id', playlistId).single();
    if (pl && !pl.cover_url) {
      await supabase.from('media_playlists').update({ cover_url: track.cover }).eq('id', playlistId);
      fetchPlaylists();
    }
    
    setIsAddToPlaylistOpen(false);
    setOptionsSong(null);
  };

  const handleSongSelect = async (song: any, contextQueue?: any[]) => {
    let targetQueue = contextQueue?.map(s => ({ ...s, artist: s.artist_name }));
    
    // SMART QUEUE LOGIC: If context is full tracks (Quick Picks), build genre-based queue
    if (contextQueue === tracks) {
      const genreTracks = tracks.filter(t => t.genre === song.genre && t.id !== song.id);
      
      const playedIds = new Set(listeningHistory.map((s: any) => s.id));
      const playedTracks = genreTracks.filter(t => playedIds.has(t.id));
      const unplayedTracks = genreTracks.filter(t => !playedIds.has(t.id));

      const shuffle = (array: any[]) => [...array].sort(() => 0.5 - Math.random());
      const shuffledPlayed = shuffle(playedTracks);
      const shuffledUnplayed = shuffle(unplayedTracks);

      const queueSize = 20;
      let numPlayed = Math.floor(queueSize * 0.6); // 60%
      let numUnplayed = queueSize - numPlayed;     // 40%

      if (shuffledPlayed.length < numPlayed) {
        numPlayed = shuffledPlayed.length;
        numUnplayed = Math.min(queueSize - numPlayed, shuffledUnplayed.length);
      } else if (shuffledUnplayed.length < numUnplayed) {
        numUnplayed = shuffledUnplayed.length;
        numPlayed = Math.min(queueSize - numUnplayed, shuffledPlayed.length);
      }

      const finalQueue = shuffle([
        ...shuffledPlayed.slice(0, numPlayed),
        ...shuffledUnplayed.slice(0, numUnplayed)
      ]);

      targetQueue = [song, ...finalQueue].map(s => ({ ...s, artist: s.artist_name }));
    }

    playSong({ ...song, artist: song.artist_name }, targetQueue);

    // Track Listening History
    setListeningHistory(prev => {
      const newHistory = [song, ...prev.filter(s => s.id !== song.id)].slice(0, 20);
      localStorage.setItem('music_listening_history', JSON.stringify(newHistory));
      return newHistory;
    });

    // Track Genre Preferences
    if (song.genre) {
      setGenrePreferences(prev => {
        const newPrefs = { ...prev, [song.genre]: (prev[song.genre] || 0) + 1 };
        localStorage.setItem('music_genre_preferences', JSON.stringify(newPrefs));
        return newPrefs;
      });
    }

    // Next Gig Popup Logic
    if (song.creator_id) {
      const lastShown = localStorage.getItem(`artist_gig_popup_${song.creator_id}`);
      const now = Date.now();
      
      // 4 hours cooldown = 14400000 ms
      if (!lastShown || (now - parseInt(lastShown, 10)) > 14400000) {
        const { data } = await supabase
          .from('events')
          .select('*')
          .eq('creator_id', song.creator_id)
          .gte('event_date', new Date().toISOString())
          .order('event_date', { ascending: true })
          .limit(1)
          .maybeSingle();
          
        if (data) {
          setGigPopup({ ...data, artist_name: song.artist_name });
          localStorage.setItem(`artist_gig_popup_${song.creator_id}`, now.toString());
        }
      }
    }
  };

  // ─── Aggregations ───
  const artistTracks = useMemo(() => {
    if (!activeArtist) return [];
    return tracks.filter(t => t.artist_name.toLowerCase() === activeArtist.toLowerCase())
                 .sort((a, b) => (b.plays || 0) - (a.plays || 0)); // Sort by top plays if available
  }, [tracks, activeArtist]);

  useEffect(() => {
    if (activeArtist && artistTracks.length > 0) {
      const creatorId = artistTracks[0]?.creator_id;
      if (creatorId) {
        supabase.from('events').select('*').eq('creator_id', creatorId).gte('event_date', new Date().toISOString()).order('event_date', { ascending: true })
          .then(({ data }) => setArtistEvents(data || []));
      }
    } else {
      setArtistEvents([]);
    }
    setArtistActiveTab('music');
  }, [activeArtist, artistTracks]);

  const { artistAlbums, artistEPs, artistSingles } = useMemo(() => {
    if (!activeArtist) return { artistAlbums: [], artistEPs: [], artistSingles: [] };
    const uniqueCovers = new Set();
    const aList: any[] = [];
    const eList: any[] = [];
    const sList: any[] = [];

    artistTracks.forEach(t => {
      if (!uniqueCovers.has(t.cover)) {
        uniqueCovers.add(t.cover);
        const item = { title: t.album_name || t.title, artist: t.artist_name, cover: t.cover, id: t.id };
        if (t.album_type === 'Album') aList.push(item);
        else if (t.album_type === 'EP') eList.push(item);
        else sList.push(item);
      }
    });
    return { artistAlbums: aList, artistEPs: eList, artistSingles: sList };
  }, [artistTracks, activeArtist]);

  const exploreArtists = useMemo(() => {
    const uniqueArtists = new Map();
    tracks.forEach(t => {
      if (!uniqueArtists.has(t.artist_name)) {
        uniqueArtists.set(t.artist_name, { name: t.artist_name, cover: t.cover });
      }
    });
    return Array.from(uniqueArtists.values());
  }, [tracks]);

  // ─── Home Page Personalization ───
  const topGenres = useMemo(() => {
    return Object.entries(genrePreferences)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0])
      .slice(0, 3);
  }, [genrePreferences]);

  const quickPicks = useMemo(() => {
    return [...tracks]
      .sort((a, b) => {
        // 1. Starred tracks get absolute top priority
        if (a.is_starred !== b.is_starred) return a.is_starred ? -1 : 1;
        
        // 2. Then by user's top genres
        const aTop = topGenres.includes(a.genre) ? 1 : 0;
        const bTop = topGenres.includes(b.genre) ? 1 : 0;
        if (aTop !== bTop) return bTop - aTop;
        
        // 3. Then by total plays
        return (b.plays || 0) - (a.plays || 0);
      })
      .slice(0, 12);
  }, [tracks, topGenres]);

  const dynamicMixes = useMemo(() => {
    if (topGenres.length === 0) return MIXES;
    return topGenres.map((genre, idx) => {
      const genreTracks = tracks.filter(t => t.genre === genre);
      const cover = genreTracks[0]?.cover || MIXES[idx % MIXES.length].cover;
      return {
        id: `mix-${genre}`,
        title: `Your ${genre} Mix`,
        artist: 'Made for you',
        cover: cover
      };
    });
  }, [topGenres, tracks]);

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
          {quickPicks.map((song) => (
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
                <p className="song-row-artist">
                  {song.isExplicit && <span className="explicit-badge">E</span>}
                  <span style={{ transition: 'color 0.2s' }}>
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

      {listeningHistory.length > 0 ? (
        <section className="music-section">
          <div className="section-header">
            <h3 className="section-title">Play again</h3>
            <button className="section-more-btn">More</button>
          </div>
          <div className="horizontal-scroll">
            {listeningHistory.map((song, idx) => (
              <div key={`${song.id}-${idx}`} className="album-card" onClick={() => handleSongSelect(song, listeningHistory)}>
                <div className="album-cover-wrap">
                  <img src={song.cover} alt={song.title} className="album-cover" />
                  <button className="album-play-btn"><Play size={24} fill="#fff" color="#fff" /></button>
                </div>
                <div>
                  <h4 className="album-title">{song.title}</h4>
                  <p className="album-artist">{song.artist_name}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : (
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
      )}

      <section className="music-section">
        <div className="section-header">
          <h3 className="section-title">Mixed for you</h3>
        </div>
        <div className="horizontal-scroll">
          {dynamicMixes.map(mix => (
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
        <div onClick={() => setActiveExploreView('new-releases')} className="album-card" style={{ width: 'auto', gap: 16, flexDirection: 'row', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '16px 24px', borderRadius: 12, cursor: 'pointer' }}>
          <Music2 size={32} color="var(--primary)" />
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>New Releases</h3>
        </div>
        <div onClick={() => setActiveExploreView('charts')} className="album-card" style={{ width: 'auto', gap: 16, flexDirection: 'row', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '16px 24px', borderRadius: 12, cursor: 'pointer' }}>
          <Activity size={32} color="#f43f5e" />
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Charts</h3>
        </div>
      </div>

      <section className="music-section">
        <div className="section-header">
          <h3 className="section-title">Artists</h3>
        </div>
        <div className="horizontal-scroll">
          {exploreArtists.map((artist, idx) => (
            <div key={idx} className="album-card" style={{ width: 140 }} onClick={() => setActiveArtist(artist.name)}>
              <div className="album-cover-wrap" style={{ width: 140, height: 140, borderRadius: '50%', overflow: 'hidden' }}>
                <img src={artist.cover} alt={artist.name} className="album-cover" style={{ borderRadius: '50%' }} />
              </div>
              <div style={{ textAlign: 'center', marginTop: 8 }}>
                <h4 className="album-title">{artist.name}</h4>
                <p className="album-artist">Artist</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="music-section">
        <div className="section-header">
          <h3 className="section-title">Genres</h3>
        </div>
        <div className="moods-grid">
          {TRADITIONAL_GENRES.map(genre => (
            <div key={genre.name} className="mood-card" style={{ background: genre.color }}>
              <h4 className="mood-title">{genre.name}</h4>
            </div>
          ))}
        </div>
      </section>

      <section className="music-section" style={{ marginTop: 24 }}>
        <div className="section-header">
          <h3 className="section-title">Moods</h3>
        </div>
        <div className="moods-grid">
          {MASTER_MOODS.map(mood => (
            <div key={mood.name} className="mood-card" style={{ background: mood.color }}>
              <h4 className="mood-title">{mood.name}</h4>
            </div>
          ))}
        </div>
      </section>

      <section className="music-section" style={{ marginTop: 24 }}>
        <div className="section-header">
          <h3 className="section-title">Podcasts</h3>
        </div>
        <div className="horizontal-scroll">
          {PODCASTS.map(pod => (
            <div key={pod.id} className="album-card">
              <div className="album-cover-wrap" style={{ borderRadius: 12, overflow: 'hidden' }}>
                <img src={pod.cover} alt={pod.title} className="album-cover" />
                <button className="album-play-btn"><Play size={24} fill="#fff" color="#fff" /></button>
              </div>
              <div>
                <h4 className="album-title">{pod.title}</h4>
                <p className="album-artist">{pod.host}</p>
              </div>
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
        
        <div className="artist-hero" style={{ '--artist-bg': `url(${artistAlbums[0]?.cover || artistSingles[0]?.cover || 'https://images.unsplash.com/photo-1459749411177-042180ce673c?auto=format&fit=crop&q=80&w=300'})` } as any}>
          <h1 className="artist-hero-title">{activeArtist}</h1>
          <p className="artist-hero-subtitle">{artistTracks.length} tracks • {artistEvents.length} upcoming shows</p>
          
          <div style={{ display: 'flex', gap: 16, marginTop: 16, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 8 }}>
            <button 
              style={{ background: 'none', border: 'none', color: artistActiveTab === 'music' ? '#fff' : 'rgba(255,255,255,0.5)', fontWeight: artistActiveTab === 'music' ? 700 : 400, fontSize: '1rem', cursor: 'pointer', padding: '0 8px', borderBottom: artistActiveTab === 'music' ? '2px solid var(--primary)' : '2px solid transparent' }}
              onClick={() => setArtistActiveTab('music')}
            >Music</button>
            <button 
              style={{ background: 'none', border: 'none', color: artistActiveTab === 'shows' ? '#fff' : 'rgba(255,255,255,0.5)', fontWeight: artistActiveTab === 'shows' ? 700 : 400, fontSize: '1rem', cursor: 'pointer', padding: '0 8px', borderBottom: artistActiveTab === 'shows' ? '2px solid var(--primary)' : '2px solid transparent' }}
              onClick={() => setArtistActiveTab('shows')}
            >Upcoming Shows</button>
          </div>
        </div>

        <div className="music-content" style={{ padding: '24px 0' }}>
          {artistActiveTab === 'music' && (
            <>
              <section className="music-section">
                <div className="section-header">
                  <h3 className="section-title">Top Plays</h3>
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

              {artistSingles.length > 0 && (
                <section className="music-section" style={{ marginTop: 24 }}>
                  <div className="section-header"><h3 className="section-title">Singles</h3></div>
                  <div className="horizontal-scroll">
                    {artistSingles.map((album, idx) => (
                      <div key={idx} className="album-card">
                        <div className="album-cover-wrap">
                          <img src={album.cover} alt={album.title} className="album-cover" />
                          <button className="album-play-btn"><Play size={24} fill="#fff" color="#fff" /></button>
                        </div>
                        <div>
                          <h4 className="album-title">{album.title}</h4>
                          <p className="album-artist">Single</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {artistAlbums.length > 0 && (
                <section className="music-section" style={{ marginTop: 24 }}>
                  <div className="section-header"><h3 className="section-title">Albums</h3></div>
                  <div className="horizontal-scroll">
                    {artistAlbums.map((album, idx) => (
                      <div key={idx} className="album-card">
                        <div className="album-cover-wrap">
                          <img src={album.cover} alt={album.title} className="album-cover" />
                          <button className="album-play-btn"><Play size={24} fill="#fff" color="#fff" /></button>
                        </div>
                        <div>
                          <h4 className="album-title">{album.title}</h4>
                          <p className="album-artist">Album</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {artistEPs.length > 0 && (
                <section className="music-section" style={{ marginTop: 24 }}>
                  <div className="section-header"><h3 className="section-title">EPs</h3></div>
                  <div className="horizontal-scroll">
                    {artistEPs.map((album, idx) => (
                      <div key={idx} className="album-card">
                        <div className="album-cover-wrap">
                          <img src={album.cover} alt={album.title} className="album-cover" />
                          <button className="album-play-btn"><Play size={24} fill="#fff" color="#fff" /></button>
                        </div>
                        <div>
                          <h4 className="album-title">{album.title}</h4>
                          <p className="album-artist">EP</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          {artistActiveTab === 'shows' && (
            <section className="music-section">
              <div className="song-list" style={{ padding: '0 24px' }}>
                {artistEvents.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', marginTop: 40 }}>
                    <Calendar size={48} style={{ opacity: 0.5, marginBottom: 16 }} />
                    <p>No upcoming shows scheduled.</p>
                  </div>
                ) : (
                  artistEvents.map((evt) => (
                    <div key={evt.id} className="song-row" onClick={() => setSelectedEventPopup(evt)} style={{ width: '100%', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 12, marginBottom: 8 }}>
                      <div style={{ width: 48, height: 48, background: 'rgba(255,255,255,0.1)', borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--primary)', fontWeight: 700 }}>{new Date(evt.event_date).toLocaleString('default', { month: 'short' })}</span>
                        <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>{new Date(evt.event_date).getDate()}</span>
                      </div>
                      <div className="song-row-info" style={{ marginLeft: 12 }}>
                        <h4 className="song-row-title">{evt.title}</h4>
                        <p className="song-row-artist">{evt.location} • {new Date(evt.event_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          )}

        </div>
      </div>
    );
  };

  const renderNewReleasesOverlay = () => {
    // 90 days = 90 * 24 * 60 * 60 * 1000 = 7776000000 ms
    const ninetyDaysAgo = Date.now() - 7776000000;
    
    // Sort by created_at DESC
    const sorted = [...tracks]
      .filter(t => new Date(t.created_at).getTime() > ninetyDaysAgo)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return (
      <div className="music-overlay fade-in" style={{ padding: '0 0 120px 0' }}>
        <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(20px)', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <button onClick={() => setActiveExploreView('none')} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <ChevronLeft size={28} />
          </button>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>New Releases</h2>
        </div>
        <div style={{ padding: '24px' }}>
          {sorted.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 40 }}>No new releases in the last 3 months.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {sorted.map((song) => (
                <div key={song.id} className={`song-row ${currentSong?.id === song.id ? 'active' : ''}`} onClick={() => handleSongSelect(song, sorted)} style={{ width: '100%', background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: 8 }}>
                  <div className="song-row-cover-wrap">
                    <img src={song.cover} alt={song.title} className="song-row-cover" />
                    <div className="song-row-play"><Play size={20} fill="#fff" color="#fff" /></div>
                  </div>
                  <div className="song-row-info">
                    <h4 className="song-row-title">{song.title}</h4>
                    <p className="song-row-artist">{song.artist_name}</p>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginRight: 16 }}>
                    {new Date(song.created_at).toLocaleDateString()}
                  </span>
                  <button className="song-row-action" onClick={(e) => { e.stopPropagation(); setOptionsSong(song); setIsAddToPlaylistOpen(true); }}>
                    <Plus size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderChartsOverlay = () => {
    // Top 10 Overall
    const topOverall = [...tracks]
      .sort((a, b) => (b.plays || 0) - (a.plays || 0))
      .slice(0, 10);

    return (
      <div className="music-overlay fade-in" style={{ padding: '0 0 120px 0' }}>
        <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(20px)', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <button onClick={() => setActiveExploreView('none')} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <ChevronLeft size={28} />
          </button>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Charts</h2>
        </div>
        <div style={{ padding: '24px' }}>
          
          <h3 style={{ margin: '0 0 16px 0', fontSize: 20 }}>Top 10 Overall</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 40 }}>
            {topOverall.map((song, index) => (
              <div key={`overall-${song.id}`} className={`song-row ${currentSong?.id === song.id ? 'active' : ''}`} onClick={() => handleSongSelect(song, topOverall)} style={{ width: '100%', background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: 8 }}>
                <div style={{ width: 30, textAlign: 'center', fontSize: '1.1rem', fontWeight: 700, color: index < 3 ? 'var(--primary)' : 'rgba(255,255,255,0.5)' }}>{index + 1}</div>
                <div className="song-row-cover-wrap">
                  <img src={song.cover} alt={song.title} className="song-row-cover" />
                  <div className="song-row-play"><Play size={20} fill="#fff" color="#fff" /></div>
                </div>
                <div className="song-row-info">
                  <h4 className="song-row-title">{song.title}</h4>
                  <p className="song-row-artist">{song.artist_name}</p>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginRight: 16 }}>
                  {song.plays || 0} plays
                </span>
                <button className="song-row-action" onClick={(e) => { e.stopPropagation(); setOptionsSong(song); setIsAddToPlaylistOpen(true); }}>
                  <Plus size={18} />
                </button>
              </div>
            ))}
          </div>

          {TRADITIONAL_GENRES.map(genre => {
            const topForGenre = [...tracks]
              .filter(t => t.genre === genre.name)
              .sort((a, b) => (b.plays || 0) - (a.plays || 0))
              .slice(0, 10);
              
            if (topForGenre.length === 0) return null;

            return (
              <div key={`chart-${genre.name}`} style={{ marginBottom: 40 }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: 20 }}>Top 10 {genre.name}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {topForGenre.map((song, index) => (
                    <div key={`genre-${song.id}`} className={`song-row ${currentSong?.id === song.id ? 'active' : ''}`} onClick={() => handleSongSelect(song, topForGenre)} style={{ width: '100%', background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: 8 }}>
                      <div style={{ width: 30, textAlign: 'center', fontSize: '1.1rem', fontWeight: 700, color: index < 3 ? 'var(--primary)' : 'rgba(255,255,255,0.5)' }}>{index + 1}</div>
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
              </div>
            );
          })}
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
      {globalActiveTab === 0 && renderHome()}
      {globalActiveTab === 1 && renderExplore()}
      {globalActiveTab === 2 && renderLibrary()}


      
      {/* Render Sub-Views inside Explore */}
      {globalActiveTab === 1 && activeExploreView === 'new-releases' && renderNewReleasesOverlay()}
      {globalActiveTab === 1 && activeExploreView === 'charts' && renderChartsOverlay()}
      
      {/* Absolute Overlays */}
      {renderArtistOverlay()}
      {renderPlaylistOverlay()}
      {renderSearchOverlay()}

              {/* Create Playlist Modal */}
      {isCreateModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="music-modal-overlay" onClick={() => { setIsCreateModalOpen(false); setOptionsSong(null); }}>
          <div className="music-modal" onClick={e => e.stopPropagation()}>
            <h3>New Playlist</h3>
            <input 
              type="text" 
              autoFocus
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
              <button className="music-modal-btn cancel" onClick={() => { setIsCreateModalOpen(false); setOptionsSong(null); }}>Cancel</button>
              <button className="music-modal-btn primary" onClick={handleCreatePlaylist} disabled={!newPlaylistTitle.trim()}>Create</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Add to Playlist Selection Menu */}
      {optionsSong && isAddToPlaylistOpen && typeof document !== 'undefined' && createPortal(
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
        </div>,
        document.body
      )}

      {/* Render Sub-Views inside Explore */}
      {globalActiveTab === 1 && activeExploreView === 'new-releases' && renderNewReleasesOverlay()}
      {globalActiveTab === 1 && activeExploreView === 'charts' && renderChartsOverlay()}
      
      {/* Next Gig / Event Details Popup */}
      {(gigPopup || selectedEventPopup) && typeof document !== 'undefined' && createPortal(
        <div className="music-modal-overlay gig-popup-overlay" onClick={() => { setGigPopup(null); setSelectedEventPopup(null); }} style={{ background: 'rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="gig-popup-card" onClick={e => e.stopPropagation()} style={{ 
            background: 'var(--card-bg)',
            border: '1px solid rgba(255,255,255,0.1)',
            padding: '24px',
            borderRadius: '16px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
            width: '90%',
            maxWidth: '360px',
            animation: 'fadeInUp 0.3s ease-out',
            position: 'relative'
          }}>
            <button style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }} onClick={() => { setGigPopup(null); setSelectedEventPopup(null); }}>
              <X size={18} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ background: 'var(--primary)', color: '#fff', padding: '6px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>
                {gigPopup ? 'Next Gig' : 'Show Details'}
              </div>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{(gigPopup || selectedEventPopup).artist_name || activeArtist}</span>
            </div>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '1.25rem' }}>{(gigPopup || selectedEventPopup).title}</h4>
            <div style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.8)', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Calendar size={16} color="var(--primary)" /> {new Date((gigPopup || selectedEventPopup).event_date).toLocaleDateString()}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>≡ƒòÆ {new Date((gigPopup || selectedEventPopup).event_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>≡ƒôì {(gigPopup || selectedEventPopup).location}</span>
              {(gigPopup || selectedEventPopup).ticket_price > 0 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>≡ƒÄƒ∩╕Å Tickets: ${(gigPopup || selectedEventPopup).ticket_price}</span>
              )}
            </div>
            <button style={{ width: '100%', padding: '12px', background: '#fff', color: '#000', borderRadius: '8px', fontWeight: 700, border: 'none', cursor: 'pointer' }} onClick={() => { setGigPopup(null); setSelectedEventPopup(null); }}>
              Get Tickets
            </button>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

