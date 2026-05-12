import React, { useState } from 'react';
import { 
  ArrowRight, 
  ArrowLeft, 
  User, 
  Briefcase, 
  CreditCard, 
  Lock, 
  CheckCircle2, 
  Zap,
  Globe,
  Star,
  Check,
  Loader2,
  MapPin,
  Mail,
  Shield
} from 'lucide-react';
import './LabsWizard.css';
import './SetxIoSignup.css';

import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';

interface LabsWizardProps {
  onBack: () => void;
}

const PLANS = [
  { id: 'free', name: 'Free', price: '$0', desc: 'setx.io/ extension', icon: Globe },
  { id: 'bronze', name: 'Bronze', price: '$1', desc: 'Personal Branding', icon: Zap },
  { id: 'silver', name: 'Silver', price: '$2', desc: 'Growth Features', icon: Star },
  { id: 'gold', name: 'Gold', price: '$3', desc: 'Enterprise Power', icon: CheckCircle2 }
];

const CATEGORIES = ['Retail', 'Food', 'Services', 'Auto', 'Real Estate'];

export const LabsWizard: React.FC<LabsWizardProps> = ({ onBack }) => {
  const { isSetxIO } = useApp();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    businessName: '',
    zipCode: '',
    email: '',
    password: '',
    category: 'Retail',
    plan: 'free'
  });

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handleComplete = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Sign up on the current database (setx.io)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            zip_code: formData.zipCode,
            role: 'business'
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No user created');

      // 2. Create the store/site on the current database
      const { error: storeError } = await supabase
        .from('stores')
        .insert({
          owner_id: authData.user.id,
          name: formData.businessName,
          category: formData.category,
          slug: formData.businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
          zip_code: formData.zipCode,
          status: 'Live',
          subscription_tier: formData.plan
        });

      if (storeError) throw storeError;

      if (isSetxIO) {
        setStep(5);
      } else {
        nextStep();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch(step) {
      case 1: 
        if (isSetxIO) {
          return (
            <div className="setxio-signup-container">
              <div className="signup-card">
                <button className="wizard-back-btn-abs" onClick={onBack}><ArrowLeft size={20} /></button>
                
                <div className="signup-header">
                  <div className="signup-icon-wrapper">
                    <Zap />
                  </div>
                  <h1>Start your journey</h1>
                  <p>Create your multi-tenant workspace and start building today.</p>
                </div>

                <div className="signup-form">
                  <div className="input-row">
                    <div className="signup-input-group">
                      <label><User /> Full Name</label>
                      <div className="signup-input-wrapper">
                        <input 
                          type="text" 
                          placeholder="John Doe" 
                          value={formData.name}
                          onChange={e => setFormData({...formData, name: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="signup-input-group">
                      <label><Briefcase /> Business Name</label>
                      <div className="signup-input-wrapper">
                        <input 
                          type="text" 
                          placeholder="My Agency" 
                          value={formData.businessName}
                          onChange={e => setFormData({...formData, businessName: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="signup-input-group">
                    <label><MapPin /> Business Zip Code (TX)</label>
                    <div className="signup-input-wrapper">
                      <input 
                        type="text" 
                        placeholder="77701" 
                        value={formData.zipCode}
                        onChange={e => setFormData({...formData, zipCode: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="signup-input-group">
                    <label><Mail /> Email Address</label>
                    <div className="signup-input-wrapper">
                      <input 
                        type="email" 
                        placeholder="setxplatform@gmail.com" 
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="signup-input-group">
                    <label><Lock /> Password</label>
                    <div className="signup-input-wrapper">
                      <input 
                        type="password" 
                        placeholder="••••••••" 
                        value={formData.password}
                        onChange={e => setFormData({...formData, password: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="signup-input-group">
                    <label><Globe /> Industry Vertical</label>
                    <div className="signup-input-wrapper">
                      <select 
                        value={formData.category}
                        onChange={e => setFormData({...formData, category: e.target.value})}
                      >
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  {error && <div className="signup-error">{error}</div>}

                  <button 
                    className="signup-submit-btn" 
                    onClick={() => setStep(3)}
                    disabled={!formData.name || !formData.businessName || !formData.email || !formData.password}
                  >
                    Continue to Plans <ArrowRight size={20} />
                  </button>
                </div>

                <div className="signup-footer">
                  By clicking Launch, you agree to our <strong>Terms of Service</strong>.
                </div>
              </div>
            </div>
          );
        }
        return (
          <div className="wizard-step fade-in">
            <header>
              <div className="step-icon"><User /></div>
              <h2>Founder Details</h2>
              <p>Let's start with who you are.</p>
            </header>
            <div className="step-body">
              <div className="input-group">
                <label>Full Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. John Doe"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="input-group">
                <label>Zip Code (TX)</label>
                <input 
                  type="text" 
                  placeholder="77701"
                  value={formData.zipCode}
                  onChange={e => setFormData({...formData, zipCode: e.target.value})}
                />
              </div>
            </div>
            <footer>
              <button className="wizard-prev-btn" onClick={onBack}>Cancel</button>
              <button className="wizard-next-btn" disabled={!formData.name} onClick={nextStep}>Next <ArrowRight size={18} /></button>
            </footer>
          </div>
        );
      case 2:
        if (isSetxIO) return null; 
        return (
          <div className="wizard-step fade-in">
            <header>
              <div className="step-icon"><Briefcase /></div>
              <h2>Venture Details</h2>
              <p>Tell us about your first business.</p>
            </header>
            <div className="step-body">
              <div className="input-group">
                <label>Business Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Beaumont Bistro"
                  value={formData.businessName}
                  onChange={e => setFormData({...formData, businessName: e.target.value})}
                />
              </div>
              <div className="input-group">
                <label>Business Category</label>
                <select 
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                >
                  <option value="">Select a category...</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <footer>
              <button className="wizard-prev-btn" onClick={prevStep}><ArrowLeft size={18} /> Back</button>
              <button className="wizard-next-btn" disabled={!formData.businessName || !formData.category} onClick={nextStep}>Next <ArrowRight size={18} /></button>
            </footer>
          </div>
        );
      case 3:
        return (
          <div className="wizard-step wide fade-in">
            <header>
              <div className="step-icon"><CreditCard /></div>
              <h2>Subscription Plan</h2>
              <p>Choose the power level for your new business.</p>
            </header>
            <div className="step-body">
              <div className="plans-grid">
                {PLANS.map(p => (
                  <div 
                    key={p.id} 
                    className={`plan-card glass ${formData.plan === p.id ? 'active' : ''}`}
                    onClick={() => setFormData({...formData, plan: p.id})}
                  >
                    <p.icon className="plan-icon" />
                    <h3>{p.name}</h3>
                    <div className="price">{p.price || '$0'}<span>/mo</span></div>
                    <p>{p.desc}</p>
                    {formData.plan === p.id && <Check className="check-icon" />}
                  </div>
                ))}
              </div>
              {formData.plan !== 'free' && (
                <div className="billing-section fade-in">
                  <h3>Billing Information</h3>
                  <div className="billing-row">
                    <input type="text" placeholder="Card Number" />
                  </div>
                  <div className="billing-row">
                    <input type="text" placeholder="MM/YY" style={{ flex: 1 }} />
                    <input type="text" placeholder="CVC" style={{ flex: 1 }} />
                  </div>
                </div>
              )}
            </div>
            <footer>
              <button className="wizard-prev-btn" onClick={isSetxIO ? () => setStep(1) : prevStep}><ArrowLeft size={18} /> Back</button>
              <button className="wizard-next-btn" onClick={isSetxIO ? handleComplete : nextStep}>
                {isSetxIO && isLoading ? <Loader2 className="animate-spin" size={18} /> : (isSetxIO ? 'Complete Setup' : 'Next')} 
                <ArrowRight size={18} />
              </button>
            </footer>
          </div>
        );
      case 4:
        return (
          <div className="wizard-step fade-in">
            <header>
              <div className="step-icon"><Lock /></div>
              <h2>Account Security</h2>
              <p>Create your portal credentials.</p>
            </header>
            <div className="step-body">
              <div className="input-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div className="input-group">
                <label>Create Password</label>
                <input 
                  type="password" 
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>
              {error && <div className="wizard-error fade-in">{error}</div>}
            </div>
            <footer>
              <button className="wizard-prev-btn" onClick={prevStep} disabled={isLoading}><ArrowLeft size={18} /> Back</button>
              <button className="wizard-next-btn" disabled={!formData.email || !formData.password || isLoading} onClick={handleComplete}>
                {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Complete Setup'} <ArrowRight size={18} />
              </button>
            </footer>
          </div>
        );
      case 5:
        const selectedPlan = PLANS.find(p => p.id === formData.plan);
        return (
          <div className="wizard-step success fade-in">
            <header>
              <div className="success-badge"><CheckCircle2 size={48} /></div>
              <h2>Project Initialized!</h2>
              <p>Welcome to the SETX Ecosystem, Founder.</p>
            </header>
            <div className="receipt-card glass">
              <div className="receipt-header">
                <span>Receipt #LAB-7729</span>
                <span>May 05, 2026</span>
              </div>
              <div className="receipt-body">
                <div className="receipt-item">
                  <span>{formData.businessName} ({formData.plan?.toUpperCase() || 'FREE'})</span>
                  <span>{selectedPlan?.price || '$0'}</span>
                </div>
                <div className="receipt-total">
                  <span>Total Paid</span>
                  <span>{selectedPlan?.price || '$0'}</span>
                </div>
              </div>
              <p className="receipt-footer">A copy of this receipt has been sent to {formData.email}</p>
            </div>
            <footer>
              <button className="finish-btn" onClick={() => window.location.reload()}>Go to CRM Dashboard <ArrowRight size={18} /></button>
            </footer>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="wizard-container">
      <div className="wizard-progress">
        <div className="progress-bar" style={{ width: `${(step / 5) * 100}%` }}></div>
      </div>
      {renderStep()}
    </div>
  );
};
