import React, { useState, useRef, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { X, Image, Video, Loader2 } from 'lucide-react';
import { Avatar } from './Avatar';
import { supabase } from '../lib/supabase';
import { LinkPreviewCard, extractPreviewUrl } from './LinkPreviewCard';
import './CreatePostModal.css';

interface EditPostModalProps {
  post: any;
  onClose: () => void;
  user?: any;
}

export const EditPostModal: React.FC<EditPostModalProps> = ({ post, onClose, user }) => {
  const [postContent, setPostContent] = useState(post.content || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { info, warning, error: toastError, success } = useToast();
  
  // Existing media from DB
  const [existingMedia, setExistingMedia] = useState<string[]>(post.media_urls || []);
  
  // New media to add
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
    const timer = setTimeout(() => {
      setPreviewUrl(extractPreviewUrl(postContent));
    }, 600);
    return () => clearTimeout(timer);
  }, [postContent]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setMediaFiles(prev => [...prev, ...files]);
    setMediaPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeExistingMedia = (index: number) => {
    setExistingMedia(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    if (!user) { info("You must be logged in to edit."); setIsSubmitting(false); return; }

    try {
      const newMediaUrls: string[] = [...existingMedia];
      
      // Upload new files
      for (const file of mediaFiles) {
        const fileName = `${user.id}/${Date.now()}-${file.name}`;
        const { data, error: uploadError } = await supabase.storage.from('posts').upload(fileName, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('posts').getPublicUrl(data.path);
        newMediaUrls.push(publicUrl);
      }

      const { error } = await supabase.from('posts').update({ 
        content: postContent,
        media_urls: newMediaUrls,
        updated_at: new Date().toISOString()
      }).eq('id', post.id);

      if (error) throw error;
      success("Post updated successfully!");
      onClose();
    } catch (error: any) {
      console.error('Error updating post:', error);
      toastError(`Editing Error: ${error.message || "Failed to update post."}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-container redesign-modal fade-in">
        <div className="modal-tabs-row" style={{ justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Edit Post</h3>
          <button className="close-btn-minimal" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-content-scrollable">
          <div className="composer-wrapper">
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

              {previewUrl && existingMedia.length === 0 && mediaPreviews.length === 0 && (
                <LinkPreviewCard url={previewUrl} compact />
              )}

              {/* Media Previews */}
              {(existingMedia.length > 0 || mediaPreviews.length > 0) && (
                <div className="media-previews-grid">
                  {existingMedia.map((url, i) => (
                    <div key={`existing-${i}`} className="preview-item">
                      {url.match(/\.(mp4|webm|ogg)$/i) ? (
                        <video src={url} className="preview-media" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <img src={url} alt="preview" className="preview-media" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      )}
                      <button onClick={() => removeExistingMedia(i)}><X size={14} /></button>
                    </div>
                  ))}
                  {mediaPreviews.map((url, i) => (
                    <div key={`new-${i}`} className="preview-item">
                      <img src={url} alt="preview" className="preview-media" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button onClick={() => removeNewMedia(i)}><X size={14} /></button>
                    </div>
                  ))}
                </div>
              )}

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
                  <Image size={16} /> Add Media
                </button>
                <div className="spacer" />
                <button 
                  className={`submit-post-btn-minimal ${postContent.length > 0 && !isSubmitting ? 'ready' : ''}`}
                  disabled={postContent.length === 0 || isSubmitting}
                  onClick={handleSave}
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
