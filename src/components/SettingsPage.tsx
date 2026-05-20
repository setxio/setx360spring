import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';
import { 
  Shield,
  LogOut,
  ChevronRight,
  Download,
  Bell,
  RefreshCw
} from 'lucide-react';
import './SettingsPage.css';

import { ThemeCustomizer } from './ThemeCustomizer';
import { LegalNotice } from './LegalNotice';
import { PushNotificationManager } from './PushNotificationManager';

import { type Theme } from '../context/AppContext';

interface SettingsPageProps {
  user: any;
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ user }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [preferences, setPreferences] = useState({
    is_public: true,
    allow_dms: true,
    show_online_status: true,
    enable_typing_indicators: true,
    enable_read_receipts: true,
    blur_nsfw: true,
    show_following: true,
    show_followers: true,
  });
  const [trustedPerson, setTrustedPerson] = useState<any>(null);
  const [guardianships, setGuardianships] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [guardianSearch, setGuardianSearch] = useState('');
  const [isSearchingGuardian, setIsSearchingGuardian] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [archiveSearch, setArchiveSearch] = useState('');
  const [isSearchingArchive, setIsSearchingArchive] = useState(false);
  const [archiveResults, setArchiveResults] = useState<any[]>([]);
  const [showLegal, setShowLegal] = useState(false);

  useEffect(() => {
    const fetchPreferences = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('is_public, allow_dms, show_online_status, enable_typing_indicators, enable_read_receipts, blur_nsfw, show_following, show_followers')
        .eq('id', user.id)
        .single();
      
      if (data) {
        setPreferences({
          is_public: data.is_public === false ? false : true,
          allow_dms: data.allow_dms === false ? false : true,
          show_online_status: data.show_online_status === false ? false : true,
          enable_typing_indicators: data.enable_typing_indicators === false ? false : true,
          enable_read_receipts: data.enable_read_receipts === false ? false : true,
          blur_nsfw: data.blur_nsfw === false ? false : true,
          show_following: data.show_following === false ? false : true,
          show_followers: data.show_followers === false ? false : true,
        });
      }
    };

    const fetchLegacyConfig = async () => {
      const { data, error } = await supabase
        .from('legacy_access_config')
        .select('trusted_person_id, profiles!trusted_person_id(name, email)')
        .eq('user_id', user.id)
        .single();
      
      if (data && !error) {
        setTrustedPerson({
          id: data.trusted_person_id,
          name: (data as any).profiles.name,
          email: (data as any).profiles.email
        });
      }
    };

    const fetchGuardianships = async () => {
      const { data } = await supabase
        .from('legacy_access_config')
        .select('user_id, profiles!user_id(name, email)')
        .eq('trusted_person_id', user.id);
      
      if (data) {
        setGuardianships(data.map((d: any) => ({
          id: d.user_id,
          name: d.profiles.name,
          email: d.profiles.email
        })));
      }
    };

    const fetchPendingRequests = async () => {
      const { data } = await supabase
        .from('legacy_access_requests')
        .select('*')
        .eq('requester_id', user.id);
      
      if (data) setPendingRequests(data);
    };

    fetchPreferences();
    fetchLegacyConfig();
    fetchGuardianships();
    fetchPendingRequests();
  }, [user.id]);

  const handleToggle = async (key: 'is_public' | 'allow_dms' | 'show_online_status' | 'enable_typing_indicators' | 'enable_read_receipts' | 'blur_nsfw' | 'show_following' | 'show_followers') => {
    setIsUpdating(true);
    const newValue = !preferences[key];
    setPreferences(prev => ({ ...prev, [key]: newValue }));

    const { error } = await supabase
      .from('profiles')
      .update({ [key]: newValue })
      .eq('id', user.id);

    if (error) {
      console.error(`Error updating ${key}:`, error);
      setPreferences(prev => ({ ...prev, [key]: !newValue }));
    }
    setIsUpdating(false);
  };

  const searchGuardian = async () => {
    if (guardianSearch.length < 3) return;
    setIsSearchingGuardian(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, name, email')
      .ilike('email', `%${guardianSearch}%`)
      .neq('id', user.id)
      .limit(5);
    
    setSearchResults(data || []);
    setIsSearchingGuardian(false);
  };

  const assignGuardian = async (target: any) => {
    setIsUpdating(true);
    const { error } = await supabase
      .from('legacy_access_config')
      .upsert({ user_id: user.id, trusted_person_id: target.id });
    
    if (!error) {
      setTrustedPerson(target);
      setSearchResults([]);
      setGuardianSearch('');
    }
    setIsUpdating(false);
  };

  const removeGuardian = async () => {
    setIsUpdating(true);
    const { error } = await supabase
      .from('legacy_access_config')
      .delete()
      .eq('user_id', user.id);
    
    if (!error) setTrustedPerson(null);
    setIsUpdating(false);
  };

  const requestAccess = async (targetId: string) => {
    setIsUpdating(true);
    const { error } = await supabase
      .from('legacy_access_requests')
      .insert({ user_id: targetId, requester_id: user.id });
    
    if (!error) {
      alert('Access request submitted to platform admins.');
      const { data } = await supabase.from('legacy_access_requests').select('*').eq('requester_id', user.id);
      if (data) setPendingRequests(data);
    } else {
      alert('Error submitting request: ' + error.message);
    }
    setIsUpdating(false);
  };

  const searchArchiveUser = async () => {
    if (archiveSearch.length < 3) return;
    setIsSearchingArchive(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, name, email')
      .ilike('name', `%${archiveSearch}%`)
      .neq('id', user.id)
      .limit(5);
    
    setArchiveResults(data || []);
    setIsSearchingArchive(false);
  };

  const downloadTranscript = async (otherId: string, otherName: string) => {
    setIsUpdating(true);
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${user.id})`)
      .order('created_at', { ascending: true });

    if (error) {
      alert('Error fetching transcript: ' + error.message);
    } else if (messages && messages.length > 0) {
      const blob = new Blob([JSON.stringify(messages, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `chat_transcript_${otherName.replace(/\s/g, '_')}_${new Date().getTime()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      alert('Transcript downloaded successfully.');
    } else {
      alert('No messages found for this conversation.');
    }
    setIsUpdating(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleDownloadData = async () => {
    setIsUpdating(true);
    try {
      // 1. Fetch Profile
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      
      // 2. Fetch Posts
      const { data: posts } = await supabase.from('posts').select('*').eq('user_id', user.id);
      
      // 3. Fetch Messages
      const { data: messages } = await supabase.from('messages').select('*').or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`);
      
      // 4. Fetch Orders
      const { data: orders } = await supabase.from('orders').select('*').eq('customer_id', user.id);

      const allData = {
        export_date: new Date().toISOString(),
        profile,
        posts,
        messages,
        orders
      };

      const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `efutura_data_${user.id.slice(0, 8)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert('Data export completed successfully.');
    } catch (err) {
      console.error(err);
      alert('Failed to export data.');
    }
    setIsUpdating(false);
  };

  const handleForceUpdate = async () => {
    setIsUpdating(true);
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.update();
          if (registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
        }
      }
      if ('caches' in window) {
        const keys = await window.caches.keys();
        await Promise.all(keys.map(key => caches.delete(key)));
      }
      // Force reload from server
      window.location.reload();
    } catch (err) {
      console.error('Failed to force update:', err);
      window.location.reload();
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>System Settings</h1>
        <p>Manage privacy, messaging, and app preferences</p>
      </div>

      <div className="settings-sections">
        {/* Themes Section */}
        <ThemeCustomizer />

        {/* Privacy & Comfort */}
        <section className="settings-card">
          <h2 className="section-title"><Shield size={20} /> Privacy & Comfort</h2>
          <div className="preference-list">
            <div className="pref-item">
              <span>Public Profile</span>
              <div 
                className={`toggle-switch ${preferences.is_public ? 'active' : ''}`}
                onClick={() => !isUpdating && handleToggle('is_public')}
              ></div>
            </div>
            <div className="pref-item">
              <span>Allow Direct Messages</span>
              <div 
                className={`toggle-switch ${preferences.allow_dms ? 'active' : ''}`}
                onClick={() => !isUpdating && handleToggle('allow_dms')}
              ></div>
            </div>
            <div className="pref-item">
              <span>Show Online Status</span>
              <div 
                className={`toggle-switch ${preferences.show_online_status ? 'active' : ''}`}
                onClick={() => !isUpdating && handleToggle('show_online_status')}
              ></div>
            </div>
            <div className="pref-item">
              <span>Typing Indicators</span>
              <div 
                className={`toggle-switch ${preferences.enable_typing_indicators ? 'active' : ''}`}
                onClick={() => !isUpdating && handleToggle('enable_typing_indicators')}
              ></div>
            </div>
            <div className="pref-item">
              <span>Read Receipts</span>
              <div 
                className={`toggle-switch ${preferences.enable_read_receipts ? 'active' : ''}`}
                onClick={() => !isUpdating && handleToggle('enable_read_receipts')}
              ></div>
            </div>
            <div className="pref-item">
              <span>Blur NSFW Content</span>
              <div 
                className={`toggle-switch ${preferences.blur_nsfw ? 'active' : ''}`}
                onClick={() => !isUpdating && handleToggle('blur_nsfw')}
              ></div>
            </div>
            <div className="pref-item">
              <span>Show Following List</span>
              <div 
                className={`toggle-switch ${preferences.show_following ? 'active' : ''}`}
                onClick={() => !isUpdating && handleToggle('show_following')}
              ></div>
            </div>
            <div className="pref-item">
              <span>Show Followers List</span>
              <div 
                className={`toggle-switch ${preferences.show_followers ? 'active' : ''}`}
                onClick={() => !isUpdating && handleToggle('show_followers')}
              ></div>
            </div>
          </div>
        </section>

        {/* Account Guardian / Legacy Access */}
        <section className="settings-card">
          <h2 className="section-title"><Shield size={20} color="var(--admin-gold)" /> Account Guardian</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: -8, marginBottom: 16 }}>
            Nominate a trusted person to manage your account in case of death or emergency. 
            They can request access which must be approved by the platform admins.
          </p>

          {trustedPerson ? (
            <div className="guardian-active glass">
              <div className="guardian-info">
                <strong>{trustedPerson.name}</strong>
                <span>{trustedPerson.email}</span>
              </div>
              <button className="remove-guardian-btn" onClick={removeGuardian}>Remove</button>
            </div>
          ) : (
            <div className="guardian-assign">
              <div className="guardian-search-box">
                <input 
                  type="text" 
                  placeholder="Search by email..." 
                  value={guardianSearch}
                  onChange={(e) => setGuardianSearch(e.target.value)}
                />
                <button onClick={searchGuardian} disabled={isSearchingGuardian}>
                  {isSearchingGuardian ? <Loader2 className="animate-spin" size={16} /> : 'Search'}
                </button>
              </div>

              {searchResults.length > 0 && (
                <div className="guardian-results glass">
                  {searchResults.map(res => (
                    <div key={res.id} className="result-item" onClick={() => assignGuardian(res)}>
                      <span>{res.name} ({res.email})</span>
                      <button className="assign-btn">Assign</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Guardianship Management */}
        {guardianships.length > 0 && (
          <section className="settings-card">
            <h2 className="section-title"><Shield size={20} color="#10b981" /> Guardianship</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: -8, marginBottom: 16 }}>
              You have been nominated as a guardian for the following accounts. 
              In case of emergency, you can request administrative access.
            </p>
            <div className="guardianship-list">
              {guardianships.map(g => {
                const request = pendingRequests.find(r => r.user_id === g.id);
                return (
                  <div key={g.id} className="guardian-active glass" style={{ background: 'rgba(16, 185, 129, 0.05)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                    <div className="guardian-info">
                      <strong>{g.name}</strong>
                      <span>{g.email}</span>
                      {request && (
                        <div className={`request-status-badge ${request.status}`}>
                          Status: {request.status.toUpperCase()} 
                          {request.access_pin && ` | PIN: ${request.access_pin}`}
                        </div>
                      )}
                    </div>
                    {!request ? (
                      <button className="request-access-btn" onClick={() => requestAccess(g.id)}>Request Access</button>
                    ) : (
                      <div className="status-label">{request.status === 'pending' ? 'Reviewing...' : request.status}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Notifications Section */}
        <section className="settings-card">
          <h2 className="section-title"><Bell size={20} /> Push Notifications</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: -8, marginBottom: 16 }}>Control how you receive real-time updates and alerts on this device.</p>
          <PushNotificationManager />
        </section>

        {/* PWA App Updates & Cache */}
        <section className="settings-card">
          <h2 className="section-title"><RefreshCw size={20} /> App Updates & Cache</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: -8, marginBottom: 16 }}>
            Check for the latest Vercel deployment and clear local PWA cache.
          </p>
          <button 
            className="secondary-btn" 
            onClick={handleForceUpdate}
            disabled={isUpdating}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 700 }}
          >
            {isUpdating ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
            Check for Updates / Clear Cache
          </button>
        </section>

        {/* Legal Section */}
        <section className="settings-card" onClick={() => setShowLegal(true)} style={{ cursor: 'pointer' }}>
          <h2 className="section-title"><Shield size={20} /> Legal & Policies</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: -8, marginBottom: 16 }}>Review the Terms of Service, Privacy Policy, and Copyright guidelines.</p>
          <div className="pref-item" style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 16 }}>
            <span>View Platform Guidelines</span>
            <ChevronRight size={20} color="var(--primary)" />
          </div>
        </section>

        {/* Chat Transcripts & Data Portability */}
        <section className="settings-card">
          <h2 className="section-title"><Download size={20} /> Chat Archives</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: -8, marginBottom: 16 }}>
            Download historical chat transcripts. Search for a person to export your conversation history.
          </p>

          <div className="guardian-assign">
            <div className="guardian-search-box">
              <input 
                type="text" 
                placeholder="Search person..." 
                value={archiveSearch}
                onChange={(e) => setArchiveSearch(e.target.value)}
                style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '10px', color: '#fff', width: '100%' }}
              />
              <button 
                onClick={searchArchiveUser} 
                disabled={isSearchingArchive}
                style={{ position: 'absolute', right: 5, top: 5, bottom: 5, background: 'var(--primary)', border: 'none', borderRadius: '8px', color: '#fff', padding: '0 15px', cursor: 'pointer' }}
              >
                {isSearchingArchive ? <Loader2 className="animate-spin" size={16} /> : 'Search'}
              </button>
            </div>

            {archiveResults.length > 0 && (
              <div className="guardian-results glass" style={{ marginTop: 12, borderRadius: 12, overflow: 'hidden' }}>
                {archiveResults.map(res => (
                  <div key={res.id} className="result-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '0.9rem' }}>{res.name}</span>
                    <button 
                      onClick={() => downloadTranscript(res.id, res.name)}
                      style={{ background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '0.75rem', cursor: 'pointer' }}
                    >
                      Export JSON
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Data Portability */}
        <section className="settings-card">
          <h2 className="section-title"><Download size={20} /> Data Portability</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: -8, marginBottom: 16 }}>Download a copy of all your profile data, posts, and transactions.</p>
          <button 
            className="secondary-btn" 
            onClick={handleDownloadData}
            disabled={isUpdating}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            {isUpdating ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
            Download My Data (.json)
          </button>
        </section>

        {/* Account Actions */}
        <div className="account-actions">
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={20} /> Sign Out
          </button>
          <button className="delete-account-btn">Delete Account</button>
        </div>
      </div>

      {showLegal && (
        <div className="legal-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--bg-dark)', zIndex: 1000, overflowY: 'auto' }}>
          <LegalNotice onClose={() => setShowLegal(false)} />
        </div>
      )}
    </div>
  );
};
