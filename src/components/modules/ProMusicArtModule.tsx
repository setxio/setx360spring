import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Music, Image as ImageIcon, Plus, Link as LinkIcon, Upload, Trash2, Edit2, Loader2, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useApp } from '../../context/AppContext';

export const ProMusicArtModule: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { activeContext, theme } = useApp();
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'track' | 'artwork'>('track');
  
  // Form State
  const [formType, setFormType] = useState<'track' | 'artwork'>('track');
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [mediaSource, setMediaSource] = useState<'external' | 'upload'>('external');
  const [externalUrl, setExternalUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDark = theme.includes('dark');
  const bgColors = isDark ? {
    card: '#1e293b',
    border: '#334155',
    text: '#f8fafc',
    subtext: '#94a3b8',
    inputBg: '#0f172a'
  } : {
    card: '#ffffff',
    border: '#e2e8f0',
    text: '#0f172a',
    subtext: '#64748b',
    inputBg: '#f8fafc'
  };

  const fetchItems = async () => {
    if (!activeContext) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from('artist_portfolio')
      .select('*')
      .eq('page_id', activeContext.id)
      .order('created_at', { ascending: false });
    
    if (data) setItems(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, [activeContext]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    await supabase.from('artist_portfolio').delete().eq('id', id);
    fetchItems();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeContext) return;
    if (!formTitle.trim()) return alert('Title is required');
    if (mediaSource === 'external' && !externalUrl.trim()) return alert('URL is required');
    if (mediaSource === 'upload' && !selectedFile) return alert('File is required');

    setIsSubmitting(true);
    try {
      let finalUrl = externalUrl;

      if (mediaSource === 'upload' && selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${activeContext.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('portfolio_media')
          .upload(fileName, selectedFile);
          
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('portfolio_media')
          .getPublicUrl(fileName);
          
        finalUrl = publicUrl;
      }

      const { error } = await supabase.from('artist_portfolio').insert({
        page_id: activeContext.id,
        item_type: formType,
        title: formTitle.trim(),
        description: formDesc.trim() || null,
        media_type: mediaSource,
        media_url: finalUrl
      });

      if (error) throw error;

      setIsModalOpen(false);
      setFormTitle('');
      setFormDesc('');
      setExternalUrl('');
      setSelectedFile(null);
      fetchItems();
    } catch (err: any) {
      console.error(err);
      alert('Error saving item: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredItems = items.filter(i => i.item_type === activeTab);

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
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: bgColors.text, margin: 0 }}>Music & Art</h2>
            <p style={{ color: bgColors.subtext, margin: '4px 0 0 0' }}>Manage your discography and portfolio</p>
          </div>
        </div>
        <button 
          onClick={() => {
            setFormType(activeTab);
            setIsModalOpen(true);
          }}
          style={{ padding: '10px 20px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '999px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}
        >
          <Plus size={18} /> Add New {activeTab === 'track' ? 'Track' : 'Artwork'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: bgColors.card, padding: '8px', borderRadius: '16px', border: `1px solid ${bgColors.border}`, width: 'fit-content' }}>
        <button 
          onClick={() => setActiveTab('track')}
          style={{ padding: '8px 24px', background: activeTab === 'track' ? 'var(--primary)' : 'transparent', color: activeTab === 'track' ? '#fff' : bgColors.text, border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
        >
          <Music size={18} /> Discography
        </button>
        <button 
          onClick={() => setActiveTab('artwork')}
          style={{ padding: '8px 24px', background: activeTab === 'artwork' ? 'var(--primary)' : 'transparent', color: activeTab === 'artwork' ? '#fff' : bgColors.text, border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
        >
          <ImageIcon size={18} /> Visual Art
        </button>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
          <Loader2 size={32} color="var(--primary)" className="spin" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px', background: bgColors.card, borderRadius: '24px', border: `1px dashed ${bgColors.border}` }}>
          {activeTab === 'track' ? <Music size={48} color={bgColors.border} style={{ margin: '0 auto 16px' }} /> : <ImageIcon size={48} color={bgColors.border} style={{ margin: '0 auto 16px' }} />}
          <h3 style={{ color: bgColors.text, fontSize: '18px', margin: '0 0 8px 0' }}>No {activeTab}s yet</h3>
          <p style={{ color: bgColors.subtext, margin: 0 }}>Click the "Add New" button above to get started.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
          {filteredItems.map(item => (
            <div key={item.id} style={{ background: bgColors.card, borderRadius: '16px', border: `1px solid ${bgColors.border}`, overflow: 'hidden' }}>
              <div style={{ height: 160, background: bgColors.inputBg, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundImage: item.item_type === 'artwork' ? `url(${item.media_url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
                {item.item_type === 'track' && <Music size={48} color={bgColors.border} />}
              </div>
              <div style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', color: bgColors.text, fontSize: '16px' }}>{item.title}</h4>
                    {item.description && <p style={{ margin: 0, color: bgColors.subtext, fontSize: '14px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.description}</p>}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${bgColors.border}` }}>
                  <a href={item.media_url} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <LinkIcon size={12} /> View Media
                  </a>
                  <button onClick={() => handleDelete(item.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              style={{ background: bgColors.card, borderRadius: '24px', width: '100%', maxWidth: '500px', padding: '32px', position: 'relative', border: `1px solid ${bgColors.border}` }}
            >
              <button onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', top: 24, right: 24, background: 'transparent', border: 'none', color: bgColors.subtext, cursor: 'pointer' }}>
                <X size={24} />
              </button>
              
              <h3 style={{ margin: '0 0 24px 0', color: bgColors.text, fontSize: '20px' }}>Add {formType === 'track' ? 'Track' : 'Artwork'}</h3>
              
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', color: bgColors.text, fontWeight: 600, marginBottom: '8px' }}>Title *</label>
                  <input type="text" required value={formTitle} onChange={e => setFormTitle(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: `1px solid ${bgColors.border}`, background: bgColors.inputBg, color: bgColors.text, outline: 'none' }} placeholder="e.g. Summer Breeze" />
                </div>
                
                <div>
                  <label style={{ display: 'block', color: bgColors.text, fontWeight: 600, marginBottom: '8px' }}>Description</label>
                  <textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: `1px solid ${bgColors.border}`, background: bgColors.inputBg, color: bgColors.text, outline: 'none', resize: 'vertical' }} rows={3} placeholder="Tell us about this piece..." />
                </div>

                <div>
                  <label style={{ display: 'block', color: bgColors.text, fontWeight: 600, marginBottom: '8px' }}>Media Source *</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="button" onClick={() => setMediaSource('external')} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: mediaSource === 'external' ? 'var(--primary)' : bgColors.inputBg, color: mediaSource === 'external' ? '#fff' : bgColors.text, border: `1px solid ${mediaSource === 'external' ? 'var(--primary)' : bgColors.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 600 }}>
                      <LinkIcon size={18} /> External Link
                    </button>
                    <button type="button" onClick={() => setMediaSource('upload')} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: mediaSource === 'upload' ? 'var(--primary)' : bgColors.inputBg, color: mediaSource === 'upload' ? '#fff' : bgColors.text, border: `1px solid ${mediaSource === 'upload' ? 'var(--primary)' : bgColors.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 600 }}>
                      <Upload size={18} /> Upload File
                    </button>
                  </div>
                </div>

                {mediaSource === 'external' ? (
                  <div>
                    <label style={{ display: 'block', color: bgColors.text, fontWeight: 600, marginBottom: '8px' }}>URL *</label>
                    <input type="url" required value={externalUrl} onChange={e => setExternalUrl(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: `1px solid ${bgColors.border}`, background: bgColors.inputBg, color: bgColors.text, outline: 'none' }} placeholder="https://soundcloud.com/..." />
                    <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: bgColors.subtext }}>Paste a link to Spotify, YouTube, SoundCloud, or your website.</p>
                  </div>
                ) : (
                  <div>
                    <label style={{ display: 'block', color: bgColors.text, fontWeight: 600, marginBottom: '8px' }}>File *</label>
                    <input type="file" required accept={formType === 'track' ? "audio/*" : "image/*"} onChange={e => setSelectedFile(e.target.files?.[0] || null)} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: `1px dashed ${bgColors.border}`, background: bgColors.inputBg, color: bgColors.text, outline: 'none' }} />
                  </div>
                )}

                <button type="submit" disabled={isSubmitting} style={{ marginTop: '16px', padding: '16px', borderRadius: '12px', background: 'var(--primary)', color: '#fff', border: 'none', fontWeight: 700, fontSize: '16px', cursor: isSubmitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  {isSubmitting ? <Loader2 size={20} className="spin" /> : <Plus size={20} />}
                  Save to Portfolio
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
