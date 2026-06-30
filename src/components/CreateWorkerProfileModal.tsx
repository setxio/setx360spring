import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import './CreateGigModal.css';

interface CreateWorkerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onSuccess: () => void;
}

const CATEGORIES = [
  { id: 'driving', label: 'Delivery' },
  { id: 'tech', label: 'Tech Support' },
  { id: 'cleaning', label: 'House Cleaning' },
  { id: 'handyman', label: 'Handyman' },
  { id: 'yard', label: 'Yard Work' },
  { id: 'freelance', label: 'Digital Freelance' },
  { id: 'admin', label: 'Administrative' },
  { id: 'tutoring', label: 'Tutoring' },
  { id: 'moving', label: 'Moving & Packing' },
  { id: 'petcare', label: 'Pet Care' },
  { id: 'events', label: 'Event Staffing' },
  { id: 'creative', label: 'Creative' },
  { id: 'security', label: 'Security' },
  { id: 'data', label: 'Data Entry' },
];

export const CreateWorkerProfileModal: React.FC<CreateWorkerProfileModalProps> = ({ isOpen, onClose, user, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isExisting, setIsExisting] = useState(false);
  const [existingData, setExistingData] = useState<any>(null);
  const { success, error } = useToast();

  const [formData, setFormData] = useState({
    primary_category: '',
    additional_categories: [] as string[],
    cash_app_handle: '',
    zelle_handle: '',
  });

  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');

  useEffect(() => {
    if (user && isOpen) {
      supabase.from('gig_worker_profiles').select('*').eq('id', user.id).single().then(({ data, error }) => {
        if (data) {
          setIsExisting(true);
          setExistingData(data);
          
          const dbSkills = data.skills || [];
          const catLabels = CATEGORIES.map(c => c.label);
          
          // Split dbSkills into additional_categories and custom skills
          const loadedAdditionalCats = dbSkills.filter((s: string) => catLabels.includes(s) && s !== data.primary_category);
          const loadedSkills = dbSkills.filter((s: string) => !catLabels.includes(s));

          setFormData({
            primary_category: data.primary_category || '',
            additional_categories: loadedAdditionalCats,
            cash_app_handle: data.cash_app_handle || '',
            zelle_handle: data.zelle_handle || '',
          });
          setSkills(loadedSkills);
        }
        setIsFetching(false);
      });
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!user) {
      error('You must be logged in to become a worker.');
      return;
    }
    
    if (!formData.primary_category) {
      error('Please select a primary category.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Merge additional_categories and skills into a single array for DB storage
      const mergedSkills = [...formData.additional_categories, ...skills];

      const { error: upsertError } = await supabase
        .from('gig_worker_profiles')
        .upsert([{
          id: user.id,
          primary_category: formData.primary_category,
          skills: mergedSkills,
          cash_app_handle: formData.cash_app_handle || null,
          zelle_handle: formData.zelle_handle || null,
          is_verified: isExisting ? existingData.is_verified : false,
          background_check_status: isExisting ? existingData.background_check_status : 'Pending',
          success_rate: isExisting ? existingData.success_rate : 100.0,
          total_gigs_completed: isExisting ? existingData.total_gigs_completed : 0
        }], { onConflict: 'id' });

      if (upsertError) throw upsertError;
      
      success(isExisting ? 'Profile updated successfully!' : 'Worker profile created successfully!');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Worker profile creation error:', err);
      error(err.message || 'Failed to update worker profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content gig-modal" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <button className="modal-close" onClick={onClose}>
          <X size={24} />
        </button>
        <div className="modal-header">
          <h2>{isExisting ? 'Update Freelancer Profile' : 'Become a Worker'}</h2>
          <p>{isExisting ? 'Manage your skills and payout information.' : 'Join the gig economy and start earning.'}</p>
        </div>

        {isFetching ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <Loader2 size={32} className="spin" style={{ color: 'var(--primary-color)' }} />
          </div>
        ) : (
          <div className="modal-body">
            <div className="form-group">
              <label>Primary Skill Category</label>
              <select 
                value={formData.primary_category}
                onChange={(e) => setFormData({...formData, primary_category: e.target.value})}
              >
                <option value="">Select your main expertise...</option>
                {CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.label}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Additional Categories</label>
              <div className="categories-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
                {CATEGORIES.filter(c => c.label !== formData.primary_category).map(cat => (
                  <label key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={formData.additional_categories.includes(cat.label)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({...formData, additional_categories: [...formData.additional_categories, cat.label]});
                        } else {
                          setFormData({...formData, additional_categories: formData.additional_categories.filter(c => c !== cat.label)});
                        }
                      }}
                    />
                    {cat.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Specific Skills</label>
              <div className="skills-input-container" style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <input 
                  type="text" 
                  placeholder="e.g. React, Driving, Landscaping..."
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      if (skillInput.trim() && !skills.includes(skillInput.trim())) {
                        setSkills([...skills, skillInput.trim()]);
                        setSkillInput('');
                      }
                    }
                  }}
                />
                <button type="button" className="secondary-btn" onClick={() => {
                  if (skillInput.trim() && !skills.includes(skillInput.trim())) {
                    setSkills([...skills, skillInput.trim()]);
                    setSkillInput('');
                  }
                }}>Add</button>
              </div>
              <div className="skills-pills" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {skills.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No skills added. Press enter to add a skill.</span>}
                {skills.map(skill => (
                  <span key={skill} className="skill-pill glass" style={{ padding: '6px 12px', borderRadius: '16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {skill}
                    <X size={14} style={{ cursor: 'pointer' }} onClick={() => setSkills(skills.filter(s => s !== skill))} />
                  </span>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Cash App Handle (Optional)</label>
              <input 
                type="text" 
                placeholder="$yourcashtag"
                value={formData.cash_app_handle}
                onChange={(e) => setFormData({...formData, cash_app_handle: e.target.value})}
              />
              <small>Used by requesters to send you payments directly.</small>
            </div>

            <div className="form-group">
              <label>Zelle Handle (Optional)</label>
              <input 
                type="text" 
                placeholder="Email or Phone Number"
                value={formData.zelle_handle}
                onChange={(e) => setFormData({...formData, zelle_handle: e.target.value})}
              />
            </div>

            {!isExisting && (
              <div className="gig-summary-card">
                <h3>Verification</h3>
                <p>Your profile will show as unverified until you pass a background check. You can still apply for jobs, but verified workers often get priority.</p>
              </div>
            )}
          </div>
        )}

        <div className="modal-footer">
          <button className="primary-btn gigs-btn full-width" onClick={handleSubmit} disabled={isSubmitting || isFetching}>
            {isSubmitting ? <><Loader2 size={18} className="spin" /> Saving...</> : (isExisting ? 'Save Profile' : 'Complete Profile')}
          </button>
        </div>
      </div>
    </div>
  );
};
