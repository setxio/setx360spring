import React from 'react';
import { Palette, Check, LayoutGrid } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Theme } from '../context/AppContext';
import './ThemeCustomizer.css';

export const ThemeCustomizer: React.FC = () => {
  const { theme, setTheme } = useApp();

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
    </div>
  );
};
