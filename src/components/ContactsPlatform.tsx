import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import { ContactActionButtons } from './ContactActionButtons';
import { Avatar } from './Avatar';
import { Loader2, Search, ArrowLeft, History, Users, Briefcase, Landmark, MapPin, Smartphone, CheckCircle2 } from 'lucide-react';
import './ContactsPlatform.css';

interface ContactsPlatformProps {
  onBack?: () => void;
}

export const ContactsPlatform: React.FC<ContactsPlatformProps> = ({ onBack }) => {
  const { user } = useApp();
  const [activeTab, setActiveTab] = useState<'recent' | 'friends' | 'interactions' | 'businesses' | 'civic'>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data states
  const [recent, setRecent] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [interactions, setInteractions] = useState<any[]>([]);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [civicContacts, setCivicContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncComplete, setSyncComplete] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'friends') {
        // Fetch friends (mocking for now, could be replaced with actual follows/friends table)
        const { data } = await supabase.from('profiles').select('*').limit(10);
        setFriends(data || []);
      } else if (activeTab === 'businesses') {
        // Fetch businesses (profiles with specific roles)
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .in('role', ['vendor', 'business', 'restaurant', 'store'])
          .limit(20);
        setBusinesses(data || []);
      } else if (activeTab === 'civic') {
        // Fetch civic directory
        const { data } = await supabase.from('civic_directory').select('*').limit(20);
        setCivicContacts(data || []);
      } else if (activeTab === 'recent') {
        // Mock recent conversations
        setRecent([
          { id: '1', name: 'Joey Hilliard', phone: '409-555-0101', type: 'Call', time: '2 hours ago', avatar_url: 'https://i.pravatar.cc/150?u=1' },
          { id: '2', name: 'Mike Getz', phone: '409-555-0102', type: 'Message', time: 'Yesterday', avatar_url: 'https://i.pravatar.cc/150?u=5' }
        ]);
      } else if (activeTab === 'interactions') {
        // Mock gig economy / SETX platform interactions
        setInteractions([
          { id: '1', name: 'Marcus T. (Driver)', phone: '409-555-0201', role: 'Delivery Driver', avatar_url: 'https://i.pravatar.cc/150?u=11' },
          { id: '2', name: 'Sarah L. (Service)', phone: '409-555-0202', role: 'Plumber', avatar_url: 'https://i.pravatar.cc/150?u=12' }
        ]);
      }
    } catch (err) {
      console.error('Error fetching contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncContacts = () => {
    setIsSyncing(true);
    setSyncComplete(false);
    // Mock the sync process
    setTimeout(() => {
      setIsSyncing(false);
      setSyncComplete(true);
      // Automatically hide the success message after 3 seconds
      setTimeout(() => setSyncComplete(false), 3000);
    }, 2000);
  };

  const renderList = (items: any[], type: string) => {
    if (loading) {
      return (
        <div className="contacts-loading">
          <Loader2 className="animate-spin" size={32} color="var(--primary)" />
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div className="contacts-empty">
          <p>No contacts found in this section.</p>
        </div>
      );
    }

    return (
      <div className="contacts-list">
        {items.filter(item => (item.name || item.title || '').toLowerCase().includes(searchQuery.toLowerCase())).map((item) => (
          <div key={item.id} className="contact-card glass">
            <div className="contact-info">
              {type === 'civic' ? (
                <div className="civic-icon-wrap">
                  <Landmark size={24} />
                </div>
              ) : (
                <Avatar url={item.avatar_url} name={item.name} size={48} />
              )}
              <div className="contact-details">
                <h3>{item.name || item.title}</h3>
                {type === 'recent' && <p className="subtitle">{item.type} • {item.time}</p>}
                {type === 'interactions' && <p className="subtitle">{item.role}</p>}
                {type === 'businesses' && <p className="subtitle capitalize">{item.role || 'Business'}</p>}
                {type === 'civic' && <p className="subtitle">{item.department || item.jurisdiction || 'Civic Department'}</p>}
              </div>
            </div>
            
            <ContactActionButtons 
              contactId={item.id} 
              phone={item.phone || item.custom_phone}
              size="medium"
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="contacts-platform">
      <header className="contacts-header glass">
        {onBack && (
          <button className="back-btn" onClick={onBack}>
            <ArrowLeft size={24} />
          </button>
        )}
        <div className="header-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <h1>Contacts</h1>
          <button 
            className="sync-contacts-btn" 
            onClick={handleSyncContacts}
            disabled={isSyncing}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 16px', borderRadius: '20px',
              background: 'var(--primary)', color: 'white',
              border: 'none', cursor: 'pointer',
              fontWeight: 600, fontSize: '0.9rem',
              transition: 'all 0.3s'
            }}
          >
            {isSyncing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : syncComplete ? (
              <CheckCircle2 size={16} />
            ) : (
              <Smartphone size={16} />
            )}
            {isSyncing ? 'Syncing...' : syncComplete ? 'Synced!' : 'Sync Phone'}
          </button>
        </div>
        
        <div className="contacts-search-wrap">
          <Search size={20} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search contacts..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <nav className="contacts-tabs no-scrollbar">
          <button className={`tab-btn ${activeTab === 'recent' ? 'active' : ''}`} onClick={() => setActiveTab('recent')}>
            <History size={16} /> Recent
          </button>
          <button className={`tab-btn ${activeTab === 'friends' ? 'active' : ''}`} onClick={() => setActiveTab('friends')}>
            <Users size={16} /> Friends
          </button>
          <button className={`tab-btn ${activeTab === 'interactions' ? 'active' : ''}`} onClick={() => setActiveTab('interactions')}>
            <MapPin size={16} /> Interactions
          </button>
          <button className={`tab-btn ${activeTab === 'businesses' ? 'active' : ''}`} onClick={() => setActiveTab('businesses')}>
            <Briefcase size={16} /> Businesses
          </button>
          <button className={`tab-btn ${activeTab === 'civic' ? 'active' : ''}`} onClick={() => setActiveTab('civic')}>
            <Landmark size={16} /> Civic
          </button>
        </nav>
      </header>

      <main className="contacts-main-content no-scrollbar">
        {activeTab === 'recent' && renderList(recent, 'recent')}
        {activeTab === 'friends' && renderList(friends, 'friends')}
        {activeTab === 'interactions' && renderList(interactions, 'interactions')}
        {activeTab === 'businesses' && renderList(businesses, 'businesses')}
        {activeTab === 'civic' && renderList(civicContacts, 'civic')}
      </main>
    </div>
  );
};
