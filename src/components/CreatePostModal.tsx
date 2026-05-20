import React, { useState, useRef, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { X, Image, Video, BarChart2, Loader2, ChevronDown, Plus } from 'lucide-react';
import { Avatar } from './Avatar';
import { supabase } from '../lib/supabase';
import { LinkPreviewCard, extractPreviewUrl } from './LinkPreviewCard';
import './CreatePostModal.css';
import './CreatePostModalMeta.css';

interface CreatePostModalProps {
  onClose: () => void;
  user?: any;
  activeCategory?: string;
  groupId?: string;
  currentScope?: 'national' | 'state' | 'county' | 'city';
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({ 
  onClose, 
  user, 
  activeCategory = 'Everybody', 
  groupId,
  currentScope = 'national' 
}) => {
  const [postContent, setPostContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { info, warning, error: toastError } = useToast();
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [location] = useState(user?.community || '');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // New State for Redesign
  const [selectedTab, setSelectedTab] = useState<'post' | 'poll'>('post');
  const [targetFeed, setTargetFeed] = useState(groupId ? 'Groups' : (activeCategory === 'Hot' ? 'Everybody' : activeCategory));
  const [faithType, setFaithType] = useState('post');
  const [userGroups, setUserGroups] = useState<any[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>(groupId || '');
  const [isNsfw, setIsNsfw] = useState(false);
  const [tags, setTags] = useState('');
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      fetchUserGroups();
    }
  }, [user]);

  const fetchUserGroups = async () => {
    const { data, error } = await supabase
      .from('group_members')
      .select('group_id, groups(id, name)')
      .eq('profile_id', user.id);
    
    if (data && !error) {
      const groups = data.map((m: any) => m.groups);
      setUserGroups(groups);
      if (groups.length > 0) {
        setSelectedGroupId(groups[0].id);
      }
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
    // Debounce URL detection — wait 600ms after typing stops
    const timer = setTimeout(() => {
      setPreviewUrl(extractPreviewUrl(postContent));
    }, 600);
    return () => clearTimeout(timer);
  }, [postContent]);

  const feedOptions = [
    'Everybody', 'Following', 'Groups', 'News', 'Events', 'Faith', 'Official', 'Shopping', 'Services', 'Non Profit'
  ];

  const faithOptions = [
    { id: 'post', label: 'General Post', icon: '✨' },
    { id: 'prayer_request', label: 'Prayer Request', icon: '🙏' },
    { id: 'testament', label: 'Testament', icon: '✨' },
    { id: 'bible_question', label: 'Bible Question', icon: '📖' },
    { id: 'event', label: 'Church Event', icon: '⛪' }
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setMediaFiles(prev => [...prev, ...files]);
    setMediaPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handlePost = async () => {
    setIsSubmitting(true);
    if (!user) { info("You must be logged in to post."); setIsSubmitting(false); return; }

    try {
      const mediaUrls: string[] = [];
      for (const file of mediaFiles) {
        const fileName = `${user.id}/${Date.now()}-${file.name}`;
        const { data, error: uploadError } = await supabase.storage.from('posts').upload(fileName, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('posts').getPublicUrl(data.path);
        mediaUrls.push(publicUrl);
      }

      // Detect YouTube URL
      const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:shorts\/|live\/|embed\/|v\/|watch\?v=|watch\?.+&v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
      const hasYoutube = youtubeRegex.test(postContent);

      const pollData = selectedTab === 'poll' ? {
        options: pollOptions.filter(opt => opt.trim() !== '').map(opt => ({ text: opt, votes: 0 })),
        total_votes: 0
      } : null;

      // Map dynamic types
      let finalType = 'post';
      if (selectedTab === 'poll') finalType = 'poll';
      else if (hasYoutube) finalType = 'video';
      else if (targetFeed === 'Faith') finalType = faithType;
      else if (targetFeed === 'Shopping') finalType = 'sale';
      else if (targetFeed === 'News') finalType = 'news';
      else if (targetFeed === 'Events') finalType = 'event';

      // Role-based validation
      if (targetFeed === 'News' && !['admin', 'media', 'v_media'].includes(user.role)) {
        warning("News posts are restricted to verified Media accounts.");
        setIsSubmitting(false);
        return;
      }
      if (targetFeed === 'Official' && !['admin', 'official', 'v_official'].includes(user.role)) {
        warning("Official posts are restricted to verified Official accounts.");
        setIsSubmitting(false);
        return;
      }
      if (targetFeed === 'Groups' && userGroups.length === 0) {
        info("You must be a member of a group to post in the Groups feed.");
        setIsSubmitting(false);
        return;
      }

      const { error } = await supabase.from('posts').insert([{ 
        profile_id: user.id,
        content: postContent,
        type: finalType,
        category: targetFeed,
        media_urls: mediaUrls,
        poll_data: pollData,
        location: location || user?.community,
        visibility_scope: currentScope === 'national' ? 'national' : currentScope,
        group_id: targetFeed === 'Groups' ? selectedGroupId : null,
        is_nsfw: isNsfw,
        tags: tags.split(',').map(t => t.trim()).filter(t => t.length > 0)
      }]);

      if (error) throw error;
      onClose();
    } catch (error: any) {
      console.error('CRITICAL: Error creating post:', error);
      
      let errorMsg = error.message || "Failed to create post.";
      if (errorMsg.includes('profiles')) {
        errorMsg = "Profile relationship error: " + errorMsg + "\nPlease ensure the 'profiles' table schema is up to date.";
      }
      
      toastError(`Posting Error: ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-container redesign-modal fade-in">
        {/* Top Tabs */}
        <div className="modal-tabs-row">
          <button 
            className={`modal-tab ${selectedTab === 'post' ? 'active' : ''}`}
            onClick={() => setSelectedTab('post')}
          >
            <Image size={18} /> Post
          </button>
          <button 
            className={`modal-tab ${selectedTab === 'poll' ? 'active' : ''}`}
            onClick={() => setSelectedTab('poll')}
          >
            <BarChart2 size={18} /> Poll
          </button>
          <button className="close-btn-minimal" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-content-scrollable">
          <div className="composer-wrapper">
            <div className="composer-header">
              <Avatar url={user?.avatar_url} name={user?.name} size={48} />
              <div className="header-controls">
                <div className="control-row">
                  <div className="community-chip">
                    {location || 'Local'}
                  </div>
                  <div className="dropdown-wrapper">
                    <select 
                      value={targetFeed} 
                      onChange={(e) => setTargetFeed(e.target.value)}
                      className="category-select"
                    >
                      {feedOptions.map(opt => {
                        let isRestricted = false;
                        if (opt === 'News' && !['admin', 'media', 'v_media'].includes(user?.role)) isRestricted = true;
                        if (opt === 'Official' && !['admin', 'official', 'v_official'].includes(user?.role)) isRestricted = true;
                        if (opt === 'Groups' && userGroups.length === 0) isRestricted = true;
                        
                        return (
                          <option key={opt} value={opt}>
                            {opt} {isRestricted ? '🔒' : ''}
                          </option>
                        );
                      })}
                    </select>
                    <ChevronDown size={14} className="dropdown-arrow" />
                  </div>
                </div>
                
                {targetFeed === 'Groups' && userGroups.length > 0 && (
                  <div className="group-segment animate-in">
                    <span className="segment-label">POST TO GROUP:</span>
                    <div className="dropdown-wrapper">
                      <select 
                        value={selectedGroupId} 
                        onChange={(e) => setSelectedGroupId(e.target.value)}
                        className="group-select"
                      >
                        {userGroups.map(g => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="dropdown-arrow" />
                    </div>
                  </div>
                )}

                {targetFeed === 'Faith' && (
                  <div className="faith-segment animate-in">
                    <span className="segment-label">FAITH CONTENT:</span>
                    <div className="dropdown-wrapper">
                      <select 
                        value={faithType} 
                        onChange={(e) => setFaithType(e.target.value)}
                        className="faith-select"
                      >
                        {faithOptions.map(opt => (
                          <option key={opt.id} value={opt.id}>{opt.icon} {opt.label}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="dropdown-arrow" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="input-field-container">
              <textarea
                ref={textareaRef}
                className="post-textarea-redesign"
                placeholder="What's on your mind?"
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                autoFocus
                disabled={isSubmitting}
              />

              {/* Link Preview */}
              {previewUrl && selectedTab === 'post' && mediaPreviews.length === 0 && (
                <LinkPreviewCard url={previewUrl} compact />
              )}

              {/* Poll Interface integrated into body */}
              {selectedTab === 'poll' && (
                <div className="poll-editor-embedded">
                  {pollOptions.map((opt, i) => (
                    <div key={i} className="poll-option-input-wrapper">
                      <input 
                        type="text" 
                        placeholder={`Option ${i + 1}`}
                        value={opt}
                        onChange={(e) => {
                          const next = [...pollOptions];
                          next[i] = e.target.value;
                          setPollOptions(next);
                        }}
                      />
                    </div>
                  ))}
                  {pollOptions.length < 4 && (
                    <button className="add-option-btn-minimal" onClick={() => setPollOptions([...pollOptions, ''])}>
                      <Plus size={14} /> Add option
                    </button>
                  )}
                </div>
              )}

              {/* Media Previews */}
              {mediaPreviews.length > 0 && (
                <div className="media-previews-grid">
                  {mediaPreviews.map((url, i) => (
                    <div key={i} className="preview-item">
                      <img src={url} alt="preview" />
                      <button onClick={() => removeMedia(i)}><X size={14} /></button>
                    </div>
                  ))}
                </div>
              )}

              {/* Meta Inputs (NSFW & Tags) */}
              <div className="composer-meta-inputs">
                <label className="nsfw-toggle">
                  <input 
                    type="checkbox" 
                    checked={isNsfw} 
                    onChange={(e) => setIsNsfw(e.target.checked)} 
                  />
                  <span>Mark as NSFW</span>
                </label>
                <div className="tags-input-wrapper">
                  <input 
                    type="text" 
                    placeholder="Add tags (comma separated)" 
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                  />
                </div>
              </div>

              {/* Action Chips */}
              <div className="composer-chips-row">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileSelect} 
                  multiple 
                  accept="image/*,video/*" 
                  style={{ display: 'none' }} 
                />
                <button className="action-chip" onClick={() => fileInputRef.current?.click()}>
                  <Image size={16} /> Photo
                </button>
                <button className="action-chip" onClick={() => fileInputRef.current?.click()}>
                  <Video size={16} /> Video
                </button>
                <div className="spacer" />
                <button 
                  className={`submit-post-btn-minimal ${postContent.length > 0 && !isSubmitting ? 'ready' : ''}`}
                  disabled={postContent.length === 0 || isSubmitting}
                  onClick={handlePost}
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Post'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
