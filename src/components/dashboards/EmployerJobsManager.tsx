import React, { useState, useEffect } from 'react';
import { supabase as supabase } from '../../lib/supabase';
import { Users, Plus, Loader2, CheckCircle, XCircle } from 'lucide-react';
import type { User } from '../../types/user';

export const EmployerJobsManager: React.FC<{ user: User }> = ({ user }) => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [newJob, setNewJob] = useState({ title: '', company_name: '', location: '', salary_range: '', job_type: 'Full-time' });

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setIsLoading(true);
    // Fetch Jobs
    const { data: jobsData } = await supabase.from('job_postings').select('*').eq('employer_id', user.id).order('created_at', { ascending: false });
    setJobs(jobsData || []);

    // Fetch Candidates (Swipes)
    if (jobsData && jobsData.length > 0) {
      const jobIds = jobsData.map((j: any) => j.id);
      const { data: swipeData } = await supabase
        .from('job_swipes')
        .select('*, job_postings(title), candidate:profiles!candidate_id(name, email, role)')
        .in('job_id', jobIds)
        .eq('action', 'applied')
        .order('created_at', { ascending: false });
      setCandidates(swipeData || []);
    }
    setIsLoading(false);
  };

  const handlePostJob = async () => {
    if (!newJob.title || !newJob.company_name) return;
    setIsPosting(true);
    
    const { error } = await supabase.from('job_postings').insert([{
      employer_id: user.id,
      title: newJob.title,
      company_name: newJob.company_name,
      location: newJob.location,
      salary_range: newJob.salary_range,
      job_type: newJob.job_type
    }]);

    setIsPosting(false);
    if (!error) {
      setNewJob({ title: '', company_name: '', location: '', salary_range: '', job_type: 'Full-time' });
      fetchData();
    } else {
      alert("Error posting job: " + error.message);
    }
  };

  if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Loader2 className="animate-spin" /></div>;

  return (
    <div className="fade-in">
      <div className="elite-widget" style={{ marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}><Plus size={20} /> Post a New Job</h3>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <input type="text" placeholder="Job Title (e.g. Lead Designer)" value={newJob.title} onChange={e => setNewJob({...newJob, title: e.target.value})} className="glass-input" style={{ flex: 1, minWidth: 200, padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'white' }} />
          <input type="text" placeholder="Company Name" value={newJob.company_name} onChange={e => setNewJob({...newJob, company_name: e.target.value})} className="glass-input" style={{ flex: 1, minWidth: 200, padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'white' }} />
          <input type="text" placeholder="Location" value={newJob.location} onChange={e => setNewJob({...newJob, location: e.target.value})} className="glass-input" style={{ width: 140, padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'white' }} />
          <input type="text" placeholder="Salary Range" value={newJob.salary_range} onChange={e => setNewJob({...newJob, salary_range: e.target.value})} className="glass-input" style={{ width: 140, padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'white' }} />
          <select value={newJob.job_type} onChange={e => setNewJob({...newJob, job_type: e.target.value})} className="glass-input" style={{ padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: '#1e1e24', color: 'white' }}>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
          </select>
          <button onClick={handlePostJob} disabled={isPosting} className="primary-btn" style={{ height: 44 }}>Post Job</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="elite-widget">
          <h3 style={{ margin: '0 0 16px' }}>Active Listings</h3>
          {jobs.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No jobs posted yet.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {jobs.map(j => (
                <div key={j.id} style={{ padding: 16, background: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{j.title}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{j.location} • {j.job_type} • {j.salary_range}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="elite-widget">
          <h3 style={{ margin: '0 0 16px' }}>Candidates (Swiped Right)</h3>
          {candidates.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No candidates yet.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {candidates.map(c => (
                <div key={c.id} style={{ padding: 16, background: 'rgba(255,255,255,0.05)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{c.candidate?.name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Applied for: {c.job_postings?.title}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="icon-btn" style={{ color: '#10b981' }}><CheckCircle size={20} /></button>
                    <button className="icon-btn" style={{ color: '#ef4444' }}><XCircle size={20} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

