import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, 
  PlayCircle, 
  Loader2, 
  Phone, 
  MapPin, 
  DollarSign, 
  Video, 
  ArrowLeft,
  UserPlus,
  CheckCircle2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import './ChurchProfileView.css';

interface ChurchProfileProps {
  churchId: string;
  onBack: () => void;
}

export const ChurchProfileView: React.FC<ChurchProfileProps> = ({ churchId, onBack }) => {
  const { user: currentUser } = useApp();
  const [church, setChurch] = useState<any>(null);
  const [isMember, setIsMember] = useState(false);
  const [activeTab, setActiveTab] = useState('services');
  const [isLoading, setIsLoading] = useState(true);
  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    fetchChurchData();
    checkMembership();
    fetchMembers();
  }, [churchId]);

  const fetchMembers = async () => {
    const { data } = await supabase
      .from('church_members')
      .select('*, member:profiles!user_id(*)')
      .eq('church_id', churchId);
    if (data) setMembers(data);
  };

  const fetchChurchData = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', churchId)
      .single();

    if (data) {
      setChurch(data);
    }
    setIsLoading(false);
  };

  const checkMembership = async () => {
    if (!currentUser) return;
    const { data } = await supabase
      .from('church_members')
      .select('id')
      .eq('church_id', churchId)
      .eq('user_id', currentUser.id)
      .maybeSingle();
    
    setIsMember(!!data);
  };

  const toggleMembership = async () => {
    if (!currentUser) return;
    if (isMember) {
      await supabase
        .from('church_members')
        .delete()
        .eq('church_id', churchId)
        .eq('user_id', currentUser.id);
      setIsMember(false);
    } else {
      await supabase
        .from('church_members')
        .insert({ church_id: churchId, user_id: currentUser.id });
      setIsMember(true);
    }
  };

  if (isLoading || !church) {
    return (
      <div className="church-profile-loading">
        <Loader2 className="animate-spin" size={48} color="var(--primary)" />
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'services':
        return (
          <div className="tab-content services-tab">
            <h3>Service Times</h3>
            <div className="service-list">
              {(church.service_times || []).map((s: any, i: number) => (
                <div key={i} className="service-item glass">
                  <span className="day">{s.day}</span>
                  <span className="time">{s.time}</span>
                  <span className="type">{s.type}</span>
                </div>
              ))}
            </div>
            <div className="contact-info">
              {church.phone && (
                <a href={`tel:${church.phone}`} className="contact-btn glass">
                  <Phone size={20} /> {church.phone}
                </a>
              )}
              {church.address && (
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(church.address)}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="contact-btn glass"
                >
                  <MapPin size={20} /> Get Directions
                </a>
              )}
            </div>
          </div>
        );
      case 'members':
        return (
          <div className="tab-content">
            <h3>Church Family</h3>
            {members.length > 0 ? (
              <div className="members-grid">
                {members.map(m => (
                  <div key={m.id} className="member-card glass">
                    <img src={m.member?.avatar_url || 'https://i.pravatar.cc/150'} alt={m.member?.name} />
                    <span>{m.member?.name || 'Member'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-content">No members have joined this church family yet.</div>
            )}
          </div>
        );
      case 'events':
        return (
          <div className="tab-content">
            <h3>Church Events</h3>
            <div className="no-content">No upcoming events scheduled.</div>
          </div>
        );
      case 'prayer':
        return (
          <div className="tab-content">
            <h3>Prayer Wall</h3>
            <div className="no-content">Share a prayer request with the church family.</div>
          </div>
        );
      case 'tithe':
        return (
          <div className="tab-content tithe-tab">
            <h3>Giving & Tithes</h3>
            <p>Your support helps us continue our mission and serve the community.</p>
            {church.tithe_url ? (
              <a href={church.tithe_url} target="_blank" rel="noopener noreferrer" className="give-btn">
                <DollarSign size={24} /> Give Now
              </a>
            ) : (
              <div className="no-content">Tithing link not provided by the church.</div>
            )}
          </div>
        );
      case 'media':
        return (
          <div className="tab-content">
            <h3>Media Library</h3>
            <div className="no-content">Past services and devotionals.</div>
          </div>
        );
      case 'groups':
        return (
          <div className="tab-content">
            <h3>Study Groups</h3>
            <div className="no-content">Small groups and Bible studies.</div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="church-profile-view">
      <header className="church-profile-header">
        <button className="back-btn" onClick={onBack}><ArrowLeft size={24} /></button>
        <div className="banner" style={{ backgroundImage: `url(${church.banner_url || 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&q=80&w=1200'})` }}>
          <div className="banner-overlay" />
        </div>
        <div className="profile-top-info">
          <div className="logo-wrap">
            <img src={church.avatar_url || 'https://i.pravatar.cc/150?u=church'} alt={church.name} className="church-logo" />
          </div>
          <div className="header-actions">
            <button className={`action-btn member-btn ${isMember ? 'active' : ''}`} onClick={toggleMembership}>
              {isMember ? <CheckCircle2 size={20} /> : <UserPlus size={20} />}
              {isMember ? 'Member' : 'Join'}
            </button>
            <button className="action-btn message-btn">
              <MessageCircle size={20} /> Message
            </button>
          </div>
        </div>
      </header>

      <main className="church-profile-content">
        <div className="bio-section">
          <h1 className="church-name">{church.name || 'Grace Community Church'}</h1>
          <span className="denomination-tag">{church.denomination || 'Non-Denominational'}</span>
          <p className="church-bio">{church.bio || 'Welcome to our church home. We are dedicated to serving the SETX community through faith, fellowship, and love.'}</p>
        </div>

        <section className="live-service-section glass">
          <div className="live-status">
            <div className="status-indicator live" />
            <span>Live Now</span>
          </div>
          <div className="video-placeholder">
            <Video size={48} />
            <p>Sunday Service - 10/28/23</p>
            <button className="play-btn"><PlayCircle size={32} /></button>
          </div>
        </section>

        <nav className="church-tabs-nav">
          <button className={`tab-btn ${activeTab === 'services' ? 'active' : ''}`} onClick={() => setActiveTab('services')}>Services</button>
          <button className={`tab-btn ${activeTab === 'members' ? 'active' : ''}`} onClick={() => setActiveTab('members')}>Family</button>
          <button className={`tab-btn ${activeTab === 'prayer' ? 'active' : ''}`} onClick={() => setActiveTab('prayer')}>Prayer Wall</button>
          <button className={`tab-btn ${activeTab === 'groups' ? 'active' : ''}`} onClick={() => setActiveTab('groups')}>Study Groups</button>
          <button className={`tab-btn ${activeTab === 'events' ? 'active' : ''}`} onClick={() => setActiveTab('events')}>Events</button>
          <button className={`tab-btn ${activeTab === 'media' ? 'active' : ''}`} onClick={() => setActiveTab('media')}>Media</button>
          <button className={`tab-btn ${activeTab === 'tithe' ? 'active' : ''}`} onClick={() => setActiveTab('tithe')}>Tithe</button>
        </nav>

        <div className="tab-container">
          {renderTabContent()}
        </div>
      </main>
    </div>
  );
};
