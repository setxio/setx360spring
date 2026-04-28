import React from 'react';
import { Sparkles, Siren } from 'lucide-react';
import './FeedFilters.css';

interface FeedFiltersProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  hasActiveAlert?: boolean;
  userRole?: string;
}

export const FeedFilters: React.FC<FeedFiltersProps> = ({ activeCategory, onCategoryChange, hasActiveAlert, userRole }) => {
  const categories = [
    'Hot',
    'Everybody',
    'AI Picks',
    'Following',
    'Civic',
    'Groups',
    'News',
    'Events',
    'Faith',
    'Official',
    'Shopping',
    'Services',
    'Non Profit',
    'Hiring',
    'Emergency',
  ].filter(cat => cat !== 'Civic' || userRole === 'admin');
  return (
    <div className="feed-filters-container">
      {/* Category Slider */}
      <div className="filter-slider categories-slider">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`filter-pill ${activeCategory === cat ? 'active' : ''} ${cat === 'AI Picks' ? 'ai-pill' : ''} ${cat === 'Emergency' ? 'emergency-pill' : ''} ${cat === 'Emergency' && hasActiveAlert ? 'alert-pulse' : ''}`}
            onClick={() => onCategoryChange(cat)}
          >
            {cat === 'AI Picks' && <Sparkles size={12} style={{ marginRight: 4 }} />}
            {cat === 'Emergency' && <Siren size={12} style={{ marginRight: 4 }} />}
            {cat}
            {cat === 'Emergency' && hasActiveAlert && (
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', marginLeft: 4, display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
