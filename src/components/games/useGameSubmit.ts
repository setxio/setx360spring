import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useApp } from '../../context/AppContext';

export const useGameSubmit = (gameName: string) => {
  const { user } = useApp();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNewBest, setIsNewBest] = useState(false);
  const [coinsEarned, setCoinsEarned] = useState(0);

  const submitScore = async (score: number, contextData: any = {}) => {
    if (!user) return;
    setIsSubmitting(true);
    setIsNewBest(false);
    setCoinsEarned(0);

    try {
      // 1. Fetch current best score for this game
      const { data: previousScores } = await supabase
        .from('game_scores')
        .select('score')
        .eq('profile_id', user.id)
        .eq('game_name', gameName)
        .order('score', { ascending: false })
        .limit(1);

      const previousBest = previousScores?.[0]?.score || 0;
      if (score > previousBest) {
        setIsNewBest(true);
      }

      // 2. Insert the new score
      await supabase.from('game_scores').insert({
        profile_id: user.id,
        game_name: gameName,
        score,
        metadata: {
          ...contextData,
          version: '1.1',
          platform: 'web'
        }
      });

      // 3. Calculate and award arcade coins (1 coin per 100 points, minimum 1 if score > 0)
      const earned = score > 0 ? Math.max(1, Math.floor(score / 100)) : 0;
      setCoinsEarned(earned);

      if (earned > 0) {
        // Fetch current coins
        const { data: profile } = await supabase
          .from('profiles')
          .select('arcade_coins')
          .eq('id', user.id)
          .single();
          
        const currentCoins = profile?.arcade_coins || 0;
        
        // Update coins
        await supabase
          .from('profiles')
          .update({ arcade_coins: currentCoins + earned })
          .eq('id', user.id);
      }

    } catch (err) {
      console.error('Failed to submit score:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return { submitScore, isSubmitting, isNewBest, coinsEarned };
};
