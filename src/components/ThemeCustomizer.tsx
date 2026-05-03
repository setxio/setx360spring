import React from 'react';
import { Palette, Check, LayoutGrid, Monitor, Smartphone, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Theme } from '../context/AppContext';
import './ThemeCustomizer.css';

export const ThemeCustomizer: React.FC = () => {
  const { theme, setTheme, layout, setLayout } = useApp();

  const themes: { id: Theme; label: string; icon: any }[] = [
    { id: 'setx-dark',        label: 'Civic Classic',   icon: <LayoutGrid size={16} /> },
    { id: 'setx-light',       label: 'Civic Light',     icon: <LayoutGrid size={16} /> },
  ];

  return (
    <div className="theme-customizer glass fade-in">
      <div className="customizer-header">
        <Palette size={20} color="var(--primary)" />
        <h3>Platform Identity</h3>
      </div>

      <div className="theme-presets">
        {themes.map(t => (
          <button 
            key={t.id} 
            className={`preset-btn ${theme === t.id ? 'active' : ''}`}
            onClick={() => setTheme(t.id)}
          >
            {t.icon}
            <span>{t.label}</span>
            {theme === t.id && <Check size={12} className="check-icon" />}
          </button>
        ))}
      </div>

      <div className="customizer-header" style={{ marginTop: '24px' }}>
        <Monitor size={20} color="var(--primary)" />
        <h3>Interface Style</h3>
      </div>

      <div className="theme-presets">
        <button 
          className={`preset-btn ${layout === 'classic' ? 'active' : ''}`}
          onClick={() => setLayout('classic')}
        >
          <LayoutGrid size={16} />
          <span>Classic 360</span>
          {layout === 'classic' && <Check size={12} className="check-icon" />}
        </button>
        <button 
          className={`preset-btn ${layout === 'minimal' ? 'active' : ''}`}
          onClick={() => setLayout('minimal')}
        >
          <Smartphone size={16} />
          <span>Minimalist</span>
          {layout === 'minimal' && <Check size={12} className="check-icon" />}
        </button>
        <button 
          className={`preset-btn ${layout === 'setx-v1' ? 'active' : ''}`}
          onClick={() => setLayout('setx-v1')}
        >
          <Sparkles size={16} />
          <span>SETX v1</span>
          {layout === 'setx-v1' && <Check size={12} className="check-icon" />}
        </button>
      </div>
    </div>
  );
};
