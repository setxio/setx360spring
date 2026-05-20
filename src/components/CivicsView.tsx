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
  Vote, 
  Activity, 
  CheckCircle2, 
  XCircle,
  Users,
  ShieldCheck,
  Key,
  FileText,
  UserCheck
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

  // Governance Voting State (Soulbound DID)
  const [proposals, setProposals] = useState<any[]>([]);
  const [isVoting, setIsVoting] = useState(false);
  const [voteError, setVoteError] = useState('');
  const [voteSuccess, setVoteSuccess] = useState('');

  // Smart City Telemetry State (Flare Network IoT Oracles)
  const [telemetryLogs, setTelemetryLogs] = useState<any[]>([]);
  const [isLoadingTelemetry, setIsLoadingTelemetry] = useState(false);

  // Regional Digital Council State (Texas HB 4518 Multi-Sig)
  const [councilSeats, setCouncilSeats] = useState<any[]>([]);
  const [councilProposals, setCouncilProposals] = useState<any[]>([]);
  const [isCouncilMember, setIsCouncilMember] = useState(false);
  const [isSigningMultiSig, setIsSigningMultiSig] = useState(false);
  const [isTriggeringVeto, setIsTriggeringVeto] = useState(false);

  useEffect(() => {
    if (activeTab === 2 && user) fetchMyReports();
    if (activeTab === 4 && user) {
      fetchProposals();
      fetchTelemetry();
      fetchDigitalCouncil();
    }
  }, [activeTab, user]);

  const fetchMyReports = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('civic_incidents')
      .select('*')
      .eq('reporter_id', user.id)
      .order('created_at', { ascending: false });
    
    if (data) setMyReports(data);
    else {
      setMyReports([
        { id: '1', type: 'pothole', description: 'Deep pothole on Main St', status: 'in_progress', created_at: new Date().toISOString() },
        { id: '2', type: 'streetlight', description: 'Light out at intersection', status: 'resolved', created_at: new Date(Date.now() - 86400000 * 5).toISOString() }
      ]);
    }
    setIsLoading(false);
  };

  const fetchProposals = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('civic_proposals').select('*').order('created_at', { ascending: false });
    if (!error && data) setProposals(data);
    else {
      setProposals([
        { id: 'prop_1', title: 'Allocate $250k DUNA Gas Fund for Smart Traffic Grid on Twin City Highway', description: 'Deploy Flare-verified IoT traffic sensors to dynamically optimize green light corridors between Nederland and Port Arthur.', yes_votes: 1420, no_votes: 380, status: 'active', end_time: new Date(Date.now() + 86400000 * 3).toISOString() },
        { id: 'prop_2', title: 'Establish 0% Platform Fee Municipal Delivery Subsidy for Local Restaurants', description: 'Utilize Ondo Treasury yield to permanently sponsor 100% of gig driver gas fees for independent food vendors in Orange County.', yes_votes: 2150, no_votes: 120, status: 'active', end_time: new Date(Date.now() + 86400000 * 7).toISOString() }
      ]);
    }
    setIsLoading(false);
  };

  const fetchTelemetry = async () => {
    setIsLoadingTelemetry(true);
    const { data, error } = await supabase.from('smart_city_telemetry_logs').select('*').order('verified_at', { ascending: false }).limit(5);
    if (!error && data) setTelemetryLogs(data);
    else {
      setTelemetryLogs([
        { device_id: 'METER_WATER_NEDERLAND_01', metric_value: '142850.5', flare_proof_hash: '0xFLARE_PROOF_8f9a2b1c3d4e5f6a', verified_at: new Date().toISOString() },
        { device_id: 'GRID_TRAFFIC_PORT_ARTHUR_04', metric_value: '842.0', flare_proof_hash: '0xFLARE_PROOF_1a2b3c4d5e6f7a8b', verified_at: new Date(Date.now() - 3600000).toISOString() },
        { device_id: 'SENSOR_AIR_ORANGE_02', metric_value: '32.4', flare_proof_hash: '0xFLARE_PROOF_9c8b7a6f5e4d3c2b', verified_at: new Date(Date.now() - 7200000).toISOString() },
      ]);
    }
    setIsLoadingTelemetry(false);
  };

  const fetchDigitalCouncil = async () => {
    const { data: seats } = await supabase.from('civic_digital_council').select('*, profiles(name, email)').order('seat_id', { ascending: true });
    const { data: cProps } = await supabase.from('council_proposals').select('*').order('created_at', { ascending: false });

    if (seats && seats.length > 0) {
      setCouncilSeats(seats);
      const isRep = seats.some(s => s.representative_profile_id === user?.id);
      setIsCouncilMember(isRep);
    } else {
      setCouncilSeats([
        { seat_id: 1, city_name: 'Beaumont', profiles: { name: 'Mayor Roy West' }, term_expiry_time: new Date(Date.now() + 86400000 * 500).toISOString(), term_count: 1, is_permanent_founder_seat: false },
        { seat_id: 2, city_name: 'Port Arthur', profiles: { name: 'Thurman Bartie' }, term_expiry_time: new Date(Date.now() + 86400000 * 500).toISOString(), term_count: 1, is_permanent_founder_seat: false },
        { seat_id: 3, city_name: 'Orange', profiles: { name: 'Larry Spears Jr.' }, term_expiry_time: new Date(Date.now() + 86400000 * 150).toISOString(), term_count: 2, is_permanent_founder_seat: false },
        { seat_id: 4, city_name: 'Groves/Nederland', profiles: { name: 'Chris Borne' }, term_expiry_time: new Date(Date.now() + 86400000 * 150).toISOString(), term_count: 2, is_permanent_founder_seat: false },
        { seat_id: 5, city_name: 'SETX.io Tech Infrastructure', profiles: { name: 'SETX.io LLC Core Dev' }, term_expiry_time: new Date(Date.now() + 86400000 * 3650).toISOString(), term_count: 1, is_permanent_founder_seat: true },
      ]);
    }

    if (cProps && cProps.length > 0) setCouncilProposals(cProps);
    else {
      setCouncilProposals([
        { id: 101, description: 'Emergency $15,000 Hurricane Disaster Relief Grant for Port Arthur Clean-up Crews', target_amount: 15000.00, recipient_address: 'rPortArthurReliefFundXRP123...', approval_count: 2, citizen_veto_count: 12, status: 'pending' },
        { id: 102, description: 'Contract 3rd-Party Dev to build Regional Flood Warning PWA Widget', target_amount: 8500.00, recipient_address: 'rDevBountyWalletXRP456...', approval_count: 3, citizen_veto_count: 4, status: 'approved' }
      ]);
    }
  };

  const handleSubmitIssue = async () => {
    if (!issueDescription || !issueLocation) { alert("Please provide a description and location."); return; }
    setIsSubmittingIssue(true);
    const { error } = await supabase.from('civic_incidents').insert([{ reporter_id: user?.id, type: issueType, description: issueDescription, location: issueLocation, status: 'open', priority: 'medium', community: user?.community, county: user?.county, state: user?.state }]);
    setIsSubmittingIssue(false);
    if (error) alert('Failed to submit report. Please ensure database tables exist.');
    else {
      alert('Report submitted successfully! City staff notified.');
      setIssueDescription(''); setIssueLocation('');
      if (activeTab === 2) fetchMyReports();
    }
  };

  const handlePayUtility = async () => {
    setIsProcessingPayment(true);
    const result = await payUtilityBill(user.id, 142.50, '#8492-1102');
    setIsProcessingPayment(false);
    if (result.success) setPaymentSuccess(true);
    else alert('Payment failed. Please try again.');
  };

  const handleCastVote = async (proposalId: string, support: boolean) => {
    setVoteError(''); setVoteSuccess(''); setIsVoting(true);
    try {
      const { data: registry, error: regErr } = await supabase.from('civic_voter_registry').select('sbt_token_id').eq('profile_id', user?.id).single();
      if (regErr || !registry) throw new Error('Voting Error: Caller does not possess a valid SETXIdentity Soulbound Token.');
      const { data: existingVote } = await supabase.from('ballot_votes').select('id').eq('proposal_id', proposalId).eq('voter_id', user?.id).single();
      if (existingVote) throw new Error('Voting Error: Citizen has already cast their single allocated ballot.');
      const { error: insertErr } = await supabase.from('ballot_votes').insert({ proposal_id: proposalId, voter_id: user?.id, vote_choice: support ? 'yes' : 'no', weight: 1 });
      if (insertErr) throw insertErr;

      setProposals(proposals.map(p => p.id === proposalId ? { ...p, yes_votes: support ? p.yes_votes + 1 : p.yes_votes, no_votes: !support ? p.no_votes + 1 : p.no_votes } : p));
      setVoteSuccess('Ballot cast successfully! 1 Vote securely logged to the civic ledger.');
    } catch (err: any) { setVoteError(err.message); } finally { setIsVoting(false); }
  };

  // Multi-Sig Council Signing Handler (Tier 2)
  const handleSignMultiSig = async (proposalId: number) => {
    setVoteError(''); setVoteSuccess(''); setIsSigningMultiSig(true);
    try {
      const { error } = await supabase.from('council_proposal_approvals').insert({ proposal_id: proposalId, council_member_id: user?.id });
      if (error) throw error;
      setCouncilProposals(councilProposals.map(p => p.id === proposalId ? { ...p, approval_count: p.approval_count + 1, status: p.approval_count + 1 >= 3 ? 'approved' : p.status } : p));
      setVoteSuccess('Multi-Sig Key Applied! Proposal approval count updated.');
    } catch (err: any) { setVoteError('Failed to sign proposal: ' + err.message); } finally { setIsSigningMultiSig(false); }
  };

  // Sovereign Citizen Veto Handler (Tier 3)
  const handleTriggerVeto = async (proposalId: number) => {
    setVoteError(''); setVoteSuccess(''); setIsTriggeringVeto(true);
    try {
      const { error } = await supabase.from('citizen_referendums').insert({ proposal_id: proposalId, citizen_id: user?.id });
      if (error) throw error;
      setCouncilProposals(councilProposals.map(p => p.id === proposalId ? { ...p, citizen_veto_count: p.citizen_veto_count + 1, status: p.citizen_veto_count + 1 >= 1000 ? 'vetoed' : p.status } : p));
      setVoteSuccess('Sovereign Veto Logged! Ejecting rogue council action if threshold reached.');
    } catch (err: any) { setVoteError('Failed to log veto: ' + err.message); } finally { setIsTriggeringVeto(false); }
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
      
      {activeTab === 0 && (
        <div className="civics-home fade-in">
          <div className="civics-hero premium-card">
            <Landmark size={48} className="text-primary" />
            <h2>City Hall Online</h2>
            <p>Welcome to your digital civic center. Report issues, pay bills, and vote on community proposals.</p>
          </div>
          <div className="civics-grid">
            <div className="civics-action-card premium-card"><div className="icon-wrapper alert"><AlertTriangle size={24} /></div><div className="card-content"><h3>Report 311 Issue</h3><p>Potholes, graffiti, streetlights</p></div><ChevronRight size={20} className="text-secondary" /></div>
            <div className="civics-action-card premium-card"><div className="icon-wrapper wallet"><Wallet size={24} /></div><div className="card-content"><h3>Pay Utilities</h3><p>Water, Trash, Sewer bills</p></div><ChevronRight size={20} className="text-secondary" /></div>
            <div className="civics-action-card premium-card" onClick={() => alert('Navigate to Proposals tab')}><div className="icon-wrapper info" style={{ background: 'rgba(16,185,129,0.2)', color: '#10b981' }}><Vote size={24} /></div><div className="card-content"><h3>Civic Proposals</h3><p>2 Active Ballots</p></div><ChevronRight size={20} className="text-secondary" /></div>
          </div>
        </div>
      )}

      {activeTab === 1 && (
        <div className="civics-form-container fade-in">
          <div className="civics-header"><AlertTriangle size={32} className="text-warning" /><h2>Report an Issue</h2><p>Help keep your city safe and clean.</p></div>
          <div className="civics-form premium-card">
            <div className="input-group"><label>Issue Type</label><select value={issueType} onChange={(e) => setIssueType(e.target.value)}><option value="pothole">Pothole / Road Repair</option><option value="streetlight">Streetlight Outage</option><option value="graffiti">Graffiti Removal</option><option value="code_violation">Code Violation</option><option value="utility_issue">Utility Issue (Water/Gas)</option><option value="other">Other</option></select></div>
            <div className="input-group"><label><MapPin size={16} /> Location</label><input type="text" placeholder="e.g. 123 Main St, near intersection" value={issueLocation} onChange={(e) => setIssueLocation(e.target.value)} /></div>
            <div className="input-group"><label>Description</label><textarea placeholder="Provide details about the issue..." value={issueDescription} onChange={(e) => setIssueDescription(e.target.value)} rows={4} /></div>
            <div className="input-group"><label><Camera size={16} /> Photo Evidence (Optional)</label><div className="photo-upload-placeholder"><Camera size={24} /><span>Tap to take or upload a photo</span></div></div>
            <button className="primary-btn submit-btn" onClick={handleSubmitIssue} disabled={isSubmittingIssue}>{isSubmittingIssue ? <Loader2 className="animate-spin" size={20} /> : 'Submit Report'}</button>
          </div>
        </div>
      )}

      {activeTab === 2 && (
        <div className="civics-reports-container fade-in">
          <div className="civics-header"><History size={32} className="text-primary" /><h2>My Reports</h2><p>Track the status of your submitted issues.</p></div>
          {isLoading ? <div className="loading-state"><Loader2 className="animate-spin" size={32} /></div> : myReports.length === 0 ? <div className="empty-state premium-card"><CheckCircle size={48} className="text-success" /><h3>All Good!</h3><p>You haven't reported any issues yet.</p></div> : (
            <div className="reports-list">
              {myReports.map((report, idx) => (
                <div key={idx} className="report-card premium-card"><div className="report-header"><span className="report-type">{report.type.replace('_', ' ').toUpperCase()}</span>{getStatusBadge(report.status)}</div><p className="report-desc">{report.description || report.content}</p><div className="report-footer"><span className="report-date"><Clock size={14} /> {new Date(report.created_at).toLocaleDateString()}</span></div></div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 3 && (
        <div className="civics-utilities-container fade-in">
          <div className="civics-header"><Wallet size={32} className="text-success" /><h2>City Utilities</h2><p>Manage and pay your municipal bills.</p></div>
          {paymentSuccess ? <div className="success-state premium-card fade-in"><div className="success-icon-wrapper"><CheckCircle size={48} /></div><h3>Payment Successful!</h3><p>Your utility bill has been paid and your balance is now $0.00.</p><button className="outline-btn" onClick={() => setPaymentSuccess(false)}>View Receipt</button></div> : (
            <div className="utility-bill-card premium-card"><div className="bill-header"><h3>Water & Solid Waste</h3><span className="account-number">Acct: #8492-1102</span></div><div className="bill-amount"><span className="amount-label">Current Balance</span><span className="amount-value text-danger">$142.50</span><span className="due-date">Due: {new Date(Date.now() + 86400000 * 10).toLocaleDateString()}</span></div><div className="bill-breakdown"><div className="breakdown-row"><span>Water Usage</span><span>$85.00</span></div><div className="breakdown-row"><span>Sewer</span><span>$35.00</span></div><div className="breakdown-row"><span>Trash Collection</span><span>$22.50</span></div></div><button className="primary-btn pay-btn" onClick={handlePayUtility} disabled={isProcessingPayment}>{isProcessingPayment ? <Loader2 className="animate-spin" size={20} /> : 'Pay $142.50 Now'}</button></div>
          )}
        </div>
      )}

      {/* 4: Proposals & Voting (Regional Digital Council Multi-Sig & SBT Governance) */}
      {activeTab === 4 && (
        <div className="civics-voting-container fade-in">
          <div className="civics-header" style={{ marginBottom: 24 }}>
            <Vote size={32} className="text-primary" />
            <h2>Community Governance</h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              Governed under Texas HB 4518. Multi-Sig Digital Council manages treasury yield (Tier 2). Citizens retain Sovereign Veto via Soulbound DIDs (Tier 3).
            </p>
          </div>

          {voteError && <div className="premium-card" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444', color: '#ef4444', padding: 16, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}><XCircle size={24} /> <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{voteError}</div></div>}
          {voteSuccess && <div className="premium-card" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid #10b981', color: '#10b981', padding: 16, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}><CheckCircle2 size={24} /> <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{voteSuccess}</div></div>}

          {/* REGIONAL DIGITAL COUNCIL COMMAND CENTER (Texas HB 4518 Multi-Sig) */}
          <div className="premium-card glass" style={{ padding: 28, marginBottom: 32, border: '2px solid #6366f1', background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(26,26,46,0.6) 100%)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Users size={28} color="#6366f1" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#fff' }}>Regional Digital Council (DUNA Administrators)</h3>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Federated 5-Seat Multi-Sig Council. Staggered 2-Year Terms. Strict 2-Term Cap.</p>
                </div>
              </div>
              {isCouncilMember && <span style={{ background: '#6366f1', color: '#fff', padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}><Key size={14} /> ACTIVE MULTI-SIG KEYHOLDER</span>}
            </div>

            {/* 5 Council Seats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
              {councilSeats.map((seat) => (
                <div key={seat.seat_id} className="premium-card" style={{ background: 'rgba(255,255,255,0.03)', border: seat.is_permanent_founder_seat ? '1px solid #eab308' : '1px solid rgba(255,255,255,0.1)', padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: seat.is_permanent_founder_seat ? '#eab308' : '#6366f1' }}>SEAT {seat.seat_id}</span>
                    {seat.is_permanent_founder_seat && <span style={{ fontSize: '0.65rem', background: 'rgba(234,179,8,0.2)', color: '#eab308', padding: '2px 6px', borderRadius: 8, fontWeight: 700 }}>FOUNDER SEAT</span>}
                  </div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>{seat.city_name}</h4>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, marginBottom: 8 }}>{seat.profiles?.name || 'Vacant'}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={12} /> Term {seat.term_count}/2 · Expires {new Date(seat.term_expiry_time).getFullYear()}
                  </div>
                </div>
              ))}
            </div>

            {/* Multi-Sig Proposals (Tier 2 & Tier 3) */}
            <h4 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}><FileText size={18} color="#6366f1" /> Active Multi-Sig Actions (3-of-5 Threshold)</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {councilProposals.map((prop) => {
                const approvalPercent = Math.min(100, Math.round((prop.approval_count / 3) * 100));
                const vetoPercent = Math.min(100, Math.round((prop.citizen_veto_count / 1000) * 100));

                return (
                  <div key={prop.id} className="premium-card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <span className={`status-badge ${prop.status}`} style={{ padding: '4px 10px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', background: prop.status === 'approved' ? 'rgba(16,185,129,0.2)' : prop.status === 'vetoed' ? 'rgba(239,68,68,0.2)' : 'rgba(234,179,8,0.2)', color: prop.status === 'approved' ? '#10b981' : prop.status === 'vetoed' ? '#ef4444' : '#eab308' }}>
                        {prop.status}
                      </span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#10b981' }}>${Number(prop.target_amount).toLocaleString()}</span>
                    </div>
                    <p style={{ margin: '0 0 16px 0', fontSize: '0.95rem', color: '#fff', lineHeight: 1.5, fontWeight: 600 }}>{prop.description}</p>
                    
                    {/* Progress Bars */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 20 }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, marginBottom: 6 }}>
                          <span style={{ color: '#6366f1' }}>Council Consensus (3-of-5 Required)</span>
                          <span style={{ color: '#6366f1' }}>{prop.approval_count}/3 Sigs ({approvalPercent}%)</span>
                        </div>
                        <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}><div style={{ width: `${approvalPercent}%`, background: '#6366f1', height: '100%' }} /></div>
                      </div>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, marginBottom: 6 }}>
                          <span style={{ color: '#ef4444' }}>Sovereign Citizen Veto (1,000 Required)</span>
                          <span style={{ color: '#ef4444' }}>{prop.citizen_veto_count}/1000 ({vetoPercent}%)</span>
                        </div>
                        <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}><div style={{ width: `${vetoPercent}%`, background: '#ef4444', height: '100%' }} /></div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      <button className="primary-btn" style={{ padding: '10px 20px', fontWeight: 800, background: '#6366f1', display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => handleSignMultiSig(prop.id)} disabled={isSigningMultiSig || prop.status !== 'pending'}>
                        {isSigningMultiSig ? <Loader2 className="animate-spin" size={16} /> : <Key size={16} />}
                        Sign Multi-Sig (Council Only)
                      </button>
                      <button className="danger-btn" style={{ padding: '10px 20px', fontWeight: 800, background: 'rgba(239,68,68,0.2)', border: '1px solid #ef4444', color: '#ef4444', display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => handleTriggerVeto(prop.id)} disabled={isTriggeringVeto || prop.status === 'vetoed'}>
                        {isTriggeringVeto ? <Loader2 className="animate-spin" size={16} /> : <ShieldCheck size={16} />}
                        Trigger Sovereign Veto (1 SBT)
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Citizen Proposals List (Tier 3 General Citizenry Ballots) */}
          <h3 style={{ margin: '0 0 20px 0', fontSize: '1.25rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}><UserCheck size={22} color="var(--primary)" /> General Citizenry Referendums</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 32 }}>
            {isLoading ? <div style={{ textAlign: 'center', padding: 40 }}><Loader2 className="animate-spin" size={32} /></div> : proposals.map(prop => {
              const totalVotes = prop.yes_votes + prop.no_votes;
              const yesPercent = totalVotes > 0 ? Math.round((prop.yes_votes / totalVotes) * 100) : 0;
              const noPercent = totalVotes > 0 ? Math.round((prop.no_votes / totalVotes) * 100) : 0;

              return (
                <div key={prop.id} className="premium-card proposal-card glass" style={{ padding: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}><span className="proposal-badge active">ACTIVE BALLOT</span><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={14} /> Closes {new Date(prop.end_time).toLocaleDateString()}</span></div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 8 }}>{prop.title}</h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.5 }}>{prop.description}</p>
                  
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, marginBottom: 8 }}><span style={{ color: '#10b981' }}>Yes: {yesPercent}% ({prop.yes_votes})</span><span style={{ color: '#ef4444' }}>No: {noPercent}% ({prop.no_votes})</span></div>
                    <div style={{ height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden', display: 'flex' }}><div style={{ width: `${yesPercent}%`, background: '#10b981' }} /><div style={{ width: `${noPercent}%`, background: '#ef4444' }} /></div>
                  </div>

                  <div style={{ display: 'flex', gap: 16 }}>
                    <button className="success-btn" style={{ flex: 1, padding: 14, fontWeight: 700 }} onClick={() => handleCastVote(prop.id, true)} disabled={isVoting}>{isVoting ? <Loader2 className="animate-spin" size={18} /> : 'Vote Yes (1 SBT)'}</button>
                    <button className="danger-btn" style={{ flex: 1, padding: 14, fontWeight: 700, background: 'rgba(239,68,68,0.2)', border: '1px solid #ef4444', color: '#ef4444' }} onClick={() => handleCastVote(prop.id, false)} disabled={isVoting}>{isVoting ? <Loader2 className="animate-spin" size={18} /> : 'Vote No (1 SBT)'}</button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Flare Network IoT Telemetry Widget */}
          <div className="premium-card glass" style={{ padding: 24, borderTop: '2px solid var(--accent)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}><Activity size={24} className="text-accent pulse" /><div><h3 style={{ margin: 0, fontWeight: 800 }}>Municipal IoT Telemetry (Flare Network)</h3><p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Decentralized oracle proofs preventing single-point municipal data manipulation.</p></div></div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead><tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}><th style={{ padding: '12px 8px' }}>Device ID</th><th style={{ padding: '12px 8px' }}>Metric Value</th><th style={{ padding: '12px 8px' }}>Flare State Proof Hash</th><th style={{ padding: '12px 8px' }}>Verified At</th></tr></thead>
                <tbody>{isLoadingTelemetry ? <tr><td colSpan={4} style={{ padding: 24, textAlign: 'center' }}><Loader2 className="animate-spin" /></td></tr> : telemetryLogs.map((log, idx) => (<tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}><td style={{ padding: '12px 8px', fontWeight: 700, color: 'var(--text-primary)' }}>{log.device_id}</td><td style={{ padding: '12px 8px', color: 'var(--accent)', fontWeight: 600 }}>{log.metric_value}</td><td style={{ padding: '12px 8px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{log.flare_proof_hash}</td><td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>{new Date(log.verified_at).toLocaleTimeString()}</td></tr>))}</tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 5 && (
        <div className="civics-settings fade-in"><div className="premium-card empty-state"><h3>Civic Settings</h3><p>Manage your linked property addresses and notification preferences.</p></div></div>
      )}

    </div>
  );
};
