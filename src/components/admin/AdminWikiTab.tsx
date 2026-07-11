import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Loader2, Trash2, Globe, Link as LinkIcon, Book, 
  Check, X, FileText, CheckCircle, XCircle, ShieldAlert 
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface Props {
  onRefresh?: () => void;
}

export const AdminWikiTab: React.FC<Props> = ({ onRefresh }) => {
  const { success, error: toastError } = useToast();
  
  // Crawler State
  const [entries, setEntries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [url, setUrl] = useState('');
  const [linkType, setLinkType] = useState('general');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isIngesting, setIsIngesting] = useState(false);
  const [deepCrawl, setDeepCrawl] = useState(false);
  const [maxPages, setMaxPages] = useState(50);
  const [skipExisting, setSkipExisting] = useState(true);
  const [crawlProgress, setCrawlProgress] = useState({ current: 0, total: 0, currentUrl: '' });

  // Moderation State
  const [activeSubTab, setActiveSubTab] = useState<'crawler' | 'moderation'>('crawler');
  const [pendingEdits, setPendingEdits] = useState<any[]>([]);
  const [selectedEdit, setSelectedEdit] = useState<any | null>(null);
  const [currentArticle, setCurrentArticle] = useState<any | null>(null);
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchEntries();
    fetchPendingEdits();
  }, []);

  useEffect(() => {
    if (selectedEdit && selectedEdit.article_id) {
      fetchCurrentArticle(selectedEdit.article_id);
    } else {
      setCurrentArticle(null);
    }
  }, [selectedEdit]);

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

  const fetchPendingEdits = async () => {
    const { data, error } = await supabase
      .from('wiki_edits')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    
    if (!error && data) {
      const proposerIds = data.map(d => d.proposed_by).filter(Boolean);
      if (proposerIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', proposerIds);
        
        const profileMap = new Map(profiles?.map(p => [p.id, p.name]) || []);
        const mapped = data.map(edit => ({
          ...edit,
          proposer_name: profileMap.get(edit.proposed_by) || 'Anonymous User'
        }));
        setPendingEdits(mapped);
      } else {
        setPendingEdits(data.map(edit => ({ ...edit, proposer_name: 'Anonymous User' })));
      }
    }
  };

  const fetchCurrentArticle = async (articleId: string) => {
    const { data } = await supabase
      .from('wiki_articles')
      .select('*')
      .eq('id', articleId)
      .single();
    if (data) {
      setCurrentArticle(data);
    }
  };

  // Crawling process
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
          body: { url: currentUrl, type: linkType, skipExisting }
        });

        if (error) throw error;
        
        if (deepCrawl && data?.links) {
          data.links.forEach((link: string) => {
            if (!visited.has(link) && !queue.includes(link)) {
              queue.push(link);
            }
          });
        }
        
        processedCount++;
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

  // Moderation actions
  const handleApprove = async (edit: any) => {
    setIsProcessing(true);
    try {
      let savedRecord: any = null;

      if (!edit.article_id) {
        // 1. Proposing a NEW article
        const { data, error } = await supabase
          .from('wiki_articles')
          .insert({
            slug: edit.slug,
            title: edit.title,
            category: edit.category,
            body_content: edit.body_content,
            infobox_data: edit.infobox_data,
            external_links: edit.external_links,
            author_id: edit.proposed_by
          })
          .select()
          .single();

        if (error) throw error;
        savedRecord = data;
      } else {
        // 2. Proposing edits to an EXISTING article
        const { data, error } = await supabase
          .from('wiki_articles')
          .update({
            title: edit.title,
            body_content: edit.body_content,
            infobox_data: edit.infobox_data,
            external_links: edit.external_links,
            updated_at: new Date().toISOString()
          })
          .eq('id', edit.article_id)
          .select()
          .single();

        if (error) throw error;
        savedRecord = data;
      }

      // 3. Trigger Semantic Embedding Generation edge function
      if (savedRecord) {
        await supabase.functions.invoke('generate-embedding', {
          body: { record: savedRecord, table: 'wiki_articles' }
        });
      }

      // 4. Set proposal status to approved
      const { error: editErr } = await supabase
        .from('wiki_edits')
        .update({ status: 'approved', reviewer_notes: reviewerNotes })
        .eq('id', edit.id);

      if (editErr) throw editErr;

      success('Edit proposal approved and applied live!');
      setSelectedEdit(null);
      setReviewerNotes('');
      fetchPendingEdits();
    } catch (err: any) {
      console.error(err);
      toastError(`Failed to approve: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (edit: any) => {
    if (!reviewerNotes.trim()) {
      toastError('Please provide reviewer notes explaining the reason for rejection.');
      return;
    }

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('wiki_edits')
        .update({ status: 'rejected', reviewer_notes: reviewerNotes })
        .eq('id', edit.id);

      if (error) throw error;

      success('Edit proposal rejected.');
      setSelectedEdit(null);
      setReviewerNotes('');
      fetchPendingEdits();
    } catch (err: any) {
      console.error(err);
      toastError(`Failed to reject: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="admin-card" style={{ padding: '24px' }}>
      
      {/* Sub tab navigation */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, borderBottom: '1px solid var(--admin-border)', paddingBottom: '12px' }}>
        <button 
          onClick={() => setActiveSubTab('crawler')}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: activeSubTab === 'crawler' ? '2px solid var(--admin-accent)' : '2px solid transparent',
            color: activeSubTab === 'crawler' ? 'var(--admin-accent)' : '#94a3b8',
            fontWeight: 700,
            padding: '8px 16px',
            cursor: 'pointer',
            fontSize: '0.95rem'
          }}
        >
          Crawler Ingestion
        </button>
        <button 
          onClick={() => setActiveSubTab('moderation')}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: activeSubTab === 'moderation' ? '2px solid var(--admin-accent)' : '2px solid transparent',
            color: activeSubTab === 'moderation' ? 'var(--admin-accent)' : '#94a3b8',
            fontWeight: 700,
            padding: '8px 16px',
            cursor: 'pointer',
            fontSize: '0.95rem'
          }}
        >
          Proposed Edits Queue ({pendingEdits.length})
        </button>
      </div>

      {activeSubTab === 'crawler' ? (
        /* CRAWLER TAB */
        <>
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
            <form onSubmit={handleIngest} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '0 16px', border: '1px solid var(--admin-border)', width: '100%' }}>
                <LinkIcon size={18} color="#94a3b8" />
                <input 
                  type="url" 
                  placeholder="https://example.com" 
                  value={url} 
                  onChange={(e) => setUrl(e.target.value)}
                  style={{ flex: 1, background: 'transparent', border: 'none', padding: '16px', color: '#fff', outline: 'none', minWidth: 0 }}
                  required
                />
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                <div style={{ position: 'relative', minWidth: '200px' }}>
                  <div 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    style={{ padding: '0 16px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--admin-border)', color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '52px', cursor: 'pointer' }}
                  >
                    <span style={{ textTransform: 'capitalize' }}>
                      {linkType}
                    </span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                  
                  {isDropdownOpen && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 8, width: '100%', background: '#0f172a', border: '1px solid var(--admin-border)', borderRadius: 12, overflow: 'hidden', zIndex: 50 }}>
                      {['general', 'article', 'city', 'shop', 'wiki'].map((option) => (
                        <div 
                          key={option}
                          onClick={() => { setLinkType(option); setIsDropdownOpen(false); }}
                          style={{ padding: '12px 16px', cursor: 'pointer', color: '#fff' }}
                        >
                          {option}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flex: 1, alignItems: 'center', gap: 16, padding: '0 16px', background: 'rgba(255,255,255,0.05)', borderRadius: 12, minWidth: '300px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input 
                      type="checkbox" 
                      id="deepCrawl" 
                      checked={deepCrawl} 
                      onChange={(e) => setDeepCrawl(e.target.checked)} 
                      style={{ width: 16, height: 16, accentColor: 'var(--admin-accent)' }}
                    />
                    <label htmlFor="deepCrawl" style={{ fontSize: '0.85rem', cursor: 'pointer' }}>Deep Crawl</label>
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
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: 16 }}>
                    <input 
                      type="checkbox" 
                      id="skipExisting" 
                      checked={skipExisting} 
                      onChange={(e) => setSkipExisting(e.target.checked)} 
                      style={{ width: 16, height: 16, accentColor: 'var(--admin-accent)' }}
                    />
                    <label htmlFor="skipExisting" style={{ fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>Skip Existing</label>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isIngesting || !url}
                  style={{ padding: '0 24px', borderRadius: 12, background: isIngesting ? 'rgba(255,255,255,0.1)' : 'var(--admin-accent)', color: '#fff', border: 'none', fontWeight: 600, cursor: isIngesting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, height: '52px', flexShrink: 0 }}
                >
                  {isIngesting ? <><Loader2 size={18} className="spin" /> Processing...</> : 'Ingest Link'}
                </button>
              </div>
            </form>
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
                  <th>Snippet</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(entry => (
                  <tr key={entry.id}>
                    <td>
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>{entry.title}</div>
                      <a href={entry.url} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: '#3b82f6', textDecoration: 'none' }}>
                        {entry.url}
                      </a>
                    </td>
                    <td>
                      <span className="role-badge">{entry.type}</span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem', color: '#94a3b8', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {entry.description || entry.content?.substring(0, 100)}
                      </div>
                    </td>
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
        </>
      ) : (
        /* WIKI MODERATION TAB */
        <div>
          <div className="card-header" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: 10, borderRadius: 12, color: '#8b5cf6' }}>
                <ShieldAlert size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0 }}>Proposed Wiki Edits Queue</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Review community proposed article creations or source modifications.</p>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24, alignItems: 'start' }}>
            {/* List panel */}
            <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--admin-border)', borderRadius: 16, padding: 16, maxHeight: '600px', overflowY: 'auto' }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '0.9rem', color: '#94a3b8' }}>Pending Submissions</h4>
              {pendingEdits.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: '#64748b', textAlign: 'center', padding: 20 }}>No pending edits.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {pendingEdits.map(edit => (
                    <div 
                      key={edit.id}
                      onClick={() => setSelectedEdit(edit)}
                      style={{
                        padding: 12,
                        borderRadius: 10,
                        border: '1px solid var(--admin-border)',
                        background: selectedEdit?.id === edit.id ? 'rgba(139, 92, 246, 0.1)' : 'rgba(255,255,255,0.02)',
                        cursor: 'pointer',
                        borderColor: selectedEdit?.id === edit.id ? '#8b5cf6' : 'var(--admin-border)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 4 }}>{edit.title}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8' }}>
                        <span>Category: <strong>{edit.category}</strong></span>
                        <span style={{ color: edit.article_id ? '#3b82f6' : '#22c55e', fontWeight: 600 }}>
                          {edit.article_id ? 'EDIT' : 'NEW'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 4 }}>
                        By {edit.proposer_name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Details panel */}
            <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--admin-border)', borderRadius: 16, padding: 24, minHeight: '400px' }}>
              {selectedEdit ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ borderBottom: '1px solid var(--admin-border)', paddingBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ margin: 0, fontSize: '1.2rem' }}>
                        {selectedEdit.article_id ? 'Proposed Edit Review' : 'New Article Proposal'}
                      </h4>
                      <span className="role-badge" style={{ background: selectedEdit.article_id ? 'rgba(59, 130, 246, 0.2)' : 'rgba(34, 197, 94, 0.2)', color: selectedEdit.article_id ? '#3b82f6' : '#22c55e' }}>
                        {selectedEdit.article_id ? 'Existing Article' : 'New Entry'}
                      </span>
                    </div>
                    <p style={{ margin: '8px 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                      Proposed by <strong>{selectedEdit.proposer_name}</strong> on {new Date(selectedEdit.created_at).toLocaleString()}
                    </p>
                  </div>

                  {/* Title & Category Info */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <strong style={{ fontSize: '0.8rem', color: '#64748b' }}>TITLE:</strong>
                      <div style={{ fontSize: '1rem', fontWeight: 700 }}>{selectedEdit.title}</div>
                    </div>
                    <div>
                      <strong style={{ fontSize: '0.8rem', color: '#64748b' }}>CATEGORY:</strong>
                      <div style={{ fontSize: '1rem', fontWeight: 700, textTransform: 'capitalize' }}>{selectedEdit.category}</div>
                    </div>
                  </div>

                  {/* Infobox Metadata Diffs */}
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: 16, borderRadius: 12, border: '1px solid var(--admin-border)' }}>
                    <h5 style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: '#94a3b8' }}>Infobox Key-Value Properties</h5>
                    <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--admin-border)', textAlign: 'left' }}>
                          <th style={{ paddingBottom: 6 }}>Field</th>
                          {selectedEdit.article_id && <th style={{ paddingBottom: 6 }}>Current Value</th>}
                          <th style={{ paddingBottom: 6 }}>Proposed Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(selectedEdit.infobox_data || {}).map(([key, proposedVal]) => {
                          const currentVal = currentArticle?.infobox_data?.[key];
                          const isChanged = currentArticle && JSON.stringify(currentVal) !== JSON.stringify(proposedVal);
                          
                          return (
                            <tr key={key} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                              <td style={{ padding: '8px 0', fontWeight: 700, color: '#94a3b8' }}>{key}</td>
                              {selectedEdit.article_id && (
                                <td style={{ padding: '8px', opacity: 0.7 }}>
                                  {currentVal ? String(currentVal) : <em style={{ color: '#64748b' }}>None</em>}
                                </td>
                              )}
                              <td style={{ padding: '8px', color: isChanged ? '#22c55e' : '#fff', fontWeight: isChanged ? 700 : 'normal' }}>
                                {proposedVal ? String(proposedVal) : <em style={{ color: '#64748b' }}>None</em>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Body Content Markdown Diffs */}
                  <div>
                    <h5 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: '#94a3b8' }}>Body Markdown Comparison</h5>
                    <div style={{ display: 'grid', gridTemplateColumns: selectedEdit.article_id ? '1fr 1fr' : '1fr', gap: 16 }}>
                      {selectedEdit.article_id && (
                        <div>
                          <div style={{ fontSize: '0.75rem', color: '#ef4444', marginBottom: 6, fontWeight: 700 }}>CURRENT SOURCE:</div>
                          <textarea 
                            readOnly 
                            value={currentArticle?.body_content || ''} 
                            style={{ width: '100%', height: '250px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--admin-border)', borderRadius: 8, padding: 10, color: '#94a3b8', fontFamily: 'monospace', fontSize: '0.75rem' }}
                          />
                        </div>
                      )}
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#22c55e', marginBottom: 6, fontWeight: 700 }}>PROPOSED SOURCE:</div>
                        <textarea 
                          readOnly 
                          value={selectedEdit.body_content} 
                          style={{ width: '100%', height: '250px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--admin-border)', borderRadius: 8, padding: 10, color: '#fff', fontFamily: 'monospace', fontSize: '0.75rem' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Moderation Controls */}
                  <div style={{ borderTop: '1px solid var(--admin-border)', paddingTop: 20 }}>
                    <div className="wiki-input-group" style={{ marginBottom: 16 }}>
                      <label style={{ color: '#94a3b8' }}>Reviewer Notes (Required for rejection)</label>
                      <textarea
                        placeholder="Add review notes, reasons for edits, or rejection feedback..."
                        value={reviewerNotes}
                        onChange={(e) => setReviewerNotes(e.target.value)}
                        style={{ width: '100%', minHeight: '60px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--admin-border)', borderRadius: 8, padding: 10, color: '#fff', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                      <button 
                        onClick={() => handleReject(selectedEdit)}
                        disabled={isProcessing}
                        style={{ padding: '10px 20px', borderRadius: 8, background: '#ef4444', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        <XCircle size={16} /> Reject
                      </button>
                      <button 
                        onClick={() => handleApprove(selectedEdit)}
                        disabled={isProcessing}
                        style={{ padding: '10px 20px', borderRadius: 8, background: '#22c55e', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        {isProcessing ? <Loader2 size={16} className="spin" /> : <CheckCircle size={16} />} Approve & Publish
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b', padding: '60px 0' }}>
                  <FileText size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
                  <p>Select a proposed wiki edit from the list to review.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
