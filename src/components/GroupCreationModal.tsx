import React, { useState } from 'react';
import { X, Camera, Image as ImageIcon, Save, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './GroupCreationModal.css';

interface GroupCreationModalProps {
  onClose: () => void;
  user: any;
}

export const GroupCreationModal: React.FC<GroupCreationModalProps> = ({ onClose, user }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'General',
    rules: '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [bannerPreview, setBannerPreview] = useState<string>('');

  const categories = ['Faith', 'Recipes', 'Events', 'Hobbies', 'General', 'Community', 'Business', 'Sports'];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'avatar') {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    } else {
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let finalAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=random`;
      let finalBannerUrl = '';

      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop();
        const fileName = `${user.id}-avatar-${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from('group_assets').upload(fileName, avatarFile);
        if (!error) finalAvatarUrl = supabase.storage.from('group_assets').getPublicUrl(fileName).data.publicUrl;
      }

      if (bannerFile) {
        const ext = bannerFile.name.split('.').pop();
        const fileName = `${user.id}-banner-${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from('group_assets').upload(fileName, bannerFile);
        if (!error) finalBannerUrl = supabase.storage.from('group_assets').getPublicUrl(fileName).data.publicUrl;
      }

      // 1. Create the group
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({
          name: formData.name,
          description: formData.description,
          category: formData.category,
          rules: formData.rules,
          creator_id: user.id,
          avatar_url: finalAvatarUrl,
          banner_url: finalBannerUrl,
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // 2. Add creator as admin member
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          profile_id: user.id,
          role: 'admin'
        });

      if (memberError) throw memberError;

      onClose();
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Failed to create group. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content group-modal glass">
        <div className="modal-header">
          <h2>Create New Group</h2>
          <button onClick={onClose} className="close-btn"><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="group-form">
          <div className="form-section">
            <div className="image-placeholders" style={{ position: 'relative', marginBottom: '24px' }}>
              <input type="file" id="group-banner-upload" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileChange(e, 'banner')} disabled={loading} />
              <label htmlFor="group-banner-upload" className="placeholder-banner" style={{ backgroundImage: bannerPreview ? `url(${bannerPreview})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', cursor: 'pointer' }}>
                {!bannerPreview && <><ImageIcon size={32} /><span>Upload Group Banner</span></>}
              </label>

              <input type="file" id="group-avatar-upload" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileChange(e, 'avatar')} disabled={loading} />
              <label htmlFor="group-avatar-upload" className="placeholder-avatar" style={{ backgroundImage: avatarPreview ? `url(${avatarPreview})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', cursor: 'pointer', zIndex: 10 }}>
                {!avatarPreview && <Camera size={20} />}
              </label>
            </div>

            <div className="input-group">
              <label>Group Name</label>
              <input 
                type="text" 
                required 
                placeholder="e.g., Southeast Texas Gardeners"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>

            <div className="input-group">
              <label>Category</label>
              <select 
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              >
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            <div className="input-group">
              <label>Description</label>
              <textarea 
                rows={3} 
                placeholder="What is this group about?"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              ></textarea>
            </div>
          </div>

          <div className="form-section rules-section">
            <h3><Shield size={18} /> Group Rules</h3>
            <p className="section-hint">Set the tone for your community</p>
            <textarea 
              rows={4} 
              placeholder="1. Be respectful...&#10;2. No spam..."
              value={formData.rules}
              onChange={(e) => setFormData({...formData, rules: e.target.value})}
            ></textarea>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="cancel-btn">Cancel</button>
            <button type="submit" className="create-btn" disabled={loading}>
              {loading ? 'Creating...' : <><Save size={18} /> Create Group</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
