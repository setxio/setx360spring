import React, { useState } from 'react';
import { Trophy, Activity, Calendar, Users, Star, ArrowRight, Bell, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import './SportsView.css';

const LIVE_SCORES = [
  { id: 'l1', sport: 'Football', teamA: 'Local Tigers', teamB: 'Metro Lions', scoreA: 28, scoreB: 24, status: '4th Qtr 2:15' },
  { id: 'l2', sport: 'Baseball', teamA: 'Southside Blue', teamB: 'North Star', scoreA: 3, scoreB: 5, status: 'Final' },
  { id: 'l3', sport: 'Basketball', teamA: 'City Heat', teamB: 'Stormers', scoreA: 98, scoreB: 102, status: 'Overtime' }
];

const UPCOMING_GAMES = [
  { id: 'u1', sport: 'Soccer', match: 'Valley Utd vs Real City', date: 'Tomorrow', time: '6:00 PM', location: 'Central Field' },
  { id: 'u2', sport: 'Softball', match: 'Ladies Elite vs Thunder', date: 'Sat, Apr 26', time: '10:00 AM', location: 'Park South' },
  { id: 'u3', sport: 'High School FB', match: 'East High vs West Prep', date: 'Fri, Apr 25', time: '7:30 PM', location: 'Memorial Stadium' }
];

export const SportsView: React.FC<{ activeTab?: number; user?: any; scope?: string }> = ({ user: propUser, scope = 'national' }) => {
  const [scores, setScores] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [escalatedScope, setEscalatedScope] = useState<string | null>(null);

  const { user: contextUser } = useApp();
  const user = propUser || contextUser;

  React.useEffect(() => {
    setIsLoading(true);
    let currentEscalation: string | null = null;
    const needsGeoFilter = user && scope !== 'national';

    let fetchedScores = [...LIVE_SCORES];

    if (needsGeoFilter) {
      if (fetchedScores.length < 3) {
        const escalationMap: Record<string, { nextScope: string; label: string }> = {
          city: { nextScope: 'county', label: `${user.county || 'your'} County` },
          county: { nextScope: 'state', label: user.state || 'your state' },
          state: { nextScope: 'national', label: 'nationwide' },
        };
        const esc = escalationMap[scope];
        if (esc) currentEscalation = esc.label;
      }
    }

    setTimeout(() => {
      setScores(fetchedScores);
      setEscalatedScope(currentEscalation);
      setIsLoading(false);
    }, 400);
  }, [scope, user]);
  return (
    <div className="sports-container">
      <header className="sports-header">
        <div className="sports-title-wrap">
          <Trophy size={32} className="sports-icon-gold" />
          <h1 className="sports-main-title">Local Sports</h1>
        </div>
        <button className="sports-notif-btn"><Bell size={24} /></button>
      </header>

      <section className="sports-section">
        <div className="section-header">
          <h3 className="section-subtitle">Live & Recent Scores</h3>
          <button className="view-all-btn">View All <ArrowRight size={14} /></button>
        </div>
        
        {escalatedScope && (
          <div style={{
            padding: '10px 16px',
            marginBottom: '16px',
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
            <span>Expanded to <strong style={{ color: 'var(--primary)' }}>{escalatedScope}</strong> — not enough local sports yet</span>
          </div>
        )}

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px', width: '100%' }}>
            <Loader2 className="animate-spin" size={32} color="var(--primary)" />
          </div>
        ) : (
        <div className="score-scroll">
          {scores.map(game => (
            <div key={game.id} className="score-card premium-card">
              <div className="score-header">
                <span className="sport-label">{game.sport}</span>
                <span className={`status-badge ${game.status === 'Final' ? '' : 'live'}`}>{game.status}</span>
              </div>
              <div className="score-body">
                <div className="team-row">
                  <span className="team-name">{game.teamA}</span>
                  <span className="team-score">{game.scoreA}</span>
                </div>
                <div className="team-row">
                  <span className="team-name">{game.teamB}</span>
                  <span className="team-score">{game.scoreB}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}
      </section>

      <div className="sports-quick-nav">
        <button className="q-nav-btn"><Star size={20} /> My Teams</button>
        <button className="q-nav-btn"><Activity size={20} /> Standings</button>
        <button className="q-nav-btn"><Users size={20} /> Recruitment</button>
        <button className="q-nav-btn"><Calendar size={20} /> Tickets</button>
      </div>

      <section className="sports-section">
        <h3 className="section-subtitle">Upcoming Local Matchups</h3>
        <div className="upcoming-list">
          {UPCOMING_GAMES.map(game => (
            <div key={game.id} className="upcoming-item premium-card">
              <div className="u-game-info">
                <div className="u-date-box">
                  <span className="u-month">{game.date.split(',')[0]}</span>
                  <span className="u-day">{game.date.includes(',') ? game.date.split(',')[1].trim() : ''}</span>
                </div>
                <div className="u-details">
                  <h4 className="u-match-title">{game.match}</h4>
                  <p className="u-meta">{game.time} • {game.location}</p>
                </div>
              </div>
              <button className="u-remind-btn">Remind</button>
            </div>
          ))}
        </div>
      </section>

      <section className="sports-news-section">
        <h3 className="section-subtitle">Sports Headlines</h3>
        <div className="news-card premium-card">
          <img src="https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&q=80&w=600" alt="Stadium" className="news-img" />
          <div className="news-content">
            <h4 className="news-title">Memorial Stadium Renovation Approved for 2027</h4>
            <p className="news-excerpt">The city council voted unanimously to upgrade the historic stadium with new seating and lightning...</p>
            <span className="news-time">3 hours ago</span>
          </div>
        </div>
      </section>
    </div>
  );
};
