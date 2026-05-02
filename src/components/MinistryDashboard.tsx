import React, { useState } from 'react';
import { 
  Church, 
  HeartHandshake, 
  Calendar, 
  Gift, 
  Settings, 
  Loader2,
  TrendingUp,
  MessageSquare,
  Users,
  Sparkles,
  FileText,
  Send
} from 'lucide-react';
import { AdManager } from './AdManager';
import { supabase } from '../lib/supabase';
import { formatText } from '../utils/textFormatting';
import './VendorDashboard.css'; // Reusing layout styles

interface MinistryDashboardProps {
  user: any;
  activeTab?: number;
}

export const MinistryDashboard: React.FC<MinistryDashboardProps> = ({ user, activeTab: propTab }) => {
  const tabMap = ['events', 'donations', 'members', 'ads', 'settings', 'overview', 'ai'];
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'donations' | 'members' | 'ads' | 'settings' | 'ai'>((propTab !== undefined && tabMap[propTab]) ? tabMap[propTab] as any : 'overview');
  
  const [isLoading] = useState(false);
  const [sermonNotes, setSermonNotes] = useState('');
  const [aiResult, setAiResult] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async (action: 'generate_posts' | 'generate_guide' | 'generate_summary') => {
    if (!sermonNotes) return;
    setIsGenerating(true);
    setAiResult('');
    
    try {
      const { data, error } = await supabase.functions.invoke('faith-assistant', {
        body: { action, sermonNotes }
      });
      if (error) throw error;
      setAiResult(data.result);
    } catch (err) {
      console.error(err);
      setAiResult('Error generating content. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="vendor-dashboard-loading">
        <Loader2 className="animate-spin" size={48} />
        <p>Loading Ministry Hub...</p>
      </div>
    );
  }

  return (
    <div className="vendor-dashboard-container">
      {/* Ministry Header */}
      <header className="vendor-header premium-card">
        <div className="vendor-profile-brief">
          <div className="vendor-logo" style={{ background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {user?.role === 'church' ? <Church size={24} /> : <HeartHandshake size={24} />}
          </div>
          <div className="vendor-info">
            <h2>{user?.name || 'Ministry & Outreach'}</h2>
            <div className="vendor-badges">
              <span className="vendor-role-badge">{user?.role?.replace('_', ' ').toUpperCase()}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs Navigation */}
      <nav className="vendor-tabs">
        <button className={`vendor-tab-link ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          <TrendingUp size={18} /> Overview
        </button>
        <button className={`vendor-tab-link ${activeTab === 'events' ? 'active' : ''}`} onClick={() => setActiveTab('events')}>
          <Calendar size={18} /> Events
        </button>
        <button className={`vendor-tab-link ${activeTab === 'donations' ? 'active' : ''}`} onClick={() => setActiveTab('donations')}>
          <Gift size={18} /> Donations
        </button>
        <button className={`vendor-tab-link ${activeTab === 'members' ? 'active' : ''}`} onClick={() => setActiveTab('members')}>
          <Users size={18} /> Members
        </button>
        <button className={`vendor-tab-link ${activeTab === 'ads' ? 'active' : ''}`} onClick={() => setActiveTab('ads')}>
          <MessageSquare size={18} /> Outreach
        </button>
        <button className={`vendor-tab-link ${activeTab === 'ai' ? 'active' : ''}`} onClick={() => setActiveTab('ai')}>
          <Sparkles size={18} /> AI Assistant
        </button>
        <button className={`vendor-tab-link ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
          <Settings size={18} /> Settings
        </button>
      </nav>

      {/* Tab Content */}
      <main className="vendor-content">
        {activeTab === 'overview' && (
          <div className="vendor-overview fade-in">
            <div className="vendor-stats-grid">
              <div className="stat-card premium-card">
                <span className="stat-label">Upcoming Events</span>
                <span className="stat-value">0</span>
              </div>
              <div className="stat-card premium-card">
                <span className="stat-label">Community Reach</span>
                <span className="stat-value">--</span>
              </div>
            </div>
            <div className="premium-card empty-vendor-state" style={{ marginTop: 24 }}>
              <h3>Community Outreach Hub</h3>
              <p>Manage your services, food drives, and faith events.</p>
            </div>
          </div>
        )}

        {activeTab === 'events' && (
          <div className="premium-card empty-vendor-state fade-in">
            <Calendar size={48} style={{ opacity: 0.5, marginBottom: 16 }} />
            <h3>Event Manager</h3>
            <p>Feature coming soon: Schedule services and outreach events.</p>
          </div>
        )}

        {activeTab === 'donations' && (
          <div className="premium-card empty-vendor-state fade-in">
            <Gift size={48} style={{ opacity: 0.5, marginBottom: 16 }} />
            <h3>Donations</h3>
            <p>Feature coming soon: Track community support and tithes.</p>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="premium-card empty-vendor-state fade-in">
            <Users size={48} style={{ opacity: 0.5, marginBottom: 16 }} />
            <h3>Membership Requests</h3>
            <p>You have 0 pending membership requests to approve.</p>
          </div>
        )}

        {activeTab === 'ads' && (
          <div className="fade-in">
            <AdManager user={user} />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="premium-card empty-vendor-state fade-in">
            <Settings size={48} style={{ opacity: 0.5, marginBottom: 16 }} />
            <h3>Settings</h3>
            <p>Organization settings coming soon.</p>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="fade-in premium-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ background: 'var(--primary)', padding: '8px', borderRadius: '8px' }}>
                <Sparkles size={24} color="#fff" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Sermon Multiplier</h3>
                <p style={{ margin: '4px 0 0 0', opacity: 0.8, fontSize: '0.9rem' }}>Turn your sermon notes into engaging community content.</p>
              </div>
            </div>
            
            <textarea 
              value={sermonNotes}
              onChange={(e) => setSermonNotes(e.target.value)}
              placeholder="Paste your sermon notes or scripture references here..."
              style={{
                width: '100%',
                minHeight: '150px',
                padding: '16px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--text-primary)',
                resize: 'vertical',
                marginBottom: '16px',
                fontFamily: 'inherit'
              }}
            />
            
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
              <button 
                onClick={() => handleGenerate('generate_posts')}
                disabled={isGenerating || !sermonNotes}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 16px', borderRadius: '6px',
                  background: 'var(--primary)', color: '#fff', border: 'none',
                  cursor: isGenerating || !sermonNotes ? 'not-allowed' : 'pointer',
                  opacity: isGenerating || !sermonNotes ? 0.5 : 1
                }}
              >
                <Send size={16} /> Generate Social Posts
              </button>
              <button 
                onClick={() => handleGenerate('generate_guide')}
                disabled={isGenerating || !sermonNotes}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 16px', borderRadius: '6px',
                  background: 'rgba(255,255,255,0.1)', color: 'var(--text-primary)', border: 'none',
                  cursor: isGenerating || !sermonNotes ? 'not-allowed' : 'pointer',
                  opacity: isGenerating || !sermonNotes ? 0.5 : 1
                }}
              >
                <FileText size={16} /> Generate Discussion Guide
              </button>
            </div>
            
            {isGenerating && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                <Loader2 className="animate-spin" size={20} color="var(--primary)" />
                <span>Generating anointed content...</span>
              </div>
            )}
            
            {aiResult && !isGenerating && (
              <div style={{ 
                padding: '20px', 
                background: 'rgba(0,0,0,0.2)', 
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.05)',
                marginTop: '16px'
              }}>
                <h4 style={{ marginTop: 0, marginBottom: '16px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={16} /> Generated Result
                </h4>
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{formatText(aiResult)}</div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
