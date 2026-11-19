import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let active = true;
    getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard')
      .then((data) => active && setLeaderboard(data.leaderboard))
      .catch(() => active && setError('Unable to load leaderboard.'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Leaderboard</h2>
        <p>Compare team point totals.</p>
        {loading && <p role="status">Loading leaderboard...</p>}
        {error && <p role="alert">{error}</p>}
        {!loading && !error && leaderboard.length === 0 && <p>No leaderboard results found.</p>}
        {!loading && !error && leaderboard.length > 0 && (
          <ol>
            {leaderboard.map((entry) => <li key={entry.teamName}>{entry.teamName}: {entry.totalPoints} points</li>)}
          </ol>
        )}
      </div>
    </section>
  );
}
