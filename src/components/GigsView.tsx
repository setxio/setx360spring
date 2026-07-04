import React, { useState } from 'react';
import { 
  Search, 
  MapPin, 
  DollarSign, 
  Filter,
  ChevronRight,
  Star,
  CheckCircle2,
  Zap,
  Clock,
  Car,
  Package,
  Wrench,
  Laptop,
  Dog,
  Calendar,
  Camera,
  MessageSquare,
  FileText,
  ShieldCheck,
  Briefcase,
  Home,
  Database,
  GraduationCap,
  Globe,
  TreePine,
  X
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { Avatar } from './Avatar';
import { CreateGigModal } from './CreateGigModal';
import { WorkerProfileModal } from './WorkerProfileModal';
import { CreateWorkerProfileModal } from './CreateWorkerProfileModal';
import { VerificationModal } from './VerificationModal';
import { GigApplicationModal } from './GigApplicationModal';
import './GigsView.css';

const GIG_CATEGORIES = [
  { id: 'driving', label: 'Delivery', icon: <Car size={16} /> },
  { id: 'tech', label: 'Tech Support', icon: <Laptop size={16} /> },
  { id: 'cleaning', label: 'House Cleaning', icon: <Home size={16} /> },
  { id: 'handyman', label: 'Handyman', icon: <Wrench size={16} /> },
  { id: 'yard', label: 'Yard Work', icon: <TreePine size={16} /> },
  { id: 'freelance', label: 'Digital Freelance', icon: <FileText size={16} /> },
  { id: 'admin', label: 'Administrative', icon: <Briefcase size={16} /> },
  { id: 'tutoring', label: 'Tutoring', icon: <GraduationCap size={16} /> },
  { id: 'moving', label: 'Moving & Packing', icon: <Package size={16} /> },
  { id: 'petcare', label: 'Pet Care', icon: <Dog size={16} /> },
  { id: 'events', label: 'Event Staffing', icon: <Calendar size={16} /> },
  { id: 'creative', label: 'Creative', icon: <Camera size={16} /> },
  { id: 'security', label: 'Security', icon: <ShieldCheck size={16} /> },
  { id: 'data', label: 'Data Entry', icon: <Database size={16} /> },
];

interface Gig {
  id: string;
  title: string;
  requester: string;
  requester_id?: string;
  avatar_url?: string;
  location: string;
  compensation: string;
  type: 'Local' | 'Remote';
  urgency: 'ASAP' | 'Flexible' | 'Scheduled';
  posted: string;
  status?: 'Active' | 'Completed' | 'Pending';
  verifiedOnly?: boolean;
  categoryId?: string;
  description?: string;
  clientRating?: number;
  clientReviewCount?: number;
}



const CITY_OPTIONS = [
  'All Cities',
  'Beaumont',
  'Port Arthur',
  'Nederland',
  'Port Neches',
  'Groves',
  'Bevil Oaks',
  'China',
  'Nome',
  'Taylor Landing'
];

export const GigsView: React.FC<{ activeTab?: number; user?: any; scope?: string; onNavigate?: (env: string, tab?: number, params?: any) => void }> = ({ activeTab = 0, user: propUser, onNavigate }) => {
  const [localTab, setLocalTab] = useState(activeTab);
  const [activeMode, setActiveMode] = useState<'client' | 'freelancer'>(activeTab === 1 || activeTab === 4 ? 'client' : 'freelancer');
  
  React.useEffect(() => {
    setLocalTab(activeTab);
    if (activeTab === 1 || activeTab === 4) {
      setActiveMode('client');
    } else {
      setActiveMode('freelancer');
    }
  }, [activeTab]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [workTypeFilter, setWorkTypeFilter] = useState<'All' | 'Local' | 'Remote'>('All');
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<any>(null);
  const [workerProfile, setWorkerProfile] = useState<any>(null);
  const [isWorkerModalOpen, setIsWorkerModalOpen] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [selectedGigForApplication, setSelectedGigForApplication] = useState<any>(null);
  const [workersDirectory, setWorkersDirectory] = useState<any[]>([]);
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const { user: contextUser, theme } = useApp();
  const user = propUser || contextUser;

  React.useEffect(() => {
    fetchGigs();
    fetchWorkerData();
    fetchMyPosts();
    fetchMyTasks();
  }, [user]);

  const fetchMyPosts = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('gigs')
      .select(`
        *,
        applications:gig_applications(
          id, applicant_id, status, message, created_at, answers,
          applicant:profiles!applicant_id(first_name, last_name, avatar_url)
        )
      `)
      .eq('requester_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setMyPosts(data);
    }
  };

  const fetchMyTasks = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('gig_applications')
      .select(`
        *,
        gig:gigs(*, requester:profiles!requester_id(first_name, last_name, avatar_url))
      `)
      .eq('applicant_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setMyTasks(data);
    }
  };

  const fetchWorkerData = async () => {
    if (user) {
      const { data } = await supabase.from('gig_worker_profiles').select('*').eq('id', user.id).single();
      if (data) setWorkerProfile(data);
    }
    
    const { data: dirData } = await supabase
      .from('gig_worker_profiles')
      .select(`
        *,
        profile:profiles!id(first_name, last_name, avatar_url, name)
      `)
      .order('success_rate', { ascending: false });
      
    if (dirData) setWorkersDirectory(dirData);
  };

  const fetchGigs = async () => {
    try {
      const { data, error } = await supabase
        .from('gigs')
        .select(`
          *,
          requester:profiles!requester_id(first_name, last_name, avatar_url, gig_client_rating, gig_client_reviews_count)
        `)
        .eq('status', 'Active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (data && data.length > 0) {
        const mapped = data.map(g => ({
          id: g.id,
          title: g.title,
          requester: g.requester ? `${g.requester.first_name} ${g.requester.last_name?.charAt(0) || ''}.` : 'Unknown',
          location: g.location || 'Remote',
          compensation: `${g.compensation_type === 'Hourly' ? '$' : '$'}${g.compensation_amount}${g.compensation_type === 'Hourly' ? '/hr' : ' flat'}`,
          type: g.type as 'Local' | 'Remote',
          urgency: g.urgency as 'ASAP' | 'Flexible' | 'Scheduled',
          posted: 'Just now',
          avatar_url: g.requester?.avatar_url,
          verifiedOnly: g.verified_only_until ? new Date(g.verified_only_until) > new Date() : false,
          categoryId: g.category_id,
          description: g.description,
          clientRating: g.requester?.gig_client_rating || 0,
          clientReviewCount: g.requester?.gig_client_reviews_count || 0,
          questions: g.questions,
          require_answers: g.require_answers
        }));
        setGigs(mapped);
      } else {
        setGigs([]);
      }
    } catch (e) {
      console.error('Error fetching gigs:', e);
    }
  };

  const handleAcceptApplicant = async (appId: string, gigId: string) => {
    try {
      // Set chosen applicant to Accepted
      await supabase.from('gig_applications').update({ status: 'Accepted' }).eq('id', appId);
      // Set others to Rejected
      await supabase.from('gig_applications').update({ status: 'Rejected' }).eq('gig_id', gigId).neq('id', appId);
      // Set gig to Pending (In Progress)
      await supabase.from('gigs').update({ status: 'Pending' }).eq('id', gigId);
      
      // Refresh My Posts
      fetchMyPosts();
    } catch (e) {
      console.error('Error accepting applicant:', e);
    }
  };

  const handleCancelGigByRequester = async (gigId: string) => {
    try {
      await supabase.from('gigs').update({ status: 'Cancelled' }).eq('id', gigId);
      await supabase.from('gig_applications').update({ status: 'Cancelled' }).eq('gig_id', gigId);
      fetchMyPosts();
    } catch (e) { console.error(e); }
  };

  const handleCancelGigByWorker = async (appId: string, gigId: string) => {
    try {
      await supabase.from('gig_applications').update({ status: 'Cancelled' }).eq('id', appId);
      await supabase.from('gigs').update({ status: 'Active' }).eq('id', gigId);
      fetchMyTasks();
      fetchMyPosts(); // just to refetch if needed
    } catch (e) { console.error(e); }
  };

  const handleCompleteTask = async (appId: string, gig: any) => {
    let deliverableUrl = null;
    if (gig.type === 'Remote' && gig.category !== 'Website / Tech') {
      deliverableUrl = window.prompt("Please provide a link to your digital deliverable (Google Drive, Dropbox, etc):");
      if (!deliverableUrl) {
         window.alert("A deliverable link is required to complete this gig.");
         return;
      }
    }
    try {
      await supabase.from('gig_applications').update({ status: 'Completed', deliverable_url: deliverableUrl }).eq('id', appId);
      await supabase.from('gigs').update({ status: 'Completed' }).eq('id', gig.id);
      
      const ratingInput = window.prompt("Task Completed! Please rate the client from 1 to 5 stars:");
      if (ratingInput) {
        const rating = parseInt(ratingInput, 10);
        if (!isNaN(rating) && rating >= 1 && rating <= 5) {
          const reviewText = window.prompt("Optional: Leave a brief review of your experience with this client:");
          await supabase.from('gig_client_reviews').insert([{
             gig_id: gig.id,
             reviewer_id: propUser.id,
             client_id: gig.requester_id,
             rating: rating,
             review_text: reviewText || ''
          }]);
          await supabase.rpc('update_gig_client_rating', { p_client_id: gig.requester_id });
          window.alert("Thank you! Your rating has been submitted.");
        } else {
          window.alert("Invalid rating. Skipping review.");
        }
      }

      fetchMyTasks();
      fetchMyPosts();
    } catch (e) { console.error(e); }
  };

  const handleDisputeGig = async (gigId: string, requesterId: string, workerId: string) => {
    try {
      const reason = window.prompt("Please provide a reason for the dispute:");
      if (!reason) return;
      await supabase.from('gig_disputes').insert([{
        gig_id: gigId,
        requester_id: requesterId,
        worker_id: workerId,
        reason
      }]);
      window.alert("Dispute submitted successfully.");
    } catch (e) { console.error(e); }
  };

  const handleApply = async (gig: any) => {
    if (!workerProfile) {
      setIsWorkerModalOpen(true);
      return;
    }
    setSelectedGigForApplication(gig);
  };

  const renderHome = () => {
    const filteredGigs = gigs
      .filter(g => {
         const search = searchQuery.toLowerCase();
         const searchMatch = !search || 
           g.title.toLowerCase().includes(search) || 
           g.requester.toLowerCase().includes(search) ||
           g.location.toLowerCase().includes(search) ||
           (g.description || '').toLowerCase().includes(search);
         
         const cityMatch = selectedCity === 'All Cities' || g.location.toLowerCase().includes(selectedCity.toLowerCase());
         const workTypeMatch = workTypeFilter === 'All' || g.type === workTypeFilter;
         
         return searchMatch && cityMatch && workTypeMatch;
      })
      .map(g => {
        let matchScore = 50;
        if (workerProfile) {
          if (g.categoryId === workerProfile.primary_category) matchScore += 30;
          if (workerProfile.skills && workerProfile.skills.length > 0) {
            const hasSkill = workerProfile.skills.some((skill: string) => 
              g.title.toLowerCase().includes(skill.toLowerCase()) || 
              (g.description || '').toLowerCase().includes(skill.toLowerCase())
            );
            if (hasSkill) matchScore += 20;
          }
          if (g.urgency === 'ASAP') matchScore += 10;
        } else {
          if (g.urgency === 'ASAP') matchScore += 10;
        }
        return { ...g, matchScore };
      })
      .sort((a, b) => b.matchScore - a.matchScore);

    return (
    <div className="gigs-content">
      <header className="gigs-header">
        <div className="gigs-header-top">
          <div className="gigs-welcome">
            <h1>Gig Economy</h1>
            <p>Find local tasks, remote freelance work, and quick shifts.</p>
          </div>
        </div>
        {!workerProfile && user && (
          <div className="become-worker-cta glass" style={{ padding: '16px', margin: '16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--gigs-green)', borderRadius: '12px' }}>
            <div>
              <h3 style={{ margin: '0 0 4px 0', color: 'var(--text)' }}>Become a Worker</h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Set up your profile to start accepting gigs and getting paid.</p>
            </div>
            <button className="primary-btn gigs-btn" onClick={() => setIsWorkerModalOpen(true)}>
              Get Started
            </button>
          </div>
        )}
        <div className="gigs-search-bar">
          <Search size={20} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search gigs, skills, or keywords..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="filter-btn">
            <Filter size={18} />
          </button>
        </div>
      </header>

      <section className="gigs-section">
        <div className="section-header">
          <h2>Gig Categories</h2>
        </div>
        <div className="categories-grid">
          {GIG_CATEGORIES.map(cat => (
            <div key={cat.id} className="category-card glass">
              {cat.icon} <span>{cat.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="gigs-section">
        <div className="section-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <h2>Available Now <span className="live-badge">Live</span></h2>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="toggle-options" style={{ padding: '2px', display: 'flex', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '20px', overflow: 'hidden' }}>
              <button 
                className={`toggle-opt ${workTypeFilter === 'All' ? 'active' : ''}`}
                onClick={() => setWorkTypeFilter('All')}
                style={{ padding: '4px 12px', borderRadius: '18px', fontSize: '0.8rem', flex: 1, minWidth: '60px' }}
              >
                All
              </button>
              <button 
                className={`toggle-opt ${workTypeFilter === 'Local' ? 'active' : ''}`}
                onClick={() => setWorkTypeFilter('Local')}
                style={{ padding: '4px 12px', borderRadius: '18px', fontSize: '0.8rem', flex: 1, minWidth: '60px' }}
              >
                Local
              </button>
              <button 
                className={`toggle-opt ${workTypeFilter === 'Remote' ? 'active' : ''}`}
                onClick={() => setWorkTypeFilter('Remote')}
                style={{ padding: '4px 12px', borderRadius: '18px', fontSize: '0.8rem', flex: 1, minWidth: '60px' }}
              >
                Remote
              </button>
            </div>
            <select 
              className="city-filter-select"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '20px',
                border: '1px solid var(--border)',
                background: 'var(--card-bg)',
                color: 'var(--text)',
                fontSize: '0.85rem',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {CITY_OPTIONS.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="gigs-list">
          {filteredGigs.length === 0 ? (
             <div className="empty-gigs-state" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
                <Search size={40} style={{ opacity: 0.2, marginBottom: '16px' }} />
                <h3>No gigs found</h3>
                <p>Try adjusting your search filters or check back later for new gigs.</p>
             </div>
          ) : filteredGigs.map(gig => (
            <div key={gig.id} className="gig-card glass">
              <div className="gig-card-main">
                <Avatar name={gig.requester} url={gig.avatar_url} size={48} />
                <div className="gig-info">
                  <h3>{gig.title}</h3>
                  <p className="requester-name">
                    {gig.requester} 
                    {gig.clientReviewCount ? (
                      <span style={{ fontSize: '0.85rem', color: '#fbbf24', marginLeft: '6px' }}>
                         ⭐ {gig.clientRating?.toFixed(1)} ({gig.clientReviewCount})
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginLeft: '6px' }}>
                         (New)
                      </span>
                    )}
                  </p>
                  <div className="gig-meta">
                    <span><MapPin size={14} /> {gig.location}</span>
                    <span className="compensation"><DollarSign size={14} /> {gig.compensation}</span>
                  </div>
                </div>
                <div style={{display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end'}}>
                  <button className="save-gig">
                    <Star size={18} />
                  </button>
                  {user && gig.requester_id !== user.id && (
                    <button className="primary-btn gigs-btn" onClick={() => {
                      if (onNavigate) onNavigate('social', 4); // Go to MessagesView
                    }} style={{ padding: '6px 12px', fontSize: '0.85rem', marginTop: 'auto' }}>
                      Message
                    </button>
                  )}
                  <button className="gigs-btn primary-btn" style={{padding: '6px 12px', fontSize: '0.8rem', minHeight: '32px'}} onClick={() => handleApply(gig)}>
                    I'm Interested
                  </button>
                </div>
              </div>
              <div className="gig-card-footer">
                <div className="gig-tags">
                  <span className={`gig-type ${gig.type.toLowerCase()}`}>
                    {gig.type === 'Remote' && <Globe size={12} style={{marginRight: 4}} />}
                    {gig.type === 'Local' && <MapPin size={12} style={{marginRight: 4}} />}
                    {gig.type}
                  </span>
                  <span className={`gig-urgency ${gig.urgency.toLowerCase()}`}>{gig.urgency}</span>
                  {gig.verifiedOnly && (
                    <span className="gig-urgency verified-dibs"><ShieldCheck size={12} style={{marginRight: 4}}/> First Dibs</span>
                  )}
                  {gig.matchScore && gig.matchScore >= 80 && (
                    <span className="gig-type local" style={{background: 'rgba(16, 185, 129, 0.1)', color: 'var(--gigs-green)'}}>🔥 Top Match</span>
                  )}
                </div>
                <span className="posted-date">{gig.posted}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <CreateGigModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        user={user} 
        onSuccess={fetchGigs} 
      />
    </div>
  );
  };

  const renderMyTasks = () => {
    const activeTasks = myTasks.filter(t => ['Pending', 'Accepted'].includes(t.status));
    const completedTasks = myTasks.filter(t => ['Completed', 'Cancelled'].includes(t.status));

    return (
      <div className="gigs-content">
        <header className="page-header">
          <h1>My Tasks</h1>
          <p>Track gigs you are currently working on.</p>
        </header>
        
        <div className="gigs-list">
          <h2 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Active Tasks</h2>
          {activeTasks.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>You have no active tasks.</p>
          ) : activeTasks.map(task => (
            <div key={task.id} className="gig-card glass active-task-card">
              <div className="gig-card-main">
                <div className="requester-avatar">{task.gig?.requester?.first_name?.[0] || 'U'}</div>
                <div className="gig-info">
                  <h3>{task.gig?.title}</h3>
                  <p className="requester-name">{task.gig?.requester?.first_name} {task.gig?.requester?.last_name || ''} • <MapPin size={12}/> {task.gig?.location}</p>
                  <div className="gig-meta">
                    <span className="compensation"><DollarSign size={14} /> ${task.gig?.compensation_amount} {task.gig?.compensation_type}</span>
                    <span className="gig-status in-progress">Status: {task.status}</span>
                  </div>
                </div>
              </div>
              <div className="task-tools-grid">
                {task.status === 'Pending' && (
                  <button className="tool-btn" onClick={() => handleCancelGigByWorker(task.id, task.gig_id)}>
                    <X size={16} /> Cancel App
                  </button>
                )}
                {task.status === 'Accepted' && (
                  <>
                    <button className="tool-btn" onClick={() => handleDisputeGig(task.gig_id, task.gig?.requester_id, user.id)}>
                      <MessageSquare size={16} /> Dispute
                    </button>
                    <button className="tool-btn complete-btn" onClick={() => handleCompleteTask(task.id, task.gig)}>
                      <CheckCircle2 size={16} /> Complete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}

          <h2 style={{ fontSize: '1.2rem', margin: '32px 0 16px' }}>Completed History</h2>
          {completedTasks.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>No completed tasks.</p>
          ) : completedTasks.map(task => (
            <div key={task.id} className="gig-card glass active-task-card">
              <div className="gig-card-main">
                <div className="requester-avatar">{task.gig?.requester?.first_name?.[0] || 'U'}</div>
                <div className="gig-info">
                  <h3>{task.gig?.title}</h3>
                  <p className="requester-name">{task.gig?.requester?.first_name} {task.gig?.requester?.last_name || ''} • <MapPin size={12}/> {task.gig?.location}</p>
                  <div className="gig-meta">
                    <span className="compensation"><DollarSign size={14} /> ${task.gig?.compensation_amount} {task.gig?.compensation_type}</span>
                    <span className="gig-status" style={{ color: task.status === 'Cancelled' ? '#ef4444' : '#10b981' }}>
                      Status: {task.status}
                    </span>
                  </div>
                  {task.deliverable_url && (
                     <div style={{ marginTop: '8px', fontSize: '0.85rem' }}>
                       <a href={task.deliverable_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-color)' }}>View Deliverable</a>
                     </div>
                  )}
                </div>
              </div>
              {task.status === 'Completed' && (
                <div className="task-tools-grid">
                  <button className="tool-btn" onClick={() => handleDisputeGig(task.gig_id, task.gig?.requester_id, user.id)}>
                    <MessageSquare size={16} /> Dispute
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderEarnings = () => {
    const completedTasks = myTasks.filter(t => t.status === 'Completed');
    const totalEarnings = completedTasks.reduce((sum, task) => sum + Number(task.gig?.compensation_amount || 0), 0);
    const successRate = workerProfile?.success_rate || 0;
    const totalJobs = workerProfile?.total_gigs_completed || completedTasks.length;

    return (
      <div className="gigs-content">
        <header className="page-header" style={{ marginBottom: '24px' }}>
          <h1>Performance Dashboard</h1>
          <p>Track your earnings, success metrics, and payment methods.</p>
        </header>

        {!workerProfile ? (
          <div className="worker-setup-prompt glass" style={{ padding: '24px', textAlign: 'center', marginBottom: '24px' }}>
            <h3 style={{ marginBottom: '8px' }}>Become a Verified Worker</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>You need to set up a worker profile to track your performance and handle payments.</p>
            <button className="primary-btn" onClick={() => setIsWorkerModalOpen(true)}>Set Up Profile</button>
          </div>
        ) : (
          <>
            {!workerProfile.is_verified && (
              <div className="verification-cta glass" style={{ padding: '24px', borderRadius: '16px', marginBottom: '24px', background: 'linear-gradient(145deg, rgba(99,102,241,0.1) 0%, rgba(16,185,129,0.05) 100%)', border: '1px solid rgba(99,102,241,0.2)' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <ShieldCheck size={32} color="var(--primary)" style={{ flexShrink: 0 }} />
                  <div>
                    <h3 style={{ marginBottom: '8px', fontSize: '1.2rem' }}>Get Verified & Boost Your Earnings</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
                      Verified freelancers appear higher in search results, build instant trust with clients, and earn up to 40% more on average. Secure your "First Dibs" on premium gigs by verifying your identity today.
                    </p>
                    <button className="primary-btn" onClick={() => setIsVerificationModalOpen(true)}>
                      Get Verified Now
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div className="kpi-card glass" style={{ padding: '20px', borderRadius: '16px' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px' }}>Total Lifetime Earnings</p>
                <h2 style={{ fontSize: '2rem', color: 'var(--gigs-green)' }}>${totalEarnings.toFixed(2)}</h2>
              </div>
              <div className="kpi-card glass" style={{ padding: '20px', borderRadius: '16px' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px' }}>Success Rate</p>
                <h2 style={{ fontSize: '2rem' }}>{successRate}%</h2>
              </div>
              <div className="kpi-card glass" style={{ padding: '20px', borderRadius: '16px' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px' }}>Jobs Completed</p>
                <h2 style={{ fontSize: '2rem' }}>{totalJobs}</h2>
              </div>
            </div>

            <div className="payment-methods-card glass" style={{ padding: '20px', borderRadius: '16px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.1rem' }}>Payout Methods</h3>
                <button className="secondary-btn" onClick={() => setIsWorkerModalOpen(true)} style={{ fontSize: '0.85rem', padding: '6px 12px' }}>
                  Update Info
                </button>
              </div>
              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                <div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>CashApp Handle</p>
                  <p style={{ fontWeight: '600' }}>{workerProfile.cash_app_handle || <span style={{ color: 'var(--text-muted)' }}>Not configured</span>}</p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Zelle Handle</p>
                  <p style={{ fontWeight: '600' }}>{workerProfile.zelle_handle || <span style={{ color: 'var(--text-muted)' }}>Not configured</span>}</p>
                </div>
              </div>
            </div>
          </>
        )}

        <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Earnings Breakdown</h3>
        <div className="earnings-list">
          {completedTasks.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>You haven't completed any paid gigs yet.</p>
          ) : completedTasks.map(task => (
            <div key={task.id} className="earning-item glass" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderRadius: '12px', marginBottom: '12px' }}>
              <div>
                <h4 style={{ fontSize: '1rem', marginBottom: '4px' }}>{task.gig?.title}</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Client: {task.gig?.requester?.first_name} {task.gig?.requester?.last_name || ''} • Completed on {new Date(task.updated_at || task.created_at).toLocaleDateString()}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--gigs-green)' }}>
                  +${task.gig?.compensation_amount}
                </span>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                  Via {task.gig?.compensation_type}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderMyPosts = () => {
    const activePosts = myPosts.filter(p => ['Active', 'Pending'].includes(p.status));
    const completedPosts = myPosts.filter(p => ['Completed', 'Cancelled'].includes(p.status));

    return (
      <div className="gigs-content">
        <header className="page-header">
          <h1>My Posts</h1>
          <p>Manage the gigs you have requested.</p>
          <button className="primary-btn post-gig-btn" onClick={() => setIsModalOpen(true)} style={{ marginTop: '12px' }}>
            Post a Gig
          </button>
        </header>

        <div className="gigs-list">
          <h2 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Active Work</h2>
          {activePosts.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>You have no active posts.</p>
          ) : activePosts.map((post) => (
            <div key={post.id} className="gig-card glass my-post-card">
              <div className="gig-card-main">
                <div className="gig-info">
                  <h3>{post.title}</h3>
                  <p className="requester-name">Posted {new Date(post.created_at).toLocaleDateString()}</p>
                  <div className="gig-meta">
                    <span className="compensation"><DollarSign size={14} /> ${post.compensation_amount} {post.compensation_type}</span>
                    <span className="gig-status escrow-funded"><ShieldCheck size={14} /> Status: {post.status}</span>
                  </div>
                </div>
              </div>
              
              {post.status === 'Active' && post.applications && post.applications.length > 0 && (
                <div className="applicants-section">
                  <h4>Review Applicants ({post.applications.filter((a:any) => a.status === 'Pending').length})</h4>
                  <div className="applicant-list">
                    {post.applications.filter((a:any) => a.status === 'Pending').map((app: any) => (
                      <div key={app.id} className="applicant-item">
                        <div className="applicant-details">
                          <div className="applicant-info">
                            <Avatar name={app.applicant.first_name} url={app.applicant.avatar_url} size={32} />
                            <div style={{display: 'flex', flexDirection: 'column'}}>
                              <span className="applicant-name">{app.applicant.first_name} {app.applicant.last_name}</span>
                              <span className="success-rate"><Star size={12} className="star-icon" /> {app.success_rate || 0}% Success</span>
                            </div>
                          </div>
                          <p className="applicant-message">{app.message}</p>
                          
                          {app.answers && Array.isArray(app.answers) && post.questions && Array.isArray(post.questions) && app.answers.length > 0 && (
                            <div className="applicant-answers" style={{ marginTop: '12px', background: 'var(--card-bg)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                              <h5 style={{ fontSize: '0.85rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>Questionnaire Answers</h5>
                              {post.questions.map((q: string, idx: number) => (
                                <div key={idx} style={{ marginBottom: idx < post.questions.length - 1 ? '12px' : '0' }}>
                                  <p style={{ fontSize: '0.8rem', fontWeight: '500', marginBottom: '4px' }}>Q: {q}</p>
                                  <p style={{ fontSize: '0.85rem', color: 'var(--text)' }}>A: {app.answers[idx] || <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Skipped</span>}</p>
                                </div>
                              ))}
                            </div>
                          )}

                          {app.skills && app.skills.length > 0 && (
                            <div className="applicant-skills" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                               {app.skills.map((skill: string) => (
                                 <span key={skill} style={{ fontSize: '0.75rem', padding: '2px 8px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--gigs-green)', borderRadius: '12px' }}>
                                   {skill}
                                 </span>
                               ))}
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                            <button className="primary-btn gigs-btn" onClick={() => handleAcceptApplicant(app.id, post.id)} style={{ flex: 1 }}>Accept</button>
                            <button className="secondary-btn" onClick={() => {
                              if (onNavigate) onNavigate('social', 4, { chatId: app.applicant_id }); // Go to MessagesView with specific chat
                            }} style={{ padding: '8px 12px' }}>
                              <MessageSquare size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {post.status === 'Pending' && (
                <div className="task-tools-grid" style={{ marginTop: '16px' }}>
                  <button className="tool-btn" onClick={() => handleCancelGigByRequester(post.id)}>
                    <X size={16} /> Cancel Gig
                  </button>
                  <button className="tool-btn" onClick={() => {
                    const acceptedApp = post.applications.find((a:any) => a.status === 'Accepted');
                    if (acceptedApp) handleDisputeGig(post.id, user.id, acceptedApp.applicant_id);
                  }}>
                    <MessageSquare size={16} /> Dispute
                  </button>
                </div>
              )}
            </div>
          ))}

          <h2 style={{ fontSize: '1.2rem', margin: '32px 0 16px' }}>Completed History</h2>
          {completedPosts.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>No completed gigs.</p>
          ) : completedPosts.map((post) => (
            <div key={post.id} className="gig-card glass my-post-card">
              <div className="gig-card-main">
                <div className="gig-info">
                  <h3>{post.title}</h3>
                  <p className="requester-name">Posted {new Date(post.created_at).toLocaleDateString()}</p>
                  <div className="gig-meta">
                    <span className="compensation"><DollarSign size={14} /> ${post.compensation_amount} {post.compensation_type}</span>
                    <span className="gig-status" style={{ color: post.status === 'Cancelled' ? '#ef4444' : '#10b981' }}>
                      Status: {post.status}
                    </span>
                  </div>
                </div>
              </div>
              <div className="task-tools-grid" style={{ marginTop: '16px' }}>
                <button className="tool-btn" onClick={() => {
                  const acceptedApp = post.applications?.find((a:any) => a.status === 'Accepted' || a.status === 'Completed');
                  if (acceptedApp) handleDisputeGig(post.id, user.id, acceptedApp.applicant_id);
                }}>
                  <MessageSquare size={16} /> Dispute
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDirectory = () => {
    const filteredWorkers = workersDirectory
      .filter(w => {
         const search = searchQuery.toLowerCase();
         const searchMatch = !search || 
           (w.profile ? `${w.profile.first_name} ${w.profile.last_name || ''}` : '').toLowerCase().includes(search) || 
           (w.primary_category || '').toLowerCase().includes(search) || 
           (w.skills ? w.skills.some((s: string) => s.toLowerCase().includes(search)) : false);
           
         const cityMatch = selectedCity === 'All Cities' || 
           (w.location && w.location.toLowerCase().includes(selectedCity.toLowerCase())) ||
           (w.profile?.location && w.profile.location.toLowerCase().includes(selectedCity.toLowerCase())) ||
           // If they have no location, include them to avoid filtering everyone out
           (!w.location && !w.profile?.location);

         return searchMatch && cityMatch;
      })
      .map(w => {
         // Calculate Smart Directory Ranking score
         const successRate = w.success_rate || 0;
         const totalGigs = Math.min(w.total_gigs_completed || 0, 50);
         const rankingScore = (successRate * 0.7) + ((totalGigs / 50) * 30);
         return { ...w, rankingScore };
      })
      .sort((a, b) => b.rankingScore - a.rankingScore);

    return (
    <div className="gigs-content">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Freelancers Directory</h1>
          <p>Find top-rated workers in your area.</p>
        </div>
        <select 
          className="city-filter-select"
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          style={{
            padding: '6px 12px',
            borderRadius: '20px',
            border: '1px solid var(--border)',
            background: 'var(--card-bg)',
            color: 'var(--text)',
            fontSize: '0.85rem',
            cursor: 'pointer',
            outline: 'none',
            marginTop: '8px'
          }}
        >
          {CITY_OPTIONS.map(city => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>
      </header>
      <div className="gigs-search-bar" style={{margin: '0 20px 20px'}}>
        <Search size={20} className="search-icon" />
        <input 
          type="text" 
          placeholder="Search freelancers by name, category, or skills..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <div className="gigs-list">
        {filteredWorkers.length === 0 ? (
           <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>No freelancers found matching your search.</p>
        ) : filteredWorkers.map(worker => (
          <div key={worker.id} className="gig-card glass" style={{cursor: 'pointer'}} onClick={() => setSelectedWorker({
            name: worker.profile ? `${worker.profile.first_name} ${worker.profile.last_name || ''}` : 'Unknown',
            initial: worker.profile ? worker.profile.first_name?.[0] : 'U',
            isVerified: worker.is_verified,
            successRate: worker.success_rate || 0,
            totalGigs: worker.total_gigs || 0,
            primaryCategory: worker.primary_category || 'General',
            cashAppHandle: worker.cash_app_handle,
            zelleHandle: worker.zelle_handle,
            workerId: worker.id
          })}>
            <div className="gig-card-main">
              <div className="requester-avatar">{worker.profile ? worker.profile.first_name?.[0] : 'U'}</div>
              <div className="gig-info">
                <h3>{worker.profile ? `${worker.profile.first_name} ${worker.profile.last_name || ''}` : 'Unknown'}</h3>
                <p className="requester-name">{worker.primary_category || 'General Labor'}</p>
                <div className="gig-meta">
                  <span className="success-rate"><Star size={12} className="star-icon" /> {worker.success_rate || 0}% Success ({worker.total_gigs || 0} gigs)</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {selectedWorker && (
        <WorkerProfileModal
          isOpen={true}
          onClose={() => setSelectedWorker(null)}
          workerName={selectedWorker.name}
          workerInitial={selectedWorker.initial}
          isVerified={selectedWorker.isVerified}
          successRate={selectedWorker.successRate}
          totalGigs={selectedWorker.totalGigs}
          primaryCategory={selectedWorker.primaryCategory}
          cashAppHandle={selectedWorker.cashAppHandle}
          zelleHandle={selectedWorker.zelleHandle}
          workerId={selectedWorker.workerId}
        />
      )}
    </div>
  );
  };

  return (
    <div className="gigs-view-container">
      <div className="gigs-mode-toggle-container">
        <div className="gigs-mode-toggle">
          <button 
            className={`gigs-mode-btn ${activeMode === 'client' ? 'active' : ''}`}
            onClick={() => {
              setActiveMode('client');
              setLocalTab(1); // Default to My Posts
            }}
          >
            Client Mode
          </button>
          <button 
            className={`gigs-mode-btn ${activeMode === 'freelancer' ? 'active' : ''}`}
            onClick={() => {
              setActiveMode('freelancer');
              setLocalTab(0); // Default to Available Gigs
            }}
          >
            Freelancer Mode
          </button>
        </div>
      </div>

      <nav className="gigs-internal-nav no-scrollbar">
        {activeMode === 'client' ? (
          <>
            <button className={`gigs-tab ${localTab === 1 ? 'active' : ''}`} onClick={() => setLocalTab(1)}>My Posts</button>
            <button className={`gigs-tab ${localTab === 4 ? 'active' : ''}`} onClick={() => setLocalTab(4)}>Freelancer Directory</button>
          </>
        ) : (
          <>
            <button className={`gigs-tab ${localTab === 0 ? 'active' : ''}`} onClick={() => setLocalTab(0)}>Available Gigs</button>
            <button className={`gigs-tab ${localTab === 2 ? 'active' : ''}`} onClick={() => setLocalTab(2)}>My Tasks</button>
            <button className={`gigs-tab ${localTab === 3 ? 'active' : ''}`} onClick={() => setLocalTab(3)}>Earnings</button>
          </>
        )}
      </nav>

      {(() => {
        switch (localTab) {
          case 0: return renderHome();
          case 1: return renderMyPosts();
          case 2: return renderMyTasks();
          case 3: return renderEarnings();
          case 4: return renderDirectory();
          default: return renderHome();
        }
      })()}

      {isModalOpen && (
        <CreateGigModal
          isOpen={true}
          user={user}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchGigs();
            fetchMyPosts();
            setLocalTab(1); // switch to my posts after posting
          }}
        />
      )}

      {isWorkerModalOpen && (
        <CreateWorkerProfileModal
          isOpen={true}
          user={user}
          onClose={() => setIsWorkerModalOpen(false)}
          onSuccess={() => {
            setIsWorkerModalOpen(false);
            fetchWorkerData();
          }}
        />
      )}

      {isVerificationModalOpen && (
        <VerificationModal onClose={() => setIsVerificationModalOpen(false)} user={user} />
      )}

      {selectedGigForApplication && (
        <GigApplicationModal
          gig={selectedGigForApplication}
          user={user}
          onClose={() => setSelectedGigForApplication(null)}
          onSuccess={() => {
            setSelectedGigForApplication(null);
            fetchMyTasks();
            setLocalTab(2); // Go to My Tasks
          }}
        />
      )}
    </div>
  );
};
