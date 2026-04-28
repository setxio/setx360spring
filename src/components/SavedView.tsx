import React, { useState } from 'react';
import { 
  Bookmark, 
  Search, 
  MessageSquare, 
  ShoppingBag, 
  Briefcase,
  Trash2,
  ExternalLink
} from 'lucide-react';
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
}

const SAVED_ITEMS: SavedItem[] = [
  {
    id: 's1',
    type: 'post',
    title: 'Check out the new sunrise over the Neches River!',
    author: 'Sarah Jenkins',
    date: 'Saved 2 days ago',
    image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 's2',
    type: 'product',
    title: 'Handcrafted Oak Coffee Table',
    price: '$299',
    date: 'Saved yesterday',
    image: 'https://images.unsplash.com/photo-1554290712-e640351074bd?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 's3',
    type: 'job',
    title: 'Senior Frontend Developer',
    company: 'TechFlow Systems',
    date: 'Saved 4h ago'
  }
];

export const SavedView: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'post' | 'product' | 'job'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = SAVED_ITEMS.filter(item => {
    const matchesFilter = filter === 'all' || item.type === filter;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
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
      </header>

      <div className="saved-content">
        {filteredItems.length > 0 ? (
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
                    <button className="card-btn secondary"><Trash2 size={16} /></button>
                    <button className="card-btn primary">
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
