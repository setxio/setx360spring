import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle, ChevronRight, ChevronLeft, DollarSign, MapPin, Loader2, Plus, Trash2 } from 'lucide-react';
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
  const [agreedToDisclaimer, setAgreedToDisclaimer] = useState(false);
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
    questions: [] as string[],
    require_answers: false,
  });

  if (!isOpen) return null;

  const handleNext = () => setStep(prev => Math.min(prev + 1, 4));
  const handlePrev = () => setStep(prev => Math.max(prev - 1, 1));

  const addQuestion = () => {
    if (formData.questions.length < 5) {
      setFormData({ ...formData, questions: [...formData.questions, ''] });
    } else {
      error('Maximum of 5 questions allowed.');
    }
  };

  const removeQuestion = (index: number) => {
    const newQuestions = [...formData.questions];
    newQuestions.splice(index, 1);
    setFormData({ ...formData, questions: newQuestions });
  };

  const updateQuestion = (index: number, val: string) => {
    const newQuestions = [...formData.questions];
    newQuestions[index] = val;
    setFormData({ ...formData, questions: newQuestions });
  };

  const handleSubmit = async () => {
    if (!user) {
      error('You must be logged in to post a gig.');
      return;
    }
    
    if (!formData.title || !formData.description || !formData.category_id || !formData.compensation_amount) {
      error('Please fill in all required fields.');
      return;
    }

    if (!agreedToDisclaimer) {
      error('You must acknowledge that the platform is not liable for incomplete or unsatisfactory work.');
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
          questions: formData.questions.filter(q => q.trim() !== ''),
          require_answers: formData.require_answers,
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
      
      <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-soft)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)' }}>
        <input 
          type="checkbox" 
          id="remote-checkbox"
          checked={formData.type === 'Remote'}
          onChange={(e) => {
             setFormData({ ...formData, type: e.target.checked ? 'Remote' : 'Local', location: e.target.checked ? 'Remote' : formData.location })
          }}
          style={{ width: '20px', height: '20px', accentColor: 'var(--gigs-green)', cursor: 'pointer' }}
        />
        <label htmlFor="remote-checkbox" style={{ margin: 0, cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem' }}>
          This is a remote (digital) gig
        </label>
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
      <h3>Questionnaire (Optional)</h3>
      <p className="step-desc">Ask freelancers questions when they apply.</p>
      
      <div className="form-group" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label>Custom Questions ({formData.questions.length}/5)</label>
          {formData.questions.length < 5 && (
            <button className="secondary-btn" onClick={addQuestion} style={{ fontSize: '0.8rem', padding: '4px 8px' }}>
              <Plus size={14} /> Add Question
            </button>
          )}
        </div>
        
        {formData.questions.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', background: 'var(--card-bg)', borderRadius: '12px', border: '1px dashed var(--border)', marginTop: '8px' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No questions added. Click above to add one.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
            {formData.questions.map((q, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <input 
                  type="text" 
                  placeholder={`Question ${idx + 1}`} 
                  value={q}
                  onChange={(e) => updateQuestion(idx, e.target.value)}
                  style={{ flex: 1 }}
                />
                <button className="tool-btn" onClick={() => removeQuestion(idx)} style={{ color: '#ef4444', padding: '10px' }}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {formData.questions.length > 0 && (
        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={formData.require_answers} 
              onChange={(e) => setFormData({...formData, require_answers: e.target.checked})} 
            />
            <span style={{ fontSize: '0.95rem' }}>Make answers mandatory for applicants</span>
          </label>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: '24px', marginTop: '4px' }}>
            If unchecked, freelancers can opt out and skip your questions.
          </p>
        </div>
      )}
    </div>
  );

  const renderStep4 = () => (
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
      
      <div className="disclaimer-checkbox">
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', marginTop: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <input 
            type="checkbox" 
            checked={agreedToDisclaimer} 
            onChange={(e) => setAgreedToDisclaimer(e.target.checked)} 
            style={{ marginTop: '2px' }}
          />
          <span>I acknowledge that the platform is not liable for incomplete or unsatisfactory work or any disputes arising from this gig.</span>
        </label>
      </div>
    </div>
  );

  return (
    <div className="modal-overlay gig-modal-overlay">
      <div className="modal-content gig-modal">
        <div className="modal-header">
          <h2>Post a Gig</h2>
          <button className="close-btn" onClick={onClose}><X size={24} /></button>
        </div>

        <div className="wizard-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${(step / 4) * 100}%` }} />
          </div>
          <div className="step-indicators">
            <span className={step >= 1 ? 'active' : ''}>1. Basics</span>
            <span className={step >= 2 ? 'active' : ''}>2. Logistics</span>
            <span className={step >= 3 ? 'active' : ''}>3. Questions</span>
            <span className={step >= 4 ? 'active' : ''}>4. Payment</span>
          </div>
        </div>

        <div className="modal-body">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </div>

        <div className="modal-footer wizard-footer">
          {step > 1 ? (
            <button className="secondary-btn" onClick={handlePrev}>
              <ChevronLeft size={18} /> Back
            </button>
          ) : <div></div>}
          
          {step < 4 ? (
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
