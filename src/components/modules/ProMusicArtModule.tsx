import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Music, Disc, Plus, Link as LinkIcon, Upload, Trash2, Loader2, X, Star } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useApp } from '../../context/AppContext';

export const ProMusicArtModule: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { activeContext, theme } = useApp();
  const [albums, setAlbums] = useState<any[]>([]);
  const [tracks, setTracks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'albums' | 'tracks'>('albums');
  
  // Modal states
  const [isAlbumModalOpen, setIsAlbumModalOpen] = useState(false);
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State: Album
  const [albumTitle, setAlbumTitle] = useState('');
  const [albumType, setAlbumType] = useState<'Album' | 'EP'>('Album');
  const [albumReleaseDate, setAlbumReleaseDate] = useState('');
  const [albumCoverSource, setAlbumCoverSource] = useState<'external' | 'upload'>('external');
  const [albumCoverUrl, setAlbumCoverUrl] = useState('');
  const [albumCoverFile, setAlbumCoverFile] = useState<File | null>(null);

  // Form State: Track
  const [trackTitle, setTrackTitle] = useState('');
  const [trackDesc, setTrackDesc] = useState('');
  const [trackAlbumId, setTrackAlbumId] = useState<string>(''); // empty means single
  const [trackMediaSource, setTrackMediaSource] = useState<'external' | 'upload'>('external');
  const [trackMediaUrl, setTrackMediaUrl] = useState('');
  const [trackMediaFiles, setTrackMediaFiles] = useState<File[]>([]);
  const [trackDrafts, setTrackDrafts] = useState<{ id: string, title: string, order: number, file: File }[]>([]);
  const [trackCoverSource, setTrackCoverSource] = useState<'external' | 'upload'>('external');
  const [trackCoverUrl, setTrackCoverUrl] = useState('');
  const [trackCoverFile, setTrackCoverFile] = useState<File | null>(null);
  const [trackNumber, setTrackNumber] = useState<number>(1);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  
  // Track metadata
  const [trackGenre, setTrackGenre] = useState('');
  const [trackMoods, setTrackMoods] = useState<string>(''); // comma separated for now
  const [trackEnergy, setTrackEnergy] = useState<number>(50);
  const [trackExplicit, setTrackExplicit] = useState(false);

  const isDark = theme.includes('dark');
  const bgColors = isDark ? {
    card: '#1e293b', border: '#334155', text: '#f8fafc', subtext: '#94a3b8', inputBg: '#0f172a'
  } : {
    card: '#ffffff', border: '#e2e8f0', text: '#0f172a', subtext: '#64748b', inputBg: '#f8fafc'
  };

  const fetchData = async () => {
    if (!activeContext) return;
    setIsLoading(true);
    const [resAlbums, resTracks] = await Promise.all([
      supabase.from('media_albums').select('*').eq('page_id', activeContext.id).order('created_at', { ascending: false }),
      supabase.from('media_tracks').select('*').eq('page_id', activeContext.id).order('created_at', { ascending: false })
    ]);
    if (resAlbums.data) setAlbums(resAlbums.data);
    if (resTracks.data) setTracks(resTracks.data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [activeContext]);

  const handleDeleteAlbum = async (id: string) => {
    if (!confirm('Are you sure you want to delete this album? All associated tracks will become singles.')) return;
    await supabase.from('media_albums').delete().eq('id', id);
    fetchData();
  };

  const handleDeleteTrack = async (id: string) => {
    if (!confirm('Are you sure you want to delete this track?')) return;
    await supabase.from('media_tracks').delete().eq('id', id);
    fetchData();
  };

  const toggleStar = async (track: any) => {
    const newVal = !track.is_starred;
    // Optimistic update
    setTracks(prev => prev.map(t => t.id === track.id ? { ...t, is_starred: newVal } : t));
    await supabase.from('media_tracks').update({ is_starred: newVal }).eq('id', track.id);
  };

  const handleAlbumSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeContext) return;
    if (!albumTitle.trim()) return alert('Title is required');

    setIsSubmitting(true);
    try {
      let finalCover = albumCoverUrl;
      if (albumCoverSource === 'upload' && albumCoverFile) {
        const fileExt = albumCoverFile.name.split('.').pop();
        const fileName = `${activeContext.id}/covers/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('portfolio_media').upload(fileName, albumCoverFile);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('portfolio_media').getPublicUrl(fileName);
        finalCover = publicUrl;
      }

      const { error } = await supabase.from('media_albums').insert({
        page_id: activeContext.id,
        title: albumTitle.trim(),
        album_type: albumType,
        cover_url: finalCover || null,
        release_date: albumReleaseDate || null
      });

      if (error) throw error;
      setIsAlbumModalOpen(false);
      setAlbumTitle(''); setAlbumCoverUrl(''); setAlbumCoverFile(null);
      setActiveTab('albums');
      fetchData();
    } catch (err: any) {
      alert('Error saving album: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeContext) return;
    if (trackMediaSource === 'external' && !trackTitle.trim()) return alert('Title is required for external tracks');
    if (trackMediaSource === 'upload' && trackDrafts.length === 0) return alert('Please select at least one file to upload');

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      // 1. Handle Cover Upload once for the whole batch
      let finalCover = trackCoverUrl;
      if (!trackAlbumId && trackCoverSource === 'upload' && trackCoverFile) {
        const fileExt = trackCoverFile.name.split('.').pop();
        const fileName = `${activeContext.id}/covers/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('portfolio_media').upload(fileName, trackCoverFile);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('portfolio_media').getPublicUrl(fileName);
        finalCover = publicUrl;
      }

      // 2. Fetch Album details if applicable
      let finalAlbumName = null;
      let finalAlbumType = 'Single';
      if (trackAlbumId) {
        const selectedAlbum = albums.find(a => a.id === trackAlbumId);
        if (selectedAlbum) {
          if (!finalCover) finalCover = selectedAlbum.cover_url;
          finalAlbumName = selectedAlbum.title;
          finalAlbumType = selectedAlbum.album_type;
        }
      }

      // 3. Process Tracks
      const itemsToProcess = trackMediaSource === 'upload' ? trackDrafts : [{ 
        title: trackTitle, 
        order: trackNumber, 
        file: null, 
        mediaUrl: trackMediaUrl 
      }];

      let currentItemIndex = 0;

      for (const item of itemsToProcess) {
        // Update overall progress
        const progressBase = (currentItemIndex / itemsToProcess.length) * 100;
        const progressPerItem = 100 / itemsToProcess.length;
        setUploadProgress(Math.round(progressBase + (progressPerItem * 0.1)));

        let finalMedia = item.mediaUrl || '';
        if (trackMediaSource === 'upload' && item.file) {
          const fileExt = item.file.name.split('.').pop();
          const fileName = `${activeContext.id}/tracks/${Date.now()}_${Math.random().toString(36).substr(2, 5)}.${fileExt}`;
          
          setUploadProgress(Math.round(progressBase + (progressPerItem * 0.4)));
          const { error: uploadError } = await supabase.storage.from('portfolio_media').upload(fileName, item.file, {
            cacheControl: '3600',
            upsert: false
          });
          if (uploadError) throw uploadError;
          
          setUploadProgress(Math.round(progressBase + (progressPerItem * 0.8)));
          const { data: { publicUrl } } = supabase.storage.from('portfolio_media').getPublicUrl(fileName);
          finalMedia = publicUrl;
        }

        const { error } = await supabase.from('media_tracks').insert({
          page_id: activeContext.id,
          album_id: trackAlbumId || null,
          album_name: finalAlbumName,
          album_type: finalAlbumType,
          track_number: trackAlbumId ? item.order : null,
          title: item.title.trim() || 'Untitled Track',
          description: trackDesc.trim() || null,
          media_type: trackMediaSource,
          audio_url: finalMedia,
          album_art_url: finalCover || null,
          genre: trackGenre || null,
          moods: trackMoods ? trackMoods.split(',').map(m => m.trim()) : null,
          energy_level: trackEnergy,
          is_explicit: trackExplicit,
          artist_name: activeContext.name,
          creator_id: activeContext.owner_id
        });

        if (error) throw error;
        currentItemIndex++;
        setUploadProgress(Math.round((currentItemIndex / itemsToProcess.length) * 100));
      }

      setUploadProgress(100);
      setIsTrackModalOpen(false);
      setTrackTitle(''); setTrackDesc(''); setTrackMediaUrl(''); setTrackMediaFiles([]); setTrackDrafts([]);
      setTrackCoverUrl(''); setTrackCoverFile(null); setTrackGenre(''); setTrackMoods('');
      setTrackExplicit(false); setTrackNumber(1);
      setActiveTab('tracks');
      setTimeout(() => setUploadProgress(0), 500);
      fetchData();
    } catch (err: any) {
      alert('Error saving track: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setTrackMediaFiles(files);
    
    // Auto-generate drafts
    const drafts = files.map((file, index) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      title: file.name.replace(/\.[^/.]+$/, ""), // strip extension
      order: trackAlbumId ? trackNumber + index : 1
    }));
    setTrackDrafts(drafts);
  };

  const updateDraft = (id: string, field: 'title' | 'order', value: string | number) => {
    setTrackDrafts(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d));
  };

  return (
    <div style={{ padding: '24px', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={onBack}
            style={{ background: bgColors.card, border: `1px solid ${bgColors.border}`, borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: bgColors.text }}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: bgColors.text, margin: 0 }}>Music Dashboard</h2>
            <p style={{ color: bgColors.subtext, margin: '4px 0 0 0' }}>Manage your albums, EPs, and tracks.</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => setIsAlbumModalOpen(true)}
            style={{ padding: '10px 20px', background: bgColors.card, color: bgColors.text, border: `1px solid ${bgColors.border}`, borderRadius: '999px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}
          >
            <Plus size={18} /> New Album/EP
          </button>
          <button 
            onClick={() => setIsTrackModalOpen(true)}
            style={{ padding: '10px 20px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '999px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}
          >
            <Plus size={18} /> Add Track
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: bgColors.card, padding: '8px', borderRadius: '16px', border: `1px solid ${bgColors.border}`, width: 'fit-content' }}>
        <button 
          onClick={() => setActiveTab('albums')}
          style={{ padding: '8px 24px', background: activeTab === 'albums' ? 'var(--primary)' : 'transparent', color: activeTab === 'albums' ? '#fff' : bgColors.text, border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
        >
          <Disc size={18} /> Albums & EPs
        </button>
        <button 
          onClick={() => setActiveTab('tracks')}
          style={{ padding: '8px 24px', background: activeTab === 'tracks' ? 'var(--primary)' : 'transparent', color: activeTab === 'tracks' ? '#fff' : bgColors.text, border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
        >
          <Music size={18} /> All Tracks
        </button>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}><Loader2 size={32} color="var(--primary)" className="spin" /></div>
      ) : activeTab === 'albums' ? (
        albums.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px', background: bgColors.card, borderRadius: '24px', border: `1px dashed ${bgColors.border}` }}>
            <Disc size={48} color={bgColors.border} style={{ margin: '0 auto 16px' }} />
            <h3 style={{ color: bgColors.text, fontSize: '18px', margin: '0 0 8px 0' }}>No Albums Yet</h3>
            <p style={{ color: bgColors.subtext, margin: 0 }}>Create your first Album or EP.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
            {albums.map(album => (
              <div key={album.id} style={{ background: bgColors.card, borderRadius: '16px', border: `1px solid ${bgColors.border}`, overflow: 'hidden' }}>
                <div style={{ height: 160, background: bgColors.inputBg, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundImage: album.cover_url ? `url(${album.cover_url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}>
                  {!album.cover_url && <Disc size={48} color={bgColors.border} />}
                </div>
                <div style={{ padding: '16px' }}>
                  <h4 style={{ margin: '0 0 4px 0', color: bgColors.text, fontSize: '16px' }}>{album.title}</h4>
                  <p style={{ margin: 0, color: bgColors.subtext, fontSize: '14px' }}>{album.album_type} • {tracks.filter(t => t.album_id === album.id).length} tracks</p>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${bgColors.border}` }}>
                    <button onClick={() => handleDeleteAlbum(album.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        tracks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px', background: bgColors.card, borderRadius: '24px', border: `1px dashed ${bgColors.border}` }}>
            <Music size={48} color={bgColors.border} style={{ margin: '0 auto 16px' }} />
            <h3 style={{ color: bgColors.text, fontSize: '18px', margin: '0 0 8px 0' }}>No Tracks Yet</h3>
            <p style={{ color: bgColors.subtext, margin: 0 }}>Upload your first song to get started.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {tracks.map(track => (
              <div key={track.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: bgColors.card, border: `1px solid ${bgColors.border}`, borderRadius: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: 48, height: 48, borderRadius: '8px', background: bgColors.inputBg, backgroundImage: track.cover ? `url(${track.cover})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {!track.cover && <Music size={20} color={bgColors.border} />}
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', color: bgColors.text, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {track.title}
                      {track.isExplicit && <span style={{ fontSize: '10px', background: bgColors.border, padding: '2px 6px', borderRadius: '4px' }}>E</span>}
                    </h4>
                    <p style={{ margin: 0, color: bgColors.subtext, fontSize: '14px' }}>
                      {track.album_id ? albums.find(a => a.id === track.album_id)?.title || 'Unknown Album' : 'Single'}
                      {track.genre && ` • ${track.genre}`}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button 
                    onClick={() => toggleStar(track)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center', gap: '6px', color: track.is_starred ? '#f59e0b' : bgColors.subtext }}
                    title={track.is_starred ? 'Unstar Track' : 'Star Track to push in Algorithm'}
                  >
                    <Star size={20} fill={track.is_starred ? '#f59e0b' : 'none'} color={track.is_starred ? '#f59e0b' : bgColors.subtext} />
                  </button>
                  <a href={track.audioUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', padding: '8px' }}>
                    <LinkIcon size={18} />
                  </a>
                  <button onClick={() => handleDeleteTrack(track.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '8px' }}>
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Album Modal */}
      <AnimatePresence>
        {isAlbumModalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={{ background: bgColors.card, borderRadius: '24px', width: '100%', maxWidth: '500px', padding: '32px', position: 'relative', border: `1px solid ${bgColors.border}` }}>
              <button onClick={() => setIsAlbumModalOpen(false)} style={{ position: 'absolute', top: 24, right: 24, background: 'transparent', border: 'none', color: bgColors.subtext, cursor: 'pointer' }}><X size={24} /></button>
              <h3 style={{ margin: '0 0 24px 0', color: bgColors.text, fontSize: '20px' }}>Create Album / EP</h3>
              <form onSubmit={handleAlbumSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', color: bgColors.text, fontWeight: 600, marginBottom: '8px' }}>Title *</label>
                  <input type="text" required value={albumTitle} onChange={e => setAlbumTitle(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: `1px solid ${bgColors.border}`, background: bgColors.inputBg, color: bgColors.text, outline: 'none' }} placeholder="Album Name" />
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', color: bgColors.text, fontWeight: 600, marginBottom: '8px' }}>Type</label>
                    <select value={albumType} onChange={e => setAlbumType(e.target.value as any)} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: `1px solid ${bgColors.border}`, background: bgColors.inputBg, color: bgColors.text, outline: 'none' }}>
                      <option value="Album">Album</option>
                      <option value="EP">EP</option>
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', color: bgColors.text, fontWeight: 600, marginBottom: '8px' }}>Release Date</label>
                    <input type="date" value={albumReleaseDate} onChange={e => setAlbumReleaseDate(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: `1px solid ${bgColors.border}`, background: bgColors.inputBg, color: bgColors.text, outline: 'none' }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', color: bgColors.text, fontWeight: 600, marginBottom: '8px' }}>Cover Art Source</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="button" onClick={() => setAlbumCoverSource('external')} style={{ flex: 1, padding: '8px', borderRadius: '8px', background: albumCoverSource === 'external' ? 'var(--primary)' : bgColors.inputBg, color: albumCoverSource === 'external' ? '#fff' : bgColors.text, border: `1px solid ${albumCoverSource === 'external' ? 'var(--primary)' : bgColors.border}`, cursor: 'pointer' }}>External Link</button>
                    <button type="button" onClick={() => setAlbumCoverSource('upload')} style={{ flex: 1, padding: '8px', borderRadius: '8px', background: albumCoverSource === 'upload' ? 'var(--primary)' : bgColors.inputBg, color: albumCoverSource === 'upload' ? '#fff' : bgColors.text, border: `1px solid ${albumCoverSource === 'upload' ? 'var(--primary)' : bgColors.border}`, cursor: 'pointer' }}>Upload File</button>
                  </div>
                </div>
                {albumCoverSource === 'external' ? (
                  <input type="url" value={albumCoverUrl} onChange={e => setAlbumCoverUrl(e.target.value)} placeholder="https://..." style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: `1px solid ${bgColors.border}`, background: bgColors.inputBg, color: bgColors.text, outline: 'none' }} />
                ) : (
                  <input type="file" accept="image/*" onChange={e => setAlbumCoverFile(e.target.files?.[0] || null)} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: `1px dashed ${bgColors.border}`, background: bgColors.inputBg, color: bgColors.text, outline: 'none' }} />
                )}
                <button type="submit" disabled={isSubmitting} style={{ marginTop: '16px', padding: '16px', borderRadius: '12px', background: 'var(--primary)', color: '#fff', border: 'none', fontWeight: 700, fontSize: '16px', cursor: isSubmitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  {isSubmitting ? <Loader2 size={20} className="spin" /> : 'Create'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Track Modal */}
      <AnimatePresence>
        {isTrackModalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={{ background: bgColors.card, borderRadius: '24px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '32px', position: 'relative', border: `1px solid ${bgColors.border}` }}>
              <button onClick={() => setIsTrackModalOpen(false)} style={{ position: 'absolute', top: 24, right: 24, background: 'transparent', border: 'none', color: bgColors.subtext, cursor: 'pointer' }}><X size={24} /></button>
              <h3 style={{ margin: '0 0 24px 0', color: bgColors.text, fontSize: '20px' }}>Add Track</h3>
              <form onSubmit={handleTrackSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {trackMediaSource === 'external' ? (
                  <>
                    <div>
                      <label style={{ display: 'block', color: bgColors.text, fontWeight: 600, marginBottom: '8px' }}>Title *</label>
                      <input type="text" required value={trackTitle} onChange={e => setTrackTitle(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: `1px solid ${bgColors.border}`, background: bgColors.inputBg, color: bgColors.text, outline: 'none' }} placeholder="Track Name" />
                    </div>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', color: bgColors.text, fontWeight: 600, marginBottom: '8px' }}>Album / EP</label>
                        <select value={trackAlbumId} onChange={e => setTrackAlbumId(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: `1px solid ${bgColors.border}`, background: bgColors.inputBg, color: bgColors.text, outline: 'none' }}>
                          <option value="">None (Single)</option>
                          {albums.map(a => <option key={a.id} value={a.id}>{a.title} ({a.album_type})</option>)}
                        </select>
                      </div>
                      {trackAlbumId && (
                        <div style={{ width: '100px' }}>
                          <label style={{ display: 'block', color: bgColors.text, fontWeight: 600, marginBottom: '8px' }}>Order</label>
                          <input type="number" min="1" required value={trackNumber} onChange={e => setTrackNumber(parseInt(e.target.value))} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: `1px solid ${bgColors.border}`, background: bgColors.inputBg, color: bgColors.text, outline: 'none' }} />
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', color: bgColors.text, fontWeight: 600, marginBottom: '8px' }}>Album / EP</label>
                      <select value={trackAlbumId} onChange={e => setTrackAlbumId(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: `1px solid ${bgColors.border}`, background: bgColors.inputBg, color: bgColors.text, outline: 'none' }}>
                        <option value="">None (Single)</option>
                        {albums.map(a => <option key={a.id} value={a.id}>{a.title} ({a.album_type})</option>)}
                      </select>
                    </div>
                  </div>
                )}
                
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', color: bgColors.text, fontWeight: 600, marginBottom: '8px' }}>Audio Source *</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button type="button" onClick={() => setTrackMediaSource('external')} style={{ flex: 1, padding: '8px', borderRadius: '8px', background: trackMediaSource === 'external' ? 'var(--primary)' : bgColors.inputBg, color: trackMediaSource === 'external' ? '#fff' : bgColors.text, border: `1px solid ${trackMediaSource === 'external' ? 'var(--primary)' : bgColors.border}`, cursor: 'pointer' }}>External</button>
                      <button type="button" onClick={() => setTrackMediaSource('upload')} style={{ flex: 1, padding: '8px', borderRadius: '8px', background: trackMediaSource === 'upload' ? 'var(--primary)' : bgColors.inputBg, color: trackMediaSource === 'upload' ? '#fff' : bgColors.text, border: `1px solid ${trackMediaSource === 'upload' ? 'var(--primary)' : bgColors.border}`, cursor: 'pointer' }}>Upload</button>
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', color: bgColors.text, fontWeight: 600, marginBottom: '8px' }}>Audio Content</label>
                    {trackMediaSource === 'external' ? (
                      <input type="url" required value={trackMediaUrl} onChange={e => setTrackMediaUrl(e.target.value)} placeholder="https://..." style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${bgColors.border}`, background: bgColors.inputBg, color: bgColors.text, outline: 'none' }} />
                    ) : (
                      <input type="file" required multiple accept="audio/*" onChange={handleFilesSelected} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `1px dashed ${bgColors.border}`, background: bgColors.inputBg, color: bgColors.text, outline: 'none' }} />
                    )}
                  </div>
                </div>

                {trackMediaSource === 'upload' && trackDrafts.length > 0 && (
                  <div style={{ background: bgColors.inputBg, padding: '16px', borderRadius: '12px', border: `1px solid ${bgColors.border}`, maxHeight: '200px', overflowY: 'auto' }}>
                    <label style={{ display: 'block', color: bgColors.text, fontWeight: 600, marginBottom: '12px' }}>Track List ({trackDrafts.length})</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {trackDrafts.map((draft, idx) => (
                        <div key={draft.id} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <span style={{ color: bgColors.subtext, fontSize: '12px', width: '20px' }}>{idx + 1}.</span>
                          <input type="text" value={draft.title} onChange={(e) => updateDraft(draft.id, 'title', e.target.value)} style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: `1px solid ${bgColors.border}`, background: bgColors.card, color: bgColors.text, outline: 'none', fontSize: '14px' }} placeholder="Track Title" />
                          {trackAlbumId && (
                            <input type="number" min="1" value={draft.order} onChange={(e) => updateDraft(draft.id, 'order', parseInt(e.target.value))} style={{ width: '70px', padding: '8px', borderRadius: '8px', border: `1px solid ${bgColors.border}`, background: bgColors.card, color: bgColors.text, outline: 'none', fontSize: '14px' }} placeholder="Order" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!trackAlbumId && (
                  <div>
                    <label style={{ display: 'block', color: bgColors.text, fontWeight: 600, marginBottom: '8px' }}>Cover Art (Optional for Singles)</label>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <select value={trackCoverSource} onChange={e => setTrackCoverSource(e.target.value as any)} style={{ padding: '12px', borderRadius: '8px', border: `1px solid ${bgColors.border}`, background: bgColors.inputBg, color: bgColors.text, outline: 'none' }}>
                        <option value="external">Link</option>
                        <option value="upload">Upload</option>
                      </select>
                      {trackCoverSource === 'external' ? (
                        <input type="url" value={trackCoverUrl} onChange={e => setTrackCoverUrl(e.target.value)} placeholder="Cover URL" style={{ flex: 1, padding: '12px', borderRadius: '8px', border: `1px solid ${bgColors.border}`, background: bgColors.inputBg, color: bgColors.text, outline: 'none' }} />
                      ) : (
                        <input type="file" accept="image/*" onChange={e => setTrackCoverFile(e.target.files?.[0] || null)} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: `1px dashed ${bgColors.border}`, background: bgColors.inputBg, color: bgColors.text, outline: 'none' }} />
                      )}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', color: bgColors.text, fontWeight: 600, marginBottom: '8px' }}>Genre</label>
                    <input type="text" value={trackGenre} onChange={e => setTrackGenre(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: `1px solid ${bgColors.border}`, background: bgColors.inputBg, color: bgColors.text, outline: 'none' }} placeholder="e.g. Hip-Hop" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', color: bgColors.text, fontWeight: 600, marginBottom: '8px' }}>Moods</label>
                    <input type="text" value={trackMoods} onChange={e => setTrackMoods(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: `1px solid ${bgColors.border}`, background: bgColors.inputBg, color: bgColors.text, outline: 'none' }} placeholder="Chill, Upbeat..." />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', color: bgColors.text, fontWeight: 600, marginBottom: '8px' }}>Energy Level (0-100)</label>
                    <input type="range" min="0" max="100" value={trackEnergy} onChange={e => setTrackEnergy(parseInt(e.target.value))} style={{ width: '100%' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => setTrackExplicit(!trackExplicit)}>
                    <input type="checkbox" checked={trackExplicit} readOnly style={{ width: 18, height: 18, cursor: 'pointer' }} />
                    <label style={{ color: bgColors.text, fontWeight: 600, cursor: 'pointer' }}>Explicit Content</label>
                  </div>
                </div>

                <button type="submit" disabled={isSubmitting} style={{ marginTop: '16px', padding: '16px', borderRadius: '12px', background: 'var(--primary)', color: '#fff', border: 'none', fontWeight: 700, fontSize: '16px', cursor: isSubmitting ? 'not-allowed' : 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', position: 'relative', overflow: 'hidden' }}>
                  {isSubmitting && uploadProgress > 0 && (
                    <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: `${uploadProgress}%`, background: 'rgba(255,255,255,0.2)', transition: 'width 0.2s' }} />
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', zIndex: 1 }}>
                    {isSubmitting ? <Loader2 size={20} className="spin" /> : 'Save Track'}
                  </div>
                  {isSubmitting && uploadProgress > 0 && (
                    <span style={{ fontSize: '12px', zIndex: 1 }}>Uploading... {uploadProgress}%</span>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
