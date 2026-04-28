import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import './VoteButtons.css';

interface VoteButtonsProps {
  post: any;
  user: any;
}

export const VoteButtons: React.FC<VoteButtonsProps> = ({ post, user }) => {
  const [userVote, setUserVote] = useState<number | null>(post.user_vote || null);
  const [upvotes, setUpvotes] = useState(post.upvote_count || 0);
  const [downvotes, setDownvotes] = useState(post.downvote_count || 0);
  const [loading, setLoading] = useState(false);

  const handleVote = async (type: 1 | -1) => {
    if (!user) return;
    if (loading) return;

    setLoading(true);
    const originalVote = userVote;
    const newVote = userVote === type ? null : type;

    // Optimistic Update
    setUserVote(newVote);
    
    // Update Counts Optimistically
    if (originalVote === 1) setUpvotes((prev: number) => prev - 1);
    if (originalVote === -1) setDownvotes((prev: number) => prev - 1);
    
    if (newVote === 1) setUpvotes((prev: number) => prev + 1);
    if (newVote === -1) setDownvotes((prev: number) => prev + 1);

    try {
      if (newVote === null) {
        await supabase
          .from('post_votes')
          .delete()
          .match({ post_id: post.id, user_id: user.id });
      } else {
        await supabase
          .from('post_votes')
          .upsert({
            post_id: post.id,
            user_id: user.id,
            vote_type: newVote
          });
      }
    } catch (error) {
      console.error('Error voting:', error);
      setUserVote(originalVote);
    } finally {
      setLoading(false);
    }
  };

  const aggregateScore = upvotes - downvotes;

  return (
    <div className="vote-buttons glass">
      <motion.button 
        whileTap={{ scale: 0.8 }}
        whileHover={{ scale: 1.1 }}
        className={`vote-btn up ${userVote === 1 ? 'active' : ''}`}
        onClick={() => handleVote(1)}
        disabled={!user}
      >
        <ThumbsUp size={18} fill={userVote === 1 ? 'currentColor' : 'none'} />
      </motion.button>

      <AnimatePresence mode="wait">
        <motion.span 
          key={aggregateScore}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.15 }}
          className={`vote-count ${aggregateScore > 0 ? 'positive' : aggregateScore < 0 ? 'negative' : ''}`}
        >
          {aggregateScore > 0 ? `+${aggregateScore}` : aggregateScore}
        </motion.span>
      </AnimatePresence>

      <motion.button 
        whileTap={{ scale: 0.8 }}
        whileHover={{ scale: 1.1 }}
        className={`vote-btn down ${userVote === -1 ? 'active' : ''}`}
        onClick={() => handleVote(-1)}
        disabled={!user}
      >
        <ThumbsDown size={18} fill={userVote === -1 ? 'currentColor' : 'none'} />
      </motion.button>
    </div>
  );
};
