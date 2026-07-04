import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Trophy, Medal, Building2, Loader2, ArrowLeft } from 'lucide-react';
import './CityLeaderboard.css';

interface CityLeaderboardProps {
  onBack: () => void;
}

interface CityRank {
  community: string;
  totalScore: number;
  playerCount: number;
}

export const CityLeaderboard: React.FC<CityLeaderboardProps> = ({ onBack }) => {
  const [rankings, setRankings] = useState<CityRank[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      // Fetch top 5000 scores across all games
      const { data, error } = await supabase
        .from('game_scores')
        .select(`
          score,
          profile_id,
          profiles ( community )
        `)
        .order('score', { ascending: false })
        .limit(5000);

      if (error) throw error;
      
      const cityMap = new Map<string, { score: number, players: Set<string> }>();

      (data || []).forEach(row => {
        const comm = (row as any).profiles?.community;
        // Skip empty or generic communities
        if (!comm || comm.trim() === '' || comm.toLowerCase() === 'setx') return;
        
        const current = cityMap.get(comm) || { score: 0, players: new Set() };
        current.score += row.score || 0;
        if (row.profile_id) current.players.add(row.profile_id);
        cityMap.set(comm, current);
      });

      const processed: CityRank[] = Array.from(cityMap.entries()).map(([community, stats]) => ({
        community,
        totalScore: stats.score,
        playerCount: stats.players.size
      }));

      processed.sort((a, b) => b.totalScore - a.totalScore);
      setRankings(processed.slice(0, 20)); // Top 20 cities
    } catch (err) {
      console.error('Failed to fetch city leaderboard', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="city-leaderboard-container">
      <div className="city-leaderboard-header">
        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={24} />
        </button>
        <div className="header-titles">
          <h2><Building2 size={24} /> City Pride Leaderboard</h2>
          <p>Which SETX city has the best gamers?</p>
        </div>
      </div>

      <div className="city-leaderboard-content">
        {loading ? (
          <div className="loading-state">
            <Loader2 className="spinner" size={32} />
            <p>Tallying city scores...</p>
          </div>
        ) : rankings.length === 0 ? (
          <div className="empty-state">
            <p>No city scores recorded yet. Be the first to put your city on the map!</p>
          </div>
        ) : (
          <div className="rankings-list">
            {rankings.map((city, index) => (
              <div key={city.community} className={`ranking-card ${index < 3 ? 'top-3' : ''} rank-${index + 1}`}>
                <div className="rank-badge">
                  {index === 0 ? <Trophy size={24} className="gold" /> :
                   index === 1 ? <Medal size={24} className="silver" /> :
                   index === 2 ? <Medal size={24} className="bronze" /> : 
                   `#${index + 1}`}
                </div>
                
                <div className="city-details">
                  <h3>{city.community}</h3>
                  <span className="player-count">{city.playerCount} {city.playerCount === 1 ? 'Player' : 'Players'}</span>
                </div>
                
                <div className="score-badge">
                  {city.totalScore.toLocaleString()} pts
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
