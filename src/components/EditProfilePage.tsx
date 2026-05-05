import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  User, 
  MapPin, 
  Camera, 
  Image as ImageIcon,
  Save,
  Calendar,
  Trash2,
  Loader2,
  Phone,
  Globe,
  Briefcase,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import './EditProfilePage.css';

type CityOption = { city_name: string; county_name: string };

import { isProfessional as checkProfessional, isVendor as checkVendor, isOfficial as checkOfficial } from '../utils/roles';

interface EditProfilePageProps {
  user: any;
  onUpdate: (data: any) => void;
}

export const EditProfilePage: React.FC<EditProfilePageProps> = ({ user, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name || '',
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    bio: '',
    location: user.location || '',
    website: '',
    birthMonth: '',
    birthDay: '',
    birthYear: '',
    zip: '',
    community: user.community || '',
    county: user.county || '',
    // Professional/Vendor Fields
    phone: '',
    business_category: '',
    store_type: '',
    return_policy: '',
    company: '',
    credentials: '',
    // Official Fields
    department: '',
    position: '',
    jurisdiction: '',
    official_email: '',
    // Personal Fields
    occupation: '',
    gender: '',
    handle: ''
  });

  const isProfessional = checkProfessional(user.role);
  const isVendor = checkVendor(user.role);
  const isOfficial = checkOfficial(user.role);

  const [cityOptions, setCityOptions] = useState<CityOption[]>([]);
  const [isZipLoading, setIsZipLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (data) {
        setProfile(data);
        setFormData({
          name: data.name || user.name || '',
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          bio: data.bio || '',
          location: data.location || user.location || '',
          website: data.website || '',
          birthMonth: data.birth_month?.toString() || '',
          birthDay: data.birth_day?.toString() || '',
          birthYear: data.birth_year?.toString() || '',
          zip: data.zip || '',
          community: data.community || user.community || '',
          county: data.county || user.county || '',
          phone: data.phone || '',
          business_category: data.business_category || '',
          store_type: data.store_type || '',
          return_policy: data.return_policy || '',
          company: data.company || '',
          credentials: data.credentials || '',
          department: data.department || '',
          position: data.position || '',
          jurisdiction: data.jurisdiction || '',
          official_email: data.official_email || '',
          occupation: data.occupation || '',
          gender: data.gender || '',
          handle: data.handle || ''
        });
      }
    };
    fetchProfile();
  }, [user.id]);

  const handleZipLookup = async (zip: string) => {
    setFormData(prev => ({ ...prev, zip, community: '', county: '' }));
    setCityOptions([]);

    if (zip.length === 5) {
      setIsZipLoading(true);
      const { data } = await supabase
        .from('zip_to_city_location_mapping')
        .select('city_name, county_name')
        .eq('zip_code', zip)
        .order('is_primary', { ascending: false });
      setIsZipLoading(false);

      if (!data || data.length === 0) return; // out-of-Texas zip — no auto-fill

      // Deduplicate by city name
      const seen = new Set<string>();
      const unique = data.filter((row: CityOption) => {
        if (seen.has(row.city_name)) return false;
        seen.add(row.city_name);
        return true;
      });

      if (unique.length === 1) {
        setFormData(prev => ({ ...prev, community: unique[0].city_name, county: unique[0].county_name }));
      } else {
        setCityOptions(unique);
      }
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage('');
    
    // Safety check for nulls
    const bMonth = formData.birthMonth ? parseInt(formData.birthMonth) : null;
    const bDay = formData.birthDay ? parseInt(formData.birthDay) : null;
    const bYear = formData.birthYear ? parseInt(formData.birthYear) : null;

    const { error } = await supabase
      .from('profiles')
      .update({
        name: isProfessional ? formData.company : `${formData.first_name} ${formData.last_name}`.trim(),
        first_name: formData.first_name,
        last_name: formData.last_name,
        bio: formData.bio,
        location: formData.community || formData.location,
        community: formData.community,
        county: formData.county,
        zip: formData.zip || null,
        birth_month: bMonth,
        birth_day: bDay,
        birth_year: bYear,
        phone: formData.phone,
        business_category: formData.business_category,
        store_type: formData.store_type,
        return_policy: formData.return_policy,
        company: formData.company,
        credentials: formData.credentials,
        department: formData.department,
        position: formData.position,
        jurisdiction: formData.jurisdiction,
        official_email: formData.official_email,
        occupation: formData.occupation,
        gender: formData.gender,
        handle: formData.handle || null,
        website: formData.website,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (!error) {
      setMessage('Profile updated successfully!');
      onUpdate({ 
        ...user, 
        name: isProfessional ? formData.company : `${formData.first_name} ${formData.last_name}`.trim(),
        first_name: formData.first_name,
        last_name: formData.last_name,
        location: formData.community || formData.location,
        community: formData.community,
        county: formData.county,
        phone: formData.phone,
        business_category: formData.business_category,
        company: formData.company,
        handle: formData.handle
      });
    } else {
      console.error('Update Profile Error:', error);
      setMessage(`Error: ${error.message}`);
    }
    setLoading(false);
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>, bucket: 'avatars' | 'banners') => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (bucket === 'avatars') setUploadingAvatar(true);
    else setUploadingBanner(true);

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    
    // Upload to bucket
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      console.error(uploadError);
      alert('Error uploading image');
      if (bucket === 'avatars') setUploadingAvatar(false);
      else setUploadingBanner(false);
      return;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    // Update profile
    const updateColumn = bucket === 'avatars' ? 'avatar_url' : 'banner_url';
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ [updateColumn]: publicUrl })
      .eq('id', user.id);

    if (!updateError) {
      setMessage(`${bucket === 'avatars' ? 'Profile picture' : 'Banner'} updated successfully!`);
      // Update globally so the trashcan appears immediately
      onUpdate({ ...user, [updateColumn]: publicUrl });
    } else {
      setMessage(`Error updating ${bucket}: ${updateError.message}`);
    }
    
    if (bucket === 'avatars') setUploadingAvatar(false);
    else setUploadingBanner(false);
  };

  const handleRemoveMedia = async (bucket: 'avatars' | 'banners') => {
    const updateColumn = bucket === 'avatars' ? 'avatar_url' : 'banner_url';
    const currentUrl: string | null = bucket === 'avatars' ? (user.avatar_url || null) : (user.banner_url || null);
    const label = bucket === 'avatars' ? 'profile picture' : 'banner';

    if (!currentUrl) {
      setMessage(`No ${label} to remove.`);
      return;
    }

    if (!window.confirm(`Are you sure you want to remove your ${label}?`)) return;

    // 1. Delete the file from storage
    const urlParts = currentUrl.split(`/${bucket}/`);
    if (urlParts.length > 1) {
      const fileName = urlParts[1].split('?')[0]; // strip any query params
      await supabase.storage.from(bucket).remove([fileName]);
    }

    // 2. Null out the DB column
    const { error } = await supabase
      .from('profiles')
      .update({ [updateColumn]: null })
      .eq('id', user.id);

    if (!error) {
      setMessage(`${bucket === 'avatars' ? 'Profile picture' : 'Banner'} removed successfully!`);
      onUpdate({ ...user, [updateColumn]: null });
    } else {
      setMessage(`Error removing ${label}: ${error.message}`);
    }
  };

  return (
    <div className="edit-profile-page">
      <div className="edit-profile-header">
        <h1>Edit Profile</h1>
        <p>{isProfessional ? 'Update your business identity and professional presence' : 'Update your personal information and public identity'}</p>
      </div>

      <div className="edit-profile-sections">
        {/* Profile Section */}
        <section className="edit-profile-card">
          <h2 className="section-title">
            {isProfessional ? <Briefcase size={20} /> : <User size={20} />} 
            {isProfessional ? 'Professional Identity' : 'Personal Information'}
          </h2>
          
          <div className="edit-profile-grid">
            {/* Unique Handle - Shared */}
            <div className="input-group full-width">
              <label>User Handle (Unique ID)</label>
              <div className="input-with-icon">
                <ShieldCheck size={18} />
                <input 
                  type="text" 
                  value={formData.handle} 
                  onChange={(e) => setFormData({...formData, handle: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')})}
                  placeholder="e.g. roasters_co"
                />
              </div>
              <p style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: 4 }}>This is your unique @identifier on the platform.</p>
            </div>

            {isOfficial ? (
              <>
                {/* Official Information */}
                <div className="input-group full-width">
                  <label>Department / Agency</label>
                  <div className="input-with-icon">
                    <ShieldCheck size={18} />
                    <input 
                      type="text" 
                      value={formData.department} 
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                      placeholder="e.g. City Council, Fire Dept"
                    />
                  </div>
                </div>

                <div className="input-row full-width">
                  <div className="input-group">
                    <label>Official Position</label>
                    <div className="input-with-icon">
                      <Briefcase size={18} />
                      <input 
                        type="text" 
                        value={formData.position} 
                        onChange={(e) => setFormData({...formData, position: e.target.value})}
                        placeholder="e.g. Council Member"
                      />
                    </div>
                  </div>
                  <div className="input-group">
                    <label>Jurisdiction</label>
                    <div className="input-with-icon">
                      <MapPin size={18} />
                      <input 
                        type="text" 
                        value={formData.jurisdiction} 
                        onChange={(e) => setFormData({...formData, jurisdiction: e.target.value})}
                        placeholder="e.g. District 4"
                      />
                    </div>
                  </div>
                </div>

                <div className="input-group full-width">
                  <label>Official Contact Email</label>
                  <div className="input-with-icon">
                    <Globe size={18} />
                    <input 
                      type="email" 
                      value={formData.official_email} 
                      onChange={(e) => setFormData({...formData, official_email: e.target.value})}
                      placeholder="official@city.gov"
                    />
                  </div>
                </div>
              </>
            ) : isProfessional ? (
              <>
                {/* Professional/Vendor Details */}
                <div className="input-group full-width">
                  <label>{isVendor ? 'Business / Store Name' : 'Company / Organization Name'}</label>
                  <div className="input-with-icon">
                    <Briefcase size={18} />
                    <input 
                      type="text" 
                      value={formData.company} 
                      onChange={(e) => setFormData({...formData, company: e.target.value})}
                      placeholder={isVendor ? "e.g. Downtown Coffee" : "e.g. Acme Corp"}
                    />
                  </div>
                </div>

                {!isVendor && (
                  <div className="input-group full-width">
                    <label>Professional Credentials</label>
                    <textarea 
                      value={formData.credentials} 
                      onChange={(e) => setFormData({...formData, credentials: e.target.value})}
                      placeholder="e.g. Licensed Electrician, Board Certified..."
                      rows={2}
                    />
                  </div>
                )}

                <div className="input-row full-width">
                  <div className="input-group">
                    <label>Category</label>
                    <div className="input-with-icon">
                      <ShoppingBag size={18} />
                      <select 
                        value={formData.business_category}
                        onChange={(e) => setFormData({ ...formData, business_category: e.target.value })}
                      >
                        <option value="">Select Category</option>
                        <option value="Food & Drink">Food & Drink</option>
                        <option value="Services">Services</option>
                        <option value="Retail">Retail</option>
                        <option value="Health">Health</option>
                        <option value="Artisan">Artisan</option>
                        <option value="Non-Profit">Non-Profit</option>
                        <option value="Education">Education</option>
                        <option value="Government">Government</option>
                      </select>
                    </div>
                  </div>
                  <div className="input-group">
                    <label>Primary Presence</label>
                    <div className="input-with-icon">
                      <Globe size={18} />
                      <select 
                        value={formData.store_type}
                        onChange={(e) => setFormData({ ...formData, store_type: e.target.value })}
                      >
                        <option value="">Select Presence</option>
                        <option value="Physical">Physical Location</option>
                        <option value="Online">Online Only</option>
                        <option value="Hybrid">Both</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="input-row full-width">
                  <div className="input-group">
                    <label>Contact Phone</label>
                    <div className="input-with-icon">
                      <Phone size={18} />
                      <input 
                        type="tel" 
                        value={formData.phone} 
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        placeholder="(409) 555-0100"
                      />
                    </div>
                  </div>
                  <div className="input-group">
                    <label>Website</label>
                    <div className="input-with-icon">
                      <ExternalLink size={18} />
                      <input 
                        type="url" 
                        value={formData.website} 
                        onChange={(e) => setFormData({...formData, website: e.target.value})}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </div>

                {isVendor && (
                  <div className="input-group full-width">
                    <label>Return / Service Policy</label>
                    <textarea 
                      value={formData.return_policy} 
                      onChange={(e) => setFormData({...formData, return_policy: e.target.value})}
                      placeholder="e.g. 30-day money back guarantee..."
                      rows={2}
                    />
                  </div>
                )}

                {/* Independent Store Link for Vendors */}
                {isVendor && (
                  <div className="premium-card" style={{ 
                    gridColumn: '1 / -1', 
                    background: 'var(--bg-soft)', 
                    border: '1px dashed var(--primary)',
                    padding: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '10px'
                  }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--primary)' }}>Independent Store Management</h4>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', opacity: 0.8 }}>Manage your commercial marketplace stores separately from your professional profile.</p>
                    </div>
                    <button 
                      onClick={() => window.location.href = '/vendor/dashboard'}
                      className="save-btn" 
                      style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                    >
                      Manage Stores <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Personal Information */}
                <div className="input-row full-width">
                  <div className="input-group">
                    <label>First Name</label>
                    <div className="input-with-icon">
                      <User size={18} />
                      <input 
                        type="text" 
                        value={formData.first_name} 
                        onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                        placeholder="First"
                      />
                    </div>
                  </div>
                  <div className="input-group">
                    <label>Last Name</label>
                    <div className="input-with-icon">
                      <User size={18} />
                      <input 
                        type="text" 
                        value={formData.last_name} 
                        onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                        placeholder="Last"
                      />
                    </div>
                  </div>
                </div>

                <div className="input-group full-width">
                  <label>Occupation</label>
                  <div className="input-with-icon">
                    <Briefcase size={18} />
                    <input 
                      type="text" 
                      value={formData.occupation} 
                      onChange={(e) => setFormData({...formData, occupation: e.target.value})}
                      placeholder="e.g. Software Engineer"
                    />
                  </div>
                </div>

                <div className="input-row full-width">
                  <div className="input-group">
                    <label>Gender</label>
                    <div className="input-with-icon">
                      <User size={18} />
                      <select 
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Non-Binary">Non-Binary</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    </div>
                  </div>
                  <div className="input-group">
                    <label>Date of Birth</label>
                    <div className="input-with-icon">
                      <Calendar size={18} />
                      <div className="dob-select-group">
                        <select 
                          className="month-select"
                          value={formData.birthMonth}
                          onChange={e => setFormData({ ...formData, birthMonth: e.target.value })}
                        >
                          <option value="">Month</option>
                          {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('en', { month: 'short' })}</option>
                          ))}
                        </select>
                        <select 
                          className="day-select"
                          value={formData.birthDay}
                          onChange={e => setFormData({ ...formData, birthDay: e.target.value })}
                        >
                          <option value="">Day</option>
                          {Array.from({ length: 31 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>{i + 1}</option>
                          ))}
                        </select>
                        <select 
                          className="year-select"
                          value={formData.birthYear}
                          onChange={e => setFormData({ ...formData, birthYear: e.target.value })}
                        >
                          <option value="">Year</option>
                          {Array.from({ length: 100 }, (_, i) => {
                            const year = new Date().getFullYear() - i;
                            return <option key={year} value={year}>{year}</option>;
                          })}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Shared Fields: Location & Bio */}
            <div className="input-group full-width">
              <label>Your Zip Code</label>
              <div className="input-with-icon">
                <MapPin size={18} />
                <input 
                  type="text"
                  maxLength={5}
                  value={formData.zip} 
                  onChange={(e) => handleZipLookup(e.target.value)}
                  placeholder="Enter your zip code"
                />
                {isZipLoading && <Loader2 size={16} className="animate-spin" style={{ marginLeft: 8, opacity: 0.5 }} />}
              </div>
              {cityOptions.length > 1 && (
                <div style={{ marginTop: 10 }}>
                  <p style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: 8 }}>
                    Multiple cities share this zip — which do you associate with?
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {cityOptions.map(opt => (
                      <button
                        key={opt.city_name}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, community: opt.city_name, county: opt.county_name }))}
                        className={`cluster-btn ${formData.community === opt.city_name ? 'active' : ''}`}
                        style={{
                          padding: '6px 14px',
                          borderRadius: 8,
                          border: '2px solid',
                          borderColor: formData.community === opt.city_name ? 'var(--primary)' : 'var(--border)',
                          background: formData.community === opt.city_name ? 'var(--primary)' : 'transparent',
                          color: formData.community === opt.city_name ? '#fff' : 'var(--text)',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '0.85rem'
                        }}
                      >
                        {opt.city_name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {formData.community && (
                <p style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: 8 }}>
                  📍 <strong>{formData.community}</strong>, {formData.county} County
                </p>
              )}
            </div>

            <div className="input-group full-width">
              <label>{isProfessional ? 'About the Business' : 'About You'}</label>
              <textarea 
                value={formData.bio} 
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                placeholder={isProfessional ? 'Describe your services, history, and mission...' : 'Tell us about yourself...'}
                rows={3}
              />
            </div>
          </div>

          <div className="edit-profile-footer">
            {message && <span className="status-msg">{message}</span>}
            <button 
              className="save-btn" 
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? 'Saving...' : <><Save size={18} /> Save Changes</>}
            </button>
          </div>
        </section>

        {/* Verification Section */}
        <section className="edit-profile-card">
          <h2 className="section-title"><ShieldCheck size={20} /> Verification & Credibility</h2>
          <div className="verification-status-panel">
            {profile?.is_verified ? (
              <div className="status-verified glass">
                <ShieldCheck size={32} className="verified-tick" />
                <div>
                  <h3>Official Verification Active</h3>
                  <p>Your identity as a {profile.role.replace(/_/g, ' ')} has been verified. The green tick is visible on your profile and posts.</p>
                </div>
              </div>
            ) : profile?.verification_requested ? (
              <div className="status-pending glass">
                <Loader2 size={32} className="animate-spin" />
                <div>
                  <h3>Verification Pending</h3>
                  <p>Your request is being reviewed by the community administrators. You will be notified once the process is complete.</p>
                </div>
              </div>
            ) : (
              <div className="status-request glass">
                <div>
                  <h3>Get the Green Tick</h3>
                  <p>Establish credibility and trust. Verification is available for Vendors, Professionals, and Public Officials.</p>
                  <button 
                    className="request-verify-btn"
                    onClick={async () => {
                      if (!window.confirm("Submit verification request? Admins will review your profile details.")) return;
                      const { error } = await supabase.from('profiles').update({ verification_requested: true }).eq('id', user.id);
                      if (!error) {
                        setProfile({ ...profile, verification_requested: true });
                        setMessage("Verification request submitted!");
                      }
                    }}
                  >
                    Request Verification
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Media Section */}
        <section className="edit-profile-card">
          <h2 className="section-title"><ImageIcon size={20} /> Branding</h2>
          <div className="media-settings">
            <div className="media-item">
              <div className="media-info">
                <h3>Profile Picture</h3>
                <p>Upload a high-quality square image</p>
              </div>
              <input 
                type="file" 
                id="edit-avatar-upload" 
                accept="image/*" 
                style={{ display: 'none' }} 
                onChange={(e) => handleUpload(e, 'avatars')}
                disabled={uploadingAvatar}
              />
              <div className="media-actions">
                <label htmlFor="edit-avatar-upload" className="upload-btn" style={{ cursor: uploadingAvatar ? 'default' : 'pointer' }}>
                  <Camera size={18} /> {uploadingAvatar ? 'Uploading...' : 'Change'}
                </label>
                <button 
                  className="remove-media-btn" 
                  onClick={() => handleRemoveMedia('avatars')} 
                  title="Remove profile picture"
                  style={{ opacity: user.avatar_url ? 1 : 0.3, cursor: user.avatar_url ? 'pointer' : 'default' }}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            <div className="media-item">
              <div className="media-info">
                <h3>Banner Image</h3>
                <p>Landscape image for your profile header</p>
              </div>
              <input 
                type="file" 
                id="edit-banner-upload" 
                accept="image/*" 
                style={{ display: 'none' }} 
                onChange={(e) => handleUpload(e, 'banners')}
                disabled={uploadingBanner}
              />
              <div className="media-actions">
                <label htmlFor="edit-banner-upload" className="upload-btn" style={{ cursor: uploadingBanner ? 'default' : 'pointer' }}>
                  <ImageIcon size={18} /> {uploadingBanner ? 'Uploading...' : 'Change'}
                </label>
                <button 
                  className="remove-media-btn" 
                  onClick={() => handleRemoveMedia('banners')} 
                  title="Remove banner image"
                  style={{ opacity: user.banner_url ? 1 : 0.3, cursor: user.banner_url ? 'pointer' : 'default' }}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
