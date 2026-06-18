import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Briefcase, Store, Calendar, Users, Settings, Image as ImageIcon, 
  MessageSquare, DollarSign, Activity, AlertTriangle, Megaphone, Plus, LayoutGrid, Music
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';

export const PageManagerView: React.FC = () => {
  const { user, activeContext, setEnv, theme } = useApp();
  const [activeTab, setActiveTab] = useState('overview');

  if (!user) return null;

  const isDark = theme.includes('dark');
  const bgColors = isDark ? {
    card: '#1e293b',
    border: '#334155',
    text: '#f8fafc',
    subtext: '#94a3b8'
  } : {
    card: '#ffffff',
    border: '#e2e8f0',
    text: '#0f172a',
    subtext: '#64748b'
  };

  if (!activeContext) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', 
        justifyContent: 'center', height: '100%', padding: '24px', textAlign: 'center'
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%', backgroundColor: bgColors.card, 
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24,
          border: `1px solid ${bgColors.border}`
        }}>
          <Briefcase size={40} color={isDark ? '#38bdf8' : '#0284c7'} />
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: 600, color: bgColors.text, marginBottom: 12 }}>
          Pro Tools Page Manager
        </h2>
        <p style={{ color: bgColors.subtext, maxWidth: 400, marginBottom: 32 }}>
          Select a page from your context switcher in the top right corner to manage it, or create a new page to get started.
        </p>
        <button 
          onClick={() => setEnv('page_creator')}
          style={{
            padding: '12px 24px',
            backgroundColor: '#10b981',
            color: 'white',
            borderRadius: '999px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          <Plus size={20} /> Create New Page
        </button>
      </div>
    );
  }

  // Determine modules based on page type
  const getModules = () => {
    const type = activeContext.page_type;
    const common = [
      { id: 'settings', label: 'Settings', icon: <Settings size={24} />, color: '#64748b' },
      { id: 'team', label: 'Team', icon: <Users size={24} />, color: '#8b5cf6' },
      { id: 'messages', label: 'Messages', icon: <MessageSquare size={24} />, color: '#f43f5e' }
    ];

    if (type === 'business' || type === 'venue') {
      return [
        { id: 'store', label: 'Storefront', icon: <Store size={24} />, color: '#0ea5e9' },
        { id: 'orders', label: 'Orders', icon: <DollarSign size={24} />, color: '#10b981' },
        { id: 'ads', label: 'Advertising', icon: <Megaphone size={24} />, color: '#f59e0b' },
        ...common
      ];
    }
    
    if (type === 'artist') {
      return [
        { id: 'music', label: 'Music/Art', icon: <Music size={24} />, color: '#ec4899' },
        { id: 'gigs', label: 'Gigs/Events', icon: <Calendar size={24} />, color: '#8b5cf6' },
        { id: 'store', label: 'Merch Store', icon: <Store size={24} />, color: '#0ea5e9' },
        ...common
      ];
    }

    if (type === 'non_profit' || type === 'church') {
      return [
        { id: 'donations', label: 'Donations', icon: <DollarSign size={24} />, color: '#10b981' },
        { id: 'events', label: 'Events', icon: <Calendar size={24} />, color: '#f43f5e' },
        { id: 'outreach', label: 'Outreach', icon: <Megaphone size={24} />, color: '#3b82f6' },
        ...common
      ];
    }

    // Default civic / media / official
    return [
      { id: 'directory', label: 'Directory', icon: <LayoutGrid size={24} />, color: '#3b82f6' },
      { id: 'alerts', label: 'Alerts', icon: <AlertTriangle size={24} />, color: '#ef4444' },
      { id: 'sponsors', label: 'Sponsors', icon: <Megaphone size={24} />, color: '#f59e0b' },
      ...common
    ];
  };

  const modules = getModules();

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'transparent' }}>
      {/* Header */}
      <div style={{ 
        padding: '32px 24px', 
        borderBottom: `1px solid ${bgColors.border}`,
        backgroundColor: bgColors.card,
        display: 'flex',
        alignItems: 'center',
        gap: '24px'
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: '16px',
          backgroundColor: bgColors.border,
          backgroundImage: activeContext.avatar_url ? `url(${activeContext.avatar_url})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          {!activeContext.avatar_url && <ImageIcon size={32} color={bgColors.subtext} />}
        </div>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: bgColors.text, margin: 0 }}>
            {activeContext.name}
          </h1>
          <p style={{ color: bgColors.subtext, fontSize: '16px', margin: '4px 0 0 0', textTransform: 'capitalize' }}>
            {activeContext.page_type.replace('_', ' ')} Dashboard
          </p>
        </div>
      </div>

      {/* Modules Grid */}
      <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 600, color: bgColors.text, marginBottom: '20px' }}>
          Pro Tools
        </h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', 
          gap: '16px' 
        }}>
          {modules.map((mod) => (
            <motion.div
              key={mod.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                backgroundColor: bgColors.card,
                border: `1px solid ${bgColors.border}`,
                borderRadius: '16px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              <div style={{ 
                width: 48, height: 48, borderRadius: '50%', 
                backgroundColor: `${mod.color}15`, 
                color: mod.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {mod.icon}
              </div>
              <span style={{ color: bgColors.text, fontWeight: 500 }}>
                {mod.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
