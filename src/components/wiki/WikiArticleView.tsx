import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { 
  ArrowLeft, Edit, MessageSquare, ThumbsUp, ThumbsDown, 
  MapPin, Globe, Sparkles, BookOpen, Clock, Send, Eye, ShieldAlert,
  Heart, Image as ImageIcon, Trash2, Upload
} from 'lucide-react';
import './WikiStyle.css';

interface Props {
  article: any;
  user: any;
  onBack: () => void;
  onEdit: (article: any) => void;
}

export const WikiArticleView: React.FC<Props> = ({ article, user, onBack, onEdit }) => {
  const { setEnv, setActiveTab } = useApp();
  const { success, error: toastError } = useToast();
  const [activeSubTab, setActiveSubTab] = useState<'read' | 'notes' | 'memories' | 'gallery'>('read');
  const [newNoteText, setNewNoteText] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [notes, setNotes] = useState<any[]>(article.community_notes || []);
  const [aiSummary, setAiSummary] = useState<string[] | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Memories & Gallery states
  const [memories, setMemories] = useState<any[]>([]);
  const [newMemoryText, setNewMemoryText] = useState('');
  const [newMemoryFile, setNewMemoryFile] = useState<File | null>(null);
  const [isSubmittingMemory, setIsSubmittingMemory] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isMemoriesLoading, setIsMemoriesLoading] = useState(false);

  // Advanced Layout Customization States
  const [isTocVisible, setIsTocVisible] = useState(true);
  const [isAppearanceOpen, setIsAppearanceOpen] = useState(false);
  const [textSize, setTextSize] = useState<'small' | 'standard' | 'large'>('standard');
  const [layoutWidth, setLayoutWidth] = useState<'standard' | 'wide'>('standard');
  const [colorTheme, setColorTheme] = useState<'auto' | 'light' | 'dark'>('auto');

  // Fetch Memories
  const fetchMemories = async () => {
    setIsMemoriesLoading(true);
    try {
      const { data, error } = await supabase
        .from('wiki_memories')
        .select(`
          *,
          profiles (
            name,
            avatar_url
          )
        `)
        .eq('article_id', article.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMemories(data || []);
    } catch (err) {
      console.error('Error fetching wiki memories:', err);
    } finally {
      setIsMemoriesLoading(false);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, [article.id]);

  const handlePostMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemoryText.trim()) return;
    if (!user) {
      toastError('Please log in to share a memory.');
      return;
    }

    setIsSubmittingMemory(true);
    let mediaUrl = null;

    try {
      // Upload media if present
      if (newMemoryFile) {
        const fileExt = newMemoryFile.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('wiki-media')
          .upload(fileName, newMemoryFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('wiki-media')
          .getPublicUrl(fileName);

        mediaUrl = publicUrl;
      }

      // Insert memory
      const { error: insertError } = await supabase
        .from('wiki_memories')
        .insert({
          article_id: article.id,
          profile_id: user.id,
          memory_text: newMemoryText.trim(),
          media_url: mediaUrl
        });

      if (insertError) throw insertError;

      success('Memory shared successfully!');
      setNewMemoryText('');
      setNewMemoryFile(null);
      fetchMemories();
    } catch (err) {
      console.error('Error posting memory:', err);
      toastError('Failed to post memory');
    } finally {
      setIsSubmittingMemory(false);
    }
  };

  const handleDeleteMemory = async (memoryId: string) => {
    try {
      const { error } = await supabase
        .from('wiki_memories')
        .delete()
        .eq('id', memoryId);

      if (error) throw error;
      success('Memory deleted successfully.');
      fetchMemories();
    } catch (err) {
      console.error('Error deleting memory:', err);
      toastError('Failed to delete memory');
    }
  };

  const galleryMedia = memories.filter(m => m.media_url);

  // Generate Table of Contents from markdown headers
  const getTOC = () => {
    const lines = article.body_content.split('\n');
    const toc: Array<{ text: string; id: string; level: number }> = [];
    
    lines.forEach((line: string) => {
      const match = line.match(/^(#{1,3})\s+(.*)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2].trim();
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        toc.push({ text, id, level });
      }
    });
    return toc;
  };

  const tocItems = getTOC();

  // Custom Markdown Parser
  const renderMarkdown = (markdown: string) => {
    if (!markdown) return '';
    let html = markdown
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Blockquotes
    html = html.replace(/^&gt;\s+(.*)$/gm, '<blockquote>$1</blockquote>');
    
    // Headers with IDs for TOC anchoring
    html = html.replace(/^### (.*$)/gim, (_, text) => {
      const id = text.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
      return `<h3 id="${id}">${text}</h3>`;
    });
    html = html.replace(/^## (.*$)/gim, (_, text) => {
      const id = text.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
      return `<h2 id="${id}">${text}</h2>`;
    });
    html = html.replace(/^# (.*$)/gim, (_, text) => {
      const id = text.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
      return `<h1 id="${id}">${text}</h1>`;
    });
    
    // Bold & Italics
    html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
    html = html.replace(/_(.*?)_/g, '<em>$1</em>');

    // External Links [label](url)
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="wiki-inline-link">$1 <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline-block;vertical-align:middle;margin-left:2px;"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg></a>');

    // Bullet points
    html = html.replace(/^\s*-\s+(.*)$/gm, '<li>$1</li>');
    html = html.replace(/^\s*\*\s+(.*)$/gm, '<li>$1</li>');

    // Paragraphs
    html = html.replace(/\n\s*\n/g, '</p><p>');
    html = '<p>' + html + '</p>';

    // Clean empty paragraphs or nested tags
    html = html.replace(/<p>\s*<\/p>/g, '');
    html = html.replace(/<p><h3>/g, '<h3>').replace(/<\/h3><\/p>/g, '</h3>');
    html = html.replace(/<p><h2>/g, '<h2>').replace(/<\/h2><\/p>/g, '</h2>');
    html = html.replace(/<p><h1>/g, '<h1>').replace(/<\/h1><\/p>/g, '</h1>');
    html = html.replace(/<p><blockquote>/g, '<blockquote>').replace(/<\/blockquote><\/p>/g, '</blockquote>');

    return html;
  };

  // Generate AI Summary Client-side
  const handleGenerateSummary = () => {
    setIsAiLoading(true);
    setTimeout(() => {
      const bullets: string[] = [];
      const title = article.title;
      
      if (article.category === 'figure' || article.category === 'artist' || article.category === 'sports') {
        bullets.push(`${title} is a prominent Southeast Texas figure from the ${article.infobox_data?.era || 'historical'} era.`);
        bullets.push(`Best known for contributions as a ${article.infobox_data?.profession || 'notable pioneer'} in the region.`);
        bullets.push(`Left a lasting legacy, with records indicating birth in ${article.infobox_data?.birth_date ? new Date(article.infobox_data.birth_date).getFullYear() : 'the region'}.`);
      } else if (article.category === 'event') {
        bullets.push(`The ${title} is a significant event occurring on ${article.infobox_data?.event_date ? new Date(article.infobox_data.event_date).toLocaleDateString() : 'historical dates'}.`);
        bullets.push(`Rated with an impact factor of ${article.infobox_data?.impact_rating || 80}/100 in Southeast Texas historical logs.`);
        bullets.push(`Centered geographically in coordinates ${article.infobox_data?.location_coords || 'Jefferson County'}.`);
      } else {
        bullets.push(`This article chronicles ${title}, a legendary historical establishment that operated in Southeast Texas.`);
        bullets.push(`Serves as a historical touchstone for local commerce and community life during its active years.`);
        bullets.push(`Preserved in local archives as a key component of Beaumont/Port Arthur commercial heritage.`);
      }

      setAiSummary(bullets);
      setIsAiLoading(false);
      success('AI Summary Generated by Tevis!');
    }, 1200);
  };

  // Add a Community note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    setIsSubmittingNote(true);
    const newNote = {
      id: crypto.randomUUID(),
      author_name: user?.name || 'Anonymous User',
      author_id: user?.id,
      note_text: newNoteText.trim(),
      votes_helpful: 0,
      votes_unhelpful: 0,
      created_at: new Date().toISOString()
    };

    const updatedNotes = [newNote, ...notes];

    try {
      const { error } = await supabase
        .from('wiki_articles')
        .update({ community_notes: updatedNotes })
        .eq('id', article.id);

      if (error) throw error;

      setNotes(updatedNotes);
      setNewNoteText('');
      success('Community note submitted successfully!');
    } catch (err) {
      console.error(err);
      toastError('Failed to add community note');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  // Vote on Community note
  const handleVoteNote = async (noteId: string, helpful: boolean) => {
    const updatedNotes = notes.map(note => {
      if (note.id === noteId) {
        return {
          ...note,
          votes_helpful: helpful ? note.votes_helpful + 1 : note.votes_helpful,
          votes_unhelpful: !helpful ? note.votes_unhelpful + 1 : note.votes_unhelpful
        };
      }
      return note;
    });

    try {
      const { error } = await supabase
        .from('wiki_articles')
        .update({ community_notes: updatedNotes })
        .eq('id', article.id);

      if (error) throw error;
      setNotes(updatedNotes);
      success('Vote counted!');
    } catch (err) {
      console.error(err);
      toastError('Failed to submit vote');
    }
  };

  // Navigate to radar map
  const handleViewOnMap = () => {
    if (article.infobox_data?.location_coords) {
      setEnv('discover');
      setActiveTab(4); // Radar map
    }
  };

  const coordinates = article.infobox_data?.location_coords || article.infobox_data?.coordinates;

  return (
    <div className={`wiki-article-theme-wrapper ${colorTheme === 'light' ? 'theme-light-forced' : colorTheme === 'dark' ? 'theme-dark-forced' : ''}`}>
      {/* Back to Home Button */}
      <button onClick={onBack} className="wiki-back-btn">
        <ArrowLeft size={16} /> Back to Directory
      </button>

      {/* Main Page Layout Grid */}
      <div 
        className="wiki-layout"
        style={{
          gridTemplateColumns: `${isTocVisible ? '240px' : '50px'} 1fr 320px ${isAppearanceOpen ? '250px' : ''}`,
          transition: 'all 0.3s ease'
        }}
      >
        
        {/* Left Column: Table of Contents */}
        <aside className="wiki-toc-column" style={{ overflow: 'hidden' }}>
          <div className="wiki-toc-card">
            <div className="wiki-toc-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {isTocVisible ? <span>Contents</span> : <span>TOC</span>}
              <button 
                onClick={() => setIsTocVisible(!isTocVisible)} 
                className="wiki-toc-toggle-btn"
                title={isTocVisible ? 'Hide Contents' : 'Show Contents'}
              >
                {isTocVisible ? '[hide]' : '[show]'}
              </button>
            </div>
            {isTocVisible && (
              <>
                {tocItems.length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No headers found in this article.</p>
                ) : (
                  <ul className="wiki-toc-list">
                    {tocItems.map(item => (
                      <li 
                        key={item.id} 
                        className="wiki-toc-item"
                        style={{ paddingLeft: `${(item.level - 1) * 10 + 10}px` }}
                        onClick={() => {
                          const el = document.getElementById(item.id);
                          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }}
                      >
                        {item.text}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        </aside>

        {/* Center Column: Main Article Card */}
        <section className="wiki-article-column">
          <div className={`wiki-article-card ${layoutWidth === 'wide' ? 'width-wide' : 'width-standard'}`}>
            
            {/* Title & Metadata Header */}
            <div className="wiki-article-header" style={{ position: 'relative' }}>
              {/* Coordinates display at top right */}
              {coordinates && (
                <div className="wiki-coords-header" style={{ position: 'absolute', top: 0, right: 0 }}>
                  <MapPin size={12} color="var(--primary)" style={{ marginRight: 4 }} />
                  <span>Coordinates: <a href="#map" onClick={handleViewOnMap} style={{ color: 'var(--primary)', textDecoration: 'underline' }}>{coordinates}</a></span>
                </div>
              )}

              <h2 className="wiki-article-title" style={{ paddingRight: coordinates ? '180px' : '0' }}>{article.title}</h2>
              <div className="wiki-article-meta">
                <span className="role-badge" style={{ textTransform: 'uppercase', fontSize: '0.65rem' }}>
                  {article.category}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={14} /> Last updated {new Date(article.updated_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Sub Tabs: Read vs Community Notes vs Memories vs Gallery */}
            <div className="wiki-article-tabs">
              <button 
                className={`wiki-tab-btn ${activeSubTab === 'read' ? 'active' : ''}`}
                onClick={() => setActiveSubTab('read')}
              >
                <BookOpen size={16} /> Read Entry
              </button>
              <button 
                className={`wiki-tab-btn ${activeSubTab === 'notes' ? 'active' : ''}`}
                onClick={() => setActiveSubTab('notes')}
              >
                <MessageSquare size={16} /> Community Notes ({notes.length})
              </button>
              <button 
                className={`wiki-tab-btn ${activeSubTab === 'memories' ? 'active' : ''}`}
                onClick={() => setActiveSubTab('memories')}
              >
                <Heart size={16} /> Memories ({memories.length})
              </button>
              <button 
                className={`wiki-tab-btn ${activeSubTab === 'gallery' ? 'active' : ''}`}
                onClick={() => setActiveSubTab('gallery')}
              >
                <ImageIcon size={16} /> Gallery ({galleryMedia.length})
              </button>
              <button 
                className="wiki-tab-btn"
                onClick={() => onEdit(article)}
              >
                <Edit size={16} /> Edit Source
              </button>
              <button 
                className={`wiki-tab-btn ${isAppearanceOpen ? 'active' : ''}`}
                onClick={() => setIsAppearanceOpen(!isAppearanceOpen)}
                style={{ marginLeft: 'auto' }}
              >
                <Eye size={16} /> Appearance
              </button>
            </div>

            {activeSubTab === 'read' && (
              <>
                {/* AI TL;DR Section */}
                {aiSummary ? (
                  <div className="wiki-ai-tldr-glow">
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '0 0 10px 0', fontSize: '0.9rem', color: 'var(--primary)' }}>
                      <Sparkles size={16} /> Tevis AI Quick TL;DR
                    </h4>
                    <ul style={{ margin: 0, paddingLeft: 20, fontSize: '0.88rem', lineHeight: 1.5 }}>
                      {aiSummary.map((bullet, idx) => (
                        <li key={idx} style={{ marginBottom: 6 }}>{bullet}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div style={{ marginBottom: 24 }}>
                    <button 
                      onClick={handleGenerateSummary}
                      disabled={isAiLoading}
                      className="wiki-ai-summary-pill"
                    >
                      {isAiLoading ? 'Summarizing...' : <><Sparkles size={14} /> Explain with Tevis AI</>}
                    </button>
                  </div>
                )}

                {/* Article Body Content */}
                <div 
                  className={`wiki-markdown-body ${textSize === 'small' ? 'text-small' : textSize === 'large' ? 'text-large' : ''}`}
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(article.body_content) }}
                />

                {/* References Block */}
                {article.external_links && article.external_links.length > 0 && (
                  <div style={{ marginTop: 40, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Globe size={18} /> References & External Links
                    </h3>
                    <ol style={{ paddingLeft: 20, fontSize: '0.88rem' }}>
                      {article.external_links.map((link: string | { label?: string; url: string }, index: number) => {
                        const url = typeof link === 'string' ? link : link.url;
                        const label = typeof link === 'string' ? link : (link.label || link.url);
                        return (
                          <li key={index} style={{ marginBottom: 6 }}>
                            <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                              {label}
                            </a>
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                )}

                {/* Category tags block at the absolute bottom */}
                <div className="wiki-categories-footer">
                  <span className="wiki-categories-label">Categories:</span>
                  <span className="wiki-category-tag">{article.category}s</span>
                  {article.infobox_data?.categories && (
                    Array.isArray(article.infobox_data.categories) 
                      ? article.infobox_data.categories.map((c: string) => <span key={c} className="wiki-category-tag">{c}</span>)
                      : <span className="wiki-category-tag">{article.infobox_data.categories}</span>
                  )}
                </div>
              </>
            )}

            {activeSubTab === 'notes' && (
              /* Community Notes Board */
              <div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'rgba(255, 215, 0, 0.05)', border: '1px dashed rgba(255, 215, 0, 0.3)', padding: 14, borderRadius: 12, marginBottom: 24 }}>
                  <ShieldAlert size={20} color="gold" />
                  <p style={{ fontSize: '0.85rem', margin: 0 }}>
                    <strong>Fact Check Board:</strong> Community Notes add context, citation corrections, or side-notes. They do not alter the main article directly. Vote on notes that are helpful!
                  </p>
                </div>

                {/* List of notes */}
                {notes.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)' }}>
                    <MessageSquare size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
                    <p style={{ fontSize: '0.9rem' }}>No community notes have been added yet.</p>
                  </div>
                ) : (
                  notes.map((note: any) => (
                    <div key={note.id} className="wiki-note-card">
                      <div className="wiki-note-header">
                        <span>Contributed by <strong>{note.author_name}</strong></span>
                        <span>{new Date(note.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="wiki-note-text">{note.note_text}</div>
                      <div className="wiki-note-footer">
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Was this note helpful?</span>
                        <div className="wiki-note-actions">
                          <button onClick={() => handleVoteNote(note.id, true)} className="wiki-vote-btn">
                            <ThumbsUp size={12} /> Useful ({note.votes_helpful || 0})
                          </button>
                          <button onClick={() => handleVoteNote(note.id, false)} className="wiki-vote-btn" style={{ marginLeft: 6 }}>
                            <ThumbsDown size={12} /> Not Useful ({note.votes_unhelpful || 0})
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}

                {/* Add note form */}
                {user ? (
                  <form onSubmit={handleAddNote} className="wiki-add-note-form">
                    <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Submit a fact-check context note</h4>
                    <textarea
                      placeholder="Provide additional details or citation updates (e.g. 'Note: the date of Janis Joplin's performance was actually...')"
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      style={{ 
                        width: '100%', 
                        minHeight: '80px', 
                        background: 'var(--bg)', 
                        border: '1px solid var(--border)', 
                        borderRadius: '8px', 
                        padding: '10px', 
                        color: 'var(--text)', 
                        outline: 'none',
                        fontSize: '0.85rem'
                      }}
                      required
                    />
                    <button 
                      type="submit" 
                      disabled={isSubmittingNote}
                      className="wiki-btn-primary" 
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: '0.85rem', width: 'fit-content', marginLeft: 'auto' }}
                    >
                      <Send size={14} /> {isSubmittingNote ? 'Submitting...' : 'Post Note'}
                    </button>
                  </form>
                ) : (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: 16 }}>
                    Please log in to submit a community note.
                  </p>
                )}
              </div>
            )}

            {activeSubTab === 'memories' && (
              /* Memories Board */
              <div className="wiki-memories-container">
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'rgba(112, 0, 244, 0.05)', border: '1px dashed rgba(112, 0, 244, 0.3)', padding: 14, borderRadius: 12, marginBottom: 24 }}>
                  <Heart size={20} color="var(--primary)" />
                  <p style={{ fontSize: '0.85rem', margin: 0 }}>
                    <strong>Memories & Stories:</strong> Share personal recollections, connections, or stories about this subject. Keep uploads historical, respectful, and locally relevant.
                  </p>
                </div>

                {/* List of Memories */}
                {isMemoriesLoading ? (
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading memories...</p>
                ) : memories.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)' }}>
                    <Heart size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
                    <p style={{ fontSize: '0.9rem' }}>No memories have been shared yet. Be the first to share one!</p>
                  </div>
                ) : (
                  <div className="wiki-memories-list">
                    {memories.map((mem: any) => {
                      const isOwnerOrAdmin = user && (user.id === mem.profile_id || user.role === 'admin');
                      const authorName = mem.profiles?.name || 'Anonymous Contributor';
                      const authorAvatar = mem.profiles?.avatar_url;

                      return (
                        <div key={mem.id} className="wiki-memory-card">
                          <div className="wiki-memory-header">
                            <div className="wiki-memory-author-info">
                              {authorAvatar ? (
                                <img src={authorAvatar} alt={authorName} className="wiki-memory-avatar" />
                              ) : (
                                <div className="wiki-memory-avatar-placeholder">
                                  {authorName.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <div className="wiki-memory-author-name">{authorName}</div>
                                <div className="wiki-memory-date">
                                  {new Date(mem.created_at).toLocaleDateString()} at {new Date(mem.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </div>
                            </div>
                            {isOwnerOrAdmin && (
                              <button 
                                type="button"
                                onClick={() => handleDeleteMemory(mem.id)} 
                                className="wiki-memory-delete-btn"
                                title="Delete Memory"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                          
                          <div className="wiki-memory-text">{mem.memory_text}</div>

                          {mem.media_url && (
                            <div className="wiki-memory-media-wrapper" onClick={() => setLightboxImage(mem.media_url)}>
                              <img src={mem.media_url} alt="User-contributed memory media" className="wiki-memory-media" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Form to submit a memory */}
                {user ? (
                  <form onSubmit={handlePostMemory} className="wiki-add-note-form" style={{ borderStyle: 'solid' }}>
                    <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Share your story or memory</h4>
                    
                    <textarea
                      placeholder="e.g. My dad worked at this shop in the summer of '75. He always told stories about..."
                      value={newMemoryText}
                      onChange={(e) => setNewMemoryText(e.target.value)}
                      style={{ 
                        width: '100%', 
                        minHeight: '100px', 
                        background: 'var(--bg)', 
                        border: '1px solid var(--border)', 
                        borderRadius: '8px', 
                        padding: '10px', 
                        color: 'var(--text)', 
                        outline: 'none',
                        fontSize: '0.85rem'
                      }}
                      required
                    />

                    {/* File Attachment Upload input */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Attach Media / Photo (Optional)
                      </label>
                      <div className="wiki-file-upload-container">
                        <label className="wiki-file-upload-label">
                          <Upload size={14} style={{ marginRight: 6 }} />
                          {newMemoryFile ? newMemoryFile.name : 'Select image/media file...'}
                          <input 
                            type="file" 
                            accept="image/*,video/*"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setNewMemoryFile(e.target.files[0]);
                              }
                            }}
                            style={{ display: 'none' }}
                          />
                        </label>
                        {newMemoryFile && (
                          <button 
                            type="button" 
                            onClick={() => setNewMemoryFile(null)} 
                            className="wiki-btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '0.75rem', borderRadius: '4px' }}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      disabled={isSubmittingMemory}
                      className="wiki-btn-primary" 
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: '0.85rem', width: 'fit-content', marginLeft: 'auto' }}
                    >
                      {isSubmittingMemory ? 'Sharing...' : <><Send size={14} /> Post Story</>}
                    </button>
                  </form>
                ) : (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: 16 }}>
                    Please log in to share a memory.
                  </p>
                )}
              </div>
            )}

            {activeSubTab === 'gallery' && (
              /* Collective Gallery */
              <div className="wiki-gallery-container">
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'rgba(6, 182, 212, 0.05)', border: '1px dashed rgba(6, 182, 212, 0.3)', padding: 14, borderRadius: 12, marginBottom: 24 }}>
                  <ImageIcon size={20} color="var(--primary)" />
                  <p style={{ fontSize: '0.85rem', margin: 0 }}>
                    <strong>Collective Historical Gallery:</strong> A collection of all historical media and images shared by the community for this entry. Click any thumbnail to expand.
                  </p>
                </div>

                {galleryMedia.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '50px 10px', color: 'var(--text-muted)' }}>
                    <ImageIcon size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
                    <p style={{ fontSize: '0.9rem' }}>No community photos have been uploaded yet.</p>
                    <p style={{ fontSize: '0.8rem', marginTop: 4 }}>Share a story in the <strong>Memories</strong> tab and attach a photo to contribute!</p>
                  </div>
                ) : (
                  <div className="wiki-gallery-grid">
                    {galleryMedia.map((mem: any) => (
                      <div 
                        key={mem.id} 
                        className="wiki-gallery-item"
                        onClick={() => setLightboxImage(mem.media_url)}
                      >
                        <img src={mem.media_url} alt={`Shared by ${mem.profiles?.name}`} className="wiki-gallery-img" />
                        <div className="wiki-gallery-overlay">
                          <span className="wiki-gallery-contributor">Shared by {mem.profiles?.name || 'Contributor'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </section>

        {/* Right Column: Infobox Sidebar */}
        <aside className="wiki-infobox-column">
          <div className="wiki-infobox">
            
            {/* Header */}
            <div className="wiki-infobox-header">
              <h3 className="wiki-infobox-title">{article.title}</h3>
              <span className="wiki-infobox-subtitle">{article.category} factsheet</span>
            </div>

            {/* Optional Image */}
            {article.infobox_data?.image_url && (
              <div className="wiki-infobox-image-wrapper">
                <img 
                  src={article.infobox_data.image_url} 
                  alt={article.title} 
                  className="wiki-infobox-image"
                />
              </div>
            )}

            {/* Key-Value table */}
            <table className="wiki-infobox-table">
              <tbody>
                {Object.entries(article.infobox_data || {}).map(([key, value]) => {
                  // Skip system/long properties
                  if (['image_url', 'location_coords', 'body_content', 'community_notes', 'external_links', 'categories'].includes(key)) return null;
                  if (value === null || value === undefined || value === '') return null;
                  
                  // Label formatting
                  const label = key
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, c => c.toUpperCase());
                  
                  // Render array or object values nicely
                  let displayValue = '';
                  if (Array.isArray(value)) {
                    displayValue = value.join(', ');
                  } else if (typeof value === 'object') {
                    displayValue = JSON.stringify(value);
                  } else {
                    if (
                      typeof value === 'string' && 
                      (key.includes('date') || key === 'founded' || key === 'closed') &&
                      value.match(/^\d{4}-\d{2}-\d{2}$/)
                    ) {
                      const [y, m, d] = value.split('-');
                      displayValue = `${m}/${d}/${y}`;
                    } else {
                      displayValue = String(value);
                    }
                  }

                  return (
                    <tr key={key} className="wiki-infobox-row">
                      <td className="wiki-infobox-label">{label}</td>
                      <td className="wiki-infobox-value">{displayValue}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Interactive location map (if coordinates exist) */}
            {coordinates && (
              <div style={{ padding: '0 12px 12px' }}>
                <div className="wiki-map-card">
                  <div className="wiki-map-preview">
                    <MapPin size={24} color="var(--primary)" />
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, marginTop: 4 }}>
                      Coords: {coordinates}
                    </span>
                    <button onClick={handleViewOnMap} className="wiki-map-view-btn">
                      <Globe size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Plot on Radar Map
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Appearance Settings Panel */}
        {isAppearanceOpen && (
          <aside className="wiki-appearance-column" style={{ overflow: 'hidden' }}>
            <div className="wiki-appearance-panel">
              <div className="wiki-appearance-title-row">
                <span className="wiki-appearance-title">Appearance</span>
                <button 
                  onClick={() => setIsAppearanceOpen(false)} 
                  className="wiki-toc-toggle-btn"
                >
                  [hide]
                </button>
              </div>

              {/* Text Size options */}
              <div className="wiki-appearance-group">
                <div className="wiki-appearance-group-title">Text Size</div>
                <div className="wiki-appearance-options">
                  <label className="wiki-appearance-label">
                    <input 
                      type="radio" 
                      name="textSize" 
                      value="small" 
                      checked={textSize === 'small'} 
                      onChange={() => setTextSize('small')} 
                    />
                    Small
                  </label>
                  <label className="wiki-appearance-label">
                    <input 
                      type="radio" 
                      name="textSize" 
                      value="standard" 
                      checked={textSize === 'standard'} 
                      onChange={() => setTextSize('standard')} 
                    />
                    Standard
                  </label>
                  <label className="wiki-appearance-label">
                    <input 
                      type="radio" 
                      name="textSize" 
                      value="large" 
                      checked={textSize === 'large'} 
                      onChange={() => setTextSize('large')} 
                    />
                    Large
                  </label>
                </div>
              </div>

              {/* Width options */}
              <div className="wiki-appearance-group">
                <div className="wiki-appearance-group-title">Page Width</div>
                <div className="wiki-appearance-options">
                  <label className="wiki-appearance-label">
                    <input 
                      type="radio" 
                      name="layoutWidth" 
                      value="standard" 
                      checked={layoutWidth === 'standard'} 
                      onChange={() => setLayoutWidth('standard')} 
                    />
                    Standard
                  </label>
                  <label className="wiki-appearance-label">
                    <input 
                      type="radio" 
                      name="layoutWidth" 
                      value="wide" 
                      checked={layoutWidth === 'wide'} 
                      onChange={() => setLayoutWidth('wide')} 
                    />
                    Wide
                  </label>
                </div>
              </div>

              {/* Color options */}
              <div className="wiki-appearance-group" style={{ marginBottom: 0 }}>
                <div className="wiki-appearance-group-title">Color Scheme</div>
                <div className="wiki-appearance-options">
                  <label className="wiki-appearance-label">
                    <input 
                      type="radio" 
                      name="colorTheme" 
                      value="auto" 
                      checked={colorTheme === 'auto'} 
                      onChange={() => setColorTheme('auto')} 
                    />
                    Automatic
                  </label>
                  <label className="wiki-appearance-label">
                    <input 
                      type="radio" 
                      name="colorTheme" 
                      value="light" 
                      checked={colorTheme === 'light'} 
                      onChange={() => setColorTheme('light')} 
                    />
                    Light Forced
                  </label>
                  <label className="wiki-appearance-label">
                    <input 
                      type="radio" 
                      name="colorTheme" 
                      value="dark" 
                      checked={colorTheme === 'dark'} 
                      onChange={() => setColorTheme('dark')} 
                    />
                    Dark Forced
                  </label>
                </div>
              </div>

            </div>
          </aside>
        )}

      </div>
      {lightboxImage && (
        <div className="wiki-lightbox" onClick={() => setLightboxImage(null)}>
          <div className="wiki-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img src={lightboxImage} alt="Expanded historical media" />
            <button className="wiki-lightbox-close" onClick={() => setLightboxImage(null)}>✕</button>
          </div>
        </div>
      )}
    </div>
  );
};
