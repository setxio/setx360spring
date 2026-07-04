import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useApp } from '../../context/AppContext';

export const useShareScore = (gameNameOverride?: string) => {
  const { user } = useApp();
  const [isSharing, setIsSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  const shareScore = async (gameName: string, score: number, customMessage?: string) => {
    if (!user) return false;
    
    setIsSharing(true);
    setShareSuccess(false);

    try {
      const emojiMap: Record<string, string> = {
        'Gator Chase': '🐊',
        'Groves Pecan Catch': '🌰',
        'Port Arthur Skipper': '🚢',
        'Spindletop Striker': '🛢️',
        'Windmill Defender': '🌷',
        'Riverfront Runner': '🏃'
      };

      const emoji = emojiMap[gameName] || '🎮';
      const content = customMessage || `I just scored ${score} points in ${gameName}! Can you beat my score? ${emoji}`;

      const { error } = await supabase.from('posts').insert([{ 
        profile_id: user.id,
        content: content,
        type: 'post',
        category: 'Everybody',
        media_urls: [],
        poll_data: null,
        location: user?.community || 'SETX',
        visibility_scope: 'county', // Keep arcade bragging mostly local to SETX
        group_id: null,
        is_nsfw: false,
        tags: ['arcade', gameName.toLowerCase().replace(/\s+/g, '')],
        metadata: { platform: 'web', type: 'arcade_score', game: gameName, score }
      }]);

      if (error) throw error;
      
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 3000);
      return true;

    } catch (err) {
      console.error('Failed to share score:', err);
      return false;
    } finally {
      setIsSharing(false);
    }
  };

  return { shareScore, isSharing, shareSuccess };
};
