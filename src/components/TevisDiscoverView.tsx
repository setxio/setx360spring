import type { User } from '../types/user';
import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  History, 
  Settings, 
  MessageSquare, 
  ChevronRight, 
  Sparkles,
  Zap,
  ShieldCheck,
  Search,
  Clock,
  Trash2
} from 'lucide-react';
import './TevisDiscoverView.css';

interface TevisDiscoverViewProps {
  user: User;
}

export const TevisDiscoverView: React.FC<TevisDiscoverViewProps> = () => {
  const [activeView, setActiveView] = useState<'history' | 'settings'>('history');
  const [conversations, setConversations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    setIsLoading(true);
    // Note: We'll fetch from ai_conversations once the table is fully live
    // For now, we'll show a premium empty state or mock data
    setTimeout(() => {
      setConversations([]);
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="tevis-discover-container fade-in">
      {/* Header Section */}
      <div className="tevis-discover-header glass">
        <div className="header-brand">
          <div className="tevis-logo-wrapper">
            <Bot size={32} className="tevis-bot-icon" />
            <div className="tevis-logo-glow"></div>
          </div>
          <div className="header-text">
            <h2>Tevis</h2>
            <p>SETX 360 AI Guide</p>
          </div>
        </div>
        
        <div className="header-nav">
          <button 
            className={`nav-link ${activeView === 'history' ? 'active' : ''}`}
            onClick={() => setActiveView('history')}
          >
            <History size={18} />
            <span>History</span>
          </button>
          <button 
            className={`nav-link ${activeView === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveView('settings')}
          >
            <Settings size={18} />
            <span>Settings</span>
          </button>
        </div>
      </div>

      <div className="tevis-discover-content">
        {activeView === 'history' ? (
          <div className="history-view">
            <div className="search-bar-wrapper glass">
              <Search size={18} />
              <input type="text" placeholder="Search past conversations..." />
            </div>

            {isLoading ? (
              <div className="loading-state">
                <div className="pulse-loader"></div>
                <p>Retrieving your archives...</p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="empty-history card-glow">
                <Sparkles size={48} className="sparkle-icon" />
                <h3>Your AI Journey Starts Here</h3>
                <p>Past conversations with Tevis will appear here for you to revisit at any time.</p>
                <button className="primary-btn">Start New Conversation</button>
              </div>
            ) : (
              <div className="conversation-list">
                {conversations.map(conv => (
                  <div key={conv.id} className="conversation-card glass">
                    <div className="conv-icon">
                      <MessageSquare size={20} />
                    </div>
                    <div className="conv-info">
                      <h4>{conv.title || 'Untitled Conversation'}</h4>
                      <p>{conv.summary || 'Click to view details...'}</p>
                      <div className="conv-meta">
                        <Clock size={12} />
                        <span>{new Date(conv.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <ChevronRight size={20} className="arrow-icon" />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="settings-view">
            <div className="settings-section glass">
              <h3>AI Personalization</h3>
              <div className="setting-item">
                <div className="setting-info">
                  <span className="setting-label">Community Focus</span>
                  <span className="setting-desc">Tailor Tevis's knowledge to your specific neighborhood.</span>
                </div>
                <div className="toggle-switch">
                  <input type="checkbox" defaultChecked />
                  <span className="slider"></span>
                </div>
              </div>
              <div className="setting-item">
                <div className="setting-info">
                  <span className="setting-label">Regional Alerts</span>
                  <span className="setting-desc">Allow Tevis to notify you about local safety and event updates.</span>
                </div>
                <div className="toggle-switch">
                  <input type="checkbox" defaultChecked />
                  <span className="slider"></span>
                </div>
              </div>
            </div>

            <div className="settings-section glass">
              <h3>Security & Data</h3>
              <div className="setting-item action">
                <div className="setting-info">
                  <span className="setting-label">Clear All History</span>
                  <span className="setting-desc">Permanently delete your entire conversation log.</span>
                </div>
                <button className="danger-btn">
                  <Trash2 size={16} />
                  Clear Archives
                </button>
              </div>
              <div className="setting-item">
                <div className="setting-info">
                  <span className="setting-label">Encrypted Storage</span>
                  <span className="setting-desc">Conversations are secured with end-to-end encryption.</span>
                </div>
                <ShieldCheck size={20} color="#10b981" />
              </div>
            </div>

            <div className="premium-upsell card-glow">
              <Zap size={24} />
              <div className="upsell-text">
                <h4>Pro AI Insights</h4>
                <p>Get advanced regional analytics and unlimited historical archives.</p>
              </div>
              <button className="upgrade-btn">Upgrade</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
