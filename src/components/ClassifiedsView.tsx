import React, { useState } from 'react';
import { 
  Search, 
  MapPin, 
  Plus, 
  Filter, 
  Camera,
  MessageCircle,
  Clock,
  ShieldCheck,
  X
} from 'lucide-react';
import './ClassifiedsView.css';

interface ClassifiedItem {
  id: string;
  title: string;
  price: string;
  location: string;
  category: string;
  posted: string;
  image: string;
  seller: string;
  reputation: number;
}

const DUMMY_ITEMS: ClassifiedItem[] = [
  { id: '1', title: 'Vintage Record Player', price: '$120', location: 'Beaumont, TX', category: 'Electronics', posted: '2h ago', image: '🎵', seller: 'Mike D.', reputation: 4.8 },
  { id: '2', title: 'Mountain Bike - Like New', price: '$350', location: 'Nederland, TX', category: 'Sporting Goods', posted: '5h ago', image: '🚲', seller: 'Sarah W.', reputation: 4.9 },
  { id: '3', title: 'Solid Oak Coffee Table', price: '$80', location: 'Port Arthur, TX', category: 'Furniture', posted: '1d ago', image: '🛋️', seller: 'John L.', reputation: 4.5 },
  { id: '4', title: 'Garden Tools Set', price: '$45', location: 'Orange, TX', category: 'Home & Garden', posted: '2d ago', image: '🛠️', seller: 'Linda M.', reputation: 4.2 }
];

export const ClassifiedsView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [activeChat, setActiveChat] = useState<string | null>(null);

  const handleStartChat = (seller: string) => {
    setActiveChat(`Starting chat with ${seller}...`);
    setTimeout(() => setActiveChat(null), 3000);
  };

  return (
    <div className="classifieds-container">
      {activeChat && <div className="chat-toast glass">{activeChat}</div>}
      
      {isPosting && (
        <div className="post-modal-overlay" onClick={() => setIsPosting(false)}>
          <div className="post-modal glass" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Listing</h3>
              <button onClick={() => setIsPosting(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="photo-upload">
                <Camera size={32} />
                <span>Add Photos</span>
              </div>
              <input type="text" placeholder="Title" />
              <input type="text" placeholder="Price" />
              <select>
                <option>Select Category</option>
                <option>Electronics</option>
                <option>Furniture</option>
              </select>
              <textarea placeholder="Description" rows={3} />
              <button className="submit-listing-btn">Post Now</button>
            </div>
          </div>
        </div>
      )}

      <header className="classifieds-header">
        <div className="title-row">
          <h1>Classifieds</h1>
          <button className="post-ad-btn" onClick={() => setIsPosting(true)}>
            <Plus size={18} /> Post
          </button>
        </div>
        <p className="subtitle">Local peer-to-peer trading. Meet up, trade, simplify.</p>
        
        <div className="search-bar-row">
          <div className="search-input-box">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="What are you looking for?" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="filter-pill">
            <Filter size={16} /> Filters
          </button>
        </div>

        <div className="categories-scroll">
          {['All', 'Electronics', 'Furniture', 'Sporting', 'Tools', 'Fashion', 'Other'].map(cat => (
            <button key={cat} className={`cat-pill ${cat === 'All' ? 'active' : ''}`}>{cat}</button>
          ))}
        </div>
      </header>

      <div className="items-grid">
        {DUMMY_ITEMS.map(item => (
          <div key={item.id} className="item-card glass">
            <div className="item-image-placeholder">
              <span className="item-emoji">{item.image}</span>
              <span className="item-price-tag">{item.price}</span>
            </div>
            <div className="item-body">
              <div className="item-top">
                <span className="item-cat">{item.category}</span>
                <span className="item-time"><Clock size={12} /> {item.posted}</span>
              </div>
              <h3 className="item-title">{item.title}</h3>
              <div className="item-loc">
                <MapPin size={14} /> {item.location}
              </div>
              <div className="item-footer">
                <div className="seller-info">
                  <div className="seller-avatar">{item.seller[0]}</div>
                  <div className="seller-meta">
                    <span className="seller-name">{item.seller}</span>
                    {item.reputation >= 4.8 && (
                      <span className="verified-seller"><ShieldCheck size={10} /> Top Seller</span>
                    )}
                  </div>
                </div>
                <button className="chat-btn" onClick={() => handleStartChat(item.seller)}>
                  <MessageCircle size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="classifieds-fab" onClick={() => setIsPosting(true)}>
        <button className="fab-main">
          <Camera size={24} />
          <span>Quick Post</span>
        </button>
      </div>
    </div>
  );
};
