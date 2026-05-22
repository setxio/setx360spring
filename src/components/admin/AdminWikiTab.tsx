import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader2, Trash2, Globe, Link as LinkIcon, Book } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface Props {
  onRefresh?: () => void;
}

export const AdminWikiTab: React.FC<Props> = ({ onRefresh }) => {
  const [entries, setEntries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [url, setUrl] = useState('');
  const [linkType, setLinkType] = useState('general');
  const [isIngesting, setIsIngesting] = useState(false);
  const [deepCrawl, setDeepCrawl] = useState(false);
  const [maxPages, setMaxPages] = useState(50);
  const [crawlProgress, setCrawlProgress] = useState({ current: 0, total: 0, currentUrl: '' });
  const { success, error: toastError } = useToast();

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('search_wiki_entries')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setEntries(data);
    }
    setIsLoading(false);
  };

  const processQueue = async (startUrl: string) => {
    let queue = [startUrl];
    let visited = new Set<string>();
    let processedCount = 0;

    setIsIngesting(true);
    setCrawlProgress({ current: 0, total: 1, currentUrl: startUrl });

    while (queue.length > 0 && processedCount < maxPages) {
      const currentUrl = queue.shift()!;
      if (visited.has(currentUrl)) continue;
      
      visited.add(currentUrl);
      setCrawlProgress({ current: processedCount + 1, total: visited.size + queue.length, currentUrl });

      try {
        const { data, error } = await supabase.functions.invoke('ingest-wiki-link', {
          body: { url: currentUrl, type: linkType }
        });

        if (error) throw error;
        
        // Add discovered links to queue if deepCrawl is enabled
        if (deepCrawl && data?.links) {
          data.links.forEach((link: string) => {
            if (!visited.has(link) && !queue.includes(link)) {
              queue.push(link);
            }
          });
        }
        
        processedCount++;
        // Quick update to UI to show progress immediately
        if (processedCount % 5 === 0) fetchEntries();
      } catch (err: any) {
        console.error(`Failed to ingest ${currentUrl}:`, err);
      }
    }
    
    setIsIngesting(false);
    setCrawlProgress({ current: 0, total: 0, currentUrl: '' });
    success(deepCrawl ? `Deep crawl complete! Processed ${processedCount} pages.` : 'Link successfully ingested!');
    setUrl('');
    fetchEntries();
    if (onRefresh) onRefresh();
  };

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    await processQueue(url);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this wiki entry from the search index?')) return;
    
    const { error } = await supabase.from('search_wiki_entries').delete().eq('id', id);
    if (!error) {
      success('Entry deleted');
      fetchEntries();
    } else {
      toastError('Failed to delete entry');
    }
  };

  return (
    <div className="admin-card">
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: 10, borderRadius: 12, color: '#10b981' }}>
            <Book size={24} />
          </div>
          <div>
            <h3 style={{ margin: 0 }}>Global Link Ingestion</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Ingest external sites, articles, and wiki pages into the semantic search engine.</p>
          </div>
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.02)', padding: 24, borderRadius: 16, border: '1px solid var(--admin-border)', marginBottom: 24 }}>
        <h4 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Globe size={18} /> Add New Knowledge Link
        </h4>
        <form onSubmit={handleIngest} style={{ display: 'flex', gap: 12 }}>
          <div className="input-wrapper" style={{ flex: 1, position: 'relative' }}>
            <LinkIcon size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input 
              type="url" 
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              style={{ width: '100%', padding: '14px 14px 14px 44px', borderRadius: 12, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--admin-border)', color: '#fff', fontSize: '1rem' }}
              required
            />
          </div>
          <select 
            value={linkType} 
            onChange={(e) => setLinkType(e.target.value)}
            style={{ padding: '0 16px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--admin-border)', color: '#fff', fontWeight: 700 }}
          >
            <option value="general">General</option>
            <option value="article">News / Article</option>
            <option value="city">City Site</option>
            <option value="shop">External Shop</option>
            <option value="wiki">Wiki Page</option>
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '0 16px', background: 'rgba(255,255,255,0.05)', borderRadius: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input 
                type="checkbox" 
                id="deepCrawl" 
                checked={deepCrawl} 
                onChange={(e) => setDeepCrawl(e.target.checked)} 
                style={{ width: 16, height: 16, accentColor: 'var(--admin-accent)' }}
              />
              <label htmlFor="deepCrawl" style={{ fontSize: '0.85rem', cursor: 'pointer', userSelect: 'none' }}>Deep Crawl</label>
            </div>
            
            {deepCrawl && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: 16 }}>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Max Pages:</label>
                <input 
                  type="number" 
                  value={maxPages}
                  onChange={(e) => setMaxPages(parseInt(e.target.value) || 1)}
                  min={1}
                  max={1000}
                  style={{ width: 60, padding: '4px 8px', borderRadius: 6, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--admin-border)', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>
            )}
          </div>
          <button 
            type="submit" 
            disabled={isIngesting || !url}
            style={{ 
              background: 'var(--admin-accent)', color: '#fff', padding: '0 24px', borderRadius: 12, 
              fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, border: 'none', cursor: isIngesting ? 'not-allowed' : 'pointer',
              opacity: isIngesting ? 0.7 : 1
            }}
          >
            {isIngesting ? <><Loader2 size={18} className="animate-spin" /> Crawling...</> : 'Ingest Link'}
          </button>
        </form>
        {isIngesting && deepCrawl && (
          <div style={{ marginTop: 16, padding: 16, background: 'rgba(0,0,0,0.2)', borderRadius: 12, border: '1px solid var(--admin-accent)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 8 }}>
              <span>Scraping: <span style={{ color: 'var(--admin-accent)' }}>{crawlProgress.currentUrl}</span></span>
              <span>{crawlProgress.current} / {Math.min(crawlProgress.total, maxPages)} Pages (Max {maxPages})</span>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(crawlProgress.current / Math.min(crawlProgress.total, maxPages)) * 100}%`, background: 'var(--admin-accent)', transition: 'width 0.3s ease' }} />
            </div>
          </div>
        )}
        <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 12, marginBottom: 0 }}>
          {deepCrawl ? `The deep crawler will discover and ingest up to ${maxPages} internal pages from the same domain.` : 'The AI will read the page, extract the text, generate a vector embedding, and surface it.'}
        </p>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Loader2 className="animate-spin" color="var(--admin-accent)" /></div>
      ) : entries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: 16 }}>
          <Book size={48} style={{ color: '#64748b', opacity: 0.5, marginBottom: 16 }} />
          <p style={{ color: '#94a3b8' }}>No wiki entries ingested yet.</p>
        </div>
      ) : (
        <table className="premium-table">
          <thead>
            <tr>
              <th>Title & URL</th>
              <th>Category</th>
              <th>Description Snippet</th>
              <th>Date Ingested</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(entry => (
              <tr key={entry.id}>
                <td>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>{entry.title}</div>
                  <a href={entry.url} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: '#3b82f6', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {entry.url} <Globe size={10} />
                  </a>
                </td>
                <td>
                  <span className="role-badge" style={{ textTransform: 'capitalize' }}>{entry.type}</span>
                </td>
                <td>
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8', maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {entry.description || entry.content?.substring(0, 100) + '...'}
                  </div>
                </td>
                <td style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{new Date(entry.created_at).toLocaleDateString()}</td>
                <td>
                  <button className="icon-btn" style={{ color: '#ef4444' }} onClick={() => handleDelete(entry.id)}>
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
