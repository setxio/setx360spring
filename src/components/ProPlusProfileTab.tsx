import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Camera, Briefcase, GraduationCap, Edit3, Plus, Trash2, FileText, Upload } from 'lucide-react';
import { Avatar } from './Avatar';

interface ProPlusProfileTabProps {
  user: any;
  onUpdateUser: (data: any) => void;
}

export const ProPlusProfileTab: React.FC<ProPlusProfileTabProps> = ({ user, onUpdateUser }) => {
  const [profile, setProfile] = useState<any>(null);
  const [experiences, setExperiences] = useState<any[]>([]);
  const [education, setEducation] = useState<any[]>([]);
  
  const [isEditingMain, setIsEditingMain] = useState(false);
  const [mainForm, setMainForm] = useState({ headline: '', about: '', industry: '' });
  
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);

  useEffect(() => {
    const fetchProData = async () => {
      // Fetch Profile
      const { data: profData, error: profError } = await supabase
        .from('pro_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (profError && profError.code !== 'PGRST116') {
        console.error('Error fetching pro profile', profError);
      } else if (profData) {
        setProfile(profData);
        setMainForm({
          headline: profData.headline || '',
          about: profData.about || '',
          industry: profData.industry || ''
        });
        // Also update the global user object if it doesn't have the pro_avatar_url
        if (user.pro_avatar_url !== profData.pro_avatar_url) {
          onUpdateUser({ pro_avatar_url: profData.pro_avatar_url });
        }
      }

      // Fetch Experience
      const { data: expData } = await supabase
        .from('pro_experiences')
        .select('*')
        .eq('profile_id', user.id)
        .order('start_date', { ascending: false });
      if (expData) setExperiences(expData);

      // Fetch Education
      const { data: eduData } = await supabase
        .from('pro_education')
        .select('*')
        .eq('profile_id', user.id)
        .order('start_date', { ascending: false });
      if (eduData) setEducation(eduData);
    };

    if (user?.id) fetchProData();
  }, [user]);

  const handleSaveMain = async () => {
    const updates = {
      id: user.id,
      headline: mainForm.headline,
      about: mainForm.about,
      industry: mainForm.industry,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('pro_profiles')
      .upsert(updates)
      .select()
      .single();

    if (!error && data) {
      setProfile(data);
      setIsEditingMain(false);
    }
  };

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    
    const fileExt = file.name.split('.').pop();
    const fileName = `pro-${user.id}-${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true });
      
    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      
      await supabase.from('pro_profiles').upsert({ id: user.id, pro_avatar_url: publicUrl });
      setProfile(prev => ({ ...prev, pro_avatar_url: publicUrl }));
      onUpdateUser({ pro_avatar_url: publicUrl });
    }
    setUploadingAvatar(false);
  };

  const handleUploadResume = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingResume(true);
    
    const fileExt = file.name.split('.').pop();
    const fileName = `resumes/${user.id}-${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('public')
      .upload(fileName, file, { upsert: true });
      
    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage.from('public').getPublicUrl(fileName);
      await supabase.from('pro_profiles').upsert({ id: user.id, resume_url: publicUrl });
      setProfile(prev => ({ ...prev, resume_url: publicUrl }));
    }
    setUploadingResume(false);
  };

  const addExperience = async () => {
    const newExp = {
      profile_id: user.id,
      company_name: 'New Company',
      title: 'Job Title',
      is_current: true
    };
    const { data, error } = await supabase.from('pro_experiences').insert(newExp).select().single();
    if (!error && data) {
      setExperiences([data, ...experiences]);
    }
  };

  const deleteExperience = async (id: string) => {
    await supabase.from('pro_experiences').delete().eq('id', id);
    setExperiences(experiences.filter(e => e.id !== id));
  };

  const addEducation = async () => {
    const newEdu = {
      profile_id: user.id,
      school_name: 'New School/University',
      degree: 'Degree'
    };
    const { data, error } = await supabase.from('pro_education').insert(newEdu).select().single();
    if (!error && data) {
      setEducation([data, ...education]);
    }
  };

  const deleteEducation = async (id: string) => {
    await supabase.from('pro_education').delete().eq('id', id);
    setEducation(education.filter(e => e.id !== id));
  };

  return (
    <div className="proplus-profile-tab">
      {/* Intro Card */}
      <div className="glass-card profile-header-card">
        <div className="profile-banner"></div>
        <div className="profile-info-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="avatar-wrapper" style={{ position: 'relative' }}>
              <Avatar url={profile?.pro_avatar_url || user?.avatar_url} name={user?.name} size={120} />
              <label htmlFor="pro-avatar-upload" className="edit-avatar-btn" style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--bg-card)', padding: 8, borderRadius: '50%', cursor: 'pointer', border: '1px solid var(--border)' }}>
                <Camera size={16} />
              </label>
              <input type="file" id="pro-avatar-upload" style={{ display: 'none' }} accept="image/*" onChange={handleUploadAvatar} disabled={uploadingAvatar} />
            </div>
            <button className="edit-profile-action" onClick={() => setIsEditingMain(!isEditingMain)}>
              <Edit3 size={18} />
            </button>
          </div>

          {isEditingMain ? (
            <div className="edit-main-form" style={{ marginTop: 16 }}>
              <input 
                className="pro-input full-width" 
                placeholder="Headline (e.g. Senior Software Engineer at Tech Corp)" 
                value={mainForm.headline} 
                onChange={e => setMainForm({...mainForm, headline: e.target.value})}
                style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 8 }}
              />
              <input 
                className="pro-input full-width" 
                placeholder="Industry (e.g. Technology)" 
                value={mainForm.industry} 
                onChange={e => setMainForm({...mainForm, industry: e.target.value})}
                style={{ marginBottom: 8 }}
              />
              <textarea 
                className="pro-input full-width" 
                placeholder="About you..." 
                value={mainForm.about} 
                onChange={e => setMainForm({...mainForm, about: e.target.value})}
                rows={4}
                style={{ marginBottom: 12 }}
              />
              <button className="save-btn" onClick={handleSaveMain}>Save Changes</button>
            </div>
          ) : (
            <div className="profile-details" style={{ marginTop: 16 }}>
              <h2>{user?.name}</h2>
              <p className="headline">{profile?.headline || 'Add a professional headline'}</p>
              <p className="location" style={{ opacity: 0.8, fontSize: '0.9rem', marginBottom: 16 }}>
                {user?.community || user?.city || 'SETX Region'} {profile?.industry ? `• ${profile.industry}` : ''}
              </p>
              
              <div className="about-section" style={{ background: 'var(--bg-soft)', padding: 16, borderRadius: 12 }}>
                <h3 style={{ margin: '0 0 8px', fontSize: '1.1rem' }}>About</h3>
                <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                  {profile?.about || 'Add a summary about your professional background and goals.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Resume Section */}
      <div className="glass-card section-card">
        <h3 className="section-title"><FileText size={20} /> Documents</h3>
        <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
          {profile?.resume_url ? (
            <div className="document-item" style={{ flex: 1, padding: 16, border: '1px solid var(--border)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <FileText color="#0284c7" size={24} />
                <div>
                  <h4 style={{ margin: 0 }}>Resume.pdf</h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Uploaded document</span>
                </div>
              </div>
              <a href={profile.resume_url} target="_blank" rel="noreferrer" className="btn-outline">View</a>
            </div>
          ) : (
            <div className="document-item upload-placeholder" style={{ flex: 1, padding: '24px 16px', border: '1px dashed var(--border)', borderRadius: 12, textAlign: 'center' }}>
              <input type="file" id="resume-upload" style={{ display: 'none' }} accept=".pdf,.doc,.docx" onChange={handleUploadResume} disabled={uploadingResume} />
              <label htmlFor="resume-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <Upload size={24} color="var(--text-muted)" />
                <span style={{ fontWeight: 600 }}>{uploadingResume ? 'Uploading...' : 'Upload Resume'}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>PDF, DOCX</span>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Experience Section */}
      <div className="glass-card section-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 className="section-title" style={{ margin: 0 }}><Briefcase size={20} /> Experience</h3>
          <button className="add-btn" onClick={addExperience}><Plus size={20} /></button>
        </div>
        
        {experiences.length === 0 ? (
          <p className="empty-text">No experience added yet.</p>
        ) : (
          <div className="timeline-list">
            {experiences.map(exp => (
              <div key={exp.id} className="timeline-item" style={{ display: 'flex', gap: 16, marginBottom: 24, position: 'relative' }}>
                <div className="timeline-icon" style={{ width: 48, height: 48, background: 'var(--bg-soft)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Briefcase size={24} color="var(--text-muted)" />
                </div>
                <div className="timeline-content" style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <h4 style={{ margin: '0 0 4px', fontSize: '1.1rem' }}>{exp.title}</h4>
                    <button onClick={() => deleteExperience(exp.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><Trash2 size={16} /></button>
                  </div>
                  <p style={{ margin: '0 0 4px', fontWeight: 600 }}>{exp.company_name}</p>
                  <p style={{ margin: '0 0 8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    {exp.start_date || 'Start'} - {exp.is_current ? 'Present' : (exp.end_date || 'End')}
                  </p>
                  {exp.description && <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.5 }}>{exp.description}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Education Section */}
      <div className="glass-card section-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 className="section-title" style={{ margin: 0 }}><GraduationCap size={20} /> Education</h3>
          <button className="add-btn" onClick={addEducation}><Plus size={20} /></button>
        </div>
        
        {education.length === 0 ? (
          <p className="empty-text">No education added yet.</p>
        ) : (
          <div className="timeline-list">
            {education.map(edu => (
              <div key={edu.id} className="timeline-item" style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                <div className="timeline-icon" style={{ width: 48, height: 48, background: 'var(--bg-soft)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <GraduationCap size={24} color="var(--text-muted)" />
                </div>
                <div className="timeline-content" style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <h4 style={{ margin: '0 0 4px', fontSize: '1.1rem' }}>{edu.school_name}</h4>
                    <button onClick={() => deleteEducation(edu.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><Trash2 size={16} /></button>
                  </div>
                  <p style={{ margin: '0 0 4px' }}>{edu.degree} {edu.field_of_study && `, ${edu.field_of_study}`}</p>
                  <p style={{ margin: '0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    {edu.start_date || 'Start Year'} - {edu.end_date || 'End Year'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
