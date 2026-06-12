import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle, ChevronRight, ChevronLeft, DollarSign, MapPin, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import './CreateGigModal.css';

interface CreateGigModalProps {
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

export const CreateGigModal: React.FC<CreateGigModalProps> = ({ isOpen, onClose, user, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { success, error } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    type: 'Local',
    urgency: 'Flexible',
    location: '',
    compensation_amount: '',
    compensation_type: 'Flat',
  });

  if (!isOpen) return null;

  const handleNext = () => setStep(prev => Math.min(prev + 1, 3));
  const handlePrev = () => setStep(prev => Math.max(prev - 1, 1));

  const handleSubmit = async () => {
    if (!user) {
      error('You must be logged in to post a gig.');
      return;
    }
    
    if (!formData.title || !formData.description || !formData.category_id || !formData.compensation_amount) {
      error('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { data, error: dbError } = await supabase
        .from('gigs')
        .insert({
          requester_id: user.id,
          title: formData.title,
          description: formData.description,
          category_id: formData.category_id,
          type: formData.type,
          urgency: formData.urgency,
          location: formData.type === 'Local' ? formData.location : null,
          compensation_amount: formData.compensation_amount,
          compensation_type: formData.compensation_type,
          status: 'Active'
        })
        .select();

      if (dbError) throw dbError;
      
      success('Gig posted successfully!');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      error(err.message || 'Failed to post gig.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <div className="wizard-step">
      <h3>The Basics</h3>
      <p className="step-desc">What do you need help with?</p>
      
      <div className="form-group">
        <label>Gig Title</label>
        <input 
          type="text" 
          placeholder="e.g. Need help assembling an IKEA desk" 
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
        />
      </div>

      <div className="form-group">
        <label>Category</label>
        <select 
          value={formData.category_id}
          onChange={(e) => setFormData({...formData, category_id: e.target.value})}
        >
          <option value="" disabled>Select a category</option>
          {CATEGORIES.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.label}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Description</label>
        <textarea 
          placeholder="Describe the task in detail. What tools are needed? Are there any specific requirements?"
          rows={4}
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="wizard-step">
      <h3>Logistics</h3>
      <p className="step-desc">Where and when does this need to happen?</p>
      
      <div className="form-group">
        <label>Gig Type</label>
        <div className="toggle-options">
          <button 
            className={`toggle-opt ${formData.type === 'Local' ? 'active' : ''}`}
            onClick={() => setFormData({...formData, type: 'Local'})}
          >
            Local (In-Person)
          </button>
          <button 
            className={`toggle-opt ${formData.type === 'Remote' ? 'active' : ''}`}
            onClick={() => setFormData({...formData, type: 'Remote'})}
          >
            Remote (Digital)
          </button>
        </div>
      </div>

      {formData.type === 'Local' && (
        <div className="form-group">
          <label>Location (City or Neighborhood)</label>
          <div className="input-with-icon">
            <MapPin size={18} />
            <input 
              type="text" 
              placeholder="e.g. Beaumont, TX" 
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
            />
          </div>
        </div>
      )}

      <div className="form-group">
        <label>Urgency</label>
        <div className="urgency-options">
          {['ASAP', 'Scheduled', 'Flexible'].map(u => (
            <div 
              key={u} 
              className={`urgency-card ${formData.urgency === u ? 'active' : ''}`}
              onClick={() => setFormData({...formData, urgency: u})}
            >
              <div className="radio-circle">
                {formData.urgency === u && <div className="radio-inner" />}
              </div>
              <span>{u}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="wizard-step">
      <h3>Compensation</h3>
      <p className="step-desc">How much are you offering for this task?</p>
      
      <div className="form-group">
        <label>Payment Type</label>
        <div className="toggle-options">
          <button 
            className={`toggle-opt ${formData.compensation_type === 'Flat' ? 'active' : ''}`}
            onClick={() => setFormData({...formData, compensation_type: 'Flat'})}
          >
            Flat Rate
          </button>
          <button 
            className={`toggle-opt ${formData.compensation_type === 'Hourly' ? 'active' : ''}`}
            onClick={() => setFormData({...formData, compensation_type: 'Hourly'})}
          >
            Hourly Wage
          </button>
        </div>
      </div>

      <div className="form-group">
        <label>Amount Offering</label>
        <div className="input-with-icon amount-input">
          <DollarSign size={18} />
          <input 
            type="number" 
            placeholder={formData.compensation_type === 'Flat' ? "e.g. 50" : "e.g. 15"} 
            value={formData.compensation_amount}
            onChange={(e) => setFormData({...formData, compensation_amount: e.target.value})}
          />
          <span className="currency-suffix">USD {formData.compensation_type === 'Hourly' && '/ hr'}</span>
        </div>
      </div>

      <div className="gig-summary-card">
        <AlertCircle size={20} color="#10b981" />
        <div className="summary-text">
          <strong>Review & Post</strong>
          <p>By posting this gig, you agree to pay the provider the agreed upon compensation upon completion.</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="modal-overlay">
      <div className="modal-content gig-modal">
        <div className="modal-header">
          <h2>Post a Gig</h2>
          <button className="close-btn" onClick={onClose}><X size={24} /></button>
        </div>

        <div className="wizard-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${(step / 3) * 100}%` }} />
          </div>
          <div className="step-indicators">
            <span className={step >= 1 ? 'active' : ''}>1. Basics</span>
            <span className={step >= 2 ? 'active' : ''}>2. Logistics</span>
            <span className={step >= 3 ? 'active' : ''}>3. Payment</span>
          </div>
        </div>

        <div className="modal-body">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>

        <div className="modal-footer wizard-footer">
          {step > 1 ? (
            <button className="secondary-btn" onClick={handlePrev}>
              <ChevronLeft size={18} /> Back
            </button>
          ) : <div></div>}
          
          {step < 3 ? (
            <button className="primary-btn gigs-btn" onClick={handleNext}>
              Next <ChevronRight size={18} />
            </button>
          ) : (
            <button className="primary-btn gigs-btn" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />} 
              Publish Gig
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
