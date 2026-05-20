import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { 
  Bookmark, 
  Search, 
  MessageSquare, 
  ShoppingBag, 
  Briefcase,
  Trash2,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import './SavedView.css';

interface SavedItem {
  id: string;
  type: 'post' | 'product' | 'job';
  title: string;
  author?: string;
  price?: string;
  company?: string;
  date: string;
  image?: string;
  postId?: string;
}

export const SavedView: React.FC = () => {
  const { user } = useApp();
  const [filter, setFilter] = useState<'all' | 'post' | 'product' | 'job'>('all');
  const [labelFilter, setLabelFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { error: toastError } = useToast();

  const LABELS = ['all', 'Work', 'Personal', 'Local', 'Events', 'Faith'];

  useEffect(() => {
    if (user) {
      fetchBookmarks();
    }
  }, [user]);

  const fetchBookmarks = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .select(`
          id,
          created_at,
          posts (
            id,
            content,
            media_urls,
            author:profiles!posts_profile_id_fkey (
              name,
              email
            )
          )
        `)
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formatted: SavedItem[] = (data || []).map(b => {
        const post = Array.isArray(b.posts) ? b.posts[0] : b.posts;
        const author = Array.isArray(post?.author) ? post.author[0] : post?.author;
        
        return {
          id: b.id,
          type: 'post',
          title: post?.content?.substring(0, 80) + (post?.content?.length > 80 ? '...' : '') || 'Untitled Post',
          author: author?.name || 'Unknown User',
          date: `Saved ${new Date(b.created_at).toLocaleDateString()}`,
          image: post?.media_urls?.[0],
          postId: post?.id
        };
      });

      setSavedItems(formatted);
    } catch (err) {
      console.error('Error fetching bookmarks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async (bookmarkId: string) => {
    if (!window.confirm("Remove this item from your saved collection?")) return;

    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('id', bookmarkId);
    
    if (error) {
      toastError("Failed to remove bookmark.");
    } else {
      setSavedItems(prev => prev.filter(item => item.id !== bookmarkId));
    }
  };

  const filteredItems = savedItems.filter(item => {
    const matchesFilter = filter === 'all' || item.type === filter;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLabel = labelFilter === 'all' || (item as any).label === labelFilter;
    return matchesFilter && matchesSearch && matchesLabel;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'post': return <MessageSquare size={16} />;
      case 'product': return <ShoppingBag size={16} />;
      case 'job': return <Briefcase size={16} />;
      default: return <Bookmark size={16} />;
    }
  };

  return (
    <div className="saved-container">
      <header className="saved-header">
        <div className="title-row">
          <Bookmark size={24} className="title-icon" />
          <h1>Saved Items</h1>
        </div>
        <p>Your personal collection of interesting finds across the network.</p>

        <div className="saved-search-bar glass">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search your saved items..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-chips">
          {(['all', 'post', 'product', 'job'] as const).map(f => (
            <button 
              key={f}
              className={`filter-chip ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}s
            </button>
          ))}
        </div>

        {/* Collection Labels */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '4px', marginTop: '8px' }}>
          {LABELS.map(label => (
            <button
              key={label}
              onClick={() => setLabelFilter(label)}
              style={{
                flexShrink: 0, padding: '4px 14px', borderRadius: '16px', fontSize: '0.78rem',
                fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease',
                background: labelFilter === label ? 'var(--primary)' : 'rgba(255,255,255,0.06)',
                color: labelFilter === label ? '#fff' : 'var(--text-muted)',
                border: labelFilter === label ? 'none' : '1px solid var(--border)'
              }}
            >
              {label === 'all' ? '🗂 All Collections' : label}
            </button>
          ))}
        </div>
      </header>

      <div className="saved-content">
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <Loader2 className="animate-spin" size={32} color="var(--primary)" />
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="saved-list">
            {filteredItems.map(item => (
              <div key={item.id} className="saved-card glass">
                {item.image && (
                  <div className="saved-card-image" style={{ backgroundImage: `url(${item.image})` }} />
                )}
                <div className="saved-card-body">
                  <div className="item-type-badge">
                    {getTypeIcon(item.type)}
                    <span>{item.type}</span>
                  </div>
                  <h3>{item.title}</h3>
                  <p className="item-meta">
                    {item.author || item.company || item.price} • {item.date}
                  </p>
                  <div className="saved-card-actions">
                    <button 
                      className="card-btn secondary"
                      onClick={() => handleRemove(item.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                    <button className="card-btn primary" onClick={() => {
                      if (item.postId) {
                        window.location.hash = `#/post/${item.postId}`;
                      }
                    }}>
                      <ExternalLink size={16} /> View Item
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-saved">
            <Bookmark size={48} />
            <h3>No items found</h3>
            <p>Try adjusting your filters or search query.</p>
          </div>
        )}
      </div>
    </div>
  );
};
