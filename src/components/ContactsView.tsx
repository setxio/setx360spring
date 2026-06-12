import React, { useState, useEffect } from 'react';
import { Search, Phone, MessageSquare, Briefcase, Building, Landmark, Clock, Users, X, User } from 'lucide-react';
import { Avatar } from './Avatar';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';

import './ContactsView.css';

interface ContactsViewProps {
  user: any;
  scope: string;
  onNavigate: (env: string, tab?: number, params?: any) => void;
}

export const ContactsView: React.FC<ContactsViewProps> = ({ user, scope, onNavigate }) => {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'recent' | 'friends' | 'interactions' | 'businesses' | 'civic'>('friends');
  const [friends, setFriends] = useState<any[]>([]);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [civicContacts, setCivicContacts] = useState<any[]>([]);
  const [interactions, setInteractions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const fetchContactsData = async () => {
      setIsLoading(true);
      try {
        // Fetch Friends (from relationships table where status = accepted)
        const { data: friendsData } = await supabase
          .from('relationships')
          .select('id, user1_id, user2_id, status, profiles!relationships_user2_id_fkey(id, name, avatar_url, role)')
          .eq('user1_id', user.id)
          .eq('status', 'accepted');
          
        if (friendsData) {
          const friendProfiles = friendsData.map((f: any) => f.profiles).filter(Boolean);
          setFriends(friendProfiles);
        }

        // Fetch Businesses in user's area
        const { data: businessData } = await supabase
          .from('stores')
          .select('id, name, logo_url, category, phone')
          .limit(20);
          
        if (businessData) {
          setBusinesses(businessData);
        }

        // Dummy data for Interactions & Civic for now if not available in DB
        setInteractions([
          { id: '1', name: 'Gig: Lawn Mowing', date: 'Oct 24', role: 'Gig Worker' },
          { id: '2', name: 'Order: Local Cafe', date: 'Oct 23', role: 'Delivery' }
        ]);
        
        setCivicContacts([
          { id: '1', name: 'City Hall 311', type: 'Support', phone: '311' },
          { id: '2', name: 'Water Utilities', type: 'Billing', phone: '555-0102' },
          { id: '3', name: 'Non-Emergency Police', type: 'Safety', phone: '555-0103' }
        ]);

      } catch (err) {
        console.error('Failed to load contacts:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchContactsData();
  }, [user]);

  const handleCall = (contact: any) => {
    // Navigate to the Phone App
    onNavigate('phone');
  };

  const handleMessage = (contact: any) => {
    onNavigate('messages');
  };

  const renderContent = () => {
    if (isLoading) {
      return <div className="contacts-loading">Loading contacts...</div>;
    }

    const filteredFriends = friends.filter(f => f.name.toLowerCase().includes(query.toLowerCase()));
    const filteredBusinesses = businesses.filter(b => b.name.toLowerCase().includes(query.toLowerCase()));

    switch (activeTab) {
      case 'recent':
        return (
          <div className="contacts-list">
            <p className="contacts-empty-state">No recent conversations.</p>
          </div>
        );
        
      case 'friends':
        return (
          <div className="contacts-list">
            {filteredFriends.length > 0 ? filteredFriends.map(friend => (
              <div key={friend.id} className="contact-card">
                <div className="contact-info">
                  <Avatar url={friend.avatar_url} name={friend.name} size={48} />
                  <div>
                    <h3 className="contact-name">{friend.name}</h3>
                    <p className="contact-subtitle">{friend.role}</p>
                  </div>
                </div>
                <div className="contact-actions">
                  <button className="action-btn call-btn" onClick={() => handleCall(friend)}>
                    <Phone size={20} />
                  </button>
                  <button className="action-btn message-btn" onClick={() => handleMessage(friend)}>
                    <MessageSquare size={20} />
                  </button>
                </div>
              </div>
            )) : <p className="contacts-empty-state">No friends found.</p>}
          </div>
        );

      case 'interactions':
        return (
          <div className="contacts-list">
            {interactions.map(interaction => (
              <div key={interaction.id} className="contact-card">
                <div className="contact-info">
                  <div className="icon-circle bg-purple">
                    <Briefcase size={24} color="#fff" />
                  </div>
                  <div>
                    <h3 className="contact-name">{interaction.name}</h3>
                    <p className="contact-subtitle">{interaction.role} • {interaction.date}</p>
                  </div>
                </div>
                <div className="contact-actions">
                  <button className="action-btn message-btn">
                    <MessageSquare size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        );

      case 'businesses':
        return (
          <div className="contacts-list">
            {filteredBusinesses.length > 0 ? filteredBusinesses.map(business => (
              <div key={business.id} className="contact-card">
                <div className="contact-info">
                  <div className="icon-circle bg-blue">
                    {business.logo_url ? <img src={business.logo_url} alt={business.name} /> : <Building size={24} color="#fff" />}
                  </div>
                  <div>
                    <h3 className="contact-name">{business.name}</h3>
                    <p className="contact-subtitle">{business.category}</p>
                  </div>
                </div>
                <div className="contact-actions">
                  <button className="action-btn call-btn" onClick={() => handleCall(business)}>
                    <Phone size={20} />
                  </button>
                  <button className="action-btn message-btn" onClick={() => handleMessage(business)}>
                    <MessageSquare size={20} />
                  </button>
                </div>
              </div>
            )) : <p className="contacts-empty-state">No businesses found.</p>}
          </div>
        );

      case 'civic':
        return (
          <div className="contacts-list">
            {civicContacts.map(civic => (
              <div key={civic.id} className="contact-card">
                <div className="contact-info">
                  <div className="icon-circle bg-gray">
                    <Landmark size={24} color="#fff" />
                  </div>
                  <div>
                    <h3 className="contact-name">{civic.name}</h3>
                    <p className="contact-subtitle">{civic.type}</p>
                  </div>
                </div>
                <div className="contact-actions">
                  <button className="action-btn call-btn" onClick={() => window.location.href = `tel:${civic.phone}`}>
                    <Phone size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        );
    }
  };

  return (
    <div className="contacts-platform">
      <div className="contacts-header">
        <h1 className="contacts-title">Contacts</h1>
        <div className="contacts-search-wrapper">
          <Search className="contacts-search-icon" size={20} />
          <input 
            type="text" 
            className="contacts-search-input" 
            placeholder="Search contacts..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        
        <div className="contacts-tabs">
          <button className={`contact-tab ${activeTab === 'recent' ? 'active' : ''}`} onClick={() => setActiveTab('recent')}>
            <Clock size={16} /> Recent
          </button>
          <button className={`contact-tab ${activeTab === 'friends' ? 'active' : ''}`} onClick={() => setActiveTab('friends')}>
            <Users size={16} /> Friends
          </button>
          <button className={`contact-tab ${activeTab === 'interactions' ? 'active' : ''}`} onClick={() => setActiveTab('interactions')}>
            <Briefcase size={16} /> Interactions
          </button>
          <button className={`contact-tab ${activeTab === 'businesses' ? 'active' : ''}`} onClick={() => setActiveTab('businesses')}>
            <Building size={16} /> Businesses
          </button>
          <button className={`contact-tab ${activeTab === 'civic' ? 'active' : ''}`} onClick={() => setActiveTab('civic')}>
            <Landmark size={16} /> Civic
          </button>
        </div>
      </div>

      <div className="contacts-content">
        {renderContent()}
      </div>
      
      {/* Floating Action Button to add contact - could be restricted to just SETX 360 profiles later */}
      <button className="contacts-fab">
        <User size={24} />
      </button>
    </div>
  );
};
