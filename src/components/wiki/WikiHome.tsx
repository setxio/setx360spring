import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  BookOpen, Search, User, Palette, Trophy, 
  Calendar, Building, Plus, ArrowRight, Book, HelpCircle, Loader2, Moon, Sun
} from 'lucide-react';
import { WikiArticleView } from './WikiArticleView';
import { WikiEditModal } from './WikiEditModal';
import { useApp } from '../../context/AppContext';
import './WikiStyle.css';

interface WikiHomeProps {
  user: any;
}

export const WikiHome: React.FC<WikiHomeProps> = ({ user }) => {
  const { theme, toggleTheme } = useApp();
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Navigation states
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [articleToEdit, setArticleToEdit] = useState<any | null>(null);

  const categories = [
    { id: 'all', name: 'All Knowledge', icon: <BookOpen size={20} /> },
    { id: 'figure', name: 'Figures', icon: <User size={20} /> },
    { id: 'artist', name: 'Artists', icon: <Palette size={20} /> },
    { id: 'sports', name: 'Sports Figures', icon: <Trophy size={20} /> },
    { id: 'event', name: 'Historical Events', icon: <Calendar size={20} /> },
    { id: 'business', name: 'Defunct Businesses', icon: <Building size={20} /> }
  ];

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('wiki_articles')
        .select('*')
        .order('title', { ascending: true });

      if (error) throw error;
      setArticles(data || []);
    } catch (err) {
      console.error('Error fetching wiki articles:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredArticles = () => {
    return articles.filter(art => {
      const matchesCategory = selectedCategory === 'all' || art.category === selectedCategory;
      const matchesSearch = searchQuery.trim() === '' || 
        art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        art.body_content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (art.infobox_data && JSON.stringify(art.infobox_data).toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  };

  const handleArticleClick = (id: string) => {
    setSelectedArticleId(id);
  };

  const handleCreateNew = () => {
    setArticleToEdit(null);
    setIsEditModalOpen(true);
  };

  const activeArticle = articles.find(art => art.id === selectedArticleId);

  // If viewing a specific article
  if (selectedArticleId && activeArticle) {
    return (
      <div style={{ position: 'relative' }}>
        <button 
          onClick={toggleTheme}
          style={{ position: 'absolute', top: '20px', right: '20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 1000, color: 'var(--text)' }}
        >
          {theme.includes('dark') ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <WikiArticleView
          article={activeArticle}
          user={user}
          onBack={() => {
            setSelectedArticleId(null);
            fetchArticles(); // refresh in case it changed
          }}
          onEdit={(art) => {
            setArticleToEdit(art);
            setIsEditModalOpen(true);
          }}
        />
      </div>
    );
  }

  return (
    <div className="wiki-container" style={{ position: 'relative' }}>
      <button 
        onClick={toggleTheme}
        style={{ position: 'absolute', top: '20px', right: '20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 1000, color: 'var(--text)' }}
      >
        {theme.includes('dark') ? <Sun size={20} /> : <Moon size={20} />}
      </button>
      {/* Header Section */}
      <div className="wiki-header">
        <h2 className="wiki-title text-gradient">
          <Book size={32} /> SETX Regional Wiki
        </h2>
        <p className="wiki-subtitle">The repository of Southeast Texas history, figures, and lore.</p>
      </div>

      {/* Search Input bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 32, maxWidth: 600, margin: '0 auto 32px' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          background: 'var(--bg-soft)', 
          border: '1px solid var(--border)', 
          borderRadius: '30px', 
          padding: '0 16px',
          width: '100%',
          boxShadow: 'var(--shadow)'
        }}>
          <Search size={20} color="var(--primary)" />
          <input 
            type="text" 
            placeholder="Search figures, events, businesses..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              flex: 1, 
              background: 'transparent', 
              border: 'none', 
              padding: '12px 14px', 
              color: 'var(--text)', 
              outline: 'none',
              fontSize: '0.95rem'
            }}
          />
        </div>
        <button 
          onClick={handleCreateNew}
          className="wiki-btn-primary" 
          style={{ 
            borderRadius: '30px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: 8, 
            whiteSpace: 'nowrap',
            padding: '0 24px'
          }}
        >
          <Plus size={18} /> Propose Article
        </button>
      </div>

      {/* Category Pills Grid */}
      <div className="wiki-category-grid">
        {categories.map(cat => (
          <div 
            key={cat.id} 
            className={`wiki-category-card ${selectedCategory === cat.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat.id)}
          >
            <div className="wiki-category-icon">
              {cat.icon}
            </div>
            <span className="wiki-category-name">{cat.name}</span>
          </div>
        ))}
      </div>

      {/* Main content grid of articles */}
      <div className="wiki-articles-section">
        <div className="wiki-section-header">
          <h3>
            {categories.find(c => c.id === selectedCategory)?.name} ({getFilteredArticles().length})
          </h3>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing alphabetical entries
          </span>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 60, gap: 12 }}>
            <Loader2 className="animate-spin" size={32} color="var(--primary)" />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading regional encyclopedia...</p>
          </div>
        ) : getFilteredArticles().length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <HelpCircle size={48} style={{ color: 'var(--text-muted)', opacity: 0.5, marginBottom: 16 }} />
            <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>No entries found</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4 }}>Be the first to propose an article in this category!</p>
            <button 
              onClick={handleCreateNew}
              className="wiki-btn-secondary" 
              style={{ marginTop: 16, borderRadius: '20px' }}
            >
              Add Entry
            </button>
          </div>
        ) : (
          <div className="wiki-list">
            {getFilteredArticles().map(art => {
              const dateInfo = art.category === 'event' 
                ? art.infobox_data?.event_date 
                : (art.infobox_data?.birth_date || art.infobox_data?.era);
              
              return (
                <div 
                  key={art.id} 
                  className="wiki-card"
                  onClick={() => handleArticleClick(art.id)}
                >
                  <div>
                    <div className="wiki-card-title">{art.title}</div>
                    <div className="wiki-card-summary">
                      {art.body_content.replace(/[#*`_\[\]]/g, '').substring(0, 120)}...
                    </div>
                  </div>
                  <div className="wiki-card-footer">
                    <span className="role-badge" style={{ textTransform: 'capitalize', fontSize: '0.7rem' }}>
                      {art.category === 'figure' ? 'Figure' : art.category === 'artist' ? 'Artist' : art.category === 'sports' ? 'Sports' : art.category === 'event' ? 'Event' : 'Business'}
                    </span>
                    {dateInfo && (
                      <span style={{ fontSize: '0.75rem' }}>{dateInfo}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Editor Modal for Article Proposal */}
      {isEditModalOpen && (
        <WikiEditModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setArticleToEdit(null);
            fetchArticles();
          }}
          article={articleToEdit}
          user={user}
        />
      )}
    </div>
  );
};
