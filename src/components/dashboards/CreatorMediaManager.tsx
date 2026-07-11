import React, { useState, useEffect } from 'react';
import { supabase as supabase } from '../../lib/supabase';
import { Music, UploadCloud, Loader2, Play } from 'lucide-react';
import type { User } from '../../types/user';

const GENRES = [
  'Rock', 'Metal', 'Rap', 'R&B', 'Yacht Rock', 'Cajun', 'Country', 'Blues', 
  'Jazz', 'Hip-Hop', 'Punk', 'Electronic', 'Rockabilly', 'Indie & Alternative'
];

const MASTER_MOODS = [
  'Chill', 'Focus', 'Workout', 'Party', 'Late Night', 'Upbeat', 'Melancholy', 'Aggressive'
];

export const CreatorMediaManager: React.FC<{ user: User }> = ({ user }) => {
  const [tracks, setTracks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [newTrack, setNewTrack] = useState({ title: '', artist_name: '', album_name: '', album_type: 'Single', genre: '', mood: '', energy_level: '5' });
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [albumArtFile, setAlbumArtFile] = useState<File | null>(null);

  useEffect(() => {
    fetchTracks();
  }, [user]);

  const fetchTracks = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.from('media_tracks').select('*').eq('creator_id', user.id).order('created_at', { ascending: false });
      if (error) console.error("Error fetching tracks:", error);
      setTracks(data || []);
    } catch (err) {
      console.error("Exception in fetchTracks:", err);
      setTracks([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!newTrack.title || !audioFile) return;
    setIsUploading(true);
    
    // Upload file to Supabase Storage
    const fileExt = audioFile.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('creator-assets')
      .upload(fileName, audioFile);
      
    if (uploadError) {
      alert("Error uploading file: " + uploadError.message);
      setIsUploading(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage.from('creator-assets').getPublicUrl(fileName);
    const audioUrl = publicUrlData.publicUrl;

    // Upload Album Art if provided
    let albumArtUrl = 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=300';
    if (albumArtFile) {
      const artExt = albumArtFile.name.split('.').pop();
      const artName = `${user.id}/${Date.now()}-art.${artExt}`;
      const { data: artUploadData, error: artUploadError } = await supabase.storage
        .from('creator-assets')
        .upload(artName, albumArtFile);
        
      if (!artUploadError) {
        const { data: artUrlData } = supabase.storage.from('creator-assets').getPublicUrl(artName);
        albumArtUrl = artUrlData.publicUrl;
      }
    }

    const { error: dbError } = await supabase.from('media_tracks').insert([{
      creator_id: user.id,
      title: newTrack.title,
      artist_name: newTrack.artist_name || user.name,
      album_name: newTrack.album_name,
      album_type: newTrack.album_type,
      genre: newTrack.genre,
      moods: newTrack.mood ? [newTrack.mood] : [],
      energy_level: parseInt(newTrack.energy_level),
      audio_url: audioUrl,
      album_art_url: albumArtUrl
    }]);

    setIsUploading(false);
    if (!dbError) {
      setNewTrack({ title: '', artist_name: '', album_name: '', album_type: 'Single', genre: '', mood: '', energy_level: '5' });
      setAudioFile(null);
      setAlbumArtFile(null);
      fetchTracks();
    } else {
      alert("Error saving track metadata: " + dbError.message);
    }
  };

  if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Loader2 className="animate-spin" /></div>;

  return (
    <div className="elite-widget fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}><Music size={20} /> Media & Tracks</h3>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.05)', padding: 24, borderRadius: 12, marginBottom: 24 }}>
        <h4 style={{ margin: '0 0 16px' }}>Upload New Track</h4>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <input type="text" placeholder="Track Title" value={newTrack.title} onChange={e => setNewTrack({...newTrack, title: e.target.value})} className="glass-input" style={{ flex: 1, minWidth: 200, padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'white' }} />
          <input type="text" placeholder="Artist Name (Optional)" value={newTrack.artist_name} onChange={e => setNewTrack({...newTrack, artist_name: e.target.value})} className="glass-input" style={{ flex: 1, minWidth: 150, padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'white' }} />
          <input type="text" placeholder="Album Name" value={newTrack.album_name} onChange={e => setNewTrack({...newTrack, album_name: e.target.value})} className="glass-input" style={{ flex: 1, minWidth: 150, padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'white' }} />
          <select value={newTrack.album_type} onChange={e => setNewTrack({...newTrack, album_type: e.target.value})} className="glass-input" style={{ flex: 1, minWidth: 120, padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'white' }}>
            <option value="Single" style={{ color: '#000' }}>Single</option>
            <option value="EP" style={{ color: '#000' }}>EP</option>
            <option value="Album" style={{ color: '#000' }}>Album</option>
          </select>
          <select value={newTrack.genre} onChange={e => setNewTrack({...newTrack, genre: e.target.value})} className="glass-input" style={{ flex: 1, minWidth: 120, padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'white' }}>
            <option value="" style={{ color: '#000' }}>Select Genre</option>
            {GENRES.map(g => <option key={g} value={g} style={{ color: '#000' }}>{g}</option>)}
          </select>
          <select value={newTrack.mood} onChange={e => setNewTrack({...newTrack, mood: e.target.value})} className="glass-input" style={{ flex: 1, minWidth: 120, padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'white' }}>
            <option value="" style={{ color: '#000' }}>Primary Mood</option>
            {MASTER_MOODS.map(m => <option key={m} value={m} style={{ color: '#000' }}>{m}</option>)}
          </select>
          <div style={{ flex: 1, minWidth: 120, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Energy Level: {newTrack.energy_level}</span>
            <input type="range" min="1" max="10" value={newTrack.energy_level} onChange={e => setNewTrack({...newTrack, energy_level: e.target.value})} style={{ width: '100%' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Audio File</span>
            <input type="file" accept="audio/*" onChange={e => setAudioFile(e.target.files?.[0] || null)} style={{ color: 'white', fontSize: '0.9rem' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Album Cover Art (Optional)</span>
            <input type="file" accept="image/*" onChange={e => setAlbumArtFile(e.target.files?.[0] || null)} style={{ color: 'white', fontSize: '0.9rem' }} />
          </div>
          <button onClick={handleUpload} disabled={isUploading || !audioFile} className="primary-btn" style={{ height: 44, display: 'flex', alignItems: 'center', gap: 8, alignSelf: 'flex-end' }}>
            {isUploading ? <Loader2 className="animate-spin" size={18} /> : <UploadCloud size={18} />} Upload Track
          </button>
        </div>
      </div>

      {tracks.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 24 }}>No tracks uploaded yet.</p>
      ) : (
        <table className="elite-table" style={{ width: '100%', textAlign: 'left' }}>
          <thead>
            <tr><th>Track Name</th><th>Artist</th><th>Album</th><th>Genre</th><th>Type</th><th>Plays</th><th>Action</th></tr>
          </thead>
          <tbody>
            {tracks.map(t => (
              <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ fontWeight: 700, padding: '12px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <img src={t.album_art_url} alt="Cover" style={{ width: 40, height: 40, borderRadius: 4 }} />
                  {t.title}
                </td>
                <td>{t.artist_name}</td>
                <td>{t.album_name || '-'}</td>
                <td><span style={{ color: 'var(--primary)', fontSize: '0.9rem' }}>{t.genre || '-'}</span></td>
                <td><span style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: 4, fontSize: '0.8rem' }}>{t.album_type || 'Single'}</span></td>
                <td>{t.plays}</td>
                <td>
                  <button className="icon-btn" onClick={() => window.open(t.audio_url, '_blank')}><Play size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

