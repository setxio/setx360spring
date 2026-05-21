import React, { useState } from 'react';
import { useToast } from '../context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { Plus, Loader2, MapPin, TrendingUp, Rss } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';
import { FeedFilters } from './FeedFilters';
import { RepostModal } from './RepostModal';
import { CreatePostModal } from './CreatePostModal';
import { AdCreationModal } from './AdCreationModal';
import { PostCard } from './PostCard';
import { AdCard } from './AdCard';
import { EmptyState } from './EmptyState';
import { supabase } from '../lib/supabase';
import { useSocialFeedData } from '../hooks/useSocialFeedData';
import './SocialFeed.css';

interface SocialFeedProps {
  showFilters?: boolean;
  showFAB?: boolean;
  user?: any;
  filterUserId?: string;
  filterGroupId?: string;
  scope?: 'national' | 'state' | 'county' | 'city';
  onNavigateToPost?: (postId: string, commentId?: string) => void;
  onNavigateToProfile?: (profileId: string) => void;
}

export const SocialFeed: React.FC<SocialFeedProps> = ({ 
  showFilters = true, 
  showFAB = true, 
  user, 
  filterUserId, 
  filterGroupId,
  scope = 'national',
  onNavigateToPost,
  onNavigateToProfile
}) => {
  const { theme } = useApp();
  const [activeCategory, setActiveCategory] = useState('Hot');
  const [activeType, setActiveType] = useState('all');
  const [isPosting, setIsPosting] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false);
  const [repostTarget, setRepostTarget] = useState<any>(null);
  const [userVotes, setUserVotes] = useState<Record<string, number>>({});
  const { success, error: toastError, info, warning } = useToast();
  const [userPollVotes, setUserPollVotes] = useState<Record<string, number>>({});
  const [userBookmarks, setUserBookmarks] = useState<Set<string>>(new Set());


  const calculateAge = (m: number, d: number, y: number) => {
    if (!m || !d || !y) return 0;
    const today = new Date();
    const birthDate = new Date(y, m - 1, d);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const { data: feedData, isLoading, refetch: refetchFeed } = useSocialFeedData(
    user,
    filterUserId,
    filterGroupId,
    scope,
    activeCategory,
    activeType,
    theme
  );

  const posts: any[] = feedData?.posts ?? [];
  const ads: any[] = feedData?.ads ?? [];
  const trendingTopics: any[] = feedData?.trending ?? [];
  const escalatedScope: string | null = feedData?.escalatedScope ?? null;
  const hasActiveAlert: boolean = feedData?.hasActiveAlert ?? false;

  // Sync per-user interaction state from cached query result
  React.useEffect(() => {
    if (feedData?.userVotes) setUserVotes(feedData.userVotes);
    if (feedData?.userPollVotes) setUserPollVotes(feedData.userPollVotes);
    if (feedData?.userBookmarks) setUserBookmarks(new Set(feedData.userBookmarks));
  }, [feedData]);

  // handleLike is removed in favor of VoteButtons component logic


  const handleRepost = (originalPost: any) => {
    if (!user) return info("Please log in to repost.");
    setRepostTarget(originalPost);
  };

  const handleRepostSuccess = () => {
    setRepostTarget(null);
    // Show a subtle toast
    const toastEl = document.createElement('div');
    toastEl.textContent = '✓ Shared to your timeline';
    Object.assign(toastEl.style, {
      position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)',
      background: 'var(--primary)', color: '#fff', padding: '10px 20px',
      borderRadius: '24px', fontSize: '0.9rem', fontWeight: '600',
      zIndex: '9999', boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      animation: 'fadeInUp 0.3s ease'
    });
    document.body.appendChild(toastEl);
    setTimeout(() => toastEl.remove(), 2500);
    refetchFeed();
  };

  const handleDelete = async (postId: string) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (error) {
      console.error("Failed to delete post:", error);
      toastError("Failed to delete post.");
    } else {
      refetchFeed();
    }
  };

  const handleShare = async (postId: string) => {
    const shareData = {
      title: 'Check out this post on SETX 360',
      text: 'Found something interesting on SETX 360!',
      url: `${window.location.origin}/?post=${postId}`
    };

    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error("Share failed", err);
        }
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(shareData.url);
        success("Link copied to clipboard!");
      } catch (err) {
        console.error("Failed to copy link:", err);
      }
    }
  };

  const handlePollVote = async (post: any, optionIndex: number) => {
    if (!user) return info("Please sign in to vote.");
    
    // Call the RPC for atomic vote handling
    const { data: newPollData, error } = await supabase.rpc('cast_poll_vote', {
      p_post_id: post.id,
      p_option_index: optionIndex
    });

    if (error) {
      console.error("Poll vote failed", error);
      return toastError("Failed to cast vote.");
    }

    // Update optimistic local state
    setUserPollVotes(prev => ({ ...prev, [post.id]: optionIndex }));
    // Refetch to get updated poll counts from DB
    refetchFeed();
  };

  const handleToggleBookmark = async (postId: string) => {
    if (!user) return info("Please sign in to save posts.");

    const isBookmarked = userBookmarks.has(postId);
    
    if (isBookmarked) {
      // Unsave
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('profile_id', user.id)
        .eq('post_id', postId);
      
      if (!error) {
        setUserBookmarks(prev => {
          const next = new Set(prev);
          next.delete(postId);
          return next;
        });
      }
    } else {
      // Save
      const { error } = await supabase
        .from('bookmarks')
        .insert({
          profile_id: user.id,
          post_id: postId
        });
      
      if (!error) {
        setUserBookmarks(prev => {
          const next = new Set(prev);
          next.add(postId);
          return next;
        });
      }
    }
  };

  const renderFeedContent = () => {
    const feedItems: React.ReactNode[] = [];
    let adIndex = 0;

    posts.forEach((post, index) => {
      const contentPost = post.type === 'repost' && post.original_post ? post.original_post : post;
      
      feedItems.push(
        <PostCard
          key={`post-${post.id}`}
          post={post}
          user={user}
          userVote={userVotes[contentPost.id]}
          userPollVote={userPollVotes[contentPost.id]}
          isBookmarked={userBookmarks.has(contentPost.id)}
          onPollVote={handlePollVote}
          onToggleBookmark={handleToggleBookmark}
          onDelete={handleDelete}
          onRepost={() => handleRepost(contentPost)}
          onShare={handleShare}
          onNavigateToPost={onNavigateToPost}
          onNavigateToProfile={onNavigateToProfile}
        />
      );

      // Inject Ad every 5th post (Persistent Slotting)
      if ((index + 1) % 5 === 0) {
        if (ads.length > 0) {
          const ad = ads[adIndex % ads.length];
          feedItems.push(
            <AdCard 
              key={`ad-${ad.id}-${index}`} 
              ad={ad} 
              onPromote={() => setIsPromoting(true)} 
            />
          );
          adIndex++;
        } else {
          // Injection placeholder if no ads available
          feedItems.push(
            <AdCard 
              key={`ad-placeholder-${index}`} 
              isPlaceholder={true} 
              onPromote={() => setIsPromoting(true)} 
              user={user} 
            />
          );
        }
      }
    });

    return feedItems;
  };

  return (
    <div className="social-feed">
      {showFilters && (
        <FeedFilters 
          activeCategory={activeCategory} 
          onCategoryChange={setActiveCategory}
          hasActiveAlert={hasActiveAlert}
          userRole={user?.role}
          activeType={activeType}
          onTypeChange={setActiveType}
        />
      )}
      
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}
          >
            <Loader2 className="animate-spin" size={32} color="var(--primary)" />
          </motion.div>
        ) : posts.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <EmptyState 
              icon={Rss}
              title="The Feed is Quiet"
              message={`No posts found in this ${scope} yet. Be the first to start the conversation!`}
              action={{
                label: "Create Post",
                onClick: () => setIsPosting(true)
              }}
            />
          </motion.div>
        ) : (
          <motion.div 
            key={activeCategory}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            <>
              {/* Trending Bar — shows AI-detected hot topics in user's community */}
              {trendingTopics.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', padding: '0 0 12px', scrollbarWidth: 'none' }}>
                  <TrendingUp size={14} color="#f59e0b" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: 700, flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Trending</span>
                  {trendingTopics.map(t => (
                    <button
                      key={t.topic}
                      onClick={() => setActiveCategory('AI Picks')}
                      title={`Filter to ${t.topic.replace(/_/g, ' ')} posts`}
                      style={{ whiteSpace: 'nowrap', fontSize: '0.72rem', padding: '3px 10px', borderRadius: '12px', background: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontWeight: 600, flexShrink: 0, border: '1px solid rgba(245,158,11,0.3)', cursor: 'pointer', transition: 'all 0.15s ease' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(245,158,11,0.3)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(245,158,11,0.15)')}
                    >
                      {t.topic.replace(/_/g, ' ')} · {t.post_count}
                    </button>
                  ))}
                </div>
              )}
              {escalatedScope && (
                <div style={{
                  padding: '10px 16px',
                  marginBottom: '12px',
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(157,0,255,0.08))',
                  border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.82rem',
                  color: 'var(--text-muted)',
                  fontWeight: 500
                }}>
                  <MapPin size={14} color="var(--primary)" />
                  <span>Expanded to <strong style={{ color: 'var(--primary)' }}>{escalatedScope}</strong> — not enough local posts yet</span>
                </div>
              )}
              {renderFeedContent()}
            </>
          </motion.div>
        )}
      </AnimatePresence>
      
      {showFAB && (
        <>
          <div className="fab-group">
            <button className="social-fab" onClick={() => setIsPosting(true)}>
              <Plus size={28} />
            </button>
          </div>

          {isPosting && (
            <CreatePostModal 
              user={user}
              activeCategory={activeCategory}
              currentScope={scope}
              onClose={() => {
                setIsPosting(false);
                refetchFeed();
              }} 
            />
          )}

          {isPromoting && (
            <AdCreationModal 
              onClose={() => {
                setIsPromoting(false);
                refetchFeed();
              }} 
            />
          )}

          {repostTarget && (
            <RepostModal 
              post={repostTarget}
              user={user}
              onClose={() => setRepostTarget(null)}
              onSuccess={handleRepostSuccess}
            />
          )}
        </>
      )}
    </div>
  );
};
