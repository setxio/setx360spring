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
  Loader
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { SETX_COUNTY_LIST } from '../utils/geo';
import './JobsView.css';

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

export const JobsView: React.FC<{ activeTab?: number; user?: any; scope?: string }> = ({ activeTab = 0, user: propUser, scope = 'national' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [escalatedScope, setEscalatedScope] = useState<string | null>(null);

  const { user: contextUser, theme } = useApp();
  const user = propUser || contextUser;
  
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [appliedIds, setAppliedIds] = useState<string[]>([]);

  React.useEffect(() => {
    fetchJobs();
  }, [scope, user]);

  const fetchJobs = async () => {
    setIsLoading(true);
    let selectString = `*, user:profiles!user_id(community, county, state, country)`;
    const needsGeoFilter = user && scope !== 'national';
    if (needsGeoFilter) {
      selectString = `*, user:profiles!user_id!inner(community, county, state, country)`;
    }

    let query = supabase.from('jobs').select(selectString).eq('status', 'active').order('created_at', { ascending: false }).limit(20);

    if (needsGeoFilter) {
      if (scope === 'city') query = query.eq('user.community', user.community);
      else if (scope === 'county') {
        const isSETX = theme.startsWith('setx-');
        if (isSETX) {
          query = query.in('user.county', SETX_COUNTY_LIST);
        } else {
          query = query.eq('user.county', user.county);
        }
      }
      else if (scope === 'state') query = query.eq('user.state', user.state);
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
      setJobs(fetchedJobs.length > 0 ? fetchedJobs : FEATURED_JOBS); // Fallback to hardcoded if empty DB
      setEscalatedScope(currentEscalation);
    }
    setIsLoading(false);
  };

  const smartMatches = FEATURED_JOBS.filter(job => 
    (job as any).role_match?.includes(user?.role)
  );

  const handleApply = (id: string) => {
    setApplyingId(id);
    setTimeout(() => {
      setApplyingId(null);
      setAppliedIds(prev => [...prev, id]);
    }, 1500);
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

      {smartMatches.length > 0 && (
        <section className="jobs-section smart-match-section">
          <div className="section-header">
            <h2 className="smart-title"><Sparkles size={20} /> Smart Matches for You</h2>
          </div>
          <div className="jobs-list horizontal-scroll">
            {smartMatches.map(job => (
              <div key={job.id} className="job-card glass smart-card">
                <div className="job-card-main">
                  <div className="company-logo">{job.logo}</div>
                  <div className="job-info">
                    <h3>{job.title}</h3>
                    <p className="company-name">{job.company}</p>
                  </div>
                </div>
                <div className="job-card-footer">
                  <div className="job-meta">
                    <span><MapPin size={12} /> {job.location}</span>
                  </div>
                  <button 
                    className={`apply-btn-mini ${appliedIds.includes(job.id) ? 'applied' : ''}`}
                    onClick={() => handleApply(job.id)}
                    disabled={applyingId === job.id || appliedIds.includes(job.id)}
                  >
                    {applyingId === job.id ? <Loader className="animate-spin" size={14} /> : 
                     appliedIds.includes(job.id) ? <CheckCircle2 size={14} /> : 'Quick Apply'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="jobs-section">
        <div className="section-header">
          <h2>Trending Categories</h2>
        </div>
        <div className="categories-grid">
          {['Technology', 'Medical', 'Construction', 'Oil & Gas'].map(cat => (
            <div key={cat} className="category-card glass">
              <Zap size={16} /> <span>{cat}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="jobs-section">
        <div className="section-header">
          <h2>Recent Postings</h2>
          <button className="see-all">View All</button>
        </div>
        <div className="jobs-list">
          {jobs.map((job: any) => (
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
          ))}
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
            <button className="action-link">Update</button>
          </div>
          <div className="resume-preview">
            <FileText size={24} />
            <div className="resume-info">
              <p>James_Sullivan_Resume.pdf</p>
              <span>Uploaded 2 days ago</span>
            </div>
            <CheckCircle2 size={20} className="checked" />
          </div>
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
