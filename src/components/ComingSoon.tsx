import React from 'react';
import { Hammer } from 'lucide-react';

interface ComingSoonProps {
  title: string;
}

export const ComingSoon: React.FC<ComingSoonProps> = ({ title }) => {
  return (
    <div className="coming-soon-view">
      <div className="premium-card" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '40px 20px',
        textAlign: 'center',
        minHeight: '300px',
        marginTop: '20px'
      }}>
        <div style={{
          background: 'var(--accent-bg)',
          color: 'var(--primary)',
          padding: '16px',
          borderRadius: '50%',
          marginBottom: '20px'
        }}>
          <Hammer size={32} />
        </div>
        <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px' }}>
          {title} <br/> Coming Soon
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '280px' }}>
          We're working hard to bring you this feature. Check back in a future update!
        </p>
      </div>
    </div>
  );
};
