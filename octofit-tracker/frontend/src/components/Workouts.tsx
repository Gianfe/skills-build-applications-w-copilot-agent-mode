import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Workout = { title: string; reason: string; focus?: string; minutes?: number; difficulty?: string };

const demoUserEmail = 'mona@example.com';

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<Workout[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getJson<{ suggestions: Workout[] }>(`/api/workouts/suggestions/${encodeURIComponent(demoUserEmail)}`)
      .then(({ suggestions: result }) => {
        if (active) setSuggestions(result);
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
        <h2 className="h4">Workout suggestions</h2>
        <p>Recommend workouts from activity patterns.</p>
        {error ? (
          <p role="alert">Unable to load workout suggestions: {error}</p>
        ) : suggestions === null ? (
          <p role="status">Loading workout suggestions...</p>
        ) : suggestions.length === 0 ? (
          <p>No workout suggestions available.</p>
        ) : (
          <ul>
            {suggestions.map((workout) => (
              <li key={workout.title}>
                <strong>{workout.title}</strong>
                <p>{workout.reason}</p>
                {(workout.focus || workout.minutes !== undefined || workout.difficulty) && (
                  <p>
                    {[workout.focus, workout.minutes !== undefined ? `${workout.minutes} minutes` : undefined, workout.difficulty]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
