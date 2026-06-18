import React, { useState } from 'react';
import { Briefcase, Users, FileText, Search, User, MapPin, Star } from 'lucide-react';
import { Avatar } from './Avatar';
import { ProPlusProfileTab } from './ProPlusProfileTab';
import { ProPlusFeedTab } from './ProPlusFeedTab';
import { ProPlusNetworkTab } from './ProPlusNetworkTab';
import { JobsView } from './JobsView';
import './ProPlusView.css';

interface ProPlusViewProps {
  user: any;
  scope?: string;
}

export const ProPlusView: React.FC<ProPlusViewProps> = ({ user, scope = 'national' }) => {
  const [activeTab, setActiveTab] = useState<'feed' | 'network' | 'jobs' | 'profile'>('feed');

  return (
    <div className="proplus-container">
      <header className="proplus-header glass">
        <div className="proplus-header-top">
          <div className="proplus-logo">
            <Star size={28} className="proplus-brand-icon" />
            <h1>Connect</h1>
          </div>
          <div className="proplus-search-bar">
            <Search size={18} />
            <input type="text" placeholder="Search professionals, companies, or jobs..." />
          </div>
          <Avatar url={user?.avatar_url} name={user?.name} size={40} />
        </div>
        
        <nav className="proplus-tabs no-scrollbar">
          <button 
            className={`tab-btn ${activeTab === 'feed' ? 'active' : ''}`}
            onClick={() => setActiveTab('feed')}
          >
            <FileText size={18} /> Feed
          </button>
          <button 
            className={`tab-btn ${activeTab === 'network' ? 'active' : ''}`}
            onClick={() => setActiveTab('network')}
          >
            <Users size={18} /> Network
          </button>
          <button 
            className={`tab-btn ${activeTab === 'jobs' ? 'active' : ''}`}
            onClick={() => setActiveTab('jobs')}
          >
            <Briefcase size={18} /> Jobs
          </button>
          <button 
            className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={18} /> Profile
          </button>
        </nav>
      </header>

      <main className="proplus-main" style={{ padding: activeTab === 'jobs' ? 0 : 16, maxWidth: activeTab === 'jobs' ? '100%' : 800 }}>
        {activeTab === 'feed' && <ProPlusFeedTab user={user} />}

        {activeTab === 'network' && <ProPlusNetworkTab user={user} />}

        {activeTab === 'jobs' && (
          <div style={{ height: 'calc(100vh - 150px)', overflow: 'hidden' }}>
            <JobsView activeTab={0} user={user} scope={scope as any} />
          </div>
        )}

        {activeTab === 'profile' && (
          <ProPlusProfileTab user={user} onUpdateUser={(data) => {
            // Optional: bubble up update to parent if necessary
            // For now, it mostly manages its own state and DB
          }} />
        )}
      </main>
    </div>
  );
};
