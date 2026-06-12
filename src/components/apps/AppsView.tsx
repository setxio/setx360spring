import React from 'react';
import { AppsProView } from './AppsProView';
import { AppsLabsView } from './AppsLabsView';
import { Smartphone, Briefcase, Beaker } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface AppsViewProps {
  activeTab: number;
}

export const AppsView: React.FC<AppsViewProps> = ({ activeTab }) => {
  const { setActiveTab } = useApp();

  if (activeTab === 1) return <AppsProView />;
  if (activeTab === 2) return <AppsLabsView />;

  // Default Home (activeTab === 0)
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <Smartphone size={48} color="var(--primary)" style={{ marginBottom: '16px' }} />
        <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>SETX Apps Market</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Discover locally built applications.</p>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        <div 
          className="glass" 
          onClick={() => setActiveTab(1)}
          style={{ padding: '24px', borderRadius: '20px', cursor: 'pointer', transition: 'transform 0.2s ease', border: '1px solid var(--glass-border)' }}
        >
          <Briefcase size={32} color="var(--primary)" style={{ marginBottom: '12px' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>Pro Apps</h3>
          <p style={{ color: 'var(--text-muted)' }}>Explore premium business applications certified for the SETX region.</p>
        </div>

        <div 
          className="glass" 
          onClick={() => setActiveTab(2)}
          style={{ padding: '24px', borderRadius: '20px', cursor: 'pointer', transition: 'transform 0.2s ease', border: '1px solid var(--glass-border)' }}
        >
          <Beaker size={32} color="#f59e0b" style={{ marginBottom: '12px' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>Incubator</h3>
          <p style={{ color: 'var(--text-muted)' }}>Support and test experimental youth and entrepreneurial projects from incubators in Southeast Texas.</p>
        </div>
      </div>
    </div>
  );
};
