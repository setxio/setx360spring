import React, { useState } from 'react';
import { 
  Calendar, 
  MapPin, 
  Search, 
  Ticket, 
  Users, 
  ChevronRight, 
  Star, 
  Music, 
  Utensils, 
  Trophy,
  Filter,
  Plus,
  QrCode,
  Loader2,
  Scan,
  XCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import { SETX_COUNTY_LIST } from '../utils/geo';
import './EventsView.css';

const CATEGORIES = [
  { id: 'concerts', label: 'Concerts', icon: <Music size={24} />, color: '#8b5cf6' },
  { id: 'food', label: 'Food & Drink', icon: <Utensils size={24} />, color: '#f97316' },
  { id: 'community', label: 'Community', icon: <Users size={24} />, color: '#10b981' },
  { id: 'sports', label: 'Sports', icon: <Trophy size={24} />, color: '#3b82f6' },
];

const EVENTS = [
  {
    id: 'e1',
    title: 'Beaumont Jazz Night',
    date: 'Oct 28, 2023',
    time: '7:00 PM',
    location: 'The Jefferson Theatre',
    image: 'https://images.unsplash.com/photo-1514525253361-bee8718a34a1?auto=format&fit=crop&w=800&q=80',
    price: 'From $25',
    attendees: 142,
    category: 'Music'
  },
  {
    id: 'e2',
    title: 'Southeast Texas BBQ Festival',
    date: 'Nov 4, 2023',
    time: '11:00 AM',
    location: 'Groves City Park',
    image: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=800&q=80',
    price: 'Free Entry',
    attendees: 850,
    category: 'Food'
  },
  {
    id: 'e3',
    title: 'Local Art Walk',
    date: 'Nov 12, 2023',
    time: '4:00 PM',
    location: 'Downtown Beaumont',
    image: 'https://images.unsplash.com/photo-1460661419201-fd4cecea8f82?auto=format&fit=crop&w=800&q=80',
    price: 'Free',
    attendees: 210,
    category: 'Art'
  }
];

export const EventsView: React.FC<{ activeTab?: number; user?: any; scope?: string }> = ({ activeTab = 0, user, scope = 'city' }) => {
  const { theme } = useApp();
  const isSETX = theme.startsWith('setx-');
  const [searchQuery, setSearchQuery] = useState('');
  const [events, setEvents] = useState<any[]>([]);
  const [passes, setPasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [escalatedScope, setEscalatedScope] = useState<string | null>(null);
  const [isScannerMode, setIsScannerMode] = useState(false);

  React.useEffect(() => {
    fetchEvents();
    if (user) {
      fetchPasses();
    }
  }, [scope, user]);

  const fetchPasses = async () => {
    const { data } = await supabase
      .from('tickets')
      .select('*, events(*, organizer:profiles!creator_id(community, county, state, country))')
      .eq('purchaser_id', user.id);
    
    if (data) {
      // Map DB tickets to the PASSES UI format
      const formatted = data.map((t: any, i: number) => {
        const colors = [
          'linear-gradient(135deg, #8b5cf6, #3b82f6)',
          'linear-gradient(135deg, #f97316, #eab308)',
          'linear-gradient(135deg, #10b981, #3b82f6)',
          'linear-gradient(135deg, #ec4899, #8b5cf6)'
        ];
        return {
          id: t.id,
          event: t.events?.title || 'Unknown Event',
          venue: t.events?.location || 'TBA',
          date: t.events?.event_date ? new Date(t.events.event_date).toLocaleDateString() : 'TBA',
          time: t.events?.event_date ? new Date(t.events.event_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'TBA',
          row: '-',
          seat: '-',
          section: 'General',
          tier: t.status === 'vip' ? 'VIP' : 'GA',
          color: colors[i % colors.length],
          qr: t.qr_code_hash
        };
      });
      setPasses(formatted);
    }
  };

  const fetchEvents = async () => {
    setIsLoading(true);
    let selectString = `*, organizer:profiles!profile_id(community, county, state, country)`;
    const needsGeoFilter = user && scope !== 'national';
    if (needsGeoFilter) {
      selectString = `*, organizer:profiles!profile_id!inner(community, county, state, country)`;
    }

    let query = supabase.from('events').select(selectString).order('start_time', { ascending: true }).limit(20);

    if (needsGeoFilter) {
      if (scope === 'city') query = query.eq('organizer.community', user.community);
      else if (scope === 'county') {
        if (isSETX) {
          query = query.in('organizer.county', SETX_COUNTY_LIST);
        } else {
          query = query.eq('organizer.county', user.county);
        }
      }
      else if (scope === 'state') query = query.eq('organizer.state', user.state);
    }

    const [eventsRes, postsRes] = await Promise.all([
      query,
      supabase.from('posts')
        .select('*, author:profiles!posts_profile_id_fkey(*)')
        .eq('type', 'event')
        .neq('moderation_status', 'hidden')
        .limit(10)
    ]);

    let fetchedEvents = eventsRes.data || [];
    const socialEvents = (postsRes.data || []).map(p => ({
      ...p,
      title: p.content?.slice(0, 40) + '...',
      start_time: p.event_start_time || p.created_at,
      image_url: p.media_urls?.[0] || 'https://images.unsplash.com/photo-1514525253361-bee8718a34a1?auto=format&fit=crop&w=800&q=80',
      is_social: true
    }));

    fetchedEvents = [...fetchedEvents, ...socialEvents];
    let currentEscalation: string | null = null;

    if (needsGeoFilter && fetchedEvents.length < 3 && scope !== 'national') {
      const escalationMap: Record<string, { nextScope: string; filterKey: string; filterValue: string; label: string }> = {
        city: { nextScope: 'county', filterKey: 'organizer.county', filterValue: user.county, label: `${user.county || 'your'} County` },
        // Hide state/national escalation for SETX project
        ...(!isSETX ? {
          county: { nextScope: 'state', filterKey: 'organizer.state', filterValue: user.state, label: user.state || 'your state' },
          state: { nextScope: 'national', filterKey: '', filterValue: '', label: 'nationwide' },
        } : {}),
      };
      const esc = escalationMap[scope];
      if (esc && esc.filterValue) {
        let escQuery = supabase.from('events').select(`*, organizer:profiles!profile_id!inner(community, county, state, country)`).order('start_time', { ascending: true }).limit(20);
        if (esc.nextScope !== 'national') escQuery = escQuery.eq(esc.filterKey, esc.filterValue);
        const { data: escData } = await escQuery;
        if (escData && escData.length > 0) {
          const existingIds = new Set(fetchedEvents.map((e: any) => e.id));
          const newEvents = escData.filter((e: any) => !existingIds.has(e.id));
          fetchedEvents = [...fetchedEvents, ...newEvents];
          currentEscalation = esc.label;
        }
      }
    }

    if (!eventsRes.error) {
      const mapped = fetchedEvents.map((e: any) => ({
        id: e.id,
        title: e.title,
        date: new Date(e.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: new Date(e.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        location: e.location || (e.is_social ? 'Community Post' : 'Local Venue'),
        image: e.image_url || 'https://images.unsplash.com/photo-1514525253361-bee8718a34a1?auto=format&fit=crop&w=800&q=80',
        price: e.is_social ? 'N/A' : 'From $15',
        attendees: e.is_social ? (e.upvote_count || 0) : 50,
        category: e.is_social ? 'Community' : 'Featured'
      }));
      setEvents(mapped.length > 0 ? mapped : EVENTS);
      setEscalatedScope(currentEscalation);
    } else {
      setEvents(EVENTS);
      setEscalatedScope(null);
    }
    setIsLoading(false);
  };

  const renderHome = () => (
    <div className="events-content">
      <section className="events-section">
        <div className="section-header">
          <h2>Categories</h2>
        </div>
        <div className="events-categories">
          {CATEGORIES.map(cat => (
            <div key={cat.id} className="event-cat-card" style={{ background: cat.color }}>
              <div className="cat-icon-glass">{cat.icon}</div>
              <span>{cat.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="events-section">
        <div className="section-header">
          <h2>Trending Events</h2>
          <button className="view-all">See All</button>
        </div>
        
        {escalatedScope && (
          <div style={{
            padding: '10px 16px',
            marginBottom: '16px',
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
            <span>Expanded to <strong style={{ color: 'var(--primary)' }}>{escalatedScope}</strong> — not enough local events yet</span>
          </div>
        )}

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px', width: '100%' }}>
            <Loader2 className="animate-spin" size={32} color="var(--primary)" />
          </div>
        ) : (
        <div className="events-list">
          {events.filter(e => e.title.toLowerCase().includes(searchQuery.toLowerCase())).map(event => (
            <div key={event.id} className="event-card glass">
              <div className="event-image" style={{ backgroundImage: `url(${event.image})` }}>
                <div className="event-date-badge">
                  <span className="day">{event.date.split(' ')[1].replace(',', '')}</span>
                  <span className="month">{event.date.split(' ')[0]}</span>
                </div>
                <button className="interested-btn"><Star size={18} /></button>
              </div>
              <div className="event-info">
                <span className="event-cat-tag">{event.category}</span>
                <h3>{event.title}</h3>
                <div className="event-meta">
                  <div className="meta-item">
                    <Calendar size={14} /> <span>{event.time}</span>
                  </div>
                  <div className="meta-item">
                    <MapPin size={14} /> <span>{event.location}</span>
                  </div>
                </div>
                <div className="event-footer">
                  <div className="attendees">
                    <div className="attendee-avatars">
                      <div className="avatar-mini" style={{ background: '#3b82f6' }}></div>
                      <div className="avatar-mini" style={{ background: '#10b981' }}></div>
                      <div className="avatar-mini" style={{ background: '#f59e0b' }}></div>
                    </div>
                    <span>+{event.attendees} interested</span>
                  </div>
                  <button className="ticket-btn">
                    <Ticket size={16} />
                    <span>{event.price}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}
      </section>

      <section className="hosting-banner glass">
        <div className="hosting-icon"><Users size={32} /></div>
        <div className="hosting-text">
          <h3>Host your own event</h3>
          <p>Reach thousands of locals on SETX 360.</p>
        </div>
        <button className="host-btn">Get Started</button>
      </section>
    </div>
  );

  const renderExplore = () => (
    <div className="events-content">
      <div className="section-header">
        <h2>Explore Venues</h2>
      </div>
      <div className="venue-grid">
        {['The Jefferson', 'Groves Park', 'Lumberton Arena', 'Beaumont Civic'].map(v => (
          <div key={v} className="venue-card glass">
            <div className="v-icon-box"><MapPin size={20} /></div>
            <h4>{v}</h4>
            <p>12 Upcoming Events</p>
          </div>
        ))}
      </div>
    </div>
  );

  const [activePassIdx, setActivePassIdx] = useState(0);

  const renderPasses = () => {
    if (!passes || passes.length === 0) {
      return (
        <div className="events-content">
          <div className="section-header"><h2>My Passes</h2></div>
          <div className="premium-card empty-vendor-state fade-in" style={{ marginTop: 24 }}>
            <Ticket size={48} style={{ opacity: 0.5, marginBottom: 16 }} />
            <h3>No Tickets Found</h3>
            <p>You haven't purchased any passes yet. Explore events to grab yours!</p>
          </div>
        </div>
      );
    }

    const pass = passes[activePassIdx] || passes[0];
    return (
      <div className="events-content">
        <div className="section-header">
          <h2>My Passes</h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{passes.length} tickets</span>
        </div>

        {/* Stacked Wallet Cards */}
        <div style={{ position: 'relative', height: '360px', marginBottom: '24px' }}>
          {passes.map((p, i) => {
            const offset = i - activePassIdx;
            const isActive = i === activePassIdx;
            return (
              <div
                key={p.id}
                onClick={() => setActivePassIdx(i)}
                style={{
                  position: 'absolute',
                  width: '100%',
                  borderRadius: '24px',
                  padding: '24px',
                  background: p.color,
                  boxShadow: isActive ? '0 20px 60px rgba(0,0,0,0.4)' : '0 8px 20px rgba(0,0,0,0.2)',
                  transform: `translateY(${offset * 56}px) scale(${isActive ? 1 : 1 - Math.abs(offset) * 0.04})`,
                  zIndex: passes.length - Math.abs(offset),
                  transition: 'all 0.45s cubic-bezier(0.34,1.56,0.64,1)',
                  cursor: isActive ? 'default' : 'pointer',
                  overflow: 'hidden',
                }}
              >
                {/* Holographic shimmer on VIP */}
                {p.tier === 'VIP' && (
                  <div style={{
                    position: 'absolute', inset: 0, borderRadius: '24px',
                    background: 'linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%)',
                    backgroundSize: '200% 100%',
                    animation: 'holographic-shimmer 3s linear infinite',
                    pointerEvents: 'none',
                  }} />
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>{p.tier} PASS</span>
                    <h3 style={{ margin: '4px 0 0', fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>{p.event}</h3>
                  </div>
                  <Ticket size={28} color="rgba(255,255,255,0.8)" />
                </div>
                <div style={{ display: 'flex', gap: '16px', fontSize: '0.82rem', color: 'rgba(255,255,255,0.85)', marginBottom: '20px' }}>
                  <span>{p.date} · {p.time}</span>
                  <span>{p.venue}</span>
                </div>
                {isActive && (
                  <>
                    <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: '16px', padding: '16px', display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                      <QrCode size={100} color="#111" />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-around', color: 'rgba(255,255,255,0.9)', fontSize: '0.82rem', textAlign: 'center' }}>
                      {p.row !== '-' && <div><div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#fff' }}>{p.row}</div><div>Row</div></div>}
                      {p.seat !== '-' && <div><div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#fff' }}>{p.seat}</div><div>Seat</div></div>}
                      <div><div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#fff' }}>{p.section}</div><div>Section</div></div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '8px' }}>
          {passes.map((_, i) => (
            <div key={i} onClick={() => setActivePassIdx(i)} style={{ width: i === activePassIdx ? '20px' : '8px', height: '8px', borderRadius: '4px', background: i === activePassIdx ? 'var(--primary)' : 'var(--border)', transition: 'all 0.3s ease', cursor: 'pointer' }} />
          ))}
        </div>

        <style>{`@keyframes holographic-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }`}</style>
      </div>
    );
  };

  const renderCalendar = () => (
    <div className="events-content">
      <div className="section-header">
        <h2>Event Calendar</h2>
      </div>
      <div className="events-list">
        {events.map((e: any) => (
          <div key={e.id + '-cal'} className="cal-event-item glass">
             <div className="cal-day-box">
                <span className="d">{e.date.split(' ')[1]?.replace(',', '') || ''}</span>
                <span className="m">{e.date.split(' ')[0] || ''}</span>
             </div>
             <div className="cal-event-info">
                <h4>{e.title}</h4>
                <p>{e.time} • {e.location}</p>
             </div>
             <ChevronRight size={18} />
          </div>
        ))}
      </div>
    </div>
  );

  const renderAccount = () => (
    <div className="events-content">
      {isScannerMode ? (
        <div className="scanner-mode-overlay glass" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.95)' }}>
          <div style={{ padding: '40px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ color: 'white', margin: 0 }}>Scan Tickets</h2>
            <button onClick={() => setIsScannerMode(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
              <XCircle size={32} />
            </button>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '250px', height: '250px', border: '2px dashed var(--primary)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <div style={{ position: 'absolute', width: '100%', height: '2px', background: 'var(--primary)', boxShadow: '0 0 10px var(--primary)', animation: 'scan-line 2s linear infinite' }} />
              <Scan size={64} color="var(--primary)" opacity={0.5} />
            </div>
            <p style={{ color: 'var(--text-muted)', marginTop: '24px' }}>Point camera at attendee's QR code</p>
          </div>
          <style>{`@keyframes scan-line { 0% { top: 0; } 50% { top: 100%; } 100% { top: 0; } }`}</style>
        </div>
      ) : (
        <>
          <div className="hosting-banner glass">
            <h3>Organizer Dashboard</h3>
            <p>You have 0 active events being hosted.</p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button className="host-btn" style={{ flex: 1 }}>Create Event</button>
              <button className="secondary-btn" onClick={() => setIsScannerMode(true)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', borderRadius: '12px', border: '1px solid var(--primary)', background: 'transparent', color: 'var(--primary)', fontWeight: 'bold' }}>
                <Scan size={18} /> Scanner Mode
              </button>
            </div>
          </div>
          <div className="p-interests glass">
            <h4>Your Interests</h4>
            <div className="interest-pills">
              <span className="i-pill">Jazz</span>
              <span className="i-pill">BBQ</span>
              <span className="i-pill">Art Walk</span>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const content = () => {
    switch (activeTab) {
      case 0: return renderHome();
      case 1: return renderExplore();
      case 2: return renderPasses();
      case 3: return renderCalendar();
      case 4: return renderAccount();
      default: return renderHome();
    }
  };

  return (
    <div className="events-container">
      <header className="events-header">
        <div className="header-top">
          <h1>SETX Events</h1>
          <button className="create-event-btn"><Plus size={20} /></button>
        </div>
        <p>Discover what's happening in your community.</p>

        <div className="events-search-bar glass">
          <Search size={20} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search events, venues, or vibes..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="filter-btn"><Filter size={18} /></button>
        </div>

        <div className="date-slider">
          {['Today', 'Tomorrow', 'This Weekend', 'Next Week', 'Oct 30', 'Oct 31'].map((date, i) => (
            <button key={date} className={`date-pill ${i === 0 ? 'active' : ''}`}>{date}</button>
          ))}
        </div>
      </header>
      {content()}
    </div>
  );
};
