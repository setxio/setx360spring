import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Avatar } from './Avatar';
import { Image as ImageIcon, Send, ThumbsUp, MessageSquare, Share2 } from 'lucide-react';
import { PostCard } from './PostCard';
import { useApp } from '../context/AppContext';

export const ProPlusFeedTab: React.FC<{ user: any }> = ({ user }) => {
  const [posts, setPosts] = useState<any[]>([]);
  const [content, setContent] = useState('');
  const { activeContext } = useApp();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const { data } = await supabase
      .from('detailed_posts')
      .select('*')
      .eq('type', 'proplus')
      .order('created_at', { ascending: false })
      .limit(30);

    if (data) setPosts(data);
  };

  const handlePost = async () => {
    if (!content.trim()) return;
    const { data, error } = await supabase.from('posts').insert({
      profile_id: user.id,
      page_id: activeContext?.id || null,
      content,
      type: 'proplus',
    }).select('*').single();

    if (!error && data) {
      // Re-fetch to get the detailed_posts view mapping
      fetchPosts();
      setContent('');
    }
  };

  return (
    <div className="proplus-feed-tab">
      <div className="glass-card new-post-card" style={{ display: 'block' }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <Avatar url={activeContext?.avatar_url || user?.pro_avatar_url || user?.avatar_url} name={activeContext?.name || user?.name} size={48} />
          <textarea 
            placeholder="Share an update, article, or professional milestone..."
            value={content}
            onChange={e => setContent(e.target.value)}
            style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 12, padding: 12, background: 'var(--bg-default)', color: 'var(--text)', minHeight: 80, fontFamily: 'inherit' }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button style={{ background: 'none', border: 'none', color: '#0284c7', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: 600 }}>
            <ImageIcon size={18} /> Media
          </button>
          <button 
            className="save-btn" 
            onClick={handlePost} 
            disabled={!content.trim()} 
            style={{ 
              opacity: !content.trim() ? 0.5 : 1,
              backgroundColor: '#0284c7',
              color: '#ffffff',
              padding: '8px 16px',
              borderRadius: '20px',
              fontWeight: 600,
              border: 'none'
            }}
          >
            Post
          </button>
        </div>
      </div>

      <div className="proplus-feed-list">
        {posts.length === 0 ? (
          <div className="empty-state glass-card">
            <h3 style={{ margin: '0 0 8px' }}>Your Professional Feed</h3>
            <p>Connect with others to see their professional updates here.</p>
          </div>
        ) : (
          posts.map(post => (
            <PostCard 
              key={post.id} 
              post={post} 
              user={user} 
              onDelete={() => fetchPosts()}
              onPollVote={() => {}}
              onRepost={() => {}}
              onShare={() => {}}
            />
          ))
        )}
      </div>
    </div>
  );
};
