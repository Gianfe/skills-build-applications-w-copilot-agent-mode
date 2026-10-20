import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Ranking = { teamName: string; totalPoints: number; rank: number };

export default function Leaderboard() {
  const [rankings, setRankings] = useState<Ranking[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getJson<{ leaderboard: Ranking[] }>('/api/leaderboard')
      .then(({ leaderboard }) => {
        if (active) setRankings(leaderboard);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Unknown error');
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="card">
      <div className="card-body">
        <h2 className="h4">Leaderboard</h2>
        <p>Compare team point totals.</p>
        {error ? (
          <p role="alert">Unable to load leaderboard: {error}</p>
        ) : rankings === null ? (
          <p role="status">Loading leaderboard...</p>
        ) : rankings.length === 0 ? (
          <p>No leaderboard rankings yet.</p>
        ) : (
          <ol>
            {rankings.map((ranking) => (
              <li key={ranking.teamName}>
                {ranking.teamName}: {ranking.totalPoints} points
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
