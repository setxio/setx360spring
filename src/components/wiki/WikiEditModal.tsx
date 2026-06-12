import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import { X, Eye, Edit, Sparkles, BookOpen, Globe } from 'lucide-react';
import './WikiStyle.css';

const TEMPLATES: Record<string, string> = {
  figure: `# Introduction
[Provide a lead paragraph: Full Name, lifetime, what they are famous for, and their legacy.]

## Early Life & Education
[Detail their birth date, location, family background, and education.]

## Career
[Detail their professional years, notable achievements, and key events.]

## Personal Life
[Detail relationships, spouse, children, hobbies, and personal interests.]

## Later Years & Death
[Detail their final years, retirement, date/cause of death if applicable.]

## Legacy & Honors
[Detail their lasting impact, memorials, awards, or things named after them.]

## See Also
- [Related Article 1]
- [Related Article 2]

## Notes / References
1. [Citation 1]
2. [Citation 2]

## Further Reading
- [Book or Article title]

## External Links
- [Official Website or digital archive]`,

  artist: `# Introduction
[Provide a lead paragraph: Name, lifetime, artist type, and their artistic legacy.]

## Early Life & Training
[Detail birth, training, influences, and early creative work.]

## Creative Periods
[Describe major periods of artistic creation, movements, or style shifts.]

## Themes & Techniques
[Detail recurring themes, mediums used, and unique artistic styles or techniques.]

## Major Works
[List or describe key works, albums, paintings, performances, etc.]

## Exhibitions
[Detail major gallery shows, concerts, or public displays.]

## Legacy
[Detail their influence on subsequent artists, awards, or historical place.]

## See Also
- [Related Artist or Movement]

## Notes / References
1. [Citation 1]
2. [Citation 2]

## Further Reading
- [Art history book or review]

## External Links
- [Official Gallery or audio stream link]`,

  sports: `# Introduction
[Provide a lead paragraph: Name, lifetime, sports played, achievements, and legacy.]

## Early Life & Education
[Detail birth, high school/college athletic career, and educational background.]

## Professional Career
[Detail their draft, professional years, teams played for, notable games, statistics.]

## Personal Life
[Detail relationships, family, and post-career endeavors.]

## Later Years & Death
[Detail retirement, final years, or cause of death if applicable.]

## Legacy & Honors
[Detail hall of fame inductions, retired numbers, or historical impact.]

## See Also
- [Related athletes or teams]

## Notes / References
1. [Citation 1]
2. [Citation 2]

## Further Reading
- [Sports biography or archive articles]

## External Links
- [Stat profiles, interviews, or athlete's official page]`,

  event: `# Introduction
[Provide a lead paragraph: Name of event, date, location, and its overall historical significance.]

## Background
[Detail conditions or events leading up to the main occurrence.]

## Prelude
[Detail immediate triggers or final preparations prior to the event.]

## Timeline
[Provide a chronological breakdown of what transpired during the event.]

## Aftermath
[Detail immediate results, casualties, economic impact, or short-term changes.]

## Legacy
[Detail long-term historical impact, commemorative markers, or historical consensus.]

## See Also
- [Related historical events or places]

## Notes / References
1. [Citation 1]
2. [Citation 2]

## Further Reading
- [Historical study or book reference]

## External Links
- [Historical archives, documentary videos, or articles]`,

  business: `# Introduction
[Provide a lead paragraph: Name of business, years active, headquarters, and what it was known for.]

## History
### Founding
[Detail who founded the business, when, and the initial startup story.]

### Expansion
[Detail growth, new locations, peak operations, and key business milestones.]

### Modern Era
[If applicable, detail later years, mergers, or final years before closing.]

## Products & Services
[Detail the primary goods, services, or innovations offered.]

## Corporate Affairs
[Detail headquarters, key leadership, company culture, or community involvement.]

## Controversies
[Detail any legal challenges, disputes, or major setbacks if applicable.]

## See Also
- [Related local companies or industries]

## Notes / References
1. [Citation 1]
2. [Citation 2]

## Further Reading
- [Local historical business articles or records]

## External Links
- [Historical photographs, directory listings, or archives]`
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  article?: any; // Undefined if creating new
  user: any;
}

export const WikiEditModal: React.FC<Props> = ({ isOpen, onClose, article, user }) => {
  const { success, error: toastError } = useToast();
  
  // Basic article info
  const [title, setTitle] = useState(article?.title || '');
  const [category, setCategory] = useState(article?.category || 'figure');
  const [bodyContent, setBodyContent] = useState(article?.body_content || '');
  
  // Infobox state fields
  const [imageUrl, setImageUrl] = useState(article?.infobox_data?.image_url || '');
  const [externalLinksText, setExternalLinksText] = useState(
    article?.external_links ? (
      Array.isArray(article.external_links)
        ? article.external_links.map((l: any) => typeof l === 'string' ? l : l.url).join(', ')
        : ''
    ) : ''
  );

  const [categoryTagsText, setCategoryTagsText] = useState(
    article?.infobox_data?.categories ? (
      Array.isArray(article.infobox_data.categories)
        ? article.infobox_data.categories.join(', ')
        : String(article.infobox_data.categories)
    ) : ''
  );
  
  // Pre-populate template on category change (only if bodyContent is empty or matches another template)
  useEffect(() => {
    if (!article) {
      const trimmedBody = bodyContent.trim();
      const isDefault = !trimmedBody || Object.values(TEMPLATES).some(template => template.trim() === trimmedBody);
      if (isDefault) {
        setBodyContent(TEMPLATES[category] || '');
      }
    }
  }, [category, article]);

  
  // Category-specific infobox state
  const [birthDate, setBirthDate] = useState(article?.infobox_data?.birth_date || '');
  const [deathDate, setDeathDate] = useState(article?.infobox_data?.death_date || '');
  const [era, setEra] = useState(article?.infobox_data?.era || '');
  const [profession, setProfession] = useState(article?.infobox_data?.profession || '');
  
  // Artists
  const [genres, setGenres] = useState(
    article?.infobox_data?.genres ? (Array.isArray(article.infobox_data.genres) ? article.infobox_data.genres.join(', ') : String(article.infobox_data.genres)) : ''
  );
  
  // Sports
  const [sports, setSports] = useState(
    article?.infobox_data?.sports ? (Array.isArray(article.infobox_data.sports) ? article.infobox_data.sports.join(', ') : String(article.infobox_data.sports)) : ''
  );
  
  // Events
  const [eventDate, setEventDate] = useState(article?.infobox_data?.event_date || '');
  const [locationCoords, setLocationCoords] = useState(article?.infobox_data?.location_coords || '');
  const [impactRating, setImpactRating] = useState<number>(article?.infobox_data?.impact_rating || 50);

  // Business
  const [founded, setFounded] = useState(article?.infobox_data?.founded || '');
  const [closed, setClosed] = useState(article?.infobox_data?.closed || '');
  const [founder, setFounder] = useState(article?.infobox_data?.founder || '');
  const [locationText, setLocationText] = useState(article?.infobox_data?.location || '');

  // Tab: editor vs preview
  const [activeSubTab, setActiveSubTab] = useState<'write' | 'preview'>('write');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Parse markdown client side for live preview
  const renderLiveMarkdown = (markdown: string) => {
    if (!markdown) return '<p style="color:var(--text-muted)">Write some markdown content to preview it...</p>';
    let html = markdown
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    html = html.replace(/^&gt;\s+(.*)$/gm, '<blockquote>$1</blockquote>');
    
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    
    html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
    html = html.replace(/_(.*?)_/g, '<em>$1</em>');

    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    html = html.replace(/^\s*-\s+(.*)$/gm, '<li>$1</li>');
    html = html.replace(/^\s*\*\s+(.*)$/gm, '<li>$1</li>');
    html = html.replace(/\n\s*\n/g, '</p><p>');
    html = '<p>' + html + '</p>';

    html = html.replace(/<p>\s*<\/p>/g, '');
    html = html.replace(/<p><h3>/g, '<h3>').replace(/<\/h3><\/p>/g, '</h3>');
    html = html.replace(/<p><h2>/g, '<h2>').replace(/<\/h2><\/p>/g, '</h2>');
    html = html.replace(/<p><h1>/g, '<h1>').replace(/<\/h1><\/p>/g, '</h1>');
    html = html.replace(/<p><blockquote>/g, '<blockquote>').replace(/<\/blockquote><\/p>/g, '</blockquote>');

    return html;
  };

  const handleProposeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !bodyContent.trim()) {
      toastError('Please provide a title and article body content.');
      return;
    }

    if (!user) {
      toastError('You must be logged in to propose wiki edits.');
      return;
    }

    setIsSubmitting(true);

    // Assemble infobox_data
    const infobox: Record<string, any> = { image_url: imageUrl };
    
    if (category === 'figure' || category === 'artist' || category === 'sports') {
      if (birthDate) infobox.birth_date = birthDate;
      if (deathDate) infobox.death_date = deathDate;
      if (era) infobox.era = era;
      if (profession) infobox.profession = profession;
      
      if (category === 'artist' && genres) {
        infobox.genres = genres.split(',').map(s => s.trim());
      }
      if (category === 'sports' && sports) {
        infobox.sports = sports.split(',').map(s => s.trim());
      }
    } else if (category === 'event') {
      if (eventDate) infobox.event_date = eventDate;
      if (locationCoords) infobox.location_coords = locationCoords;
      infobox.impact_rating = impactRating;
    } else if (category === 'business') {
      if (founded) infobox.founded = founded;
      if (closed) infobox.closed = closed;
      if (founder) infobox.founder = founder;
      if (locationText) infobox.location = locationText;
    }

    // Assemble categories
    if (categoryTagsText) {
      infobox.categories = categoryTagsText.split(',').map(s => s.trim()).filter(Boolean);
    } else {
      infobox.categories = [];
    }

    // Assemble external_links
    const externalLinksList = externalLinksText
      .split(',')
      .map(s => s.trim())
      .filter(s => s.startsWith('http://') || s.startsWith('https://'));

    const slug = article?.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    try {
      const { error } = await supabase
        .from('wiki_edits')
        .insert({
          article_id: article?.id || null,
          proposed_by: user.id,
          category,
          title: title.trim(),
          slug,
          body_content: bodyContent,
          infobox_data: infobox,
          external_links: externalLinksList,
          status: 'pending'
        });

      if (error) throw error;

      success('Edit proposal submitted! Admin review is pending.');
      onClose();
    } catch (err) {
      console.error(err);
      toastError('Failed to submit edit proposal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(10px)',
      zIndex: 2500,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="glass" style={{
        width: '100%',
        maxWidth: '1000px',
        height: '90vh',
        borderRadius: '24px',
        border: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: 'var(--shadow)',
        background: 'var(--bg-soft)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
            {article ? `Propose Edit for "${article.title}"` : 'Propose New Wiki Article'}
          </h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text)', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          <form onSubmit={handleProposeSubmit}>
            {/* Row 1: Title & Category */}
            <div className="wiki-editor-fields-group">
              <div className="wiki-input-group">
                <label>Article Title</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="e.g. Spindletop Gusher"
                  disabled={!!article} // Cannot rename existing article slug easily
                  required 
                />
              </div>
              <div className="wiki-input-group">
                <label>Category</label>
                <select 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={!!article}
                >
                  <option value="figure">Important Figure</option>
                  <option value="artist">Musician / Artist</option>
                  <option value="sports">Sports Figure</option>
                  <option value="event">Historical Event</option>
                  <option value="business">Defunct Business</option>
                </select>
              </div>
            </div>

            {/* Row 2: General Metadata */}
            <div className="wiki-editor-fields-group">
              <div className="wiki-input-group">
                <label>Infobox Image URL</label>
                <input 
                  type="url" 
                  value={imageUrl} 
                  onChange={(e) => setImageUrl(e.target.value)} 
                  placeholder="https://example.com/photo.jpg" 
                />
              </div>
              <div className="wiki-input-group">
                <label>References (Comma Separated URLs)</label>
                <input 
                  type="text" 
                  value={externalLinksText} 
                  onChange={(e) => setExternalLinksText(e.target.value)} 
                  placeholder="https://wikipedia.org/wiki/Page, https://tshaonline.org" 
                />
              </div>
            </div>

            {/* Row 2.5: Category Tags */}
            <div className="wiki-editor-fields-group">
              <div className="wiki-input-group" style={{ gridColumn: 'span 2' }}>
                <label>Category Tags (Comma Separated)</label>
                <input 
                  type="text" 
                  value={categoryTagsText} 
                  onChange={(e) => setCategoryTagsText(e.target.value)} 
                  placeholder="e.g. Historic Sites, Local Industry, Beaumont, Music" 
                />
              </div>
            </div>

            {/* Row 3: Category-Specific Metadata Fields */}
            <div style={{ 
              background: 'rgba(255,255,255,0.02)', 
              border: '1px solid var(--border)', 
              borderRadius: '12px', 
              padding: '16px', 
              marginBottom: '24px' 
            }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Infobox Fields ({category})
              </h4>
              
              {/* Figure/Artist/Sports fields */}
              {(category === 'figure' || category === 'artist' || category === 'sports') && (
                <div className="wiki-editor-fields-group" style={{ marginBottom: 0 }}>
                  <div className="wiki-input-group">
                    <label>Birth Date</label>
                    <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
                  </div>
                  <div className="wiki-input-group">
                    <label>Death Date (Leave blank if living)</label>
                    <input type="date" value={deathDate} onChange={(e) => setDeathDate(e.target.value)} />
                  </div>
                  <div className="wiki-input-group" style={{ marginTop: 12 }}>
                    <label>Era / Years Active</label>
                    <input type="text" value={era} onChange={(e) => setEra(e.target.value)} placeholder="e.g. 1950s-1970s" />
                  </div>
                  <div className="wiki-input-group" style={{ marginTop: 12 }}>
                    <label>Profession</label>
                    <input type="text" value={profession} onChange={(e) => setProfession(e.target.value)} placeholder="e.g. Athlete, Vocalist" />
                  </div>
                  
                  {category === 'artist' && (
                    <div className="wiki-input-group" style={{ gridColumn: 'span 2', marginTop: 12 }}>
                      <label>Genres (Comma separated)</label>
                      <input type="text" value={genres} onChange={(e) => setGenres(e.target.value)} placeholder="e.g. Country, Rockabilly" />
                    </div>
                  )}
                  {category === 'sports' && (
                    <div className="wiki-input-group" style={{ gridColumn: 'span 2', marginTop: 12 }}>
                      <label>Sports Played (Comma separated)</label>
                      <input type="text" value={sports} onChange={(e) => setSports(e.target.value)} placeholder="e.g. Football, Golf" />
                    </div>
                  )}
                </div>
              )}

              {/* Event fields */}
              {category === 'event' && (
                <div className="wiki-editor-fields-group" style={{ marginBottom: 0 }}>
                  <div className="wiki-input-group">
                    <label>Event Date</label>
                    <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
                  </div>
                  <div className="wiki-input-group">
                    <label>Location Coordinates (lat,long)</label>
                    <input type="text" value={locationCoords} onChange={(e) => setLocationCoords(e.target.value)} placeholder="e.g. 30.0860,-94.1015" />
                  </div>
                  <div className="wiki-input-group" style={{ gridColumn: 'span 2', marginTop: 12 }}>
                    <label>Historical Impact Rating ({impactRating}/100)</label>
                    <input 
                      type="range" 
                      min="1" 
                      max="100" 
                      value={impactRating} 
                      onChange={(e) => setImpactRating(parseInt(e.target.value))} 
                      style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
                    />
                  </div>
                </div>
              )}

              {/* Defunct Business fields */}
              {category === 'business' && (
                <div className="wiki-editor-fields-group" style={{ marginBottom: 0 }}>
                  <div className="wiki-input-group">
                    <label>Founded Year</label>
                    <input type="text" value={founded} onChange={(e) => setFounded(e.target.value)} placeholder="e.g. 1920" />
                  </div>
                  <div className="wiki-input-group">
                    <label>Closed Year</label>
                    <input type="text" value={closed} onChange={(e) => setClosed(e.target.value)} placeholder="e.g. 1985" />
                  </div>
                  <div className="wiki-input-group" style={{ marginTop: 12 }}>
                    <label>Founder(s)</label>
                    <input type="text" value={founder} onChange={(e) => setFounder(e.target.value)} placeholder="e.g. John Sanger" />
                  </div>
                  <div className="wiki-input-group" style={{ marginTop: 12 }}>
                    <label>Original Location</label>
                    <input type="text" value={locationText} onChange={(e) => setLocationText(e.target.value)} placeholder="e.g. Pearl St, Beaumont" />
                  </div>
                </div>
              )}
            </div>

            {/* Markdown source text area */}
            <div style={{ display: 'flex', gap: 16, borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
              <button 
                type="button"
                className={`wiki-tab-btn ${activeSubTab === 'write' ? 'active' : ''}`}
                onClick={() => setActiveSubTab('write')}
              >
                <Edit size={16} /> Edit Source (Markdown)
              </button>
              <button 
                type="button"
                className={`wiki-tab-btn ${activeSubTab === 'preview' ? 'active' : ''}`}
                onClick={() => setActiveSubTab('preview')}
              >
                <Eye size={16} /> Live Preview
              </button>
            </div>

            {activeSubTab === 'write' ? (
              <div className="wiki-input-group">
                <textarea
                  className="wiki-editor-textarea"
                  value={bodyContent}
                  onChange={(e) => setBodyContent(e.target.value)}
                  placeholder="# Early Life&#10;Write markdown articles here...&#10;&#10;## Key Accomplishments&#10;- Bullet point one&#10;- Bullet point two"
                  required
                />
              </div>
            ) : (
              <div className="wiki-preview-pane wiki-markdown-body" dangerouslySetInnerHTML={{ __html: renderLiveMarkdown(bodyContent) }} />
            )}

            {/* Footer buttons */}
            <div className="wiki-form-actions">
              <button type="button" onClick={onClose} className="wiki-btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting} className="wiki-btn-primary">
                {isSubmitting ? 'Submitting proposal...' : 'Propose Changes'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};
