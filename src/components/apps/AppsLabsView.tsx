import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader2, ExternalLink } from 'lucide-react';

export const AppsLabsView: React.FC = () => {
  const [apps, setApps] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchApps = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('developer_apps')
          .select('*, profiles(username)')
          .eq('category', 'labs')
          .eq('is_live', true)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setApps(data || []);
      } catch (err) {
        console.error('Error fetching labs apps:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApps();
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px' }}>Incubator Apps</h2>
      <p style={{ color: 'var(--text-muted)' }}>Support and test experimental youth and entrepreneurial projects from incubators in Southeast Texas.</p>
      
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '40px' }}>
          <Loader2 className="animate-spin" size={32} color="var(--primary)" />
        </div>
      ) : apps.length === 0 ? (
        <div style={{ marginTop: '40px', textAlign: 'center', opacity: 0.7, background: 'rgba(255,255,255,0.05)', padding: '40px', borderRadius: '16px' }}>
          <p>No Incubator apps published yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px', marginTop: '24px' }}>
          {apps.map(app => (
            <div key={app.id} className="glass" style={{ padding: '20px', borderRadius: '16px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                {app.icon_url ? (
                  <img src={app.icon_url} alt={app.title} style={{ width: 48, height: 48, borderRadius: '12px', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 48, height: 48, borderRadius: '12px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
                    {app.title.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>{app.title}</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>by @{app.profiles?.username || 'developer'}</span>
                </div>
              </div>
              <p style={{ margin: '0 0 16px 0', fontSize: '0.9rem', color: 'var(--text-muted)', flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {app.description}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '12px' }}>
                  {app.version_label}
                </span>
                <a 
                  href={app.app_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'white', textDecoration: 'none', background: 'var(--primary)', padding: '6px 12px', borderRadius: '12px', fontWeight: 600 }}
                >
                  Launch <ExternalLink size={14} />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
