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
  Loader2
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
  const [isLoading, setIsLoading] = useState(true);
  const [escalatedScope, setEscalatedScope] = useState<string | null>(null);

  React.useEffect(() => {
    fetchEvents();
  }, [scope, user]);

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

    const { data, error } = await query;
    let fetchedEvents = data || [];
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

    if (!error) {
      const mapped = fetchedEvents.map((e: any) => ({
        id: e.id,
        title: e.title,
        date: new Date(e.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: new Date(e.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        location: e.location || 'Local Venue',
        image: e.image_url || 'https://images.unsplash.com/photo-1514525253361-bee8718a34a1?auto=format&fit=crop&w=800&q=80',
        price: 'From $15',
        attendees: 50,
        category: 'Community'
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

  const renderPasses = () => (
    <div className="events-content">
      <div className="section-header">
        <h2>My Passes</h2>
      </div>
      <div className="pass-card glass">
        <div className="pass-header">
          <Ticket size={24} color="#8b5cf6" />
          <h3>Beaumont Jazz Night</h3>
        </div>
        <div className="pass-qr-placeholder">
          <QrCode size={140} color="var(--text)" />
        </div>
        <div className="pass-details">
          <div className="p-det"><span>Row</span><p>G</p></div>
          <div className="p-det"><span>Seat</span><p>14</p></div>
          <div className="p-det"><span>Section</span><p>Balcony</p></div>
        </div>
      </div>
    </div>
  );

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
      <div className="hosting-banner glass">
        <h3>Organizer Dashboard</h3>
        <p>You have 0 active events being hosted.</p>
        <button className="host-btn">Create Event</button>
      </div>
      <div className="p-interests glass">
        <h4>Your Interests</h4>
        <div className="interest-pills">
          <span className="i-pill">Jazz</span>
          <span className="i-pill">BBQ</span>
          <span className="i-pill">Art Walk</span>
        </div>
      </div>
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
