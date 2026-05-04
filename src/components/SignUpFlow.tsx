import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

import { 
  User, 
  Briefcase, 
  MapPin, 
  Palette, 
  Globe, 
  Building2, 
  Crown,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
  Check,
  Loader2,
  Music,
  Tv,
  HeartHandshake,
  Church,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { LegalNotice } from './LegalNotice';
import './SignUpFlow.css';

type CityOption = { city_name: string; county_name: string; state: string; state_abbr: string };

type AccountType = {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
};

const accountTypes: AccountType[] = [
  { id: 'resident', label: 'Resident', icon: <User />, description: 'Local resident of your community' },
  { id: 'business', label: 'Business', icon: <Briefcase />, description: 'Local business owner' },
  { id: 'chamber', label: 'Chamber of Commerce', icon: <Building2 />, description: 'Member of local Chamber' },
  { id: 'official', label: 'City Official', icon: <Crown />, description: 'Local government representative' },
  { id: 'artist', label: 'Artist', icon: <Palette />, description: 'Creative and local talent' },
  { id: 'venue', label: 'Venue', icon: <Music />, description: 'Local spot, event space, or venue' },
  { id: 'media', label: 'Media', icon: <Tv />, description: 'Official news and reporting' },
  { id: 'non_profit', label: 'Non Profit', icon: <HeartHandshake />, description: 'Community service & outreach' },
  { id: 'church', label: 'Church', icon: <Church />, description: 'Faith and ministry' },
  { id: 'guest', label: 'Guest', icon: <Globe />, description: 'Visiting or new to the area' },
];

export const SignUpFlow: React.FC = () => {
  const { theme } = useApp();
  const [step, setStep] = useState(1);
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    zip: '',
    community: '',
    county: '',
    state: '',
    state_abbr: '',
    birthMonth: '',
    birthDay: '',
    birthYear: '',
    // Role-Specific Fields
    company: '',
    business_category: '',
    contactName: '',
    official_title: '',
    official_department: '',
    official_type: 'city' as 'city' | 'chamber',
    creator_type: '',
    artist_name: '',
    artist_genre: ''
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showLegal, setShowLegal] = useState(false);
  const [isVisitor, setIsVisitor] = useState(false);
  const [cityOptions, setCityOptions] = useState<CityOption[]>([]);
  const [isZipLoading, setIsZipLoading] = useState(false);
  const [error, setError] = useState('');

  const calculateAge = (m: string, d: string, y: string) => {
    if (!m || !d || !y) return 0;
    const today = new Date();
    const birthDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (window.location.hash === '#reset-password') {
      setIsResettingPassword(true);
      setStep(1); // Ensure we are on step 1 to show the overlay logic
    }
  }, []);

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setIsLoading(true);
    setError('');
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setIsLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setIsResettingPassword(false);
      window.location.hash = '';
      alert('Password updated successfully! You can now log in.');
      setIsLoginMode(true);
    }
  };

  const handleNext = () => {
    if (step === 2) {
      const age = calculateAge(formData.birthMonth, formData.birthDay, formData.birthYear);
      if (age < 16) {
        setError(`You must be at least 16 years old to join SETX 360.`);
        return;
      }
    }
    setStep(prev => prev + 1);
  };
  const handleBack = () => setStep(prev => prev - 1);

  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleForgotPassword = async () => {
    if (!formData.email) {
      setError('Please enter your email address first.');
      return;
    }
    setIsLoading(true);
    setError('');
    const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
      redirectTo: `${window.location.origin}/#reset-password`,
    });
    setIsLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setResetSent(true);
    }
  };

  const handleLogin = async () => {
    setIsLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password
    });
    
    if (error) {
      setError(error.message);
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    setIsLoading(true);
    setError('');
    
    // Check for Jefferson/Orange Admin designated email
    const baseRole = (formData.email === 'setxplatform@gmail.com') ? 'admin' : formData.type;

    const { error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          name: ['business', 'official', 'chamber', 'media', 'artist', 'venue', 'non_profit', 'church'].includes(baseRole) 
            ? formData.company || `${formData.firstName} ${formData.lastName}`.trim()
            : `${formData.firstName} ${formData.lastName}`.trim(),
          first_name: formData.firstName,
          last_name: formData.lastName,
          role: baseRole,
          zip: formData.zip,
          community: formData.community,
          county: formData.county || (isVisitor ? 'Visitor' : ''),
          state: formData.state,
          state_abbr: formData.state_abbr,
          country: 'USA',
          location: formData.community || formData.county || 'Visitor',
          birth_month: parseInt(formData.birthMonth),
          birth_day: parseInt(formData.birthDay),
          birth_year: parseInt(formData.birthYear),
          // Role-specific captures
          company: formData.company,
          business_category: formData.business_category,
          official_title: formData.official_title,
          official_department: formData.official_department,
          official_type: formData.official_type,
          creator_type: formData.creator_type,
          artist_name: formData.artist_name,
          artist_genre: formData.artist_genre,
          verification_status: ['business', 'official', 'chamber', 'media', 'artist', 'venue', 'non_profit', 'church'].includes(baseRole) ? 'pending' : 'verified',
          phone: '', 
          website: '',
          tos_accepted_at: new Date().toISOString()
        }
      }
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      handleNext();
    }
  };

  const handleZipCheck = async (zip: string) => {
    setFormData(prev => ({ ...prev, zip, community: '', county: '' }));
    setCityOptions([]);
    setIsVisitor(false);

    if (zip.length === 5) {
      setIsZipLoading(true);
      const { data } = await supabase
        .from('zip_to_city_location_mapping')
        .select('city_name, county_name, state, state_abbr')
        .eq('zip_code', zip)
        .order('is_primary', { ascending: false });
      setIsZipLoading(false);

      if (!data || data.length === 0) {
        setIsVisitor(true);
        return;
      }

      // Deduplicate by city_name
      const seen = new Set<string>();
      const unique = data.filter((row: CityOption) => {
        if (seen.has(row.city_name)) return false;
        seen.add(row.city_name);
        return true;
      });

      if (unique.length === 1) {
        // Auto-fill — single city for this zip
        setFormData(prev => ({ 
          ...prev, 
          community: unique[0].city_name, 
          county: unique[0].county_name,
          state: unique[0].state,
          state_abbr: unique[0].state_abbr
        }));
      } else {
        // Multiple cities share this zip — user must choose
        setCityOptions(unique);
      }
    }
  };

  return (
    <div className="signup-flow-container">

      <AnimatePresence mode="wait">
        
        {/* Step 1: Account Type or Login */}
        {step === 1 && (
          <motion.div 
            key={isLoginMode ? "login" : "step1"}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="signup-step"
          >
            {isLoginMode ? (
              <>
                <div className="signup-header">
                  <img 
                    src={theme.includes('light') ? "/logo-setx-blue.png" : "/logo-setx-transparent.png"} 
                    alt="Logo" 
                    style={{ width: 100, height: 100, marginBottom: 24, objectFit: 'contain' }} 
                  />
                  <h3>Sign In</h3>
                  <p>Access the SETX 360 Platform</p>
                </div>
                <div className="form-inputs">
                  <div className="input-group">
                    <label>Email</label>
                    <input 
                      type="email" 
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="input-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label>Password</label>
                      <button 
                        className="back-btn" 
                        onClick={() => setIsForgotPasswordMode(true)}
                        style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)', marginBottom: 4 }}
                      >
                        Forgot?
                      </button>
                    </div>
                    <div className="password-input-wrapper">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                        style={{ paddingRight: '48px' }}
                      />
                      <button 
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  {error && <p className="error-text" style={{ color: 'var(--accent)', fontSize: '0.8rem', textAlign: 'center' }}>{error}</p>}
                  <button 
                    className="primary-btn" 
                    onClick={handleLogin} 
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="animate-spin" /> : 'Login'}
                  </button>
                  <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    Don't have an account? <button 
                      className="link-btn" 
                      style={{ color: '#22c55e', fontWeight: 700, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                      onClick={() => setIsLoginMode(false)}
                    >Sign Up</button>
                  </p>
                </div>
              </>
            ) : isResettingPassword ? (
              <>
                <div className="signup-header">
                  <h3>Set New Password</h3>
                  <p>Secure your account with a new password</p>
                </div>
                <div className="form-inputs">
                  <div className="input-group">
                    <label>New Password</label>
                    <div className="password-input-wrapper">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        style={{ paddingRight: '48px' }}
                      />
                      <button 
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  {error && <p className="error-text" style={{ color: 'var(--accent)', fontSize: '0.8rem', textAlign: 'center' }}>{error}</p>}
                  <button className="primary-btn" onClick={handleUpdatePassword} disabled={isLoading}>
                    {isLoading ? <Loader2 className="animate-spin" /> : 'Update Password'}
                  </button>
                </div>
              </>
            ) : isForgotPasswordMode ? (
              <>
                <div className="signup-header">
                  <h3>Reset Password</h3>
                  <p>Enter your email to receive a recovery link</p>
                </div>
                <div className="form-inputs">
                  {resetSent ? (
                    <div className="premium-card" style={{ textAlign: 'center', padding: '24px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                      <CheckCircle2 size={48} color="#10b981" style={{ marginBottom: 16 }} />
                      <h4 style={{ marginBottom: 8 }}>Recovery Email Sent</h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Check <strong>{formData.email}</strong> for a link to reset your password.
                      </p>
                      <button className="primary-btn" onClick={() => { setIsForgotPasswordMode(false); setResetSent(false); }} style={{ marginTop: 24 }}>
                        Back to Login
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="input-group">
                        <label>Email Address</label>
                        <input 
                          type="email" 
                          placeholder="john@example.com"
                          value={formData.email}
                          onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>
                      {error && <p className="error-text" style={{ color: 'var(--accent)', fontSize: '0.8rem', textAlign: 'center' }}>{error}</p>}
                      <button className="primary-btn" onClick={handleForgotPassword} disabled={isLoading}>
                        {isLoading ? <Loader2 className="animate-spin" /> : 'Send Reset Link'}
                      </button>
                      <button className="back-btn" onClick={() => setIsForgotPasswordMode(false)} style={{ margin: '16px auto 0' }}>
                        <ArrowLeft size={16} /> Back to Login
                      </button>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="signup-header">
                  <h3>Join SETX 360</h3>
                  <p>Select your account type to get started</p>
                </div>
                <div className="type-grid">
                  {accountTypes.map(type => (
                    <button 
                      key={type.id}
                      className={`type-card premium-card ${formData.type === type.id ? 'selected' : ''}`}
                      onClick={() => { setFormData({ ...formData, type: type.id }); handleNext(); }}
                    >
                      <div className="type-icon">{type.icon}</div>
                      <div className="type-info">
                        <span className="type-label">{type.label}</span>
                        <span className="type-desc">{type.description}</span>
                      </div>
                      {formData.type === type.id && <Check className="check-icon" size={16} />}
                    </button>
                  ))}
                </div>
                <div className="login-prompt" style={{ textAlign: 'center', marginTop: '24px' }}>
                  <button className="back-btn" onClick={() => setIsLoginMode(true)} style={{ margin: '0 auto', fontSize: '1rem' }}>
                    Already have an account? <span style={{ color: '#a855f7', fontWeight: 700 }}>Sign In</span>
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* Step 2: Credentials */}
        {step === 2 && (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="signup-step"
          >
            <button className="back-btn" onClick={handleBack}><ArrowLeft size={20} /> Back</button>
            <div className="signup-header">
              <h3>Create Your Account</h3>
              <p>Enter your basic information</p>
            </div>
            <div className="form-inputs">
              <div className="input-row" style={{ display: 'flex', gap: '12px' }}>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>First Name</label>
                  <input 
                    type="text" 
                    placeholder="John" 
                    value={formData.firstName}
                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Last Name</label>
                  <input 
                    type="text" 
                    placeholder="Doe" 
                    value={formData.lastName}
                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
              </div>
              <div className="input-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  placeholder="john@example.com" 
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="input-group">
                <label>Password</label>
                <div className="password-input-wrapper">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    style={{ paddingRight: '48px' }}
                  />
                  <button 
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="input-group">
                <label>Confirm Password</label>
                <div className="password-input-wrapper">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    value={formData.confirmPassword}
                    onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                    style={{ paddingRight: '48px' }}
                  />
                  <button 
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="input-group">
                <label>Birthday</label>
                <div className="birthday-selects">
                  <select 
                    value={formData.birthMonth}
                    onChange={e => setFormData({ ...formData, birthMonth: e.target.value })}
                  >
                    <option value="">Month</option>
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('en', { month: 'long' })}</option>
                    ))}
                  </select>
                  <select 
                    value={formData.birthDay}
                    onChange={e => setFormData({ ...formData, birthDay: e.target.value })}
                  >
                    <option value="">Day</option>
                    {Array.from({ length: 31 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1}</option>
                    ))}
                  </select>
                  <select 
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

              {error && <p className="error-text" style={{ color: 'var(--accent)', fontSize: '0.8rem', textAlign: 'center', marginBottom: '10px' }}>{error}</p>}

              <button 
                className="primary-btn" 
                disabled={!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.confirmPassword || !formData.birthMonth || !formData.birthDay || !formData.birthYear || formData.password !== formData.confirmPassword}
                onClick={() => {
                  const hasSpecialFields = ['business', 'official', 'chamber', 'media', 'artist', 'venue', 'non_profit', 'church'].includes(formData.type);
                  if (hasSpecialFields) setStep(2.5);
                  else setStep(3);
                }}
              >
                Continue <ChevronRight size={18} />
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 2.5: Role Specific Info */}
        {step === 2.5 && (
          <motion.div 
            key="step2.5"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="signup-step"
          >
            <button className="back-btn" onClick={() => setStep(2)}><ArrowLeft size={20} /> Back</button>
            <div className="signup-header">
              <h3>{formData.type.charAt(0).toUpperCase() + formData.type.slice(1)} Details</h3>
              <p>Tell us more about your {formData.type} identity</p>
            </div>
            
            <div className="form-inputs">
              {formData.type === 'business' && (
                <>
                  <div className="input-group">
                    <label>Business Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Roasters Co." 
                      value={formData.company}
                      onChange={e => setFormData({ ...formData, company: e.target.value })}
                    />
                  </div>
                  <div className="input-group">
                    <label>Business Category</label>
                    <select 
                      value={formData.business_category}
                      onChange={e => setFormData({ ...formData, business_category: e.target.value })}
                    >
                      <option value="">Select Category</option>
                      <option value="Food & Drink">Food & Drink</option>
                      <option value="Services">Services</option>
                      <option value="Retail">Retail</option>
                      <option value="Health">Health</option>
                      <option value="Artisan">Artisan</option>
                    </select>
                  </div>
                </>
              )}

              {['official', 'chamber'].includes(formData.type) && (
                <>
                  <div className="input-group">
                    <label>Official Title</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Mayor, Director" 
                      list="official-titles"
                      value={formData.official_title}
                      onChange={e => setFormData({ ...formData, official_title: e.target.value })}
                    />
                    <datalist id="official-titles">
                      <option value="City Manager" />
                      <option value="City Worker" />
                      <option value="Mayor" />
                      <option value="City Council Member" />
                      <option value="Department Director" />
                      <option value="Chamber President" />
                    </datalist>
                  </div>
                  <div className="input-group">
                    <label>Department / Office</label>
                    <input 
                      type="text" 
                      placeholder="e.g. City Hall, Parks & Rec" 
                      value={formData.official_department}
                      onChange={e => setFormData({ ...formData, official_department: e.target.value })}
                    />
                  </div>
                  <div className="input-group">
                    <label>Organization Type</label>
                    <div className="radio-group" style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input type="radio" name="offType" checked={formData.official_type === 'city'} onChange={() => setFormData({...formData, official_type: 'city'})} />
                        City Govt
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input type="radio" name="offType" checked={formData.official_type === 'chamber'} onChange={() => setFormData({...formData, official_type: 'chamber'})} />
                        Chamber
                      </label>
                    </div>
                  </div>
                </>
              )}

              {['media', 'artist'].includes(formData.type) && (
                <>
                  <div className="input-group">
                    <label>Creator / Media Type</label>
                    <select 
                      value={formData.creator_type}
                      onChange={e => setFormData({ ...formData, creator_type: e.target.value })}
                    >
                      <option value="">Select Type</option>
                      <option value="Journalist">Independent Journalist</option>
                      <option value="Blogger">Blogger / Influencer</option>
                      <option value="Musician">Music Artist</option>
                      <option value="Photographer">Photographer</option>
                      <option value="News Org">News Organization</option>
                    </select>
                  </div>
                  {formData.creator_type === 'Musician' && (
                    <div className="input-row" style={{ display: 'flex', gap: '12px' }}>
                      <div className="input-group" style={{ flex: 1 }}>
                        <label>Band/Artist Name</label>
                        <input type="text" value={formData.artist_name} onChange={e => setFormData({...formData, artist_name: e.target.value})} />
                      </div>
                      <div className="input-group" style={{ flex: 1 }}>
                        <label>Genre</label>
                        <input type="text" value={formData.artist_genre} onChange={e => setFormData({...formData, artist_genre: e.target.value})} />
                      </div>
                    </div>
                  )}
                </>
              )}

              {['church', 'non_profit', 'venue'].includes(formData.type) && (
                <div className="input-group">
                  <label>Organization/Venue Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. St. Peters, The Grand Hall" 
                    value={formData.company}
                    onChange={e => setFormData({ ...formData, company: e.target.value })}
                  />
                </div>
              )}

              <button className="primary-btn" onClick={() => setStep(3)}>
                Continue <ChevronRight size={18} />
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Localization */}
        {step === 3 && (
          <motion.div 
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="signup-step"
          >
            <button className="back-btn" onClick={() => { const hasSpecialFields = ['business', 'official', 'chamber', 'media', 'artist', 'venue', 'non_profit', 'church'].includes(formData.type); if (hasSpecialFields) setStep(2.5); else setStep(2); }}><ArrowLeft size={20} /> Back</button>
            <div className="signup-header">
              <h3>Verify Your Area</h3>
              <p>Enter your zip code to see if you qualify for a Resident Badge</p>
            </div>
            <div className="form-inputs">
              <div className="input-group">
                <label>Zip Code</label>
                <div className="zip-search">
                  <MapPin size={20} className="zip-icon" />
                  <input 
                    type="text" 
                    placeholder="77705" 
                    maxLength={5}
                    value={formData.zip}
                    onChange={e => handleZipCheck(e.target.value)}
                  />
                  {isZipLoading && <Loader2 size={18} className="animate-spin" style={{ marginLeft: 8, opacity: 0.5 }} />}
                </div>
              </div>

              {/* Multi-city picker when zip spans multiple cities */}
              {cityOptions.length > 1 && (
                <div className="shared-zip-container fade-in">
                  <p className="hint-text">This zip code covers multiple communities. Which one do you associate with?</p>
                  <div className="cluster-grid">
                    {cityOptions.map(opt => (
                      <button 
                        key={opt.city_name}
                        className={`cluster-btn ${formData.community === opt.city_name ? 'active' : ''}`}
                        onClick={() => setFormData(prev => ({ 
                          ...prev, 
                          community: opt.city_name, 
                          county: opt.county_name,
                          state: opt.state,
                          state_abbr: opt.state_abbr
                        }))}
                      >
                        {opt.city_name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Status feedback */}
              {formData.zip.length === 5 && !isZipLoading && (
                <div className="validation-summary fade-in">
                  {isVisitor ? (
                    <div className="badge-preview visitor">
                      <Globe size={18} />
                      <span>Out-of-State Zip. You will receive a <strong>Visitor Badge</strong>.</span>
                    </div>
                  ) : formData.community && formData.county ? (
                    <div className="badge-preview resident">
                      <CheckCircle2 size={18} />
                      <span>Welcome, <strong>{formData.community}</strong> — {formData.county} County!</span>
                    </div>
                  ) : null}
                </div>
              )}

              <div className="terms-checkbox" style={{ marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <input 
                  type="checkbox" 
                  id="tos-agree"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  style={{ marginTop: 3 }}
                />
                <label htmlFor="tos-agree">
                  I agree to the <span className="legal-link" style={{ color: 'var(--primary)', cursor: 'pointer' }} onClick={() => setShowLegal(true)}>Terms of Service</span>, <span className="legal-link" style={{ color: 'var(--primary)', cursor: 'pointer' }} onClick={() => setShowLegal(true)}>Privacy Policy</span>, and <span className="legal-link" style={{ color: 'var(--primary)', cursor: 'pointer' }} onClick={() => setShowLegal(true)}>Copyright Guidelines</span>.
                </label>
              </div>

              {error && <p className="error-text" style={{ color: 'var(--accent)', fontSize: '0.8rem', textAlign: 'center', marginBottom: '10px' }}>{error}</p>}

              <button 
                className="primary-btn" 
                disabled={isLoading || isZipLoading || formData.zip.length < 5 || (cityOptions.length > 1 && !formData.community) || !agreedToTerms}
                onClick={handleRegister}
              >
                {isLoading ? <Loader2 className="animate-spin" /> : 'Complete Signup'} <ChevronRight size={18} />
              </button>
            </div>
          </motion.div>
        )}

        {showLegal && (
          <div className="legal-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--bg-dark)', zIndex: 1000, overflowY: 'auto' }}>
            <LegalNotice onClose={() => setShowLegal(false)} />
          </div>
        )}

        {/* Step 4: Success Message */}
        {step === 4 && (
          <motion.div 
            key="step4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="signup-step final-reveal"
          >
            <div className="reveal-content">
              <img 
                src="/logo-setx-blue.png" 
                alt="SETX 360" 
                style={{ width: 100, height: 100, marginBottom: 24, objectFit: 'contain', display: 'block', margin: '0 auto 24px' }} 
              />
              <div className={`large-badge ${isVisitor ? 'visitor' : 'resident'}`}>
                {isVisitor ? <Globe size={48} /> : <CheckCircle2 size={48} />}
              </div>
              <h2>Registration Success!</h2>
              <p style={{ marginBottom: 8 }}>Your {isVisitor ? 'Visitor' : 'Resident'} profile is being created.</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '300px', margin: '0 auto 20px' }}>
                Please check your email for a verification link from <strong style={{ color: '#10b981' }}>Supabase</strong> to activate your account.
              </p>
              
              <div className="profile-summary premium-card">
                <div className="summary-row">
                  <span>Name</span>
                  <strong>{formData.firstName} {formData.lastName}</strong>
                </div>
                <div className="summary-row">
                  <span>Status</span>
                  <strong>Active (Please verify email if required)</strong>
                </div>
              </div>

              <button className="primary-btn" onClick={() => window.location.reload()}>
                Continue to App
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};
