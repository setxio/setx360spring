import React, { useState, useEffect } from 'react';
import { Check, Star, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './RSVPButtons.css';

interface RSVPButtonsProps {
  postId: string;
  user: any;
}

export const RSVPButtons: React.FC<RSVPButtonsProps> = ({ postId, user }) => {
  const [status, setStatus] = useState<'going' | 'interested' | null>(null);
  const [counts, setCounts] = useState({ going: 0, interested: 0 });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchRSVPStatus();
    fetchRSVPCounts();

    // Real-time subscription
    const channel = supabase
      .channel(`rsvps-${postId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'event_rsvps', 
        filter: `post_id=eq.${postId}` 
      }, () => {
        fetchRSVPCounts();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [postId]);

  const fetchRSVPStatus = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('event_rsvps')
      .select('status')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .single();
    
    if (data) setStatus(data.status as any);
  };

  const fetchRSVPCounts = async () => {
    const { data } = await supabase
      .from('event_rsvps')
      .select('status'); // In a larger app, use a count query or RPC
    
    if (data) {
      const g = data.filter(r => r.status === 'going').length;
      const i = data.filter(r => r.status === 'interested').length;
      setCounts({ going: g, interested: i });
    }
  };

  const handleRSVP = async (newStatus: 'going' | 'interested') => {
    if (!user) return alert('Please sign in to RSVP.');
    setIsLoading(true);

    try {
      if (status === newStatus) {
        // Toggle off
        await supabase.from('event_rsvps').delete().eq('post_id', postId).eq('user_id', user.id);
        setStatus(null);
      } else {
        // Upsert
        const { error } = await supabase.from('event_rsvps').upsert({
          post_id: postId,
          user_id: user.id,
          status: newStatus
        });
        if (error) throw error;
        setStatus(newStatus);
      }
      fetchRSVPCounts();
    } catch (err) {
      console.error('RSVP failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rsvp-container">
      <button 
        className={`rsvp-btn going ${status === 'going' ? 'active' : ''}`}
        onClick={() => handleRSVP('going')}
        disabled={isLoading}
      >
        {isLoading && status === 'going' ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
        <span>Going ({counts.going})</span>
      </button>

      <button 
        className={`rsvp-btn interested ${status === 'interested' ? 'active' : ''}`}
        onClick={() => handleRSVP('interested')}
        disabled={isLoading}
      >
        {isLoading && status === 'interested' ? <Loader2 className="animate-spin" size={14} /> : <Star size={14} />}
        <span>Interested ({counts.interested})</span>
      </button>
    </div>
  );
};
