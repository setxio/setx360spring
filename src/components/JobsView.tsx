import React, { useState } from 'react';
import { 
  Search, 
  FileText, 
  MapPin, 
  DollarSign, 
  Filter,
  ChevronRight,
  Star,
  CheckCircle2,
  Sparkles,
  Zap,
  Loader,
  Monitor,
  HeartPulse,
  Ruler,
  Hammer,
  Droplet,
  Calculator,
  Briefcase,
  ShoppingBag,
  Users,
  Truck,
  Megaphone,
  UploadCloud,
  GraduationCap
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { SETX_COUNTY_LIST } from '../utils/geo';
import './JobsView.css';

const JOB_CATEGORIES = [
  { id: 'tech', label: 'Technology & Software', icon: <Monitor size={16} /> },
  { id: 'health', label: 'Healthcare & Medical', icon: <HeartPulse size={16} /> },
  { id: 'engineering', label: 'Engineering & Architecture', icon: <Ruler size={16} /> },
  { id: 'construction', label: 'Construction & Trades', icon: <Hammer size={16} /> },
  { id: 'industrial', label: 'Oil, Gas & Industrial', icon: <Droplet size={16} /> },
  { id: 'finance', label: 'Accounting & Finance', icon: <Calculator size={16} /> },
  { id: 'sales', label: 'Sales & Business Dev', icon: <Briefcase size={16} /> },
  { id: 'retail', label: 'Retail & Customer Service', icon: <ShoppingBag size={16} /> },
  { id: 'hr', label: 'Human Resources', icon: <Users size={16} /> },
  { id: 'education', label: 'Education & Training', icon: <GraduationCap size={16} /> },
  { id: 'logistics', label: 'Manufacturing & Logistics', icon: <Truck size={16} /> },
  { id: 'marketing', label: 'Marketing & PR', icon: <Megaphone size={16} /> }
];

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Remote';
  posted: string;
  logo: string;
  status?: 'Applied' | 'Interviewing' | 'Offered' | 'Declined';
  role_match?: string[];
}

const FEATURED_JOBS: Job[] = [
  { id: '1', title: 'Senior Product Designer', company: 'TechFlow Systems', location: 'Beaumont, TX', salary: '$120k - $160k', type: 'Full-time', posted: '2h ago', logo: 'TF', role_match: ['resident', 'v_resident'] },
  { id: '2', title: 'Construction Project Manager', company: 'SETX Build Group', location: 'Port Arthur, TX', salary: '$90k - $115k', type: 'Contract', posted: '5h ago', logo: 'SB', role_match: ['official', 'v_official', 'business'] },
  { id: '3', title: 'Patient Care Coordinator', company: 'Heritage Health', location: 'Orange, TX', salary: '$55k - $70k', type: 'Full-time', posted: '1d ago', logo: 'HH', role_match: ['resident', 'v_resident'] },
  { id: '4', title: 'Social Media Manager', company: 'Nexus Media', location: 'Beaumont, TX', salary: '$65k - $85k', type: 'Full-time', posted: '3h ago', logo: 'NM', role_match: ['media', 'v_media'] },
  { id: '5', title: 'Government Relations Liaison', company: 'City of Beaumont', location: 'Beaumont, TX', salary: '$95k - $130k', type: 'Full-time', posted: '6h ago', logo: 'CB', role_match: ['official', 'v_official'] }
];

const MY_APPLICATIONS: Job[] = [
  {
    id: '101',
    title: 'Marketing Specialist',
    company: 'Digital Wave',
    location: 'Remote',
    salary: '$75k - $90k',
    type: 'Remote',
    posted: '3d ago',
    logo: 'DW',
    status: 'Interviewing'
  },
  {
    id: '102',
    title: 'Logistics Coordinator',
    company: 'Port Logistics Inc',
    location: 'Nederland, TX',
    salary: '$60k - $75k',
    type: 'Full-time',
    posted: '1w ago',
    logo: 'PL',
    status: 'Applied'
  }
];

export const JobsView: React.FC<{ activeTab?: number; user?: any; scope?: string }> = ({ activeTab = 0, user: propUser, scope = 'state' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [escalatedScope, setEscalatedScope] = useState<string | null>(null);

  const { user: contextUser, theme } = useApp();
  const user = propUser || contextUser;
  
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [appliedIds, setAppliedIds] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedResume, setUploadedResume] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [swipeCardIdx, setSwipeCardIdx] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [cardOffset, setCardOffset] = useState(0);
  const swipeDragStart = React.useRef<number | null>(null);

  React.useEffect(() => {
    fetchJobs();
  }, [scope, user]);

  const fetchJobs = async () => {
    setIsLoading(true);
    let selectString = `*, employer:profiles!employer_id(community, county, state, country)`;
    const needsGeoFilter = user && scope !== 'national';
    if (needsGeoFilter) {
      selectString = `*, employer:profiles!employer_id!inner(community, county, state, country)`;
    }

    let query = supabase.from('job_postings').select(selectString).eq('status', 'open').order('created_at', { ascending: false }).limit(20);

    if (needsGeoFilter) {
      if (scope === 'city') query = query.eq('employer.community', user.community);
      else if (scope === 'county') {
        const isSETX = theme.startsWith('setx-');
        if (isSETX) {
          query = query.in('employer.county', SETX_COUNTY_LIST);
        } else {
          query = query.eq('employer.county', user.county);
        }
      }
      else if (scope === 'state') query = query.eq('employer.state', user.state);
      else if (scope === 'region') query = query.eq('employer.state', user.state);
    }

    const { data, error } = await query;
    let fetchedJobs = data || [];
    let currentEscalation: string | null = null;

    if (needsGeoFilter && fetchedJobs.length < 3 && scope !== 'national') {
      const escalationMap: Record<string, { nextScope: string; filterKey: string; filterValue: string; label: string }> = {
        city: { nextScope: 'county', filterKey: 'user.county', filterValue: user.county, label: `${user.county || 'your'} County` },
        county: { nextScope: 'state', filterKey: 'user.state', filterValue: user.state, label: user.state || 'your state' },
        state: { nextScope: 'national', filterKey: '', filterValue: '', label: 'nationwide' },
      };
      const esc = escalationMap[scope];
      if (esc && esc.filterValue) {
        let escQuery = supabase.from('jobs').select(`*, user:profiles!user_id!inner(community, county, state, country)`).eq('status', 'active').order('created_at', { ascending: false }).limit(20);
        if (esc.nextScope !== 'national') escQuery = escQuery.eq(esc.filterKey, esc.filterValue);
        const { data: escData } = await escQuery;
        if (escData && escData.length > 0) {
          const existingIds = new Set(fetchedJobs.map((j: any) => j.id));
          const newJobs = escData.filter((j: any) => !existingIds.has(j.id));
          fetchedJobs = [...fetchedJobs, ...newJobs];
          currentEscalation = esc.label;
        }
      }
    }

    if (!error) {
      // Get user's past swipes so we don't show them again
      if (user) {
        const { data: pastSwipes } = await supabase.from('job_swipes').select('job_id').eq('candidate_id', user.id);
        const swipedIds = new Set((pastSwipes || []).map(s => s.job_id));
        fetchedJobs = fetchedJobs.filter((j: any) => !swipedIds.has(j.id));
      }
      setJobs(fetchedJobs.length > 0 ? fetchedJobs : FEATURED_JOBS); // Fallback to hardcoded if empty DB
      setEscalatedScope(currentEscalation);
    }
    setIsLoading(false);
  };

  // For demo, if using db jobs, just show all of them as smart matches
  const smartMatches = jobs.length > 0 && jobs[0].employer_id ? jobs : FEATURED_JOBS.filter(job => 
    (job as any).role_match?.includes(user?.role)
  );

  const filteredJobs = jobs.filter((job: any) => 
    !searchQuery || 
    job.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (job.company_name || job.company || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleApply = (id: string) => {
    setApplyingId(id);
    recordSwipe(id, 'applied');
    setTimeout(() => {
      setApplyingId(null);
      setAppliedIds(prev => [...prev, id]);
    }, 1500);
  };

  const recordSwipe = async (jobId: string, action: 'applied' | 'passed') => {
    if (!user) return;
    await supabase.from('job_swipes').insert([{ candidate_id: user.id, job_id: jobId, action }]);
  };

  const renderHome = () => (
    <div className="jobs-content">
      <header className="jobs-header">
        <div className="jobs-welcome">
          <h1>Hello, {user?.name.split(' ')[0]}</h1>
          <p>We found {smartMatches.length} jobs that match your {user?.role} profile.</p>
        </div>
        <div className="jobs-search-bar">
          <Search size={20} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search job titles or companies..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="filter-btn">
            <Filter size={18} />
          </button>
        </div>
      </header>
      
      {escalatedScope && (
        <div style={{
          padding: '10px 16px',
          margin: '0 16px 16px',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(157,0,255,0.08))',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.82rem',
          color: 'var(--text-muted)',
          fontWeight: 500
        }}>
          <span>Expanded to <strong style={{ color: 'var(--primary)' }}>{escalatedScope}</strong> — not enough local jobs yet</span>
        </div>
      )}

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <Loader className="animate-spin" size={32} color="var(--primary)" />
        </div>
      ) : (
        <>

      {!searchQuery && smartMatches.length > 0 && (
        <section className="jobs-section smart-match-section">
          <div className="section-header">
            <h2 className="smart-title"><Sparkles size={20} /> Smart Matches</h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{Math.max(0, smartMatches.length - swipeCardIdx)} remaining</span>
          </div>

          {swipeCardIdx >= smartMatches.length ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', background: 'var(--bg-soft)', borderRadius: '20px', border: '1px dashed var(--border)' }}>
              <Sparkles size={32} color="var(--primary)" style={{ marginBottom: '12px' }} />
              <h3 style={{ margin: '0 0 8px', color: 'var(--text)' }}>All caught up!</h3>
              <p style={{ margin: '0 0 16px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Check back later for new matches.</p>
              <button onClick={() => setSwipeCardIdx(0)} style={{ background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '12px', padding: '10px 24px', cursor: 'pointer', fontWeight: 700 }}>Reset</button>
            </div>
          ) : (
            <div
              style={{ position: 'relative', height: '220px' }}
              onMouseDown={(e) => { swipeDragStart.current = e.clientX; setCardOffset(0); }}
              onMouseMove={(e) => { if (swipeDragStart.current !== null) setCardOffset(e.clientX - swipeDragStart.current); }}
              onMouseUp={() => {
                if (swipeDragStart.current !== null) {
                  if (cardOffset > 80) { 
                    setSwipeDirection('right'); 
                    recordSwipe(smartMatches[swipeCardIdx].id, 'applied');
                    setTimeout(() => { setSwipeCardIdx(i => i + 1); setSwipeDirection(null); setCardOffset(0); }, 300); 
                  }
                  else if (cardOffset < -80) { 
                    setSwipeDirection('left'); 
                    recordSwipe(smartMatches[swipeCardIdx].id, 'passed');
                    setTimeout(() => { setSwipeCardIdx(i => i + 1); setSwipeDirection(null); setCardOffset(0); }, 300); 
                  }
                  else setCardOffset(0);
                  swipeDragStart.current = null;
                }
              }}
              onMouseLeave={() => { swipeDragStart.current = null; setCardOffset(0); }}
            >
              {smartMatches.slice(swipeCardIdx, swipeCardIdx + 2).reverse().map((job, stackI, arr) => {
                const isTop = stackI === arr.length - 1;
                const rotate = isTop ? (cardOffset / 20) : 0;
                const translateX = isTop ? cardOffset : (arr.length - 1 - stackI) * 6;
                const scale = isTop ? 1 : 1 - (arr.length - 1 - stackI) * 0.04;
                const translateY = isTop ? 0 : (arr.length - 1 - stackI) * 8;
                return (
                  <div
                    key={job.id}
                    style={{
                      position: 'absolute', width: '100%', borderRadius: '20px',
                      background: 'var(--bg-soft)', border: '1px solid var(--border)',
                      padding: '20px', boxSizing: 'border-box',
                      boxShadow: isTop ? '0 12px 40px rgba(0,0,0,0.2)' : '0 4px 12px rgba(0,0,0,0.1)',
                      transform: `translateX(${translateX}px) translateY(${translateY}px) rotate(${rotate}deg) scale(${scale})`,
                      transition: isTop && swipeDragStart.current === null ? 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)' : 'none',
                      cursor: isTop ? 'grab' : 'default',
                      userSelect: 'none',
                      zIndex: stackI,
                      opacity: swipeDirection && isTop ? 0 : 1,
                    }}
                  >
                    {/* Swipe indicators */}
                    {isTop && cardOffset > 30 && <div style={{ position: 'absolute', top: 16, left: 16, background: '#10b981', color: '#fff', padding: '4px 12px', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', border: '2px solid #10b981', opacity: Math.min(1, cardOffset / 80) }}>✓ APPLY</div>}
                    {isTop && cardOffset < -30 && <div style={{ position: 'absolute', top: 16, right: 16, background: '#ef4444', color: '#fff', padding: '4px 12px', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', border: '2px solid #ef4444', opacity: Math.min(1, -cardOffset / 80) }}>✕ PASS</div>}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <div style={{ width: 48, height: 48, borderRadius: '12px', background: 'linear-gradient(135deg, var(--primary), #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem', color: '#fff', flexShrink: 0 }}>{job.logo}</div>
                      <div>
                        <h3 style={{ margin: '0 0 2px', fontSize: '1rem', color: 'var(--text)' }}>{job.title}</h3>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{job.company}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                      <span style={{ fontSize: '0.75rem', padding: '4px 10px', background: 'rgba(99,102,241,0.1)', color: 'var(--primary)', borderRadius: '999px', fontWeight: 600 }}>{job.type}</span>
                      <span style={{ fontSize: '0.75rem', padding: '4px 10px', background: 'var(--bg)', color: 'var(--text-muted)', borderRadius: '999px' }}><MapPin size={10} style={{ verticalAlign: 'middle' }} /> {job.location}</span>
                      <span style={{ fontSize: '0.75rem', padding: '4px 10px', background: 'var(--bg)', color: 'var(--text-muted)', borderRadius: '999px' }}><DollarSign size={10} style={{ verticalAlign: 'middle' }} /> {job.salary}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {swipeCardIdx < smartMatches.length && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '12px' }}>
              <button onClick={() => setSwipeCardIdx(i => i + 1)} style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', border: '2px solid #ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1.3rem', color: '#ef4444' }}>✕</button>
              <button onClick={() => { handleApply(smartMatches[swipeCardIdx].id); setSwipeCardIdx(i => i + 1); }} style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #3b82f6)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1.5rem', color: '#fff', boxShadow: '0 8px 24px rgba(16,185,129,0.4)' }}><Zap size={26} /></button>
              <button onClick={() => {}} style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(234,179,8,0.1)', border: '2px solid #eab308', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1.3rem', color: '#eab308' }}><Star size={20} /></button>
            </div>
          )}
          <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>Swipe right to quick-apply · left to pass · ⚡ to apply now</p>
        </section>
      )}

      {!searchQuery && (
      <section className="jobs-section">
        <div className="section-header">
          <h2>Trending Categories</h2>
        </div>
        <div className="categories-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
          {JOB_CATEGORIES.map(cat => (
            <div key={cat.id} className="category-card glass">
              {cat.icon} <span>{cat.label}</span>
            </div>
          ))}
        </div>
      </section>
      )}

      <section className="jobs-section">
        <div className="section-header">
          <h2>{searchQuery ? `Search Results (${filteredJobs.length})` : 'Recent Postings'}</h2>
          {!searchQuery && <button className="see-all">View All</button>}
        </div>
        <div className="jobs-list">
          {filteredJobs.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px', width: '100%' }}>No jobs found matching "{searchQuery}"</p>
          ) : (
            filteredJobs.map((job: any) => (
              <div key={job.id} className="job-card glass">
              <div className="job-card-main">
                <div className="company-logo">{job.logo || (job.company_name ? job.company_name.substring(0, 2).toUpperCase() : 'JB')}</div>
                <div className="job-info">
                  <h3>{job.title}</h3>
                  <p className="company-name">{job.company_name || job.company}</p>
                  <div className="job-meta">
                    <span><MapPin size={14} /> {job.location}</span>
                    <span><DollarSign size={14} /> {job.salary_range || job.salary}</span>
                  </div>
                </div>
                <button className="save-job">
                  <Star size={18} />
                </button>
              </div>
              <div className="job-card-footer">
                <span className={`job-type ${(job.job_type || job.type || '').toLowerCase()}`}>{job.job_type || job.type}</span>
                <span className="posted-date">{job.posted || 'Just now'}</span>
              </div>
            </div>
            ))
          )}
        </div>
      </section>
      </>
      )}
    </div>
  );

  const renderSearch = () => (
    <div className="jobs-content">
      <div className="search-filters-header glass">
        <div className="search-input-wrapper">
          <Search size={20} />
          <input type="text" placeholder="Job title, keywords, or company" />
        </div>
        <div className="filter-chips">
          <button className="chip active">All</button>
          <button className="chip">Remote</button>
          <button className="chip">Full-time</button>
          <button className="chip">Part-time</button>
          <button className="chip">Contract</button>
        </div>
      </div>
      <div className="search-results">
        <p className="results-count">Showing 24 opportunities near you</p>
        <div className="jobs-list">
          {[...jobs, ...jobs].map((job: any, i) => (
            <div key={`${job.id}-${i}`} className="job-card glass">
              <div className="job-card-main">
                <div className="company-logo">{job.logo || (job.company_name ? job.company_name.substring(0, 2).toUpperCase() : 'JB')}</div>
                <div className="job-info">
                  <h3>{job.title}</h3>
                  <p className="company-name">{job.company_name || job.company}</p>
                </div>
                <ChevronRight size={20} className="arrow" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderApplied = () => (
    <div className="jobs-content">
      <header className="page-header">
        <h1>My Applications</h1>
        <p>Keep track of your career progress</p>
      </header>
      <div className="applications-list">
        {MY_APPLICATIONS.map(app => (
          <div key={app.id} className="app-card glass">
            <div className="app-header">
              <div className="company-logo">{app.logo}</div>
              <div className="app-title">
                <h3>{app.title}</h3>
                <p>{app.company}</p>
              </div>
              <span className={`status-badge ${app.status?.toLowerCase()}`}>
                {app.status}
              </span>
            </div>
            <div className="app-footer">
              <span className="applied-date">Applied 2 weeks ago</span>
              <button className="details-btn">View Details</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMessages = () => (
    <div className="jobs-content">
      <header className="page-header">
        <h1>Messages</h1>
        <p>Chat with recruiters and hiring managers</p>
      </header>
      <div className="chats-list">
        {[
          { name: 'Sarah Miller', company: 'TechFlow Systems', msg: 'We would like to schedule an interview...', time: '10:24 AM', unread: true },
          { name: 'John Davis', company: 'SETX Build', msg: 'Thanks for applying! Can you send...', time: 'Yesterday', unread: false }
        ].map((chat, i) => (
          <div key={i} className={`chat-item glass ${chat.unread ? 'unread' : ''}`}>
            <div className="chat-avatar">{chat.name[0]}</div>
            <div className="chat-body">
              <div className="chat-top">
                <h4>{chat.name}</h4>
                <span className="chat-time">{chat.time}</span>
              </div>
              <p className="chat-company">{chat.company}</p>
              <p className="chat-last-msg">{chat.msg}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="jobs-content">
      <div className="profile-hero glass">
        <div className="profile-info">
          <div className="profile-avatar large">JS</div>
          <h2>James Sullivan</h2>
          <p>Product Designer • Beaumont, TX</p>
        </div>
        <button className="edit-profile-btn">Edit Profile</button>
      </div>

      <div className="profile-sections">
        <div className="profile-card glass">
          <div className="card-header">
            <h3>Resume</h3>
            {uploadedResume && <button className="action-link" onClick={() => setUploadedResume(null)}>Replace</button>}
          </div>
          
          {!uploadedResume ? (
            <div 
              className={`resume-dropzone ${isDragging ? 'dragging' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  const file = e.dataTransfer.files[0];
                  if (file.type === 'application/pdf' || file.name.endsWith('.docx')) {
                    setUploadedResume(file);
                    setIsParsing(true);
                    setTimeout(() => setIsParsing(false), 2000);
                  } else {
                    alert('Please upload a PDF or DOCX file.');
                  }
                }
              }}
              style={{
                border: `2px dashed ${isDragging ? 'var(--primary)' : 'var(--border)'}`,
                borderRadius: '16px',
                padding: '32px 16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                background: isDragging ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              <div style={{ padding: '16px', borderRadius: '50%', background: 'var(--bg-soft)', color: 'var(--primary)' }}>
                <UploadCloud size={32} />
              </div>
              <div>
                <p style={{ fontWeight: 600, color: 'var(--text)', margin: '0 0 4px 0' }}>Click to upload or drag and drop</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>PDF or DOCX (max 5MB)</p>
              </div>
              <button className="primary-btn" style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '0.9rem', marginTop: '8px' }}>Select File</button>
            </div>
          ) : (
            <div className="resume-preview">
              {isParsing ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 0' }}>
                  <Loader className="animate-spin" size={24} color="var(--primary)" />
                  <div>
                    <p style={{ fontWeight: 600, margin: 0 }}>Parsing your resume...</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Extracting skills and experience</p>
                  </div>
                </div>
              ) : (
                <>
                  <FileText size={24} color="var(--primary)" />
                  <div className="resume-info">
                    <p>{uploadedResume.name}</p>
                    <span>Uploaded just now</span>
                  </div>
                  <CheckCircle2 size={20} className="checked" color="#10b981" />
                </>
              )}
            </div>
          )}
        </div>

        <div className="profile-card glass">
          <div className="card-header">
            <h3>Skills</h3>
            <button className="action-link">Add</button>
          </div>
          <div className="skills-tags">
            {['UI Design', 'React', 'TypeScript', 'Figma', 'Project Management'].map(skill => (
              <span key={skill} className="skill-tag">{skill}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  switch (activeTab) {
    case 0: return renderHome();
    case 1: return renderSearch();
    case 2: return renderApplied();
    case 3: return renderMessages();
    case 4: return renderProfile();
    default: return renderHome();
  }
};
