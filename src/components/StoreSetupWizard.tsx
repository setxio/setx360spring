import type { User } from '../types/user';
import React, { useState } from 'react';
import { 
  Store, 
  Image as ImageIcon, 
  MapPin, 
  CheckCircle2, 
  ChevronRight, 
  ArrowLeft,
  Loader2,
  Globe,
  Truck
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import './StoreSetupWizard.css';

interface StoreSetupWizardProps {
  user: User;
  onComplete: (storeData: any) => void;
  onCancel: () => void;
}

export const StoreSetupWizard: React.FC<StoreSetupWizardProps> = ({ user, onComplete, onCancel }) => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: user?.company || '',
    description: '',
    type: 'physical',
    category: (user?.business_category?.toLowerCase()) || 'retail',
    subcategory: '',
    location: user?.location || '',
    image_url: '',
    address: '',
    zip: user?.zip || '',
    county: user?.county || '',
    showAddressPublicly: true,
  });

  const isDisqualified = !['Jefferson', 'Orange', 'Jefferson County', 'Orange County'].includes(formData.county);

  const handleNext = () => {
    if (step === 1 && !formData.name) {
      setError('Store name is required');
      return;
    }
    if (step === 2 && !formData.address) {
      setError('A business address is required for all vendors.');
      return;
    }
    setStep(prev => prev + 1);
  };
  const handleBack = () => setStep(prev => prev - 1);

  const handleFinish = async () => {
    if (!formData.name) {
      setError('Store name is required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { data, error: insertError } = await supabase
        .from('stores')
        .insert([{
          owner_id: user.id,
          name: formData.name,
          description: formData.description,
          type: formData.type,
          category: formData.category,
          location: formData.location,
          image_url: formData.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=random`,
          address: formData.address,
          zip: formData.zip,
          county: formData.county,
          show_address: formData.showAddressPublicly,
          is_verified: false,
          subcategory: formData.subcategory
        }])
        .select()
        .single();

      if (insertError) throw insertError;
      
      onComplete(data);
    } catch (err: any) {
      setError(err.message || 'Failed to create store');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="wizard-overlay">
      <div className="wizard-modal premium-card">
        {isDisqualified ? (
          <div className="wizard-step fade-in" style={{ textAlign: 'center', padding: '40px 0' }}>
            <div className="step-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}><MapPin size={32} /></div>
            <h2>Service Unavailable</h2>
            <p style={{ marginBottom: 24 }}>SETX 360 Marketplace is currently only available for businesses in <strong>Jefferson</strong> and <strong>Orange</strong> counties.</p>
            <div className="geo-pill-display" style={{ background: 'rgba(239, 68, 68, 0.05)', color: '#ef4444' }}>
              Your Region: {formData.county || 'Unknown'}
            </div>
            <button className="primary-btn" onClick={onCancel} style={{ marginTop: 32, background: '#ef4444' }}>
              Exit Setup
            </button>
          </div>
        ) : (
          <>
            <div className="wizard-progress">
              {[1, 2, 3].map(i => (
                <div key={i} className={`progress-dot ${step >= i ? 'active' : ''}`} />
              ))}
            </div>

            {step === 1 && (
              <div className="wizard-step fade-in">
                <div className="step-header">
                  <div className="step-icon"><Store size={32} /></div>
                  <h2>Basic Branding</h2>
                  <p>Tell us about your business</p>
                </div>
                <div className="step-content">
                  <div className="input-group">
                    <label>Store Name</label>
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. SETX Artisans"
                    />
                  </div>
                  <div className="input-group">
                    <label>Description (Optional)</label>
                    <textarea 
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      placeholder="What makes your store unique?"
                      rows={3}
                    />
                  </div>
                  <div className="input-group">
                    <label>Store Logo URL (Optional)</label>
                    <div className="url-input-wrapper">
                      <ImageIcon size={18} />
                      <input 
                        type="text" 
                        value={formData.image_url}
                        onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                        placeholder="https://example.com/logo.png"
                      />
                    </div>
                  </div>
                  <div className="input-group">
                    <label>Category</label>
                    <select 
                      value={formData.category} 
                      onChange={e => setFormData({ ...formData, category: e.target.value, subcategory: '' })}
                      style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                      <option value="Retail">Retail</option>
                      <option value="Services">Services</option>
                      <option value="Food & Drink">Food & Drink</option>
                      <option value="Artisan">Artisan</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  {formData.category.toLowerCase() === 'retail' && (
                    <div className="input-group">
                      <label>Retail Store Type</label>
                      <select 
                        value={formData.subcategory} 
                        onChange={e => setFormData({ ...formData, subcategory: e.target.value })}
                        style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                      >
                        <option value="">Select Retail Type...</option>
                        <option value="Boutiques">Boutiques</option>
                        <option value="Home Decor">Home Decor</option>
                        <option value="Electronics">Electronics</option>
                        <option value="Groceries">Groceries</option>
                        <option value="Health & Beauty">Health & Beauty</option>
                        <option value="Beauty">Beauty</option>
                        <option value="Clothing & Apparel">Clothing & Apparel</option>
                        <option value="Jewelry & Accessories">Jewelry & Accessories</option>
                        <option value="Sporting Goods">Sporting Goods</option>
                        <option value="Toys & Hobbies">Toys & Hobbies</option>
                        <option value="Gifts & Souvenirs">Gifts & Souvenirs</option>
                        <option value="Other Retail">Other Retail</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="wizard-step fade-in">
                <div className="step-header">
                  <div className="step-icon"><MapPin size={32} /></div>
                  <h2>Location & Type</h2>
                  <p>Where do you operate?</p>
                </div>
                <div className="step-content">
                  <div className="type-selector">
                    <div 
                      className={`type-option ${formData.type === 'physical' ? 'active' : ''}`}
                      onClick={() => setFormData({ ...formData, type: 'physical' })}
                    >
                      <Store size={20} />
                      <span>Physical Shop</span>
                    </div>
                    <div 
                      className={`type-option ${formData.type === 'online' ? 'active' : ''}`}
                      onClick={() => setFormData({ ...formData, type: 'online' })}
                    >
                      <Globe size={20} />
                      <span>Online Only</span>
                    </div>
                    <div 
                      className={`type-option ${formData.type === 'all' ? 'active' : ''}`}
                      onClick={() => setFormData({ ...formData, type: 'all' })}
                    >
                      <Truck size={20} />
                      <span>Both</span>
                    </div>
                  </div>

                  <div className="input-group">
                    <label>Business Address <span style={{ color: '#ef4444' }}>*</span></label>
                    <input 
                      type="text" 
                      value={formData.address}
                      onChange={e => setFormData({ ...formData, address: e.target.value })}
                      placeholder="123 Main St, Beaumont, TX"
                      required
                    />
                  </div>

                  <div className="input-group" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px' }}>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Show Address Publicly</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Online stores can hide their street address.</div>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={formData.showAddressPublicly} 
                      onChange={e => setFormData({ ...formData, showAddressPublicly: e.target.checked })}
                      style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                    />
                  </div>
                  
                  <div className="geo-pill-display">
                    <MapPin size={14} /> {formData.county} County, {formData.zip}
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="wizard-step fade-in">
                <div className="step-header">
                  <div className="step-icon"><CheckCircle2 size={32} /></div>
                  <h2>Ready to Launch?</h2>
                  <p>Review your details and open your shop</p>
                </div>
                <div className="step-content">
                  <div className="review-card glass">
                    <div className="review-header">
                      <img 
                        src={formData.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=random`} 
                        alt="Preview" 
                        className="preview-logo"
                      />
                      <div>
                        <h4>{formData.name}</h4>
                        <span>{formData.category}</span>
                      </div>
                    </div>
                    <div className="review-details">
                      <div className="detail-item"><strong>Type:</strong> {formData.type.toUpperCase()}</div>
                      <div className="detail-item"><strong>Region:</strong> {formData.county}</div>
                    </div>
                  </div>
                  <p className="legal-note">By creating this store, you agree to the Merchant Terms of Service and split-payout fee structures.</p>
                </div>
              </div>
            )}

            {error && <p className="wizard-error">{error}</p>}

            <div className="wizard-actions">
              {step > 1 ? (
                <button className="back-btn" onClick={handleBack} disabled={isLoading}>
                  <ArrowLeft size={18} /> Back
                </button>
              ) : (
                <button className="back-btn" onClick={onCancel} disabled={isLoading}>
                  Cancel
                </button>
              )}

              {step < 3 ? (
                <button className="primary-btn" onClick={handleNext}>
                  Continue <ChevronRight size={18} />
                </button>
              ) : (
                <button className="primary-btn" onClick={handleFinish} disabled={isLoading}>
                  {isLoading ? <Loader2 className="animate-spin" /> : 'Launch Store'}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
