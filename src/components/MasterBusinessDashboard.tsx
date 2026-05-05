import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Megaphone, 
  ChevronRight, 
  ArrowUpRight, 
  Wallet,
  Building2,
  Plus,
  Loader2,
  PieChart,
  Bell
} from 'lucide-react';
import { AdManager } from './AdManager';
import { supabase } from '../lib/supabase';
import { 
  Briefcase, 
  CheckCircle2, 
  XCircle, 
  FileText 
} from 'lucide-react';
import { StaffManagement } from './StaffManagement';
import './VendorDashboard.css';

interface MasterBusinessDashboardProps {
  user: any;
  stores: any[];
  onSelectStore: (store: any) => void;
}

export const MasterBusinessDashboard: React.FC<MasterBusinessDashboardProps> = ({ user, stores, onSelectStore }) => {
  const [portfolioStats, setPortfolioStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    activeAds: 0
  });
  const [storeStats, setStoreStats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'ads' | 'talent' | 'team' | 'analytics'>('overview');
  
  const [selectedTeamStoreId, setSelectedTeamStoreId] = useState<string>('');
  
  const [jobs, setJobs] = useState<any[]>([]);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [showJobModal, setShowJobModal] = useState(false);
  const [newJob, setNewJob] = useState({ title: '', store_id: '', description: '', salary_range: '', job_type: 'Full-time' });

  useEffect(() => {
    calculatePortfolioStats();
    if (activeTab === 'talent') fetchTalentData();
    if (activeTab === 'team' && stores.length > 0 && !selectedTeamStoreId) {
      setSelectedTeamStoreId(stores[0].id);
    }
  }, [stores, activeTab]);

  const fetchTalentData = async () => {
    const { data: jobData } = await supabase.from('jobs').select('*, store:stores(name)').eq('user_id', user.id).order('created_at', { ascending: false });
    const { data: appData } = await supabase.from('job_applications').select('*, job:jobs(*, store:stores(name)), applicant:profiles(*)').in('job_id', jobData?.map(j => j.id) || []);
    
    setJobs(jobData || []);
    setApplicants(appData || []);
  };

  const handleCreateJob = async () => {
    if (!newJob.title || !newJob.store_id) return;
    const { error } = await supabase.from('jobs').insert([{
      ...newJob,
      user_id: user.id,
      company_name: stores.find(s => s.id === newJob.store_id)?.name,
      status: 'active'
    }]);
    if (!error) {
      setShowJobModal(false);
      setNewJob({ title: '', store_id: '', description: '', salary_range: '', job_type: 'Full-time' });
      fetchTalentData();
    }
  };

  const calculatePortfolioStats = async () => {
    setIsLoading(true);
    let rev = 0;
    let ords = 0;
    let prods = 0;
    
    const detailedStats = await Promise.all(stores.map(async (store) => {
      const { count: prodCount } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('store_id', store.id);
      const { count: orderCount } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('store_id', store.id);
      
      rev += parseFloat(store.total_sales || '0');
      ords += orderCount || 0;
      prods += prodCount || 0;

      return {
        ...store,
        orderCount: orderCount || 0,
        productCount: prodCount || 0
      };
    }));

    setPortfolioStats({
      totalRevenue: rev,
      totalOrders: ords,
      totalProducts: prods,
      activeAds: 0 // Mock for now
    });
    setStoreStats(detailedStats);
    setIsLoading(false);
  };

  if (isLoading) return <div className="vendor-dashboard-loading"><Loader2 className="animate-spin" size={48} /><p>Calculating Portfolio Analytics...</p></div>;

  return (
    <div className="vendor-dashboard-container master-dashboard">
      <header className="vendor-header premium-card">
        <div className="vendor-profile-brief">
          <div className="master-avatar" style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))', width: 60, height: 60, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <Building2 size={32} />
          </div>
          <div className="vendor-info">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>Portfolio Master <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: 20, color: 'var(--accent)' }}>PREMIUM</span></h2>
            <p style={{ margin: 0, opacity: 0.7 }}>Managing {stores.length} Establishments</p>
          </div>
        </div>
        <div className="vendor-header-actions">
           <div className="global-notification-bell">
             <Bell size={20} />
             <span className="bell-dot"></span>
           </div>
        </div>
      </header>

      <nav className="vendor-tabs">
        <button className={`vendor-tab-link ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}><BarChart3 size={18} /> Portfolio Overview</button>
        <button className={`vendor-tab-link ${activeTab === 'talent' ? 'active' : ''}`} onClick={() => setActiveTab('talent')}><Briefcase size={18} /> Talent & Jobs</button>
        <button className={`vendor-tab-link ${activeTab === 'team' ? 'active' : ''}`} onClick={() => setActiveTab('team')}><Users size={18} /> Portfolio Team</button>
        <button className={`vendor-tab-link ${activeTab === 'ads' ? 'active' : ''}`} onClick={() => setActiveTab('ads')}><Megaphone size={18} /> Global Ads</button>
        <button className={`vendor-tab-link ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}><PieChart size={18} /> Insights</button>
      </nav>

      <main className="vendor-content">
        {activeTab === 'overview' && (
          <div className="master-overview">
            <div className="vendor-stats-grid">
              <div className="stat-card premium-card">
                <span className="stat-label">Total Portfolio Revenue</span>
                <span className="stat-value" style={{ color: 'var(--primary)' }}>${portfolioStats.totalRevenue.toFixed(2)}</span>
                <div className="stat-trend positive"><ArrowUpRight size={12} /> 12% vs last month</div>
              </div>
              <div className="stat-card premium-card">
                <span className="stat-label">Total Orders</span>
                <span className="stat-value">{portfolioStats.totalOrders}</span>
              </div>
              <div className="stat-card premium-card">
                <span className="stat-label">Product Catalog</span>
                <span className="stat-value">{portfolioStats.totalProducts} Items</span>
              </div>
              <div className="stat-card premium-card">
                <span className="stat-label">Global Wallet</span>
                <span className="stat-value"><Wallet size={20} style={{ verticalAlign: 'middle', marginRight: 8 }} /> $0.00</span>
              </div>
            </div>

            <div className="section-title" style={{ marginTop: 32 }}>
              <h3>My Establishments</h3>
              <button className="back-btn" style={{ fontSize: '0.85rem', color: 'var(--primary)' }}>View Comparison <TrendingUp size={14} /></button>
            </div>

            <div className="store-management-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20, marginTop: 16 }}>
              {storeStats.map(store => (
                <div key={store.id} className="store-stat-card premium-card glass-hover" onClick={() => onSelectStore(store)} style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                    <img src={store.image_url || `https://ui-avatars.com/api/?name=${store.name}`} alt={store.name} style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'cover' }} />
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: 0 }}>{store.name}</h4>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{store.category}</span>
                    </div>
                    <ChevronRight size={16} opacity={0.5} />
                  </div>
                  <div className="mini-stats" style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 12 }}>
                    <div style={{ textAlign: 'center' }}><span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700 }}>{store.orderCount}</span><p style={{ margin: 0, fontSize: '0.6rem', opacity: 0.5 }}>Orders</p></div>
                    <div style={{ textAlign: 'center' }}><span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700 }}>${parseFloat(store.total_sales || '0').toFixed(0)}</span><p style={{ margin: 0, fontSize: '0.6rem', opacity: 0.5 }}>Revenue</p></div>
                    <div style={{ textAlign: 'center' }}><span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700 }}>{store.productCount}</span><p style={{ margin: 0, fontSize: '0.6rem', opacity: 0.5 }}>{store.category === 'Services' ? 'Services' : 'Products'}</p></div>
                  </div>
                </div>
              ))}
              <div className="store-stat-card premium-card add-new-store-placeholder" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 140, border: '2px dashed rgba(255,255,255,0.1)', background: 'transparent' }}>
                <Plus size={32} opacity={0.3} />
                <p style={{ margin: '8px 0 0', fontSize: '0.85rem', opacity: 0.5 }}>Add New Business</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'talent' && (
          <div className="portfolio-talent">
            <div className="section-title">
              <h3>Hiring & Recruitment</h3>
              <button className="primary-btn" onClick={() => setShowJobModal(true)}><Plus size={16} /> Deploy Job Listing</button>
            </div>

            <div className="talent-dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: 24, marginTop: 20 }}>
              <div className="jobs-list-section">
                <h4 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><FileText size={18} /> Active Listings</h4>
                <div className="jobs-table glass" style={{ overflow: 'hidden', borderRadius: 16 }}>
                  <table className="premium-table" style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th>Job Title</th>
                        <th>Establishment</th>
                        <th>Applicants</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobs.map(job => (
                        <tr key={job.id}>
                          <td style={{ fontWeight: 700 }}>{job.title}</td>
                          <td>{job.store?.name}</td>
                          <td><span className="applicant-count-badge">{applicants.filter(a => a.job_id === job.id).length} New</span></td>
                          <td><span className="status-badge active">ACTIVE</span></td>
                        </tr>
                      ))}
                      {jobs.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: 40, opacity: 0.5 }}>No active job listings.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="applicants-sidebar">
                <h4 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Users size={18} /> Recent Applicants</h4>
                <div className="applicants-feed" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {applicants.map(app => (
                    <div key={app.id} className="applicant-card premium-card glass-hover" style={{ padding: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                        <div className="app-avatar" style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>{app.applicant?.name?.substring(0,2).toUpperCase()}</div>
                        <div style={{ flex: 1 }}>
                          <h5 style={{ margin: 0 }}>{app.applicant?.name}</h5>
                          <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--text-muted)' }}>Applied for <strong>{app.job?.title}</strong></p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        <button className="mini-btn-success" style={{ flex: 1, padding: '6px', fontSize: '0.65rem' }}><CheckCircle2 size={12} /> Match</button>
                        <button className="mini-btn-danger" style={{ flex: 1, padding: '6px', fontSize: '0.65rem' }}><XCircle size={12} /> Pass</button>
                      </div>
                    </div>
                  ))}
                  {applicants.length === 0 && <p style={{ opacity: 0.5, textAlign: 'center', padding: 20 }}>No applications yet.</p>}
                </div>
              </div>
            </div>

            {showJobModal && (
              <div className="modal-overlay" onClick={() => setShowJobModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="modal-content glass" onClick={e => e.stopPropagation()} style={{ width: '90%', maxWidth: 500, padding: 32, borderRadius: 24 }}>
                  <h3>Deploy New Job Listing</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 24 }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: 6 }}>Target Establishment</label>
                      <select value={newJob.store_id} onChange={e => setNewJob({...newJob, store_id: e.target.value})} className="glass-input" style={{ width: '100%' }}>
                        <option value="">Select a business...</option>
                        {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: 6 }}>Job Title</label>
                      <input type="text" value={newJob.title} onChange={e => setNewJob({...newJob, title: e.target.value})} placeholder="e.g. Lead Chef, Store Manager" className="glass-input" style={{ width: '100%' }} />
                    </div>
                    <div style={{ display: 'flex', gap: 16 }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: 6 }}>Salary Range</label>
                        <input type="text" value={newJob.salary_range} onChange={e => setNewJob({...newJob, salary_range: e.target.value})} placeholder="e.g. $50k - $70k" className="glass-input" style={{ width: '100%' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: 6 }}>Job Type</label>
                        <select value={newJob.job_type} onChange={e => setNewJob({...newJob, job_type: e.target.value})} className="glass-input" style={{ width: '100%' }}>
                          <option value="Full-time">Full-time</option>
                          <option value="Part-time">Part-time</option>
                          <option value="Contract">Contract</option>
                          <option value="Remote">Remote</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: 6 }}>Description & Requirements</label>
                      <textarea value={newJob.description} onChange={e => setNewJob({...newJob, description: e.target.value})} placeholder="What are you looking for?" rows={4} className="glass-input" style={{ width: '100%' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
                    <button className="primary-btn" onClick={handleCreateJob} style={{ flex: 1 }}>Launch Listing</button>
                    <button className="secondary-btn" onClick={() => setShowJobModal(false)} style={{ flex: 1 }}>Cancel</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'team' && (
          <div className="portfolio-team">
             <div className="premium-card" style={{ padding: 24, marginBottom: 24 }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <div>
                   <h3 style={{ margin: 0 }}>Portfolio Team Management</h3>
                   <p style={{ margin: '8px 0 0', opacity: 0.7, fontSize: '0.9rem' }}>Assign managers and employees to specific business dashboards.</p>
                 </div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                   <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Select Establishment:</label>
                   <select 
                     value={selectedTeamStoreId} 
                     onChange={e => setSelectedTeamStoreId(e.target.value)} 
                     className="glass-input" 
                     style={{ minWidth: 200 }}
                   >
                     {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                   </select>
                 </div>
               </div>
             </div>
             {selectedTeamStoreId && (
               <StaffManagement 
                 entityId={selectedTeamStoreId} 
                 entityType="business" 
                 user={user} 
               />
             )}
          </div>
        )}

        {activeTab === 'ads' && (
          <div className="global-ads-manager">
             <div className="premium-card" style={{ padding: 24, marginBottom: 24, background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(157,0,255,0.05))' }}>
               <h3 style={{ marginTop: 0 }}>Global Ad Campaign</h3>
               <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>Create an advertisement and select which business it should promote.</p>
               <div style={{ marginTop: 20 }}>
                 <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: 8, display: 'block' }}>Promote Store:</label>
                 <select className="glass-input" style={{ width: '100%', maxWidth: 300 }}>
                   {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                 </select>
               </div>
             </div>
             <AdManager user={user} />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="portfolio-analytics">
             <div className="premium-card" style={{ padding: 40, textAlign: 'center', opacity: 0.5 }}>
               <PieChart size={48} style={{ margin: '0 auto 16px' }} />
               <h3>Detailed Analytics Coming Soon</h3>
               <p>Advanced cross-store performance comparisons and seasonal trends.</p>
             </div>
          </div>
        )}
      </main>
    </div>
  );
};
