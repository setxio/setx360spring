import React, { useState, useEffect } from 'react';
import { 
  Landmark, 
  AlertTriangle, 
  History, 
  Wallet, 
  MapPin, 
  Camera, 
  CheckCircle,
  Clock,
  Loader2,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { payUtilityBill } from '../lib/payments';
import './CivicsView.css';

interface CivicsViewProps {
  user: any;
  scope: string;
  activeTab: number;
}

export const CivicsView: React.FC<CivicsViewProps> = ({ user, activeTab }) => {
  const [isLoading, setIsLoading] = useState(false);

  // 311 Report State
  const [issueType, setIssueType] = useState('pothole');
  const [issueDescription, setIssueDescription] = useState('');
  const [issueLocation, setIssueLocation] = useState('');
  const [isSubmittingIssue, setIsSubmittingIssue] = useState(false);

  // My Reports State
  const [myReports, setMyReports] = useState<any[]>([]);

  // Utilities State
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    if (activeTab === 2 && user) {
      fetchMyReports();
    }
  }, [activeTab, user]);

  const fetchMyReports = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('civic_incidents')
      .select('*')
      .eq('reporter_id', user.id)
      .order('created_at', { ascending: false });
    
    if (data) {
      setMyReports(data);
    } else {
      // Mock data for preview if table doesn't exist yet
      setMyReports([
        { id: '1', type: 'pothole', description: 'Deep pothole on Main St', status: 'in_progress', created_at: new Date().toISOString() },
        { id: '2', type: 'streetlight', description: 'Light out at intersection', status: 'resolved', created_at: new Date(Date.now() - 86400000 * 5).toISOString() }
      ]);
    }
    setIsLoading(false);
  };

  const handleSubmitIssue = async () => {
    if (!issueDescription || !issueLocation) {
      alert("Please provide a description and location.");
      return;
    }

    setIsSubmittingIssue(true);
    
    const { error } = await supabase
      .from('civic_incidents')
      .insert([{
        reporter_id: user?.id,
        type: issueType,
        description: issueDescription,
        location: issueLocation,
        status: 'open',
        priority: 'medium',
        community: user?.community,
        county: user?.county,
        state: user?.state
      }]);

    setIsSubmittingIssue(false);

    if (error) {
      console.error("Submission failed", error);
      alert('Failed to submit report. Please ensure the new database tables have been created.');
    } else {
      alert('Report submitted successfully! City staff has been notified.');
      setIssueDescription('');
      setIssueLocation('');
      if (activeTab === 2) fetchMyReports();
    }
  };

  const handlePayUtility = async () => {
    setIsProcessingPayment(true);
    const result = await payUtilityBill(user.id, 142.50, '#8492-1102');
    setIsProcessingPayment(false);

    if (result.success) {
      setPaymentSuccess(true);
    } else {
      alert('Payment failed. Please try again.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'resolved': return <span className="civic-badge resolved"><CheckCircle size={14} /> Resolved</span>;
      case 'in_progress': return <span className="civic-badge progress"><Loader2 size={14} className="animate-spin" /> In Progress</span>;
      case 'assigned': return <span className="civic-badge assigned"><Clock size={14} /> Assigned</span>;
      default: return <span className="civic-badge open"><AlertTriangle size={14} /> Open</span>;
    }
  };

  return (
    <div className="civics-view scrollable-view">
      
      {/* 0: Home / Overview */}
      {activeTab === 0 && (
        <div className="civics-home fade-in">
          <div className="civics-hero premium-card">
            <Landmark size={48} className="text-primary" />
            <h2>City Hall Online</h2>
            <p>Welcome to your digital civic center. Report issues, pay bills, and stay informed.</p>
          </div>

          <div className="civics-grid">
            <div className="civics-action-card premium-card">
              <div className="icon-wrapper alert"><AlertTriangle size={24} /></div>
              <div className="card-content">
                <h3>Report 311 Issue</h3>
                <p>Potholes, graffiti, streetlights</p>
              </div>
              <ChevronRight size={20} className="text-secondary" />
            </div>
            <div className="civics-action-card premium-card">
              <div className="icon-wrapper wallet"><Wallet size={24} /></div>
              <div className="card-content">
                <h3>Pay Utilities</h3>
                <p>Water, Trash, Sewer bills</p>
              </div>
              <ChevronRight size={20} className="text-secondary" />
            </div>
            <div className="civics-action-card premium-card">
              <div className="icon-wrapper info"><ShieldAlert size={24} /></div>
              <div className="card-content">
                <h3>City Alerts</h3>
                <p>No active emergencies</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1: Report 311 */}
      {activeTab === 1 && (
        <div className="civics-form-container fade-in">
          <div className="civics-header">
            <AlertTriangle size={32} className="text-warning" />
            <h2>Report an Issue</h2>
            <p>Help keep your city safe and clean.</p>
          </div>

          <div className="civics-form premium-card">
            <div className="input-group">
              <label>Issue Type</label>
              <select value={issueType} onChange={(e) => setIssueType(e.target.value)}>
                <option value="pothole">Pothole / Road Repair</option>
                <option value="streetlight">Streetlight Outage</option>
                <option value="graffiti">Graffiti Removal</option>
                <option value="code_violation">Code Violation</option>
                <option value="utility_issue">Utility Issue (Water/Gas)</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="input-group">
              <label><MapPin size={16} /> Location</label>
              <input 
                type="text" 
                placeholder="e.g. 123 Main St, near intersection"
                value={issueLocation}
                onChange={(e) => setIssueLocation(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label>Description</label>
              <textarea 
                placeholder="Provide details about the issue..."
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                rows={4}
              />
            </div>

            <div className="input-group">
              <label><Camera size={16} /> Photo Evidence (Optional)</label>
              <div className="photo-upload-placeholder">
                <Camera size={24} />
                <span>Tap to take or upload a photo</span>
              </div>
            </div>

            <button 
              className="primary-btn submit-btn" 
              onClick={handleSubmitIssue}
              disabled={isSubmittingIssue}
            >
              {isSubmittingIssue ? <Loader2 className="animate-spin" size={20} /> : 'Submit Report'}
            </button>
          </div>
        </div>
      )}

      {/* 2: My Reports */}
      {activeTab === 2 && (
        <div className="civics-reports-container fade-in">
          <div className="civics-header">
            <History size={32} className="text-primary" />
            <h2>My Reports</h2>
            <p>Track the status of your submitted issues.</p>
          </div>

          {isLoading ? (
            <div className="loading-state"><Loader2 className="animate-spin" size={32} /></div>
          ) : myReports.length === 0 ? (
            <div className="empty-state premium-card">
              <CheckCircle size={48} className="text-success" />
              <h3>All Good!</h3>
              <p>You haven't reported any issues yet.</p>
            </div>
          ) : (
            <div className="reports-list">
              {myReports.map((report, idx) => (
                <div key={idx} className="report-card premium-card">
                  <div className="report-header">
                    <span className="report-type">{report.type.replace('_', ' ').toUpperCase()}</span>
                    {getStatusBadge(report.status)}
                  </div>
                  <p className="report-desc">{report.description || report.content}</p>
                  <div className="report-footer">
                    <span className="report-date"><Clock size={14} /> {new Date(report.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3: Utilities */}
      {activeTab === 3 && (
        <div className="civics-utilities-container fade-in">
          <div className="civics-header">
            <Wallet size={32} className="text-success" />
            <h2>City Utilities</h2>
            <p>Manage and pay your municipal bills.</p>
          </div>

          {paymentSuccess ? (
            <div className="success-state premium-card fade-in">
              <div className="success-icon-wrapper"><CheckCircle size={48} /></div>
              <h3>Payment Successful!</h3>
              <p>Your utility bill has been paid and your balance is now $0.00.</p>
              <button className="outline-btn" onClick={() => setPaymentSuccess(false)}>View Receipt</button>
            </div>
          ) : (
            <div className="utility-bill-card premium-card">
              <div className="bill-header">
                <h3>Water & Solid Waste</h3>
                <span className="account-number">Acct: #8492-1102</span>
              </div>
              
              <div className="bill-amount">
                <span className="amount-label">Current Balance</span>
                <span className="amount-value text-danger">$142.50</span>
                <span className="due-date">Due: {new Date(Date.now() + 86400000 * 10).toLocaleDateString()}</span>
              </div>

              <div className="bill-breakdown">
                <div className="breakdown-row">
                  <span>Water Usage</span>
                  <span>$85.00</span>
                </div>
                <div className="breakdown-row">
                  <span>Sewer</span>
                  <span>$35.00</span>
                </div>
                <div className="breakdown-row">
                  <span>Trash Collection</span>
                  <span>$22.50</span>
                </div>
              </div>

              <button 
                className="primary-btn pay-btn" 
                onClick={handlePayUtility}
                disabled={isProcessingPayment}
              >
                {isProcessingPayment ? <Loader2 className="animate-spin" size={20} /> : 'Pay $142.50 Now'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 4: Account/Settings */}
      {activeTab === 4 && (
        <div className="civics-settings fade-in">
          <div className="premium-card empty-state">
            <h3>Civic Settings</h3>
            <p>Manage your linked property addresses and notification preferences.</p>
          </div>
        </div>
      )}

    </div>
  );
};
