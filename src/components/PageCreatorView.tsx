import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, Store, Music, HeartHandshake, Landmark, Briefcase, Camera, Save, Loader2, Sparkles, Building, Play, Plus, Image as ImageIcon } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { PageType } from '../types/user';
import { PAGE_TYPES } from '../utils/roles';

export const PageCreatorView: React.FC = () => {
  const { user, setEnv, refreshUser, theme, setActiveContext } = useApp();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedType, setSelectedType] = useState<PageType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [about, setAbout] = useState('');
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [contactPhone, setContactPhone] = useState('');
  const [website, setWebsite] = useState('');

  // Social & Dynamic State
  const [socialFacebook, setSocialFacebook] = useState('');
  const [socialInstagram, setSocialInstagram] = useState('');
  const [socialX, setSocialX] = useState('');
  const [socialYoutube, setSocialYoutube] = useState('');
  const [socialTiktok, setSocialTiktok] = useState('');
  const [typeMetadata, setTypeMetadata] = useState<Record<string, any>>({});

  const pageTypeConfigs: Record<PageType, { label: string; icon: React.ReactNode; color: string; description: string }> = {
    business: { label: 'Business', icon: <Store size={24} />, color: '#3b82f6', description: 'Local shops, restaurants, and professional services.' },
    artist: { label: 'Artist / Creator', icon: <Music size={24} />, color: '#d946ef', description: 'Musicians, visual artists, and content creators.' },
    non_profit: { label: 'Non-Profit', icon: <HeartHandshake size={24} />, color: '#10b981', description: 'Charities and 501(c)(3) organizations.' },
    venue: { label: 'Venue', icon: <Building size={24} />, color: '#f59e0b', description: 'Event spaces, theaters, and concert halls.' },
    official: { label: 'Government / Civic', icon: <Landmark size={24} />, color: '#64748b', description: 'City officials, municipalities, and public services.' },
    chamber: { label: 'Chamber of Commerce', icon: <Briefcase size={24} />, color: '#0ea5e9', description: 'Business networks and economic development.' },
    media: { label: 'Media & News', icon: <Camera size={24} />, color: '#ef4444', description: 'Local news, podcasts, and publications.' },
    church: { label: 'Church / Faith', icon: <Sparkles size={24} />, color: '#8b5cf6', description: 'Congregations and religious organizations.' }
  };

  const handleCreatePage = async () => {
    if (!user || !selectedType || !name.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      // 1. Create the page
      const { data: pageData, error: pageError } = await supabase
        .from('pages')
        .insert({
          owner_id: user.id,
          page_type: selectedType,
          name: name.trim(),
          about: about.trim() || null,
          contact_email: contactEmail.trim() || null,
          contact_phone: contactPhone.trim() || null,
          website: website.trim() || null,
          social_facebook: socialFacebook.trim() || null,
          social_instagram: socialInstagram.trim() || null,
          social_x: socialX.trim() || null,
          social_youtube: socialYoutube.trim() || null,
          social_tiktok: socialTiktok.trim() || null,
          type_metadata: typeMetadata
        })
        .select()
        .single();

      if (pageError) throw pageError;

      // 2. Add owner as an admin in page_members
      const { error: memberError } = await supabase
        .from('page_members')
        .insert({
          page_id: pageData.id,
          user_id: user.id,
          access_level: 'admin'
        });

      if (memberError) throw memberError;

      // 3. Refresh user context (which fetches their pages)
      await refreshUser();

      // 4. Auto-select the newly created page
      setActiveContext(pageData as any);

      // 5. Redirect to page manager to see the new dashboard immediately
      setEnv('page_manager');
    } catch (err: any) {
      setError(err.message || 'Failed to create page. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <button 
          onClick={() => step === 2 ? setStep(1) : setEnv('home')}
          style={{ background: 'var(--glass-bg)', border: '1px solid var(--border)', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text)' }}
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, color: 'var(--text)' }}>Create a New Page</h1>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)' }}>
            {step === 1 ? 'Choose the type of page you want to create.' : 'Fill in the details for your new page.'}
          </p>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
          {error}
        </div>
      )}

      {step === 1 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          {PAGE_TYPES.map((type) => {
            const config = pageTypeConfigs[type];
            const isSelected = selectedType === type;
            return (
              <motion.div
                key={type}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedType(type)}
                style={{
                  background: isSelected ? `var(--primary-light, rgba(112,0,244,0.1))` : 'var(--glass-bg)',
                  border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                  borderRadius: '16px',
                  padding: '24px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  position: 'relative'
                }}
              >
                <div style={{ color: config.color, background: `${config.color}20`, width: 48, height: 48, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {config.icon}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)' }}>{config.label}</h3>
                  <p style={{ margin: '8px 0 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{config.description}</p>
                </div>
                {isSelected && (
                  <div style={{ position: 'absolute', top: 16, right: 16, color: 'var(--primary)' }}>
                    <CheckCircle size={24} />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--border)', borderRadius: '24px', padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ color: pageTypeConfigs[selectedType!].color, background: `${pageTypeConfigs[selectedType!].color}20`, width: 64, height: 64, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {pageTypeConfigs[selectedType!].icon}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)' }}>{pageTypeConfigs[selectedType!].label}</h2>
              <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)' }}>You can always change these details later.</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--text)' }}>Page Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Acme Corp, The Velvet Room, John Doe Art"
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '1rem', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--text)' }}>About / Bio</label>
              <textarea
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                placeholder="Tell people what your page is about..."
                rows={4}
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '1rem', outline: 'none', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--text)' }}>Public Email</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="contact@example.com"
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '1rem', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--text)' }}>Public Phone</label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '1rem', outline: 'none' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--text)' }}>Website</label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://www.example.com"
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '1rem', outline: 'none' }}
              />
            </div>

            {/* Dynamic Type-Specific Fields */}
            {selectedType === 'artist' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--text)' }}>Genre</label>
                  <input
                    type="text"
                    value={typeMetadata.genre || ''}
                    onChange={(e) => setTypeMetadata({ ...typeMetadata, genre: e.target.value })}
                    placeholder="e.g. Rock, Hip Hop, Jazz"
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '1rem', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--text)' }}>Label / Affiliation</label>
                  <input
                    type="text"
                    value={typeMetadata.label || ''}
                    onChange={(e) => setTypeMetadata({ ...typeMetadata, label: e.target.value })}
                    placeholder="Independent, Universal, etc."
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '1rem', outline: 'none' }}
                  />
                </div>
              </div>
            )}

            {selectedType === 'business' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--text)' }}>Industry Category</label>
                  <input
                    type="text"
                    value={typeMetadata.industry || ''}
                    onChange={(e) => setTypeMetadata({ ...typeMetadata, industry: e.target.value })}
                    placeholder="e.g. Retail, Restaurant, Service"
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '1rem', outline: 'none' }}
                  />
                </div>
              </div>
            )}

            {selectedType === 'venue' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--text)' }}>Max Capacity</label>
                  <input
                    type="number"
                    value={typeMetadata.capacity || ''}
                    onChange={(e) => setTypeMetadata({ ...typeMetadata, capacity: e.target.value })}
                    placeholder="e.g. 500"
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '1rem', outline: 'none' }}
                  />
                </div>
              </div>
            )}

            {selectedType === 'non_profit' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--text)' }}>Mission Focus</label>
                  <input
                    type="text"
                    value={typeMetadata.mission_focus || ''}
                    onChange={(e) => setTypeMetadata({ ...typeMetadata, mission_focus: e.target.value })}
                    placeholder="e.g. Education, Environment, Health"
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '1rem', outline: 'none' }}
                  />
                </div>
              </div>
            )}

            {selectedType === 'church' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--text)' }}>Denomination</label>
                  <input
                    type="text"
                    value={typeMetadata.denomination || ''}
                    onChange={(e) => setTypeMetadata({ ...typeMetadata, denomination: e.target.value })}
                    placeholder="e.g. Non-Denominational, Baptist, Catholic"
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '1rem', outline: 'none' }}
                  />
                </div>
              </div>
            )}

            <div style={{ height: '1px', background: 'var(--border)', margin: '16px 0' }} />

            {/* Social Media Section */}
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)' }}>Social Media Profiles</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--text)' }}>Facebook URL</label>
                <input
                  type="url"
                  value={socialFacebook}
                  onChange={(e) => setSocialFacebook(e.target.value)}
                  placeholder="https://facebook.com/..."
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '1rem', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--text)' }}>Instagram URL</label>
                <input
                  type="url"
                  value={socialInstagram}
                  onChange={(e) => setSocialInstagram(e.target.value)}
                  placeholder="https://instagram.com/..."
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '1rem', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--text)' }}>X (Twitter) URL</label>
                <input
                  type="url"
                  value={socialX}
                  onChange={(e) => setSocialX(e.target.value)}
                  placeholder="https://x.com/..."
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '1rem', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--text)' }}>YouTube URL</label>
                <input
                  type="url"
                  value={socialYoutube}
                  onChange={(e) => setSocialYoutube(e.target.value)}
                  placeholder="https://youtube.com/..."
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '1rem', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--text)' }}>TikTok URL</label>
                <input
                  type="url"
                  value={socialTiktok}
                  onChange={(e) => setSocialTiktok(e.target.value)}
                  placeholder="https://tiktok.com/@..."
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '1rem', outline: 'none' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
        {step === 1 ? (
          <button
            onClick={() => setStep(2)}
            disabled={!selectedType}
            style={{
              padding: '12px 32px',
              borderRadius: '24px',
              border: 'none',
              background: selectedType ? 'var(--primary)' : 'var(--border)',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: selectedType ? 'pointer' : 'not-allowed',
              transition: 'background 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            Continue <ArrowLeft size={18} style={{ transform: 'rotate(180deg)' }} />
          </button>
        ) : (
          <button
            onClick={handleCreatePage}
            disabled={isLoading || !name.trim()}
            style={{
              padding: '12px 32px',
              borderRadius: '24px',
              border: 'none',
              background: name.trim() ? 'var(--primary)' : 'var(--border)',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: name.trim() && !isLoading ? 'pointer' : 'not-allowed',
              transition: 'background 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {isLoading ? <Loader2 size={18} className="spin" /> : <Save size={18} />}
            Create Page
          </button>
        )}
      </div>
    </div>
  );
};
