import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Home, FileText, Image as ImageIcon, PenTool, MessageSquare,
  Palette, Plug, Users, Settings, Menu, Plus, ExternalLink,
  LayoutGrid, FileSignature, ArrowLeft, MoreVertical, Globe,
  Check, Loader2, X, Trash2, Edit2, Upload, Link as LinkIcon,
  AlertCircle, UserPlus, ChevronUp, ChevronDown, Star, Clock,
  RefreshCw, Tag, MessageCircle, Calendar, ShoppingCart, ShoppingBag, DollarSign
} from 'lucide-react';
import { Avatar } from './Avatar';
import { supabase } from '../lib/supabase';
import './WebBuilderView.css';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';

// ─── Types ───────────────────────────────────────────────────────────────────
interface WbSite {
  id: string; name: string; subdomain: string; tagline?: string;
  status: string; plan: string; storage_bucket?: string;
  white_label_config: { brandName?: string; sidebarBg?: string; sidebarColor?: string; accentColor?: string };
  created_at: string;
}
interface WbPost {
  id: string; site_id: string; title: string; slug: string;
  content?: string; excerpt?: string; status: string;
  featured_image_url?: string; categories: string[]; tags: string[];
  published_at?: string; created_at: string;
}
interface WbPage {
  id: string; site_id: string; title: string; slug: string;
  content?: string; status: string; sort_order: number; created_at: string;
}
interface WbMedia {
  id: string; site_id: string; file_name: string; file_url: string;
  file_type?: string; file_size?: number; alt_text?: string; created_at: string;
}
interface WbSubscriber {
  id: string; site_id: string; user_id: string; role: string;
  status: string; subscribed_at: string;
  profiles?: { name: string; avatar_url?: string; };
}
interface WbComment {
  id: string; post_id: string; author_name?: string; content: string;
  status: string; created_at: string;
  wb_posts?: { title: string };
}
interface WbMenuItem {
  id: string; site_id: string; label: string; url: string;
  sort_order: number; parent_id?: string;
}
interface WbProduct {
  id: string; site_id: string; title: string; slug: string;
  description?: string; product_type: string; price?: number; sale_price?: number;
  sku?: string; manage_stock: boolean; stock_quantity: number; stock_status: string;
  status: string; featured_image_url?: string; gallery_urls: string[];
  categories: string[]; tags: string[]; metadata: any; created_at: string;
}
interface WbOrder {
  id: string; site_id: string; customer_name?: string; customer_email?: string;
  status: string; total_amount: number; currency: string; payment_status: string;
  created_at: string;
}
interface WbBooking {
  id: string; site_id: string; product_id: string; customer_name?: string;
  start_time: string; end_time: string; status: string; created_at: string;
}

interface WebBuilderViewProps { user: any; scope: string; }

// ─── Chip Input Component ─────────────────────────────────────────────────────
const ChipInput: React.FC<{ label: string; values: string[]; onChange: (vals: string[]) => void; placeholder?: string }> = ({ label, values, onChange, placeholder }) => {
  const [input, setInput] = useState('');
  const add = () => {
    const v = input.trim().toLowerCase();
    if (v && !values.includes(v)) onChange([...values, v]);
    setInput('');
  };
  return (
    <div className="wb-form-group">
      <label>{label}</label>
      <div className="wb-chip-wrap">
        {values.map(v => (
          <span key={v} className="wb-chip">
            {v}<button type="button" onClick={() => onChange(values.filter(x => x !== v))}><X size={11} /></button>
          </span>
        ))}
        <input
          className="wb-chip-input"
          value={input}
          placeholder={placeholder || `Add ${label.toLowerCase()}...`}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); } }}
          onBlur={add}
        />
      </div>
      <small style={{ color: '#8c8f94' }}>Press Enter or comma to add</small>
    </div>
  );
};

// ─── Rich Text Editor ─────────────────────────────────────────────────────────
const RichEditor: React.FC<{
  content: string;
  onChange: (html: string) => void;
  onInsertImage?: (url: string) => void;
}> = ({ content, onChange, onInsertImage }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Start writing your content here...' }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  if (!editor) return null;

  return (
    <div className="wb-editor-wrap">
      <div className="wb-editor-toolbar">
        <button type="button" className={`wb-tb-btn ${editor.isActive('bold') ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleBold().run()}><strong>B</strong></button>
        <button type="button" className={`wb-tb-btn ${editor.isActive('italic') ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleItalic().run()}><em>I</em></button>
        <button type="button" className={`wb-tb-btn ${editor.isActive('heading', { level: 2 }) ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button>
        <button type="button" className={`wb-tb-btn ${editor.isActive('heading', { level: 3 }) ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</button>
        <button type="button" className={`wb-tb-btn ${editor.isActive('bulletList') ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleBulletList().run()}>• List</button>
        <button type="button" className={`wb-tb-btn ${editor.isActive('orderedList') ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleOrderedList().run()}>1. List</button>
        <button type="button" className={`wb-tb-btn ${editor.isActive('blockquote') ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleBlockquote().run()}>❝</button>
        <button type="button" className={`wb-tb-btn ${editor.isActive('code') ? 'active' : ''}`} onClick={() => editor.chain().focus().toggleCode().run()}>{'<>'}</button>
        <button type="button" className="wb-tb-btn" onClick={() => { const url = window.prompt('URL'); if (url) editor.chain().focus().setLink({ href: url }).run(); }}><LinkIcon size={13} /></button>
        {onInsertImage && (
          <button type="button" className="wb-tb-btn" title="Insert image from media library" onClick={() => onInsertImage('')}><ImageIcon size={13} /></button>
        )}
      </div>
      <EditorContent editor={editor} className="wb-editor-content" />
    </div>
  );
};

// ─── Settings Tab ─────────────────────────────────────────────────────────────
const SettingsTab: React.FC<{ siteId: string; subdomain: string }> = ({ siteId, subdomain }) => {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    supabase.from('wb_site_settings').select('*').eq('site_id', siteId).single().then(({ data }) => {
      setSettings(data || { site_id: siteId, timezone: 'America/Chicago', posts_per_page: 10, homepage_type: 'latest_posts', allow_subscriptions: true, comment_moderation: true });
      setLoading(false);
    });
  }, [siteId]);

  const save = async () => {
    await supabase.from('wb_site_settings').upsert({ ...settings, site_id: siteId }, { onConflict: 'site_id' });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (loading) return <div className="wb-loading"><Loader2 size={24} className="wb-spinner" /></div>;

  return (
    <div>
      <div className="wb-content-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1>General Settings</h1>
        <button className="wb-btn-primary" onClick={save}>{saved ? <><Check size={16} /> Saved!</> : 'Save Settings'}</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}>
        <div className="wb-widget">
          <h2 className="wb-widget-title">Site Identity</h2>
          <div className="wb-widget-content" style={{ padding: '16px 20px 20px' }}>
            <div className="wb-form-group">
              <label>Tagline</label>
              <input type="text" className="wb-input" value={settings?.tagline || ''} placeholder="Just another SETX 360 site" onChange={e => setSettings({ ...settings, tagline: e.target.value })} />
            </div>
            <div className="wb-form-group" style={{ marginBottom: 0 }}>
              <label>Public URL</label>
              <input type="text" className="wb-input" value={`${subdomain}.setx360.com`} readOnly style={{ background: '#f6f7f7', color: '#646970' }} />
            </div>
          </div>
        </div>
        <div className="wb-widget">
          <h2 className="wb-widget-title">Reading</h2>
          <div className="wb-widget-content" style={{ padding: '16px 20px 20px' }}>
            <div className="wb-form-group">
              <label>Homepage displays</label>
              <select className="wb-select" value={settings?.homepage_type || 'latest_posts'} onChange={e => setSettings({ ...settings, homepage_type: e.target.value })}>
                <option value="latest_posts">Your latest posts</option>
                <option value="static_page">A static page</option>
              </select>
            </div>
            <div className="wb-form-group" style={{ marginBottom: 0 }}>
              <label>Posts per page</label>
              <input type="number" className="wb-input" value={settings?.posts_per_page || 10} min={1} max={100} onChange={e => setSettings({ ...settings, posts_per_page: Number(e.target.value) })} />
            </div>
          </div>
        </div>
        <div className="wb-widget">
          <h2 className="wb-widget-title">Discussion</h2>
          <div className="wb-widget-content" style={{ padding: '16px 20px 20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 16 }}>
              <input type="checkbox" checked={settings?.comment_moderation ?? true} onChange={e => setSettings({ ...settings, comment_moderation: e.target.checked })} style={{ width: 16, height: 16 }} />
              <span>Hold comments for moderation before publishing</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input type="checkbox" checked={settings?.allow_subscriptions ?? true} onChange={e => setSettings({ ...settings, allow_subscriptions: e.target.checked })} style={{ width: 16, height: 16 }} />
              <span>Allow visitors to subscribe via SETX 360</span>
            </label>
          </div>
        </div>
        <div className="wb-widget">
          <h2 className="wb-widget-title">Integrations</h2>
          <div className="wb-widget-content" style={{ padding: '16px 20px 20px' }}>
            <div className="wb-form-group">
              <label>Google Analytics ID</label>
              <input type="text" className="wb-input" value={settings?.ga_tracking_id || ''} placeholder="G-XXXXXXXXXX" onChange={e => setSettings({ ...settings, ga_tracking_id: e.target.value })} />
            </div>
            <div className="wb-form-group" style={{ marginBottom: 0 }}>
              <label>Contact Form Email</label>
              <input type="email" className="wb-input" value={settings?.contact_form_email || ''} placeholder="contact@yourdomain.com" onChange={e => setSettings({ ...settings, contact_form_email: e.target.value })} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Menu Builder Tab ─────────────────────────────────────────────────────────
const MenuBuilderTab: React.FC<{ siteId: string; subdomain: string }> = ({ siteId, subdomain }) => {
  const [items, setItems] = useState<WbMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newLabel, setNewLabel] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('wb_menu_items').select('*').eq('site_id', siteId).is('parent_id', null).order('sort_order');
    setItems(data || []);
    setLoading(false);
  }, [siteId]);

  useEffect(() => { load(); }, [load]);

  const addItem = async () => {
    if (!newLabel || !newUrl) return;
    setSaving(true);
    const maxOrder = items.length > 0 ? Math.max(...items.map(i => i.sort_order)) + 1 : 0;
    await supabase.from('wb_menu_items').insert({ site_id: siteId, label: newLabel, url: newUrl, sort_order: maxOrder });
    setNewLabel(''); setNewUrl('');
    await load();
    setSaving(false);
  };

  const removeItem = async (id: string) => {
    await supabase.from('wb_menu_items').delete().eq('id', id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const moveItem = async (id: string, dir: 'up' | 'down') => {
    const idx = items.findIndex(i => i.id === id);
    if ((dir === 'up' && idx === 0) || (dir === 'down' && idx === items.length - 1)) return;
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    const newItems = [...items];
    [newItems[idx], newItems[swapIdx]] = [newItems[swapIdx], newItems[idx]];
    // Update sort_order
    const updates = newItems.map((item, i) => supabase.from('wb_menu_items').update({ sort_order: i }).eq('id', item.id));
    await Promise.all(updates);
    setItems(newItems.map((item, i) => ({ ...item, sort_order: i })));
  };

  const updateItem = async (id: string, field: string, value: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const saveItem = async (item: WbMenuItem) => {
    await supabase.from('wb_menu_items').update({ label: item.label, url: item.url }).eq('id', item.id);
  };

  if (loading) return <div className="wb-loading"><Loader2 size={24} className="wb-spinner" /></div>;

  return (
    <div>
      <div className="wb-content-header"><h1>Navigation Menu</h1></div>
      <div className="wb-info-box" style={{ marginBottom: 24 }}>
        <Globe size={16} />
        This menu appears in the navigation bar on your public site at <strong>{subdomain}.setx360.com</strong>
      </div>

      <div className="wb-widget" style={{ maxWidth: 680, marginBottom: 24 }}>
        <h2 className="wb-widget-title">Menu Items</h2>
        <div className="wb-widget-content" style={{ padding: '12px 16px' }}>
          {items.length === 0 && (
            <p style={{ color: '#646970', textAlign: 'center', padding: '20px 0' }}>No menu items yet. Add your first link below.</p>
          )}
          {items.map((item, idx) => (
            <div key={item.id} className="wb-menu-row">
              <div className="wb-menu-handle">
                <button className="wb-icon-btn" disabled={idx === 0} onClick={() => moveItem(item.id, 'up')}><ChevronUp size={16} /></button>
                <button className="wb-icon-btn" disabled={idx === items.length - 1} onClick={() => moveItem(item.id, 'down')}><ChevronDown size={16} /></button>
              </div>
              <input
                className="wb-input wb-menu-label-input"
                value={item.label}
                onChange={e => updateItem(item.id, 'label', e.target.value)}
                onBlur={() => saveItem(item)}
                placeholder="Label"
              />
              <input
                className="wb-input wb-menu-url-input"
                value={item.url}
                onChange={e => updateItem(item.id, 'url', e.target.value)}
                onBlur={() => saveItem(item)}
                placeholder="URL or /path"
              />
              <button className="wb-icon-btn danger" onClick={() => removeItem(item.id)}><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
      </div>

      <div className="wb-widget" style={{ maxWidth: 680 }}>
        <h2 className="wb-widget-title">Add New Item</h2>
        <div className="wb-widget-content" style={{ padding: '16px 20px 20px', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="wb-form-group" style={{ flex: 1, minWidth: 160, marginBottom: 0 }}>
            <label>Label</label>
            <input type="text" className="wb-input" value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="e.g. About" onKeyDown={e => e.key === 'Enter' && addItem()} />
          </div>
          <div className="wb-form-group" style={{ flex: 2, minWidth: 200, marginBottom: 0 }}>
            <label>URL</label>
            <input type="text" className="wb-input" value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="e.g. /page/about or https://..." onKeyDown={e => e.key === 'Enter' && addItem()} />
          </div>
          <button className="wb-btn-primary" onClick={addItem} disabled={!newLabel || !newUrl || saving}>
            {saving ? <Loader2 size={15} className="wb-spinner" /> : <Plus size={15} />} Add Item
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Comments Tab ─────────────────────────────────────────────────────────────
const CommentsTab: React.FC<{ siteId: string }> = ({ siteId }) => {
  const [comments, setComments] = useState<WbComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'spam'>('pending');

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('wb_comments')
      .select('*, wb_posts(title)')
      .eq('site_id', siteId)
      .eq('status', filter)
      .order('created_at', { ascending: false });
    setComments(data || []);
    setLoading(false);
  }, [siteId, filter]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('wb_comments').update({ status }).eq('id', id);
    setComments(prev => prev.filter(c => c.id !== id));
  };

  const deleteComment = async (id: string) => {
    await supabase.from('wb_comments').delete().eq('id', id);
    setComments(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div>
      <div className="wb-content-header"><h1>Comments</h1></div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
        {(['pending', 'approved', 'spam'] as const).map(s => (
          <button
            key={s}
            className={filter === s ? 'wb-btn-primary' : 'wb-btn-secondary'}
            style={{ textTransform: 'capitalize', padding: '6px 16px' }}
            onClick={() => setFilter(s)}
          >{s}</button>
        ))}
        <button className="wb-icon-btn" onClick={load} title="Refresh" style={{ marginLeft: 'auto' }}><RefreshCw size={16} /></button>
      </div>
      {loading ? (
        <div className="wb-loading"><Loader2 size={24} className="wb-spinner" /></div>
      ) : comments.length === 0 ? (
        <div className="wb-empty-state" style={{ height: 300 }}>
          <MessageCircle size={40} color="#c3c4c7" />
          <p>No {filter} comments.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {comments.map(c => (
            <div key={c.id} className="wb-comment-card">
              <div className="wb-comment-meta">
                <strong>{c.author_name || 'Anonymous'}</strong>
                <span style={{ color: '#646970', fontSize: 12 }}>on <em>{c.wb_posts?.title}</em></span>
                <span style={{ color: '#aaa', fontSize: 12, marginLeft: 'auto' }}>{new Date(c.created_at).toLocaleString()}</span>
              </div>
              <p className="wb-comment-body">{c.content}</p>
              <div className="wb-comment-actions">
                {filter !== 'approved' && (
                  <button className="wb-btn-secondary" style={{ padding: '4px 12px', fontSize: 12 }} onClick={() => updateStatus(c.id, 'approved')}>
                    <Check size={13} /> Approve
                  </button>
                )}
                {filter !== 'spam' && (
                  <button className="wb-btn-secondary" style={{ padding: '4px 12px', fontSize: 12, borderColor: '#f59e0b', color: '#b45309' }} onClick={() => updateStatus(c.id, 'spam')}>
                    Mark as Spam
                  </button>
                )}
                <button className="wb-icon-btn danger" onClick={() => deleteComment(c.id)}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Image Picker Modal ───────────────────────────────────────────────────────
const ImagePickerModal: React.FC<{
  siteId: string;
  storageBucket?: string;
  onSelect: (url: string) => void;
  onClose: () => void;
}> = ({ siteId, storageBucket, onSelect, onClose }) => {
  const [media, setMedia] = useState<WbMedia[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    supabase.from('wb_media').select('*').eq('site_id', siteId).like('file_type', 'image/%').order('created_at', { ascending: false }).then(({ data }) => setMedia(data || []));
  }, [siteId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!storageBucket || !e.target.files?.[0]) return;
    setUploading(true);
    const file = e.target.files[0];
    const path = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const { error } = await supabase.storage.from(storageBucket).upload(path, file, { upsert: true });
    if (!error) {
      const { data: urlData } = supabase.storage.from(storageBucket).getPublicUrl(path);
      await supabase.from('wb_media').insert({ site_id: siteId, file_name: file.name, file_url: urlData.publicUrl, file_type: file.type, file_size: file.size });
      const { data } = await supabase.from('wb_media').select('*').eq('site_id', siteId).like('file_type', 'image/%').order('created_at', { ascending: false });
      setMedia(data || []);
    }
    setUploading(false);
  };

  return (
    <div className="wb-modal-overlay" onClick={onClose}>
      <div className="wb-modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
        <div className="wb-modal-head">
          <h2>Select Image</h2>
          <button className="wb-icon-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <p style={{ margin: 0, color: '#646970', fontSize: 13 }}>Click an image to select it, or upload a new one.</p>
          <label className="wb-btn-secondary" style={{ cursor: 'pointer', padding: '6px 12px', fontSize: 13 }}>
            {uploading ? <Loader2 size={14} className="wb-spinner" /> : <><Upload size={14} /> Upload</>}
            <input type="file" hidden accept="image/*" onChange={handleUpload} />
          </label>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10, maxHeight: 380, overflowY: 'auto' }}>
          {media.map(m => (
            <div
              key={m.id}
              onClick={() => onSelect(m.file_url)}
              style={{ cursor: 'pointer', borderRadius: 6, overflow: 'hidden', border: '2px solid transparent', transition: 'border-color .15s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#2271b1')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}
            >
              <img src={m.file_url} alt={m.alt_text || m.file_name} style={{ width: '100%', height: 90, objectFit: 'cover', display: 'block' }} />
              <p style={{ margin: 0, padding: '4px 6px', fontSize: 10, color: '#646970', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.file_name}</p>
            </div>
          ))}
          {media.length === 0 && !uploading && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: '#aaa' }}>
              <ImageIcon size={32} style={{ opacity: .4 }} /><p>No images yet. Upload one above.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Appearance Tab ───────────────────────────────────────────────────────────
const AppearanceTab: React.FC<{ siteId: string; wlConfig: any; onUpdateWlConfig: (key: string, value: any) => void; storageBucket?: string }> = ({ siteId, wlConfig, onUpdateWlConfig, storageBucket }) => {
  const [showPicker, setShowPicker] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'logo' | 'favicon'>('logo');

  return (
    <div>
      <div className="wb-content-header" style={{ marginBottom: 24 }}>
        <h1>Appearance & Theming</h1>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}>
        <div className="wb-widget">
          <h2 className="wb-widget-title"><Palette size={16} /> Brand Assets</h2>
          <div className="wb-widget-content" style={{ padding: '16px 20px 20px' }}>
            <div className="wb-form-group">
              <label>Site Logo</label>
              {wlConfig?.logoUrl ? (
                <div style={{ position: 'relative', display: 'inline-block', width: '100%', border: '1px solid #dcdcde', borderRadius: 6, padding: 12, textAlign: 'center', background: '#f6f7f7' }}>
                  <img src={wlConfig.logoUrl} alt="Logo" style={{ maxHeight: 60, maxWidth: '100%', objectFit: 'contain' }} />
                  <button className="wb-btn-text" style={{ padding: '0', fontSize: 12, color: '#d63638', marginTop: 12, display: 'block', width: '100%' }} onClick={() => onUpdateWlConfig('logoUrl', '')}>Remove logo</button>
                </div>
              ) : (
                <button className="wb-btn-secondary" style={{ width: '100%' }} onClick={() => { setPickerTarget('logo'); setShowPicker(true); }}>
                  <ImageIcon size={14} style={{ marginRight: 6 }} /> Choose Logo
                </button>
              )}
            </div>
            <div className="wb-form-group" style={{ marginBottom: 0 }}>
              <label>Favicon</label>
              {wlConfig?.faviconUrl ? (
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12, border: '1px solid #dcdcde', borderRadius: 6, padding: '8px 12px', background: '#f6f7f7' }}>
                  <img src={wlConfig.faviconUrl} alt="Favicon" style={{ width: 32, height: 32, objectFit: 'contain' }} />
                  <button className="wb-btn-text" style={{ padding: '0', fontSize: 12, color: '#d63638', marginLeft: 'auto' }} onClick={() => onUpdateWlConfig('faviconUrl', '')}>Remove</button>
                </div>
              ) : (
                <button className="wb-btn-secondary" style={{ width: '100%' }} onClick={() => { setPickerTarget('favicon'); setShowPicker(true); }}>
                  <ImageIcon size={14} style={{ marginRight: 6 }} /> Choose Favicon (32x32)
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="wb-widget">
          <h2 className="wb-widget-title">Colors & Typography</h2>
          <div className="wb-widget-content" style={{ padding: '16px 20px 20px' }}>
            <div className="wb-form-group">
              <label>Primary Accent Color</label>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input type="color" value={wlConfig?.accentColor || '#2271b1'} onChange={e => onUpdateWlConfig('accentColor', e.target.value)} style={{ width: 40, height: 40, padding: 0, border: '1px solid #dcdcde', borderRadius: 4, cursor: 'pointer' }} />
                <input type="text" className="wb-input" value={wlConfig?.accentColor || '#2271b1'} onChange={e => onUpdateWlConfig('accentColor', e.target.value)} style={{ flex: 1, marginBottom: 0 }} />
              </div>
            </div>
            <div className="wb-form-group">
              <label>Heading Font</label>
              <select className="wb-select" value={wlConfig?.headingFont || 'Inter'} onChange={e => onUpdateWlConfig('headingFont', e.target.value)}>
                <option value="Inter">Inter</option>
                <option value="Playfair Display">Playfair Display</option>
                <option value="Merriweather">Merriweather</option>
                <option value="Lora">Lora</option>
              </select>
            </div>
            <div className="wb-form-group" style={{ marginBottom: 0 }}>
              <label>Body Font</label>
              <select className="wb-select" value={wlConfig?.bodyFont || 'Inter'} onChange={e => onUpdateWlConfig('bodyFont', e.target.value)}>
                <option value="Inter">Inter</option>
                <option value="Roboto">Roboto</option>
                <option value="Open Sans">Open Sans</option>
              </select>
            </div>
          </div>
        </div>
        <div className="wb-widget">
          <h2 className="wb-widget-title">Header & Footer Layout</h2>
          <div className="wb-widget-content" style={{ padding: '16px 20px 20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 16 }}>
              <input type="checkbox" checked={wlConfig?.showHeaderSearch ?? true} onChange={e => onUpdateWlConfig('showHeaderSearch', e.target.checked)} style={{ width: 16, height: 16 }} />
              <span>Show Search Bar in Header</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 16 }}>
              <input type="checkbox" checked={wlConfig?.showFooterSocial ?? true} onChange={e => onUpdateWlConfig('showFooterSocial', e.target.checked)} style={{ width: 16, height: 16 }} />
              <span>Show Social Icons in Footer</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input type="checkbox" checked={wlConfig?.centerLogo ?? false} onChange={e => onUpdateWlConfig('centerLogo', e.target.checked)} style={{ width: 16, height: 16 }} />
              <span>Center Logo in Navigation</span>
            </label>
          </div>
        </div>
      </div>
      {showPicker && (
        <ImagePickerModal
          siteId={siteId}
          storageBucket={storageBucket}
          onSelect={(url) => {
            onUpdateWlConfig(pickerTarget === 'logo' ? 'logoUrl' : 'faviconUrl', url);
            setShowPicker(false);
          }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const WebBuilderView: React.FC<WebBuilderViewProps> = ({ user }) => {
  const [mode, setMode] = useState<'list' | 'dashboard'>('list');
  const [activeSite, setActiveSite] = useState<WbSite | null>(null);
  const [sites, setSites] = useState<WbSite[]>([]);
  const [loadingSites, setLoadingSites] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteDomain, setNewSiteDomain] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const [posts, setPosts] = useState<WbPost[]>([]);
  const [pages, setPages] = useState<WbPage[]>([]);
  const [media, setMedia] = useState<WbMedia[]>([]);
  const [subscribers, setSubscribers] = useState<WbSubscriber[]>([]);
  const [products, setProducts] = useState<WbProduct[]>([]);
  const [orders, setOrders] = useState<WbOrder[]>([]);
  const [tabLoading, setTabLoading] = useState(false);

  const [editingPost, setEditingPost] = useState<Partial<WbPost> | null>(null);
  const [editingPage, setEditingPage] = useState<Partial<WbPage> | null>(null);
  const [editingProduct, setEditingProduct] = useState<Partial<WbProduct> | null>(null);
  const [editingVariations, setEditingVariations] = useState<any[]>([]);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [imagePickerTarget, setImagePickerTarget] = useState<'featured' | 'editor' | 'product_featured'>('featured');

  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [wlConfig, setWlConfig] = useState<any>({});

  // Autosave
  const autosaveTimer = useRef<NodeJS.Timeout | null>(null);
  const [autosaveStatus, setAutosaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const loadSites = useCallback(async () => {
    setLoadingSites(true);
    const { data } = await supabase.from('wb_sites').select('*').eq('owner_id', user.id).order('created_at', { ascending: false });
    setSites(data || []);
    setLoadingSites(false);
  }, [user.id]);

  useEffect(() => { loadSites(); }, [loadSites]);

  useEffect(() => {
    const fetchVariations = async () => {
      if (editingProduct?.id && editingProduct.product_type === 'variable') {
        const { data } = await supabase.from('wb_product_variations').select('*').eq('product_id', editingProduct.id).order('created_at', { ascending: true });
        setEditingVariations(data || []);
      } else {
        setEditingVariations([]);
      }
    };
    fetchVariations();
  }, [editingProduct?.id, editingProduct?.product_type]);

  useEffect(() => {
    if (!activeSite || mode !== 'dashboard') return;
    setTabLoading(true);
    const load = async () => {
      if (activeTab === 'posts' || activeTab === 'dashboard') {
        const { data } = await supabase.from('wb_posts').select('*').eq('site_id', activeSite.id).order('created_at', { ascending: false });
        setPosts(data || []);
      }
      if (activeTab === 'pages' || activeTab === 'dashboard') {
        const { data } = await supabase.from('wb_pages').select('*').eq('site_id', activeSite.id).order('sort_order');
        setPages(data || []);
      }
      if (activeTab === 'media') {
        const { data } = await supabase.from('wb_media').select('*').eq('site_id', activeSite.id).order('created_at', { ascending: false });
        setMedia(data || []);
      }
      if (activeTab === 'users') {
        const { data } = await supabase.from('wb_site_subscribers').select('*, profiles(name, avatar_url)').eq('site_id', activeSite.id).order('subscribed_at', { ascending: false });
        setSubscribers(data || []);
      }
      if (activeTab === 'products' || activeTab === 'dashboard') {
        const { data } = await supabase.from('wb_products').select('*').eq('site_id', activeSite.id).order('created_at', { ascending: false });
        setProducts(data || []);
      }
      if (activeTab === 'orders' || activeTab === 'dashboard') {
        const { data } = await supabase.from('wb_orders').select('*').eq('site_id', activeSite.id).order('created_at', { ascending: false });
        setOrders(data || []);
      }
      setTabLoading(false);
    };
    load();
  }, [activeTab, activeSite, mode]);

  const enterDashboard = async (site: WbSite) => {
    setActiveSite(site);
    setWlConfig(site.white_label_config || {});
    setMode('dashboard');
    setActiveTab('dashboard');
    if (!site.storage_bucket) {
      await supabase.functions.invoke('provision-wb-site', {
        body: { site_id: site.id, subdomain: site.subdomain, site_name: site.name },
      });
      loadSites();
    }
  };

  const handleCreateSite = async () => {
    if (!newSiteName || !newSiteDomain) return;
    setCreating(true); setCreateError('');
    const slug = newSiteDomain.toLowerCase().replace(/[^a-z0-9-]/g, '');
    const { data, error } = await supabase
      .from('wb_sites')
      .insert({ owner_id: user.id, name: newSiteName, subdomain: slug, white_label_config: { brandName: newSiteName, sidebarBg: '#1e1e1e', sidebarColor: '#ffffff', accentColor: '#2271b1' } })
      .select().single();
    if (error) { setCreateError(error.message); setCreating(false); return; }
    setSites(prev => [data, ...prev]);
    setIsCreateModalOpen(false); setNewSiteName(''); setNewSiteDomain('');
    setCreating(false);
    await enterDashboard(data);
  };

  const updateWhiteLabel = async (key: string, value: any) => {
    if (!activeSite) return;
    const newConfig = { ...wlConfig, [key]: value };
    setWlConfig(newConfig);
    setActiveSite({ ...activeSite, white_label_config: newConfig });
    await supabase.from('wb_sites').update({ white_label_config: newConfig }).eq('id', activeSite.id);
  };

  // Autosave post
  const triggerAutosave = useCallback(async (post: Partial<WbPost>) => {
    if (!post.id || !activeSite) return;
    setAutosaveStatus('saving');
    const slug = post.slug || post.title!.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    await supabase.from('wb_posts').update({ ...post, slug }).eq('id', post.id);
    setAutosaveStatus('saved');
    setTimeout(() => setAutosaveStatus('idle'), 2000);
  }, [activeSite]);

  const scheduleAutosave = useCallback((post: Partial<WbPost>) => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => triggerAutosave(post), 3000);
  }, [triggerAutosave]);

  const updateEditingPost = (updates: Partial<WbPost>) => {
    const updated = { ...editingPost, ...updates } as Partial<WbPost>;
    setEditingPost(updated);
    if (updated.id) scheduleAutosave(updated);
  };

  const savePost = async (post: Partial<WbPost>) => {
    if (!activeSite) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    const slug = post.slug || post.title!.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const publishedAt = post.status === 'published' && !post.published_at ? new Date().toISOString() : post.published_at;
    const payload = { ...post, site_id: activeSite.id, author_id: user.id, slug, published_at: publishedAt };
    if (post.id) { await supabase.from('wb_posts').update(payload).eq('id', post.id); }
    else { await supabase.from('wb_posts').insert(payload); }
    setEditingPost(null);
    const { data } = await supabase.from('wb_posts').select('*').eq('site_id', activeSite.id).order('created_at', { ascending: false });
    setPosts(data || []);
  };

  const savePage = async (page: Partial<WbPage>) => {
    if (!activeSite) return;
    const slug = page.slug || page.title!.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const payload = { ...page, site_id: activeSite.id, author_id: user.id, slug };
    if (page.id) { await supabase.from('wb_pages').update(payload).eq('id', page.id); }
    else { await supabase.from('wb_pages').insert(payload); }
    setEditingPage(null);
    const { data } = await supabase.from('wb_pages').select('*').eq('site_id', activeSite.id).order('sort_order');
    setPages(data || []);
  };

  const saveProduct = async (product: Partial<WbProduct>) => {
    if (!activeSite) return;
    const slug = product.slug || product.title!.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const payload = { ...product, site_id: activeSite.id, slug };
    let productId = product.id;
    if (productId) {
      await supabase.from('wb_products').update(payload).eq('id', productId);
    } else {
      const { data } = await supabase.from('wb_products').insert(payload).select().single();
      if (data) productId = data.id;
    }
    
    if (productId && product.product_type === 'variable') {
      for (const v of editingVariations) {
        if (v.id && !v.id.startsWith('temp-')) {
          await supabase.from('wb_product_variations').update({ ...v, product_id: productId }).eq('id', v.id);
        } else {
          const { id, ...vPayload } = v;
          await supabase.from('wb_product_variations').insert({ ...vPayload, product_id: productId });
        }
      }
    }

    setEditingProduct(null);
    setEditingVariations([]);
    const { data } = await supabase.from('wb_products').select('*').eq('site_id', activeSite.id).order('created_at', { ascending: false });
    setProducts(data || []);
  };

  const deletePost = async (id: string) => {
    if (!window.confirm('Delete this post?')) return;
    await supabase.from('wb_posts').delete().eq('id', id);
    setPosts(prev => prev.filter(p => p.id !== id));
  };

  const deletePage = async (id: string) => {
    if (!window.confirm('Delete this page?')) return;
    await supabase.from('wb_pages').delete().eq('id', id);
    setPages(prev => prev.filter(p => p.id !== id));
  };

  const deleteProduct = async (id: string) => {
    if (!window.confirm('Delete this product?')) return;
    await supabase.from('wb_products').delete().eq('id', id);
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeSite?.storage_bucket || !e.target.files?.[0]) return;
    setUploadingMedia(true);
    const file = e.target.files[0];
    const path = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const { data, error } = await supabase.storage.from(activeSite.storage_bucket).upload(path, file, { upsert: true });
    if (!error && data) {
      const { data: urlData } = supabase.storage.from(activeSite.storage_bucket).getPublicUrl(path);
      await supabase.from('wb_media').insert({ site_id: activeSite.id, uploader_id: user.id, file_name: file.name, file_url: urlData.publicUrl, file_type: file.type, file_size: file.size });
      const { data: fresh } = await supabase.from('wb_media').select('*').eq('site_id', activeSite.id).order('created_at', { ascending: false });
      setMedia(fresh || []);
    }
    setUploadingMedia(false);
  };

  const updateSubscriberRole = async (subId: string, role: string) => {
    await supabase.from('wb_site_subscribers').update({ role }).eq('id', subId);
    setSubscribers(prev => prev.map(s => s.id === subId ? { ...s, role } : s));
  };

  const sidebarBg = wlConfig.sidebarBg || '#1e1e1e';
  const sidebarColor = wlConfig.sidebarColor || '#ffffff';
  const brandName = wlConfig.brandName || activeSite?.name || 'SiteBuilder';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Home size={20} /> },
    { id: 'posts', label: 'Posts', icon: <PenTool size={20} /> },
    { id: 'pages', label: 'Pages', icon: <FileText size={20} /> },
    { id: 'media', label: 'Media', icon: <ImageIcon size={20} /> },
    { id: 'comments', label: 'Comments', icon: <MessageSquare size={20} /> },
    { id: 'products', label: 'Products', icon: <ShoppingCart size={20} /> },
    { id: 'orders', label: 'Orders', icon: <ShoppingBag size={20} /> },
    { id: 'menus', label: 'Navigation', icon: <Menu size={20} /> },
    { id: 'users', label: 'Users', icon: <Users size={20} /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette size={20} /> },
    { id: 'plugins', label: 'Integrations', icon: <Plug size={20} /> },
    { id: 'white_label', label: 'White Label', icon: <LayoutGrid size={20} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
  ];

  // ─── LIST VIEW ─────────────────────────────────────────────────────────────
  if (mode === 'list') {
    return (
      <div className="wb-list-container">
        <header className="wb-list-header">
          <div>
            <h1>My Websites</h1>
            <p>Build and manage standalone websites on <strong>*.setx360.com</strong></p>
          </div>
          <button className="wb-btn-primary" onClick={() => setIsCreateModalOpen(true)}><Plus size={18} /> Create New Website</button>
        </header>

        {loadingSites ? (
          <div className="wb-loading"><Loader2 size={32} className="wb-spinner" /><p>Loading your sites...</p></div>
        ) : (
          <div className="wb-sites-grid">
            {sites.map(site => (
              <div key={site.id} className="wb-site-card">
                <div className="wb-site-card-header">
                  <div className="wb-site-icon"><Globe size={24} color="#2271b1" /></div>
                  <span className={`wb-pill ${site.plan}`}>{site.plan}</span>
                </div>
                <div className="wb-site-info">
                  <h3>{site.name}</h3>
                  <p><a href={`/tenant/${site.subdomain}`} target="_blank" rel="noopener noreferrer">{site.subdomain}.setx360.com <ExternalLink size={12} /></a></p>
                  {site.tagline && <p className="wb-tagline">{site.tagline}</p>}
                </div>
                <div className="wb-site-actions">
                  <button className="wb-btn-primary" onClick={() => enterDashboard(site)}>Manage Dashboard</button>
                </div>
              </div>
            ))}
            {sites.length === 0 && (
              <div className="wb-empty-list">
                <Globe size={48} color="#c3c4c7" />
                <h3>No websites yet</h3>
                <p>Create your first site hosted on a free setx360.com subdomain.</p>
                <button className="wb-btn-primary" onClick={() => setIsCreateModalOpen(true)}><Plus size={16} /> Create New Website</button>
              </div>
            )}
          </div>
        )}

        {isCreateModalOpen && (
          <div className="wb-modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
            <div className="wb-modal" onClick={e => e.stopPropagation()}>
              <div className="wb-modal-head">
                <h2>Create New Website</h2>
                <button className="wb-icon-btn" onClick={() => setIsCreateModalOpen(false)}><X size={20} /></button>
              </div>
              {createError && <div className="wb-error-box"><AlertCircle size={16} />{createError}</div>}
              <div className="wb-form-group">
                <label>Site Name</label>
                <input type="text" className="wb-input" placeholder="e.g. My Photography Portfolio" value={newSiteName} onChange={e => setNewSiteName(e.target.value)} />
              </div>
              <div className="wb-form-group">
                <label>Subdomain</label>
                <div className="wb-domain-input">
                  <input type="text" className="wb-input" placeholder="myportfolio" value={newSiteDomain} onChange={e => setNewSiteDomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} />
                  <span className="wb-domain-suffix">.setx360.com</span>
                </div>
                {newSiteDomain && <small style={{ color: '#646970' }}>Your site: <strong>{newSiteDomain}.setx360.com</strong></small>}
              </div>
              <div className="wb-modal-actions">
                <button className="wb-btn-text" onClick={() => setIsCreateModalOpen(false)}>Cancel</button>
                <button className="wb-btn-primary" onClick={handleCreateSite} disabled={!newSiteName || !newSiteDomain || creating}>
                  {creating ? <><Loader2 size={16} className="wb-spinner" /> Creating...</> : 'Create Website'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── DASHBOARD VIEW ─────────────────────────────────────────────────────────
  return (
    <div className="wb-container" style={{ '--wb-sidebar-bg': sidebarBg, '--wb-sidebar-color': sidebarColor } as React.CSSProperties}>
      <aside className={`wb-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="wb-sidebar-header">
          {isSidebarOpen && <span className="wb-brand">{brandName}</span>}
        </div>
        <nav className="wb-nav">
          {navItems.map(item => (
            <button key={item.id} className={`wb-nav-item ${activeTab === item.id ? 'active' : ''}`} onClick={() => setActiveTab(item.id)}>
              <span className="wb-nav-icon">{item.icon}</span>
              {isSidebarOpen && <span className="wb-nav-label">{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="wb-sidebar-footer">
          <button className="wb-collapse-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            <Menu size={20} />{isSidebarOpen && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      <div className="wb-main-wrapper">
        <header className="wb-topbar">
          <div className="wb-topbar-left">
            <button className="wb-topbar-btn" onClick={() => { setMode('list'); setActiveSite(null); }}><ArrowLeft size={18} /><span className="hide-mobile">Sites</span></button>
            <div className="wb-topbar-divider"></div>
            <a className="wb-topbar-btn" href={`/tenant/${activeSite?.subdomain}`} target="_blank" rel="noopener noreferrer">
              <Home size={18} /><span className="hide-mobile">{activeSite?.name}</span><ExternalLink size={12} className="wb-external-icon" />
            </a>
            <button className="wb-topbar-btn" onClick={() => { setEditingPost({ title: '', status: 'draft', content: '', categories: [], tags: [] }); setActiveTab('posts'); }}><Plus size={18} /><span className="hide-mobile">New</span></button>
          </div>
          <div className="wb-topbar-right">
            {autosaveStatus === 'saving' && <span style={{ color: '#72aee6', fontSize: 12, marginRight: 8 }}><Loader2 size={12} className="wb-spinner" style={{ display: 'inline' }} /> Saving...</span>}
            {autosaveStatus === 'saved' && <span style={{ color: '#68de7c', fontSize: 12, marginRight: 8 }}><Check size={12} style={{ display: 'inline' }} /> Saved</span>}
            <button className="wb-topbar-btn"><span className="hide-mobile">{user?.name?.split(' ')[0]}</span><Avatar url={user?.avatar_url} name={user?.name} size={28} /></button>
          </div>
        </header>

        <main className="wb-content">
          {tabLoading && <div className="wb-tab-loading"><Loader2 size={24} className="wb-spinner" /></div>}

          {/* ── DASHBOARD ── */}
          {activeTab === 'dashboard' && !tabLoading && (
            <div>
              <div className="wb-content-header"><h1>Dashboard</h1></div>
              <div className="wb-dashboard-grid">
                <div className="wb-widget">
                  <h2 className="wb-widget-title">At a Glance</h2>
                  <div className="wb-widget-content">
                    <div className="wb-glance-item"><PenTool size={16} /><span onClick={() => setActiveTab('posts')} style={{ cursor: 'pointer', color: '#2271b1' }}>{posts.length} Post{posts.length !== 1 ? 's' : ''}</span></div>
                    <div className="wb-glance-item"><FileText size={16} /><span onClick={() => setActiveTab('pages')} style={{ cursor: 'pointer', color: '#2271b1' }}>{pages.length} Page{pages.length !== 1 ? 's' : ''}</span></div>
                    <div className="wb-glance-item"><Users size={16} /><span onClick={() => setActiveTab('users')} style={{ cursor: 'pointer', color: '#2271b1' }}>{subscribers.length} Subscriber{subscribers.length !== 1 ? 's' : ''}</span></div>
                    <p className="wb-glance-footer">SETX SiteBuilder · {activeSite?.subdomain}.setx360.com</p>
                  </div>
                </div>
                <div className="wb-widget">
                  <h2 className="wb-widget-title">Quick Draft</h2>
                  <div className="wb-widget-content">
                    <input type="text" placeholder="Post title..." className="wb-input" id="quick-draft-title" />
                    <textarea placeholder="What's on your mind?" className="wb-textarea" rows={3} id="quick-draft-body"></textarea>
                    <button className="wb-btn-primary" onClick={() => {
                      const t = (document.getElementById('quick-draft-title') as HTMLInputElement)?.value;
                      const b = (document.getElementById('quick-draft-body') as HTMLTextAreaElement)?.value;
                      if (t) savePost({ title: t, content: `<p>${b}</p>`, status: 'draft', categories: [], tags: [] });
                    }}>Save Draft</button>
                  </div>
                </div>
                <div className="wb-widget full-width">
                  <h2 className="wb-widget-title">Recent Posts</h2>
                  <div className="wb-widget-content">
                    {posts.slice(0, 5).map(p => (
                      <div key={p.id} className="wb-activity-row">
                        <span className={`wb-status-dot ${p.status}`}></span>
                        <span style={{ flex: 1, fontWeight: 600, color: '#1d2327', cursor: 'pointer' }} onClick={() => setEditingPost(p)}>{p.title}</span>
                        <span className="wb-activity-time">{new Date(p.created_at).toLocaleDateString()}</span>
                        <span className={`wb-pill ${p.status}`}>{p.status}</span>
                      </div>
                    ))}
                    {posts.length === 0 && <p style={{ color: '#646970', margin: 0 }}>No posts yet. <button className="wb-link-btn" onClick={() => { setEditingPost({ title: '', status: 'draft', content: '', categories: [], tags: [] }); setActiveTab('posts'); }}>Create your first post →</button></p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── POSTS ── */}
          {activeTab === 'posts' && !tabLoading && (
            <div>
              <div className="wb-content-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h1>Posts</h1>
                <button className="wb-btn-primary" onClick={() => setEditingPost({ title: '', status: 'draft', content: '', categories: [], tags: [] })}><Plus size={16} /> Add New</button>
              </div>
              <table className="wb-table">
                <thead><tr><th>Title</th><th>Categories</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
                <tbody>
                  {posts.map(p => (
                    <tr key={p.id}>
                      <td><strong style={{ color: '#2271b1', cursor: 'pointer' }} onClick={() => setEditingPost(p)}>{p.title}</strong></td>
                      <td>{(p.categories || []).slice(0, 2).map(c => <span key={c} className="wb-pill subscriber" style={{ marginRight: 4 }}>{c}</span>)}</td>
                      <td><span className={`wb-pill ${p.status}`}>{p.status}</span></td>
                      <td style={{ color: '#646970', fontSize: 13 }}>{new Date(p.created_at).toLocaleDateString()}</td>
                      <td><div className="wb-action-btns">
                        <button className="wb-icon-btn" onClick={() => setEditingPost(p)}><Edit2 size={15} /></button>
                        <button className="wb-icon-btn danger" onClick={() => deletePost(p.id)}><Trash2 size={15} /></button>
                      </div></td>
                    </tr>
                  ))}
                  {posts.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: '#646970', padding: 32 }}>No posts yet.</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {/* ── PAGES ── */}
          {activeTab === 'pages' && !tabLoading && (
            <div>
              <div className="wb-content-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h1>Pages</h1>
                <button className="wb-btn-primary" onClick={() => setEditingPage({ title: '', status: 'draft', content: '' })}><Plus size={16} /> Add New</button>
              </div>
              <table className="wb-table">
                <thead><tr><th>Title</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
                <tbody>
                  {pages.map(pg => (
                    <tr key={pg.id}>
                      <td><strong style={{ color: '#2271b1', cursor: 'pointer' }} onClick={() => setEditingPage(pg)}>{pg.title}</strong></td>
                      <td><span className={`wb-pill ${pg.status}`}>{pg.status}</span></td>
                      <td style={{ color: '#646970', fontSize: 13 }}>{new Date(pg.created_at).toLocaleDateString()}</td>
                      <td><div className="wb-action-btns">
                        <button className="wb-icon-btn" onClick={() => setEditingPage(pg)}><Edit2 size={15} /></button>
                        <button className="wb-icon-btn danger" onClick={() => deletePage(pg.id)}><Trash2 size={15} /></button>
                      </div></td>
                    </tr>
                  ))}
                  {pages.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', color: '#646970', padding: 32 }}>No pages yet.</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {/* ── MEDIA ── */}
          {activeTab === 'media' && !tabLoading && (
            <div>
              <div className="wb-content-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h1>Media Library</h1>
                <label className="wb-btn-primary" style={{ cursor: 'pointer' }}>
                  {uploadingMedia ? <><Loader2 size={16} className="wb-spinner" /> Uploading...</> : <><Upload size={16} /> Upload File</>}
                  <input type="file" hidden accept="image/*,video/*,audio/*,application/pdf" onChange={handleMediaUpload} disabled={!activeSite?.storage_bucket} />
                </label>
              </div>
              {!activeSite?.storage_bucket && <div className="wb-info-box"><AlertCircle size={16} />Storage bucket is still provisioning. Refresh in a moment.</div>}
              <div className="wb-media-grid">
                {media.map(m => (
                  <div key={m.id} className="wb-media-item">
                    {m.file_type?.startsWith('image/') ? (
                      <img src={m.file_url} alt={m.alt_text || m.file_name} className="wb-media-thumb" />
                    ) : (
                      <div className="wb-media-file-icon"><FileSignature size={32} color="#8c8f94" /></div>
                    )}
                    <div className="wb-media-info">
                      <p className="wb-media-name">{m.file_name}</p>
                      <button className="wb-link-btn" onClick={() => navigator.clipboard.writeText(m.file_url)}>Copy URL</button>
                    </div>
                  </div>
                ))}
                {media.length === 0 && <div className="wb-empty-state"><ImageIcon size={40} color="#c3c4c7" /><p>No media uploaded yet.</p></div>}
              </div>
            </div>
          )}

          {/* ── COMMENTS ── */}
          {activeTab === 'comments' && activeSite && (
            <CommentsTab siteId={activeSite.id} />
          )}

          {/* ── NAVIGATION MENU ── */}
          {activeTab === 'menus' && activeSite && (
            <MenuBuilderTab siteId={activeSite.id} subdomain={activeSite.subdomain} />
          )}

          {/* ── PRODUCTS ── */}
          {activeTab === 'products' && !tabLoading && (
            <div>
              <div className="wb-content-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h1>Products</h1>
                <button className="wb-btn-primary" onClick={() => setEditingProduct({ title: '', status: 'draft', description: '', product_type: 'simple', manage_stock: false, stock_quantity: 0, stock_status: 'instock', categories: [], tags: [], gallery_urls: [], metadata: {} })}><Plus size={16} /> Add New Product</button>
              </div>
              <table className="wb-table">
                <thead><tr><th>Product</th><th>Type</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id}>
                      <td><strong style={{ color: '#2271b1', cursor: 'pointer' }} onClick={() => setEditingProduct(p)}>{p.title}</strong></td>
                      <td style={{ textTransform: 'capitalize' }}>{p.product_type}</td>
                      <td>{p.price ? `$${p.price.toFixed(2)}` : '—'}</td>
                      <td>{p.manage_stock ? p.stock_quantity : <span className={`wb-pill ${p.stock_status}`}>{p.stock_status}</span>}</td>
                      <td><span className={`wb-pill ${p.status}`}>{p.status}</span></td>
                      <td><div className="wb-action-btns">
                        <button className="wb-icon-btn" onClick={() => setEditingProduct(p)}><Edit2 size={15} /></button>
                        <button className="wb-icon-btn danger" onClick={() => deleteProduct(p.id)}><Trash2 size={15} /></button>
                      </div></td>
                    </tr>
                  ))}
                  {products.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: '#646970', padding: 32 }}>No products yet. Build your store!</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {/* ── ORDERS ── */}
          {activeTab === 'orders' && !tabLoading && (
            <div>
              <div className="wb-content-header"><h1>Orders</h1></div>
              <table className="wb-table">
                <thead><tr><th>Order #</th><th>Customer</th><th>Date</th><th>Status</th><th>Total</th></tr></thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id}>
                      <td><strong style={{ color: '#2271b1', cursor: 'pointer' }}>#{o.id.split('-')[0]}</strong></td>
                      <td>{o.customer_name || o.customer_email || 'Guest'}</td>
                      <td style={{ color: '#646970', fontSize: 13 }}>{new Date(o.created_at).toLocaleString()}</td>
                      <td><span className={`wb-pill ${o.status}`}>{o.status}</span></td>
                      <td style={{ fontWeight: 600 }}>${Number(o.total_amount).toFixed(2)}</td>
                    </tr>
                  ))}
                  {orders.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: '#646970', padding: 32 }}>No orders yet.</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {/* ── USERS ── */}
          {activeTab === 'users' && !tabLoading && (
            <div>
              <div className="wb-content-header"><h1>Users & Subscribers</h1></div>
              <div className="wb-info-box" style={{ marginBottom: 24 }}>
                <UserPlus size={16} />
                Visitors can subscribe using their <strong>SETX 360 credentials</strong>. Promote trusted subscribers to extended roles below.
              </div>
              <table className="wb-table">
                <thead><tr><th>User</th><th>Role</th><th>Status</th><th>Since</th><th>Actions</th></tr></thead>
                <tbody>
                  {subscribers.map(sub => (
                    <tr key={sub.id}>
                      <td><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Avatar url={sub.profiles?.avatar_url} name={sub.profiles?.name || 'User'} size={28} /><span style={{ fontWeight: 600 }}>{sub.profiles?.name || sub.user_id.slice(0, 8)}</span></div></td>
                      <td><select className="wb-select" value={sub.role} onChange={e => updateSubscriberRole(sub.id, e.target.value)}>
                        <option value="subscriber">Subscriber</option>
                        <option value="contributor">Contributor</option>
                        <option value="editor">Editor</option>
                        <option value="admin">Admin</option>
                      </select></td>
                      <td><span className={`wb-pill ${sub.status}`}>{sub.status}</span></td>
                      <td style={{ color: '#646970', fontSize: 13 }}>{new Date(sub.subscribed_at).toLocaleDateString()}</td>
                      <td><button className="wb-icon-btn danger" onClick={async () => { await supabase.from('wb_site_subscribers').update({ status: 'banned' }).eq('id', sub.id); setSubscribers(prev => prev.map(s => s.id === sub.id ? { ...s, status: 'banned' } : s)); }}><X size={15} /></button></td>
                    </tr>
                  ))}
                  {subscribers.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: '#646970', padding: 32 }}>No subscribers yet.</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {/* ── WHITE LABEL ── */}
          {activeTab === 'white_label' && (
            <div>
              <div className="wb-content-header"><h1>White Label</h1></div>
              <div className="wb-widget" style={{ maxWidth: 700 }}>
                <h2 className="wb-widget-title">Dashboard Appearance</h2>
                <div className="wb-widget-content" style={{ padding: 24 }}>
                  <div className="wb-form-group">
                    <label>Dashboard Brand Name</label>
                    <input type="text" className="wb-input" value={wlConfig.brandName || ''} onChange={e => updateWhiteLabel('brandName', e.target.value)} />
                    <small style={{ color: '#8c8f94' }}>Replaces the logo text in the sidebar.</small>
                  </div>
                  <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                    {[
                      { key: 'sidebarBg', label: 'Sidebar Background', default: '#1e1e1e' },
                      { key: 'sidebarColor', label: 'Sidebar Text', default: '#ffffff' },
                      { key: 'accentColor', label: 'Public Site Accent', default: '#2271b1' },
                    ].map(({ key, label, default: def }) => (
                      <div key={key} className="wb-form-group" style={{ flex: 1, minWidth: 180 }}>
                        <label>{label}</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <input type="color" value={wlConfig[key] || def} onChange={e => updateWhiteLabel(key, e.target.value)} style={{ width: 40, height: 40, padding: 0, border: 'none', borderRadius: 4, cursor: 'pointer' }} />
                          <input type="text" className="wb-input" value={wlConfig[key] || def} onChange={e => updateWhiteLabel(key, e.target.value)} style={{ marginBottom: 0, fontFamily: 'monospace' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="wb-success-box"><Check size={16} /> Changes applied automatically</div>
                </div>
              </div>
            </div>
          )}

          {/* ── SETTINGS ── */}
          {activeTab === 'settings' && activeSite && (
            <SettingsTab siteId={activeSite.id} subdomain={activeSite.subdomain} />
          )}

          {/* ── APPEARANCE ── */}
          {activeTab === 'appearance' && activeSite && (
            <AppearanceTab siteId={activeSite.id} wlConfig={wlConfig} onUpdateWlConfig={updateWhiteLabel} storageBucket={activeSite.storage_bucket} />
          )}

          {/* ── INTEGRATIONS fallback ── */}
          {activeTab === 'plugins' && (
            <div>
              <div className="wb-content-header"><h1>{navItems.find(i => i.id === activeTab)?.label}</h1></div>
              <div className="wb-empty-state">
                <LayoutGrid size={48} color="#c3c4c7" />
                <h2>{navItems.find(i => i.id === activeTab)?.label}</h2>
                <p>Full theme and integration management coming soon.</p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── POST EDITOR MODAL ── */}
      {editingPost && (
        <div className="wb-modal-overlay">
          <div className="wb-modal wb-modal-wide">
            <div className="wb-modal-head">
              <h2>{editingPost.id ? 'Edit Post' : 'New Post'}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {editingPost.id && autosaveStatus === 'saving' && <span style={{ fontSize: 12, color: '#8c8f94' }}><Loader2 size={11} className="wb-spinner" style={{ display: 'inline' }} /> Saving...</span>}
                {editingPost.id && autosaveStatus === 'saved' && <span style={{ fontSize: 12, color: '#0a7444' }}><Check size={11} style={{ display: 'inline' }} /> Saved</span>}
                <button className="wb-icon-btn" onClick={() => setEditingPost(null)}><X size={20} /></button>
              </div>
            </div>

            {/* Featured Image */}
            <div className="wb-form-group">
              <label>Featured Image</label>
              {editingPost.featured_image_url ? (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img src={editingPost.featured_image_url} alt="Featured" style={{ height: 100, borderRadius: 6, objectFit: 'cover', display: 'block', marginBottom: 8 }} />
                  <button className="wb-btn-text" style={{ padding: '0', fontSize: 12 }} onClick={() => updateEditingPost({ featured_image_url: '' })}>Remove</button>
                  <button className="wb-btn-text" style={{ padding: '0 0 0 12px', fontSize: 12 }} onClick={() => { setImagePickerTarget('featured'); setShowImagePicker(true); }}>Change</button>
                </div>
              ) : (
                <button className="wb-btn-secondary" style={{ padding: '6px 14px', fontSize: 13 }} onClick={() => { setImagePickerTarget('featured'); setShowImagePicker(true); }}>
                  <Star size={14} /> Set Featured Image
                </button>
              )}
            </div>

            <div className="wb-form-group">
              <label>Title</label>
              <input type="text" className="wb-input" value={editingPost.title || ''} onChange={e => updateEditingPost({ title: e.target.value })} placeholder="Post title..." />
            </div>
            <div className="wb-form-group">
              <label>Content</label>
              <RichEditor
                content={editingPost.content || ''}
                onChange={html => updateEditingPost({ content: html })}
                onInsertImage={() => { setImagePickerTarget('editor'); setShowImagePicker(true); }}
              />
            </div>

            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div className="wb-form-group" style={{ flex: 1, minWidth: 200 }}>
                <label>Excerpt</label>
                <textarea className="wb-textarea" rows={2} value={editingPost.excerpt || ''} onChange={e => updateEditingPost({ excerpt: e.target.value })} placeholder="Short description..." />
              </div>
              <div style={{ minWidth: 180, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="wb-form-group" style={{ marginBottom: 0 }}>
                  <label>Status</label>
                  <select className="wb-select" value={editingPost.status || 'draft'} onChange={e => updateEditingPost({ status: e.target.value })}>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="trash">Trash</option>
                  </select>
                </div>
                {editingPost.status === 'scheduled' && (
                  <div className="wb-form-group" style={{ marginBottom: 0 }}>
                    <label><Calendar size={13} style={{ display: 'inline', marginRight: 4 }} />Publish At</label>
                    <input
                      type="datetime-local"
                      className="wb-input"
                      value={editingPost.published_at ? editingPost.published_at.slice(0, 16) : ''}
                      onChange={e => updateEditingPost({ published_at: new Date(e.target.value).toISOString() })}
                    />
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <ChipInput label="Categories" values={editingPost.categories || []} onChange={vals => updateEditingPost({ categories: vals })} placeholder="Add category..." />
              <ChipInput label="Tags" values={editingPost.tags || []} onChange={vals => updateEditingPost({ tags: vals })} placeholder="Add tag..." />
            </div>

            <div className="wb-modal-actions">
              <button className="wb-btn-text" onClick={() => setEditingPost(null)}>Cancel</button>
              <button className="wb-btn-primary" onClick={() => savePost(editingPost)}>
                {editingPost.id ? 'Update Post' : 'Save Post'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PAGE EDITOR MODAL ── */}
      {editingPage && (
        <div className="wb-modal-overlay">
          <div className="wb-modal wb-modal-wide">
            <div className="wb-modal-head">
              <h2>{editingPage.id ? 'Edit Page' : 'New Page'}</h2>
              <button className="wb-icon-btn" onClick={() => setEditingPage(null)}><X size={20} /></button>
            </div>
            <div className="wb-form-group">
              <label>Page Title</label>
              <input type="text" className="wb-input" value={editingPage.title || ''} onChange={e => setEditingPage({ ...editingPage, title: e.target.value })} placeholder="Page title..." />
            </div>
            <div className="wb-form-group">
              <label>Content</label>
              <RichEditor content={editingPage.content || ''} onChange={html => setEditingPage({ ...editingPage, content: html })} />
            </div>
            <div className="wb-form-group">
              <label>Status</label>
              <select className="wb-select" value={editingPage.status || 'draft'} onChange={e => setEditingPage({ ...editingPage, status: e.target.value })}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
            <div className="wb-modal-actions">
              <button className="wb-btn-text" onClick={() => setEditingPage(null)}>Cancel</button>
              <button className="wb-btn-primary" onClick={() => savePage(editingPage)}>{editingPage.id ? 'Update Page' : 'Save Page'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── PRODUCT EDITOR MODAL ── */}
      {editingProduct && (
        <div className="wb-modal-overlay">
          <div className="wb-modal wb-modal-wide">
            <div className="wb-modal-head">
              <h2>{editingProduct.id ? 'Edit Product' : 'New Product'}</h2>
              <button className="wb-icon-btn" onClick={() => setEditingProduct(null)}><X size={20} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
              <div>
                <div className="wb-form-group">
                  <label>Product Title</label>
                  <input type="text" className="wb-input" value={editingProduct.title || ''} onChange={e => setEditingProduct({ ...editingProduct, title: e.target.value })} placeholder="e.g. Vintage T-Shirt" />
                </div>
                <div className="wb-form-group">
                  <label>Description</label>
                  <RichEditor content={editingProduct.description || ''} onChange={html => setEditingProduct({ ...editingProduct, description: html })} />
                </div>

                <div className="wb-widget" style={{ marginBottom: 16 }}>
                  <h2 className="wb-widget-title" style={{ display: 'flex', gap: 10, alignItems: 'center' }}><DollarSign size={16} /> Product Data</h2>
                  <div className="wb-widget-content" style={{ padding: '16px 20px' }}>
                    <div className="wb-form-group">
                      <label>Product Type</label>
                      <select className="wb-select" value={editingProduct.product_type || 'simple'} onChange={e => setEditingProduct({ ...editingProduct, product_type: e.target.value })}>
                        <option value="simple">Simple Product</option>
                        <option value="variable">Variable Product</option>
                        <option value="booking">Booking / Reservation</option>
                      </select>
                    </div>

                    {editingProduct.product_type !== 'variable' && (
                      <>
                        <div style={{ display: 'flex', gap: 16 }}>
                          <div className="wb-form-group" style={{ flex: 1 }}>
                            <label>Regular Price ($)</label>
                            <input type="number" className="wb-input" value={editingProduct.price || ''} onChange={e => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })} />
                          </div>
                          <div className="wb-form-group" style={{ flex: 1 }}>
                            <label>Sale Price ($)</label>
                            <input type="number" className="wb-input" value={editingProduct.sale_price || ''} onChange={e => setEditingProduct({ ...editingProduct, sale_price: Number(e.target.value) })} />
                          </div>
                        </div>

                        <hr style={{ border: 'none', borderTop: '1px solid #f0f0f1', margin: '16px 0' }} />
                        <h3 style={{ fontSize: 13, marginBottom: 12 }}>Inventory</h3>
                        
                        <div className="wb-form-group">
                          <label>SKU</label>
                          <input type="text" className="wb-input" value={editingProduct.sku || ''} onChange={e => setEditingProduct({ ...editingProduct, sku: e.target.value })} />
                        </div>

                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, cursor: 'pointer', fontSize: 13 }}>
                          <input type="checkbox" checked={editingProduct.manage_stock || false} onChange={e => setEditingProduct({ ...editingProduct, manage_stock: e.target.checked })} />
                          Track stock quantity
                        </label>

                        {editingProduct.manage_stock ? (
                          <div className="wb-form-group">
                            <label>Stock Quantity</label>
                            <input type="number" className="wb-input" value={editingProduct.stock_quantity || 0} onChange={e => setEditingProduct({ ...editingProduct, stock_quantity: Number(e.target.value) })} />
                          </div>
                        ) : (
                          <div className="wb-form-group">
                            <label>Stock Status</label>
                            <select className="wb-select" value={editingProduct.stock_status || 'instock'} onChange={e => setEditingProduct({ ...editingProduct, stock_status: e.target.value })}>
                              <option value="instock">In stock</option>
                              <option value="outofstock">Out of stock</option>
                              <option value="onbackorder">On backorder</option>
                            </select>
                          </div>
                        )}
                      </>
                    )}

                    {editingProduct.product_type === 'variable' && (
                      <div style={{ marginTop: 16 }}>
                        <hr style={{ border: 'none', borderTop: '1px solid #f0f0f1', margin: '16px 0' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <h3 style={{ fontSize: 13, margin: 0 }}>Variations</h3>
                          <button className="wb-btn-secondary" style={{ padding: '4px 8px', fontSize: 12 }} onClick={() => setEditingVariations([...editingVariations, { id: `temp-${Date.now()}`, attributes: { "Size": "Small" }, price: 0, stock_quantity: 0, manage_stock: true }])}>
                            <Plus size={12} /> Add Variation
                          </button>
                        </div>
                        {editingVariations.map((v, idx) => (
                          <div key={v.id} style={{ padding: 12, border: '1px solid #c3c4c7', borderRadius: 4, marginBottom: 12, background: '#f6f7f7' }}>
                            <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
                              <div style={{ flex: 1 }}>
                                <label style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>Attributes (JSON)</label>
                                <input type="text" className="wb-input" style={{ padding: '4px 8px', fontSize: 12 }} value={JSON.stringify(v.attributes)} onChange={e => {
                                  try {
                                    const parsed = JSON.parse(e.target.value);
                                    const newV = [...editingVariations];
                                    newV[idx].attributes = parsed;
                                    setEditingVariations(newV);
                                  } catch (err) {} // ignore invalid json while typing
                                }} />
                              </div>
                              <div style={{ flex: 1 }}>
                                <label style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>Price ($)</label>
                                <input type="number" className="wb-input" style={{ padding: '4px 8px', fontSize: 12 }} value={v.price || ''} onChange={e => {
                                  const newV = [...editingVariations];
                                  newV[idx].price = Number(e.target.value);
                                  setEditingVariations(newV);
                                }} />
                              </div>
                              <div style={{ flex: 1 }}>
                                <label style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>Stock Qty</label>
                                <input type="number" className="wb-input" style={{ padding: '4px 8px', fontSize: 12 }} value={v.stock_quantity || 0} onChange={e => {
                                  const newV = [...editingVariations];
                                  newV[idx].stock_quantity = Number(e.target.value);
                                  setEditingVariations(newV);
                                }} />
                              </div>
                              <div>
                                <label style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>&nbsp;</label>
                                <button className="wb-icon-btn danger" onClick={() => setEditingVariations(editingVariations.filter((_, i) => i !== idx))}><Trash2 size={14} /></button>
                              </div>
                            </div>
                          </div>
                        ))}
                        {editingVariations.length === 0 && <p style={{ fontSize: 12, color: '#646970' }}>No variations added yet.</p>}
                      </div>
                    )}
                  </div>
                </div>

              </div>

              <div>
                <div className="wb-widget" style={{ marginBottom: 16 }}>
                  <h2 className="wb-widget-title">Publish</h2>
                  <div className="wb-widget-content" style={{ padding: '16px 20px' }}>
                    <div className="wb-form-group" style={{ marginBottom: 0 }}>
                      <label>Status</label>
                      <select className="wb-select" value={editingProduct.status || 'draft'} onChange={e => setEditingProduct({ ...editingProduct, status: e.target.value })}>
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="wb-widget" style={{ marginBottom: 16 }}>
                  <h2 className="wb-widget-title">Product Image</h2>
                  <div className="wb-widget-content" style={{ padding: '16px 20px' }}>
                    {editingProduct.featured_image_url ? (
                      <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
                        <img src={editingProduct.featured_image_url} alt="Product" style={{ width: '100%', height: 160, borderRadius: 6, objectFit: 'cover', display: 'block', marginBottom: 8 }} />
                        <button className="wb-btn-text" style={{ padding: '0', fontSize: 12, color: '#d63638' }} onClick={() => setEditingProduct({ ...editingProduct, featured_image_url: '' })}>Remove product image</button>
                      </div>
                    ) : (
                      <button className="wb-btn-secondary" style={{ width: '100%' }} onClick={() => { setImagePickerTarget('product_featured'); setShowImagePicker(true); }}>
                        Set product image
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="wb-widget">
                  <h2 className="wb-widget-title">Organization</h2>
                  <div className="wb-widget-content" style={{ padding: '16px 20px' }}>
                    <ChipInput label="Categories" values={editingProduct.categories || []} onChange={vals => setEditingProduct({ ...editingProduct, categories: vals })} placeholder="e.g. Clothing" />
                    <ChipInput label="Tags" values={editingProduct.tags || []} onChange={vals => setEditingProduct({ ...editingProduct, tags: vals })} placeholder="Add tag..." />
                  </div>
                </div>
              </div>
            </div>

            <div className="wb-modal-actions" style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #f0f0f1' }}>
              <button className="wb-btn-text" onClick={() => setEditingProduct(null)}>Cancel</button>
              <button className="wb-btn-primary" onClick={() => saveProduct(editingProduct)}>{editingProduct.id ? 'Update Product' : 'Save Product'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── IMAGE PICKER ── */}
      {showImagePicker && activeSite && (
        <ImagePickerModal
          siteId={activeSite.id}
          storageBucket={activeSite.storage_bucket}
          onSelect={(url) => {
            if (imagePickerTarget === 'featured') {
              updateEditingPost({ featured_image_url: url });
            } else if (imagePickerTarget === 'product_featured') {
              setEditingProduct({ ...editingProduct, featured_image_url: url });
            }
            setShowImagePicker(false);
          }}
          onClose={() => setShowImagePicker(false)}
        />
      )}
    </div>
  );
};
