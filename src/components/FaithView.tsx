import React, { useState, useEffect } from 'react';
import { Church, Sparkles, Heart, MessageCircle, PlayCircle, BookOpen, Loader2, Search, Filter, ArrowRight, MapPin, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { SETX_COUNTY_LIST } from '../utils/geo';
import { ChurchProfileView } from './ChurchProfileView';
import './FaithView.css';

const DENOMINATIONS = [
  'All Denominations',
  'Baptist',
  'Catholic',
  'Non-Denominational',
  'Methodist',
  'Pentecostal',
  'Lutheran',
  'Episcopal',
  'Presbyterian',
  'Orthodox'
];

export const FaithView: React.FC<{ user?: any; scope?: string }> = ({ user: propUser, scope = 'national' }) => {
  const [view, setView] = useState<'feed' | 'directory' | 'profile'>('feed');
  const [selectedChurchId, setSelectedChurchId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [churches, setChurches] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDenom, setSelectedDenom] = useState('All Denominations');
  const [dailyManna, setDailyManna] = useState<any>(null);

  const { user: contextUser } = useApp();
  const user = propUser || contextUser;

  useEffect(() => {
    if (view === 'directory') {
      fetchChurches();
    }
  }, [view, selectedDenom, searchQuery, scope]);

  useEffect(() => {
    if (view === 'feed') {
      setIsLoading(true);
      fetchDailyManna();
      setTimeout(() => setIsLoading(false), 400);
    }
  }, [view, scope]);

  const fetchDailyManna = async () => {
    const { data } = await supabase
      .from('daily_manna')
      .select('*')
      .order('date', { ascending: false })
      .limit(1)
      .single();
    if (data) setDailyManna(data);
  };

  const fetchChurches = async () => {
    setIsLoading(true);
    let query = supabase
      .from('profiles')
      .select('*')
      .eq('role', 'church');

    if (searchQuery) query = query.ilike('name', `%${searchQuery}%`);
    if (selectedDenom !== 'All Denominations') query = query.eq('denomination', selectedDenom);
    
    // Regional filtering for SETX
    if (user && scope !== 'national') {
      if (scope === 'city') query = query.eq('community', user.community);
      else if (scope === 'county') query = query.in('county', SETX_COUNTY_LIST);
    }

    const { data } = await query;
    setChurches(data || []);
    setIsLoading(false);
  };

  const renderFeed = () => (
    <div className="faith-content">
      <section className="faith-hero">
        <div className="hero-content">
          <Sparkles className="hero-icon" size={32} />
          <h1 className="hero-title">Daily Manna</h1>
          <p className="verse-text">{dailyManna?.verse_text || '"For I know the plans I have for you," declares the Lord, "plans to prosper you and not to harm you, plans to give you hope and a future."'}</p>
          <span className="verse-ref">— {dailyManna?.verse_reference || 'Jeremiah 29:11'}</span>
          {dailyManna?.reflection && (
            <p className="verse-reflection" style={{ marginTop: '16px', fontSize: '0.9rem', opacity: 0.9, fontStyle: 'italic' }}>
              {dailyManna.reflection}
            </p>
          )}
        </div>
      </section>

      <div className="faith-quick-actions">
        <button className="faith-action-btn" onClick={() => setView('directory')}>
          <Church size={24} />
          <span>Find Church</span>
        </button>
        <button className="faith-action-btn">
          <PlayCircle size={24} />
          <span>Live Service</span>
        </button>
        <button className="faith-action-btn">
          <BookOpen size={24} />
          <span>Study Groups</span>
        </button>
        <button className="faith-action-btn">
          <Heart size={24} />
          <span>Prayer Wall</span>
        </button>
      </div>

      <section className="faith-feed">
        <h3 className="section-title">Fellowship Feed</h3>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <Loader2 className="animate-spin" size={32} color="var(--primary)" />
          </div>
        ) : (
          <>
            <div className="faith-post premium-card">
              <div className="faith-post-header">
                <div className="faith-author-info">
                  <div className="faith-avatar" />
                  <div>
                    <h4 className="faith-author-name">Grace Community</h4>
                    <span className="faith-post-time">2 hours ago</span>
                  </div>
                </div>
                <Church size={20} className="faith-icon-muted" />
              </div>
              <p className="faith-post-content">Join us this Sunday at 10:00 AM for our special "Youth Sunday" service. All are welcome to celebrate and grow together! 🙏</p>
              <div className="faith-post-image-wrap">
                <img src="https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&q=80&w=600" alt="Church Service" className="faith-post-image" />
              </div>
              <div className="faith-post-actions">
                <button className="f-post-btn"><Heart size={18} /> 124</button>
                <button className="f-post-btn"><MessageCircle size={18} /> 12</button>
                <button className="f-post-btn-primary">RSVP</button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );

  const renderDirectory = () => (
    <div className="faith-directory">
      <header className="directory-header">
        <div className="title-row">
          <button className="back-link" onClick={() => setView('feed')}><ArrowRight size={18} style={{ transform: 'rotate(180deg)' }} /> Back</button>
          <h2>Church Directory</h2>
        </div>
        <div className="directory-controls glass">
          <div className="search-wrap">
            <Search size={18} className="icon" />
            <input 
              type="text" 
              placeholder="Search by church name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="filter-wrap">
            <select value={selectedDenom} onChange={(e) => setSelectedDenom(e.target.value)}>
              {DENOMINATIONS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <Filter size={16} className="icon" />
          </div>
        </div>
      </header>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <Loader2 className="animate-spin" size={32} color="var(--primary)" />
        </div>
      ) : (
        <div className="church-grid">
          {churches.length > 0 ? churches.map(church => (
            <div key={church.id} className="church-card glass" onClick={() => { setSelectedChurchId(church.id); setView('profile'); }}>
              <div className="card-banner" style={{ backgroundImage: `url(${church.banner_url || 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&q=80&w=600'})` }}>
                <div className="church-logo-mini">
                  <img src={church.avatar_url || 'https://i.pravatar.cc/150?u=church'} alt={church.name} />
                </div>
              </div>
              <div className="card-body">
                <div className="church-meta">
                  <h4>{church.name || 'Grace Community'}</h4>
                  <span className="denom">{church.denomination || 'Non-Denominational'}</span>
                </div>
                <div className="church-loc">
                  <MapPin size={14} />
                  <span>{church.community || 'SETX'}, {church.county || 'Jefferson'}</span>
                </div>
                <div className="card-footer">
                  <div className="members-count">
                    <Users size={14} />
                    <span>248 Members</span>
                  </div>
                  <button className="visit-btn">Visit <ArrowRight size={14} /></button>
                </div>
              </div>
            </div>
          )) : (
            <div className="no-results premium-card">
              <p>No churches found matching your criteria in {scope}.</p>
              <button className="reset-btn" onClick={() => { setSelectedDenom('All Denominations'); setSearchQuery(''); }}>Reset Filters</button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (view === 'profile' && selectedChurchId) {
    return <ChurchProfileView churchId={selectedChurchId} onBack={() => setView('directory')} />;
  }

  return (
    <div className="faith-container">
      {view === 'feed' ? renderFeed() : renderDirectory()}
    </div>
  );
};
