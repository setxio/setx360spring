import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, Calendar, User, Package, Users, Eye, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { SETX_COUNTY_LIST } from '../utils/geo';
import './NewArrivalsView.css';

interface ActivityItem {
  id: string;
  type: 'post' | 'product' | 'group';
  title: string;
  description: string;
  image_url?: string;
  created_at: string;
  metadata?: any;
}

interface NewArrivalsViewProps {
  user?: any;
  scope?: 'national' | 'state' | 'county' | 'city';
}

export const NewArrivalsView: React.FC<NewArrivalsViewProps> = ({ user, scope = 'national' }) => {
  const { theme } = useApp();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchNewArrivals();
  }, [scope]);

  const fetchNewArrivals = async () => {
    setIsLoading(true);
    
    // Build queries with geo filters
    let postQuery = supabase.from('posts').select('id, content, created_at, profiles!inner(name, avatar_url, community, county, state, country)');
    let productQuery = supabase.from('products').select('id, name, created_at, image_urls, price, stores!inner(name, seller:profiles!owner_id!inner(community, county, state, country))');
    let groupQuery = supabase.from('groups').select('*'); // Groups don't have location yet, will stick to active ones

    if (user && scope !== 'national') {
      const isSETX = theme.startsWith('setx-');

      if (scope === 'city') {
        postQuery = postQuery.or(`location.eq."${user.community}",profiles.community.eq."${user.community}"`);
        productQuery = productQuery.eq('stores.seller.community', user.community);
      } else if (scope === 'county') {
        if (isSETX) {
          // All 4 SETX counties
          postQuery = postQuery.in('profiles.county', SETX_COUNTY_LIST);
          productQuery = productQuery.in('stores.seller.county', SETX_COUNTY_LIST);
        } else if (user.county) {
          postQuery = postQuery.eq('profiles.county', user.county);
          productQuery = productQuery.eq('stores.seller.county', user.county);
        }
      } else if (scope === 'state') {
        postQuery = postQuery.eq('profiles.state', user.state);
        productQuery = productQuery.eq('stores.seller.state', user.state);
      }
    }

    // Fetch from multiple tables and combine
    const [posts, products, groups] = await Promise.all([
      postQuery.order('created_at', { ascending: false }).limit(10),
      productQuery.order('created_at', { ascending: false }).limit(10),
      groupQuery.order('created_at', { ascending: false }).limit(10)
    ]);

    const combined: ActivityItem[] = [
      ...(posts.data?.map(p => ({
        id: p.id,
        type: 'post' as const,
        title: (p as any).profiles?.name || 'Social Update',
        description: p.content,
        image_url: (p as any).profiles?.avatar_url,
        created_at: p.created_at,
        metadata: { author_name: (p as any).profiles?.name }
      })) || []),
      ...(products.data?.map(p => ({
        id: p.id,
        type: 'product' as const,
        title: p.name,
        description: `New item from ${(p as any).stores?.name || 'Local Store'} - $${p.price}`,
        image_url: p.image_urls?.[0],
        created_at: p.created_at,
        metadata: { price: p.price }
      })) || []),
      ...(groups.data?.map(g => ({
        id: g.id,
        type: 'group' as const,
        title: g.name,
        description: g.description,
        image_url: g.avatar_url,
        created_at: g.created_at
      })) || [])
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setItems(combined.slice(0, 20));
    setIsLoading(false);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'post': return <User size={16} />;
      case 'product': return <Package size={16} />;
      case 'group': return <Users size={16} />;
      default: return <Sparkles size={16} />;
    }
  };

  if (isLoading) {
    return (
      <div className="discovery-loading">
        <Loader2 className="animate-spin" size={40} color="var(--primary)" />
      </div>
    );
  }

  return (
    <div className="discovery-view-content animate-fade-in">
      <div className="discovery-hero new-hero">
        <div className="hero-badge">
          <Sparkles size={14} fill="currentColor" /> Just In
        </div>
        <h1>Fresh Arrivals</h1>
        <p>A unified stream of the latest activity across the entire marketplace and social graph.</p>
      </div>

      <div className="arrivals-timeline">
        {items.map((item) => (
          <div key={item.id} className="arrival-item premium-card">
            <div className={`arrival-indicator ${item.type}`}>
              {getIcon(item.type)}
              <span className="arrival-type-label">{item.type}</span>
            </div>
            
            <div className="arrival-main">
              <div className="arrival-image">
                <img src={item.image_url || 'https://ui-avatars.com/api/?name=' + item.title} alt={item.title} />
              </div>
              
              <div className="arrival-text">
                <div className="arrival-header">
                  <h3>{item.title}</h3>
                  <span className="arrival-date">
                    <Calendar size={12} /> {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p>{item.description}</p>
                
                <div className="arrival-actions">
                  <button className="arrival-view-btn">
                    Explore <Eye size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
