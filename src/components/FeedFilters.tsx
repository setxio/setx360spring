import React, { useRef, useState, useEffect } from 'react';
import { Sparkles, Siren, ChevronLeft, ChevronRight } from 'lucide-react';
import './FeedFilters.css';

interface FeedFiltersProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  hasActiveAlert?: boolean;
  userRole?: string;
  activeType?: string;
  onTypeChange?: (type: string) => void;
}

export const FeedFilters: React.FC<FeedFiltersProps> = ({ activeCategory, onCategoryChange, hasActiveAlert, userRole, activeType = 'all', onTypeChange }) => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

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

  const checkScroll = () => {
    if (sliderRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (sliderRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      sliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };
  return (
    <div className="feed-filters-container">
      {/* Category Slider */}
      <div className="slider-wrapper">
        {showLeftArrow && (
          <button className="scroll-arrow left" onClick={() => scroll('left')}>
            <ChevronLeft size={20} />
          </button>
        )}
        <div 
          className="filter-slider categories-slider" 
          ref={sliderRef}
          onScroll={checkScroll}
        >
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
        {showRightArrow && (
          <button className="scroll-arrow right" onClick={() => scroll('right')}>
            <ChevronRight size={20} />
          </button>
        )}
      </div>
      
      {/* Type Filter Sub-row */}
      {onTypeChange && (
        <div className="filter-slider type-slider">
          {['All', 'Text', 'Images', 'Videos'].map((type) => (
            <button
              key={type}
              className={`filter-pill type-pill ${activeType === type.toLowerCase() ? 'active' : ''}`}
              onClick={() => onTypeChange(type.toLowerCase())}
            >
              {type}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
