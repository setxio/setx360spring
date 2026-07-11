import React, { useState, useEffect } from 'react';
import { supabase as supabase } from '../../lib/supabase';
import { Calendar, Plus, Loader2 } from 'lucide-react';
import type { User } from '../../types/user';

export const CreatorEventsManager: React.FC<{ user: User }> = ({ user }) => {
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', location: '', event_date: '', ticket_price: '' });

  useEffect(() => {
    fetchEvents();
  }, [user]);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.from('events').select('*').eq('creator_id', user.id).order('event_date', { ascending: true });
      if (error) console.error("Error fetching events:", error);
      setEvents(data || []);
    } catch (err) {
      console.error("Exception in fetchEvents:", err);
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newEvent.title || !newEvent.event_date) return;
    setIsCreating(true);
    const eventDate = new Date(newEvent.event_date);
    const { data: eventData, error } = await supabase.from('events').insert([{
      creator_id: user.id,
      title: newEvent.title,
      location: newEvent.location,
      event_date: eventDate.toISOString(),
      ticket_price: parseFloat(newEvent.ticket_price) || 0
    }]).select();

    if (!error && eventData) {
      // Auto-post to Social Feed
      const formattedDate = eventDate.toLocaleDateString() + ' @ ' + eventDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      const postContent = `📅 **Upcoming Gig: ${newEvent.title}**\n\n📍 ${newEvent.location}\n🕒 ${formattedDate}\n🎟️ Tickets: $${parseFloat(newEvent.ticket_price) || 0}\n\nDon't miss out, see you there!`;
      
      await supabase.from('posts').insert([{
        profile_id: user.id,
        content: postContent,
        type: 'event',
        category: 'Events',
        location: newEvent.location,
        visibility_scope: 'national'
      }]);

      setNewEvent({ title: '', location: '', event_date: '', ticket_price: '' });
      fetchEvents();
    } else if (error) {
      alert("Error creating event: " + error.message);
    }
    setIsCreating(false);
  };

  if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Loader2 className="animate-spin" /></div>;

  return (
    <div className="elite-widget fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}><Calendar size={20} /> My Gigs & Events</h3>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.05)', padding: 24, borderRadius: 12, marginBottom: 24 }}>
        <h4 style={{ margin: '0 0 16px' }}>Schedule New Event</h4>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <input type="text" placeholder="Event Title" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} className="glass-input" style={{ flex: 1, minWidth: 200, padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'white' }} />
          <input type="text" placeholder="Location/Venue" value={newEvent.location} onChange={e => setNewEvent({...newEvent, location: e.target.value})} className="glass-input" style={{ flex: 1, minWidth: 200, padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'white' }} />
          <input type="datetime-local" value={newEvent.event_date} onChange={e => setNewEvent({...newEvent, event_date: e.target.value})} className="glass-input" style={{ padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'white' }} />
          <input type="number" placeholder="Ticket Price ($)" value={newEvent.ticket_price} onChange={e => setNewEvent({...newEvent, ticket_price: e.target.value})} className="glass-input" style={{ width: 140, padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'white' }} />
          <button onClick={handleCreate} disabled={isCreating} className="primary-btn" style={{ height: 44 }}><Plus size={18} /></button>
        </div>
      </div>

      {events.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 24 }}>No events scheduled.</p>
      ) : (
        <table className="elite-table" style={{ width: '100%', textAlign: 'left' }}>
          <thead>
            <tr><th>Date</th><th>Event</th><th>Location</th><th>Price</th></tr>
          </thead>
          <tbody>
            {events.map(e => (
              <tr key={e.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '12px 0' }}>{new Date(e.event_date).toLocaleDateString()} {new Date(e.event_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                <td style={{ fontWeight: 700 }}>{e.title}</td>
                <td>{e.location}</td>
                <td style={{ fontWeight: 800 }}>${e.ticket_price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

