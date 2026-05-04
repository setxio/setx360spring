import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';
import { 
  Shield,
  LogOut,
  ChevronRight,
  Download,
  Bell
} from 'lucide-react';
import './SettingsPage.css';

import { ThemeCustomizer } from './ThemeCustomizer';
import { LegalNotice } from './LegalNotice';
import { PushNotificationManager } from './PushNotificationManager';

type Theme =
  | 'light' | 'dark'
  | 'civic-classic-light' | 'civic-classic-dark'
  | 'setx-light' | 'setx-dark'
  | 'neo-light' | 'neo-dark'
  | 'neo-ii-light' | 'neo-ii-dark'
  | 'twilight-light' | 'twilight-dark'
  | 'twilight-ii-light' | 'twilight-ii-dark'
  | 'efutura-light' | 'efutura-dark'
  | 'porch' | 'spring' | 'summer' | 'autumn' | 'winter' | 'dynamic' | 'custom';

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
    enable_online_status: true,
    enable_typing_indicators: true,
    enable_read_receipts: true,
  });
  const [showLegal, setShowLegal] = useState(false);

  useEffect(() => {
    const fetchPreferences = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('is_public, allow_dms, enable_online_status, enable_typing_indicators, enable_read_receipts')
        .eq('id', user.id)
        .single();
      
      if (data) {
        setPreferences({
          is_public: data.is_public === false ? false : true,
          allow_dms: data.allow_dms === false ? false : true,
          enable_online_status: data.enable_online_status === false ? false : true,
          enable_typing_indicators: data.enable_typing_indicators === false ? false : true,
          enable_read_receipts: data.enable_read_receipts === false ? false : true,
        });
      }
    };
    fetchPreferences();
  }, [user.id]);

  const handleToggle = async (key: 'is_public' | 'allow_dms' | 'enable_online_status' | 'enable_typing_indicators' | 'enable_read_receipts') => {
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
                className={`toggle-switch ${preferences.enable_online_status ? 'active' : ''}`}
                onClick={() => !isUpdating && handleToggle('enable_online_status')}
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
          </div>
        </section>

        {/* Notifications Section */}
        <section className="settings-card">
          <h2 className="section-title"><Bell size={20} /> Push Notifications</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: -8, marginBottom: 16 }}>Control how you receive real-time updates and alerts on this device.</p>
          <PushNotificationManager />
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
