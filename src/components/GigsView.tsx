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
  TreePine
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { CreateGigModal } from './CreateGigModal';
import { WorkerProfileModal } from './WorkerProfileModal';
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
  location: string;
  compensation: string;
  type: 'Local' | 'Remote';
  urgency: 'ASAP' | 'Flexible' | 'Scheduled';
  posted: string;
  avatar: string;
  status?: 'Active' | 'Completed' | 'Pending';
  verifiedOnly?: boolean;
}

const FEATURED_GIGS: Gig[] = [
  { id: 'g1', title: 'Need help assembling IKEA wardrobe', requester: 'Sarah M.', location: 'Beaumont, TX', compensation: '$60 flat', type: 'Local', urgency: 'ASAP', posted: '10m ago', avatar: 'SM' },
  { id: 'g2', title: 'Logo Design for Local Coffee Shop', requester: 'Bean Brews', location: 'Remote', compensation: '$150 flat', type: 'Remote', urgency: 'Flexible', posted: '1h ago', avatar: 'BB' },
  { id: 'g3', title: 'Dog walker needed for next week (3 days)', requester: 'James T.', location: 'Nederland, TX', compensation: '$25/day', type: 'Local', urgency: 'Scheduled', posted: '2h ago', avatar: 'JT' },
  { id: 'g4', title: 'Delivery driver for catering order', requester: 'Luigis Pizza', location: 'Port Arthur, TX', compensation: '$40 flat + tip', type: 'Local', urgency: 'ASAP', posted: '5m ago', avatar: 'LP' },
];

export const GigsView: React.FC<{ activeTab?: number; user?: any; scope?: string }> = ({ activeTab = 0, user: propUser }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [gigs, setGigs] = useState<Gig[]>(FEATURED_GIGS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<any>(null);
  const { user: contextUser, theme } = useApp();
  const user = propUser || contextUser;

  React.useEffect(() => {
    fetchGigs();
  }, []);

  const fetchGigs = async () => {
    try {
      const { data, error } = await supabase
        .from('gigs')
        .select(`
          *,
          requester:profiles!requester_id(first_name, last_name)
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
          avatar: g.requester ? (g.requester.first_name?.[0] || 'U') : 'U',
          verifiedOnly: g.verified_only_until ? new Date(g.verified_only_until) > new Date() : false
        }));
        setGigs([...mapped, ...FEATURED_GIGS]); // Prepend real data to mock data
      }
    } catch (e) {
      console.error('Error fetching gigs:', e);
    }
  };

  const renderHome = () => (
    <div className="gigs-content">
      <header className="gigs-header">
        <div className="gigs-header-top">
          <div className="gigs-welcome">
            <h1>Gig Economy</h1>
            <p>Find local tasks, remote freelance work, and quick shifts.</p>
          </div>
          <button className="primary-btn post-gig-btn" onClick={() => setIsModalOpen(true)}>
            Post a Gig
          </button>
        </div>
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
        <div className="section-header">
          <h2>Available Now <span className="live-badge">Live</span></h2>
          <button className="see-all">View Map</button>
        </div>
        <div className="gigs-list">
          {gigs.map(gig => (
            <div key={gig.id} className="gig-card glass">
              <div className="gig-card-main">
                <div className="requester-avatar">{gig.avatar}</div>
                <div className="gig-info">
                  <h3>{gig.title}</h3>
                  <p className="requester-name">{gig.requester}</p>
                  <div className="gig-meta">
                    <span><MapPin size={14} /> {gig.location}</span>
                    <span className="compensation"><DollarSign size={14} /> {gig.compensation}</span>
                  </div>
                </div>
                <button className="save-gig">
                  <Star size={18} />
                </button>
              </div>
              <div className="gig-card-footer">
                <div className="gig-tags">
                  <span className={`gig-type ${gig.type.toLowerCase()}`}>{gig.type}</span>
                  <span className={`gig-urgency ${gig.urgency.toLowerCase()}`}>{gig.urgency}</span>
                  {gig.verifiedOnly && (
                    <span className="gig-urgency verified-dibs"><ShieldCheck size={12} style={{marginRight: 4}}/> First Dibs</span>
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

  const renderMyTasks = () => (
    <div className="gigs-content">
      <header className="page-header">
        <h1>My Tasks</h1>
        <p>Track gigs you are currently working on.</p>
      </header>
      
      <div className="gigs-list">
        {/* Mockup Active Task */}
        <div className="gig-card glass active-task-card">
          <div className="gig-card-main">
            <div className="requester-avatar">SM</div>
            <div className="gig-info">
              <h3>Need help assembling IKEA wardrobe</h3>
              <p className="requester-name">Sarah M. • <MapPin size={12}/> Beaumont, TX</p>
              <div className="gig-meta">
                <span className="compensation"><DollarSign size={14} /> $60 flat</span>
                <span className="gig-status in-progress">In Progress</span>
              </div>
            </div>
          </div>
          <div className="task-tools-grid">
            <button className="tool-btn clock-in-btn">
              <Clock size={16} /> Punch In
            </button>
            <button className="tool-btn">
              <Camera size={16} /> Add Receipt
            </button>
            <button className="tool-btn">
              <MessageSquare size={16} /> Message
            </button>
            <button className="tool-btn complete-btn">
              <CheckCircle2 size={16} /> Mark Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEarnings = () => (
    <div className="gigs-content">
      <header className="page-header">
        <h1>Earnings</h1>
        <p>Your gig economy income tracking.</p>
      </header>
      <div className="earnings-dashboard">
        <div className="earnings-card glass">
          <h3>Available Balance</h3>
          <h2>$0.00</h2>
          <button className="cash-out-btn disabled">Cash Out</button>
        </div>
      </div>
    </div>
  );

  const renderMyPosts = () => (
    <div className="gigs-content">
      <header className="page-header gigs-header-top">
        <div>
          <h1>My Posts</h1>
          <p>Manage the gigs you have requested.</p>
        </div>
        <button className="primary-btn post-gig-btn" onClick={() => setIsModalOpen(true)}>
          Post a Gig
        </button>
      </header>
      <div className="gigs-list">
        {/* Mockup Active Post */}
        <div className="gig-card glass my-post-card">
          <div className="gig-card-main">
            <div className="gig-info">
              <h3>Delivery driver for catering order</h3>
              <p className="requester-name">Posted 2 hours ago</p>
              <div className="gig-meta">
                <span className="compensation"><DollarSign size={14} /> $40 flat + tip</span>
                <span className="gig-status escrow-funded"><ShieldCheck size={14} /> Escrow Funded</span>
              </div>
            </div>
          </div>
          
          <div className="applicants-section">
            <h4>Review Applicants (2)</h4>
            <div className="applicant-list">
              <div className="applicant-item">
                <div className="applicant-avatar verified-avatar">
                  <span className="initial">JT</span>
                  <div className="verified-badge"><ShieldCheck size={10} /></div>
                </div>
                <div className="applicant-details">
                  <span 
                    className="name clickable-name" 
                    onClick={() => setSelectedWorker({
                      name: 'James T.',
                      initial: 'JT',
                      isVerified: true,
                      successRate: 100,
                      totalGigs: 12,
                      primaryCategory: 'Delivery'
                    })}
                  >
                    James T. <span className="verified-text">Verified Worker</span>
                  </span>
                  <span className="success-rate"><Star size={12} className="star-icon" /> 100% Success (12 deliveries)</span>
                </div>
                <button className="accept-applicant-btn">Accept</button>
              </div>
              
              <div className="applicant-item">
                <div className="applicant-avatar">
                  <span className="initial">MR</span>
                </div>
                <div className="applicant-details">
                  <span 
                    className="name clickable-name"
                    onClick={() => setSelectedWorker({
                      name: 'Mike R.',
                      initial: 'MR',
                      isVerified: false,
                      successRate: 0,
                      totalGigs: 0,
                      primaryCategory: 'Labor'
                    })}
                  >
                    Mike R.
                  </span>
                  <span className="success-rate">New Worker</span>
                </div>
                <button className="review-applicant-btn">Review</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CreateGigModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        user={user} 
        onSuccess={fetchGigs} 
      />

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
        />
      )}
    </div>
  );

  switch (activeTab) {
    case 0: return renderHome();
    case 1: return renderMyPosts();
    case 2: return renderMyTasks();
    case 3: return renderEarnings();
    default: return renderHome();
  }
};
