import React, { useState } from 'react';
import { X, CheckCircle2, Loader2, MessageSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';

interface GigApplicationModalProps {
  gig: any;
  user: any;
  onClose: () => void;
  onSuccess: () => void;
}

export const GigApplicationModal: React.FC<GigApplicationModalProps> = ({ gig, user, onClose, onSuccess }) => {
  const { success, error } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('I am interested in this gig.');
  
  // Default to empty array if no questions or parsing fails
  const questions: string[] = Array.isArray(gig.questions) ? gig.questions : [];
  const requireAnswers: boolean = gig.require_answers ?? false;
  
  // Initialize answers state to match the number of questions
  const [answers, setAnswers] = useState<string[]>(Array(questions.length).fill(''));

  const handleUpdateAnswer = (index: number, val: string) => {
    const newAnswers = [...answers];
    newAnswers[index] = val;
    setAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    if (requireAnswers && questions.length > 0) {
      const isMissingAnswers = answers.some(a => !a.trim());
      if (isMissingAnswers) {
        error("Please answer all mandatory questions before applying.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const { error: applyError } = await supabase.from('gig_applications').insert([{
        gig_id: gig.id,
        applicant_id: user.id,
        status: 'Pending',
        message: message,
        answers: answers
      }]);

      if (applyError) throw applyError;

      success("Application submitted successfully!");
      onSuccess();
    } catch (err: any) {
      console.error("Application error:", err);
      error("Failed to apply or you have already applied.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass" style={{ maxWidth: '600px', width: '100%', padding: '0' }}>
        <div className="modal-header" style={{ padding: '24px', borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>Apply for {gig.title}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Submit your application to the client</p>
          </div>
          <button className="close-btn" onClick={onClose}><X size={24} /></button>
        </div>

        <div className="modal-body no-scrollbar" style={{ padding: '24px', maxHeight: '60vh', overflowY: 'auto' }}>
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label>Cover Message</label>
            <textarea 
              rows={3} 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell the client why you're a great fit..."
              style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
            />
          </div>

          {questions.length > 0 && (
            <div className="questionnaire-section">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <MessageSquare size={18} color="var(--primary)" />
                <h3 style={{ fontSize: '1.1rem' }}>Client Questions</h3>
                {requireAnswers && <span style={{ fontSize: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '2px 8px', borderRadius: '12px' }}>Required</span>}
                {!requireAnswers && <span style={{ fontSize: '0.75rem', background: 'rgba(156, 163, 175, 0.1)', color: 'var(--text-secondary)', padding: '2px 8px', borderRadius: '12px' }}>Optional</span>}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {questions.map((q, idx) => (
                  <div key={idx} className="question-item">
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                      {idx + 1}. {q}
                    </label>
                    <textarea 
                      rows={2}
                      value={answers[idx] || ''}
                      onChange={(e) => handleUpdateAnswer(idx, e.target.value)}
                      placeholder="Your answer..."
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ padding: '24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button className="secondary-btn" onClick={onClose}>Cancel</button>
          <button className="primary-btn gigs-btn" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />} 
            Submit Application
          </button>
        </div>
      </div>
    </div>
  );
};
