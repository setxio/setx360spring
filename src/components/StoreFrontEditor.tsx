import React, { useState, useRef } from 'react';
import { 
  Palette, 
  Image as ImageIcon, 
  Clock, 
  Umbrella, 
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Upload,
  Link as LinkIcon
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface StoreFrontEditorProps {
  store: any;
  onUpdate: () => void;
}

export const StoreFrontEditor: React.FC<StoreFrontEditorProps> = ({ store, onUpdate }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [syncLogoToProfile, setSyncLogoToProfile] = useState(false);

  const defaultHours = {
    monday: { open: '09:00', close: '17:00', closed: false },
    tuesday: { open: '09:00', close: '17:00', closed: false },
    wednesday: { open: '09:00', close: '17:00', closed: false },
    thursday: { open: '09:00', close: '17:00', closed: false },
    friday: { open: '09:00', close: '17:00', closed: false },
    saturday: { open: '10:00', close: '16:00', closed: false },
    sunday: { open: '00:00', close: '00:00', closed: true },
  };

  const [formData, setFormData] = useState({
    image_url: store.image_url || '',
    banner_url: store.banner_url || '',
    bio: store.bio || '',
    return_policy: store.return_policy || '',
    is_vacation_mode: store.is_vacation_mode || false,
    category: store.category || 'Retail',
    subcategory: store.subcategory || '',
    business_hours: (store.business_hours && Object.keys(store.business_hours).length > 0) ? store.business_hours : defaultHours,
    custom_theme: store.custom_theme || {
      primary_color: '#2563eb',
      header_color: '#ffffff',
      link_color: '#2563eb',
      hover_color: '#1d4ed8',
      bg_color: '#f8fafc',
      bg_image_url: '',
      bg_style: 'cover'
    }
  });

  const fileInputRefs = {
    logo: useRef<HTMLInputElement>(null),
    banner: useRef<HTMLInputElement>(null),
    background: useRef<HTMLInputElement>(null),
  };

  const handleSave = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('stores')
        .update({
          image_url: formData.image_url,
          banner_url: formData.banner_url,
          bio: formData.bio,
          return_policy: formData.return_policy,
          is_vacation_mode: formData.is_vacation_mode,
          business_hours: formData.business_hours,
          custom_theme: formData.custom_theme,
          category: formData.category,
          subcategory: formData.subcategory
        })
        .eq('id', store.id);

      if (error) throw error;

      // Optionally sync logo to owner's social profile avatar
      if (syncLogoToProfile && formData.image_url) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('profiles')
            .update({ avatar_url: formData.image_url })
            .eq('id', user.id);
        }
      }

      setMessage({ type: 'success', text: syncLogoToProfile ? 'Storefront saved & profile photo updated!' : 'Storefront updated successfully!' });
      onUpdate();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (type: 'logo' | 'banner' | 'background', file: File) => {
    setIsUploading(type);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${store.id}-${type}-${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('stores')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('stores')
        .getPublicUrl(fileName);

      if (type === 'logo') setFormData({ ...formData, image_url: publicUrl });
      else if (type === 'banner') setFormData({ ...formData, banner_url: publicUrl });
      else if (type === 'background') setFormData({ ...formData, custom_theme: { ...formData.custom_theme, bg_image_url: publicUrl } });

    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    } finally {
      setIsUploading(null);
    }
  };

  const categories = ['Retail', 'Services', 'Dining', 'Arts & Crafts', 'Other'];
  const retailSubcategories = [
    'Boutiques', 'Home Decor', 'Electronics', 'Groceries', 
    'Health & Beauty', 'Beauty', 'Clothing & Apparel', 'Jewelry & Accessories', 
    'Sporting Goods', 'Toys & Hobbies', 'Gifts & Souvenirs', 'Other Retail'
  ];

  const updateTheme = (key: string, value: string) => {
    setFormData({
      ...formData,
      custom_theme: { ...formData.custom_theme, [key]: value }
    });
  };

  const updateHours = (day: string, field: string, value: any) => {
    setFormData({
      ...formData,
      business_hours: {
        ...formData.business_hours,
        [day]: { ...formData.business_hours[day], [field]: value }
      }
    });
  };

  return (
    <div className="storefront-editor">
      <div className="editor-grid">
        {/* Left Column: Branding & Content */}
        <div className="editor-main">
          <section className="editor-section branding-section">
            <div className="section-header">
              <ImageIcon size={20} />
              <h4>Branding & Media</h4>
            </div>

            {/* Logo Upload */}
            <div className="media-input-group">
              <label>Store Logo</label>
              <div className="media-upload-wrapper">
                <div className="preview-box logo-preview">
                  {formData.image_url ? (
                    <img src={formData.image_url} alt="Logo" />
                  ) : (
                    <div className="placeholder-icon"><ImageIcon size={32} /></div>
                  )}
                  {isUploading === 'logo' && <div className="upload-overlay"><RefreshCw className="animate-spin" /></div>}
                </div>
                <div className="upload-controls">
                  <div className="btn-row">
                    <button className="upload-btn" onClick={() => fileInputRefs.logo.current?.click()}>
                      <Upload size={14} /> Upload Logo
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRefs.logo} 
                      onChange={e => e.target.files?.[0] && handleFileUpload('logo', e.target.files[0])}
                      style={{ display: 'none' }}
                      accept="image/*"
                    />
                  </div>
                  <div className="url-input-mini">
                    <LinkIcon size={14} />
                    <input 
                      type="text" 
                      placeholder="Or paste URL..." 
                      value={formData.image_url}
                      onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                    />
                  </div>
                  {/* Sync to social profile option */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    <input 
                      type="checkbox" 
                      checked={syncLogoToProfile}
                      onChange={e => setSyncLogoToProfile(e.target.checked)}
                      style={{ width: 14, height: 14, accentColor: 'var(--primary)', cursor: 'pointer' }}
                    />
                    Also use as my social profile photo
                  </label>
                </div>
              </div>
            </div>

            {/* Banner Upload */}
            <div className="media-input-group">
              <label>Store Banner</label>
              <div className="media-upload-wrapper banner-wrapper">
                <div className="preview-box banner-preview">
                  {formData.banner_url ? (
                    <img src={formData.banner_url} alt="Banner" />
                  ) : (
                    <div className="placeholder-icon"><ImageIcon size={48} /></div>
                  )}
                  {isUploading === 'banner' && <div className="upload-overlay"><RefreshCw className="animate-spin" /></div>}
                </div>
                <div className="upload-controls">
                  <div className="btn-row">
                    <button className="upload-btn" onClick={() => fileInputRefs.banner.current?.click()}>
                      <Upload size={14} /> Upload Banner
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRefs.banner} 
                      onChange={e => e.target.files?.[0] && handleFileUpload('banner', e.target.files[0])}
                      style={{ display: 'none' }}
                      accept="image/*"
                    />
                  </div>
                  <div className="url-input-mini">
                    <LinkIcon size={14} />
                    <input 
                      type="text" 
                      placeholder="Or paste URL..." 
                      value={formData.banner_url}
                      onChange={e => setFormData({ ...formData, banner_url: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="input-group">
              <label>Store Bio</label>
              <textarea 
                placeholder="Tell your story..."
                rows={4}
                value={formData.bio}
                onChange={e => setFormData({ ...formData, bio: e.target.value })}
              />
            </div>
            <div className="input-group">
              <label>Return Policy</label>
              <textarea 
                placeholder="Shipping and return details..."
                rows={3}
                value={formData.return_policy}
                onChange={e => setFormData({ ...formData, return_policy: e.target.value })}
              />
            </div>

            <div className="input-group">
              <label>Business Category</label>
              <select 
                value={formData.category} 
                onChange={e => setFormData({ ...formData, category: e.target.value, subcategory: e.target.value === 'Retail' ? formData.subcategory : '' })}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border)' }}
              >
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            {formData.category === 'Retail' && (
              <div className="input-group">
                <label>Retail Store Type</label>
                <select 
                  value={formData.subcategory} 
                  onChange={e => setFormData({ ...formData, subcategory: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border)' }}
                >
                  <option value="">Select Retail Type...</option>
                  {retailSubcategories.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                </select>
              </div>
            )}
          </section>

          <section className="editor-section">
            <div className="section-header">
              <Clock size={20} />
              <h4>Business Hours</h4>
            </div>
            <div className="hours-grid">
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                const dayData = formData.business_hours[day] || { open: '09:00', close: '17:00', closed: true };
                return (
                  <div key={day} className="day-row">
                    <span className="day-name">{day.charAt(0).toUpperCase() + day.slice(1)}</span>
                    <div className="day-controls">
                      {!dayData.closed ? (
                        <>
                          <input 
                            type="time" 
                            value={dayData.open || '09:00'}
                            onChange={e => updateHours(day, 'open', e.target.value)}
                          />
                          <span>to</span>
                          <input 
                            type="time" 
                            value={dayData.close || '17:00'}
                            onChange={e => updateHours(day, 'close', e.target.value)}
                          />
                        </>
                      ) : (
                        <span className="closed-label">Closed</span>
                      )}
                      <button 
                        className={`toggle-closed ${dayData.closed ? 'active' : ''}`}
                        onClick={() => updateHours(day, 'closed', !dayData.closed)}
                      >
                        {dayData.closed ? 'Open' : 'Close'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Right Column: Theming & Status */}
        <div className="editor-sidebar">
          <section className="editor-section">
            <div className="section-header">
              <Palette size={20} />
              <h4>Custom Theming</h4>
            </div>
            <div className="theme-controls">
              <div className="color-input">
                <label>Primary Color</label>
                <div className="color-picker-wrapper">
                  <input type="color" value={formData.custom_theme.primary_color} onChange={e => updateTheme('primary_color', e.target.value)} />
                  <code>{formData.custom_theme.primary_color}</code>
                </div>
              </div>
              <div className="color-input">
                <label>Header Text Color</label>
                <div className="color-picker-wrapper">
                  <input type="color" value={formData.custom_theme.header_color} onChange={e => updateTheme('header_color', e.target.value)} />
                  <code>{formData.custom_theme.header_color}</code>
                </div>
              </div>
              <div className="color-input">
                <label>Link Color</label>
                <div className="color-picker-wrapper">
                  <input type="color" value={formData.custom_theme.link_color} onChange={e => updateTheme('link_color', e.target.value)} />
                  <code>{formData.custom_theme.link_color}</code>
                </div>
              </div>
              <div className="color-input">
                <label>Background Color</label>
                <div className="color-picker-wrapper">
                  <input type="color" value={formData.custom_theme.bg_color} onChange={e => updateTheme('bg_color', e.target.value)} />
                  <code>{formData.custom_theme.bg_color}</code>
                </div>
              </div>
              
              {/* Background Image Upload */}
              <div className="input-group">
                <label>Background Image</label>
                <div className="bg-upload-compact">
                  <div className="bg-preview-mini">
                    {formData.custom_theme.bg_image_url ? (
                      <img src={formData.custom_theme.bg_image_url} alt="BG" />
                    ) : (
                      <div className="placeholder-dot" />
                    )}
                    {isUploading === 'background' && <div className="upload-overlay-mini"><RefreshCw className="animate-spin" size={12} /></div>}
                  </div>
                  <button className="upload-btn-icon" onClick={() => fileInputRefs.background.current?.click()}>
                    <Upload size={14} />
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRefs.background} 
                    onChange={e => e.target.files?.[0] && handleFileUpload('background', e.target.files[0])}
                    style={{ display: 'none' }}
                    accept="image/*"
                  />
                  <input 
                    type="text" 
                    placeholder="URL..." 
                    value={formData.custom_theme.bg_image_url}
                    onChange={e => updateTheme('bg_image_url', e.target.value)}
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Background Style</label>
                <select value={formData.custom_theme.bg_style} onChange={e => updateTheme('bg_style', e.target.value)}>
                  <option value="cover">Full Cover</option>
                  <option value="repeat">Tiled/Pattern</option>
                  <option value="center">Centered</option>
                </select>
              </div>
            </div>
          </section>

          <section className="editor-section status-section">
            <div className="section-header">
              <Umbrella size={20} />
              <h4>Store Status</h4>
            </div>
            <div className="vacation-toggle">
              <div className="toggle-info">
                <h5>Vacation Mode</h5>
                <p>Temporarily hide products and pause orders.</p>
              </div>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={formData.is_vacation_mode} 
                  onChange={e => setFormData({ ...formData, is_vacation_mode: e.target.checked })} 
                />
                <span className="slider"></span>
              </label>
            </div>
          </section>

          {message && (
            <div className={`status-banner ${message.type}`}>
              {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{message.text}</span>
            </div>
          )}

          <button 
            className="primary-btn save-btn" 
            onClick={handleSave} 
            disabled={isLoading}
          >
            {isLoading ? <RefreshCw className="animate-spin" /> : <><Save size={18} /> Save Storefront</>}
          </button>
        </div>
      </div>

      <style>{`
        .storefront-editor {
          padding: 24px;
        }
        .editor-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 24px;
        }
        .editor-section {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 24px;
        }
        .section-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
          color: var(--primary);
        }
        .section-header h4 {
          margin: 0;
          font-weight: 800;
          color: var(--text);
        }

        /* Media Upload Styles */
        .media-input-group {
          margin-bottom: 24px;
        }
        .media-input-group label {
          display: block;
          font-size: 0.9rem;
          font-weight: 700;
          margin-bottom: 12px;
          color: var(--text);
        }
        .media-upload-wrapper {
          display: flex;
          gap: 20px;
          align-items: flex-start;
          background: rgba(255,255,255,0.01);
          padding: 16px;
          border-radius: 12px;
          border: 1px dashed var(--border);
        }
        .preview-box {
          position: relative;
          background: rgba(255,255,255,0.05);
          border-radius: 12px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .logo-preview { width: 100px; height: 100px; }
        .banner-preview { width: 240px; height: 80px; }
        .preview-box img { width: 100%; height: 100%; object-fit: cover; }
        .placeholder-icon { opacity: 0.2; }
        .upload-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .upload-controls {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .upload-btn {
          background: var(--primary);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .url-input-mini {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.05);
          padding: 6px 12px;
          border-radius: 8px;
          border: 1px solid var(--border);
        }
        .url-input-mini input {
          background: none;
          border: none;
          color: #fff;
          font-size: 0.75rem;
          width: 100%;
        }

        /* Compact BG Upload */
        .bg-upload-compact {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.05);
          padding: 4px;
          border-radius: 10px;
          border: 1px solid var(--border);
        }
        .bg-preview-mini {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          background: #333;
          overflow: hidden;
          position: relative;
        }
        .bg-preview-mini img { width: 100%; height: 100%; object-fit: cover; }
        .bg-upload-compact input[type="text"] {
          flex: 1;
          background: none;
          border: none;
          color: #fff;
          font-size: 0.75rem;
          padding: 4px;
        }
        .upload-btn-icon {
          background: none;
          border: none;
          color: var(--primary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .hours-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .day-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: rgba(255,255,255,0.02);
          border-radius: 8px;
        }
        .day-name {
          font-size: 0.85rem;
          font-weight: 700;
          width: 80px;
        }
        .day-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .day-controls input[type="time"] {
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--border);
          border-radius: 4px;
          padding: 4px 8px;
          color: #fff;
          font-size: 0.8rem;
        }
        .toggle-closed {
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 700;
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.2);
          cursor: pointer;
        }
        .toggle-closed.active {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
          border-color: rgba(16, 185, 129, 0.2);
        }
        .color-input {
          margin-bottom: 16px;
        }
        .color-input label {
          display: block;
          font-size: 0.8rem;
          margin-bottom: 8px;
          color: var(--text-muted);
        }
        .color-picker-wrapper {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255,255,255,0.05);
          padding: 8px;
          border-radius: 8px;
        }
        .color-picker-wrapper input[type="color"] {
          border: none;
          width: 32px;
          height: 32px;
          background: none;
          cursor: pointer;
        }
        .color-picker-wrapper code {
          font-size: 0.8rem;
          opacity: 0.7;
        }
        .vacation-toggle {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .toggle-info h5 {
          margin: 0 0 2px 0;
          font-size: 0.9rem;
        }
        .toggle-info p {
          margin: 0;
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .save-btn {
          width: 100%;
          margin-top: 12px;
          padding: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
      `}</style>
    </div>
  );
};
