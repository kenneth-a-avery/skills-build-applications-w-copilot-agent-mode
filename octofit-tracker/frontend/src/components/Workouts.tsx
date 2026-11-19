import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Workout = { title: string; reason: string };

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let active = true;
    getJson<{ suggestions: Workout[] }>('/api/workouts/suggestions/mona@example.com')
      .then((data) => active && setSuggestions(data.suggestions))
      .catch(() => active && setError('Unable to load workout suggestions.'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Workout suggestions</h2>
        <p>Recommend workouts from activity patterns.</p>
        {loading && <p role="status">Loading workout suggestions...</p>}
        {error && <p role="alert">{error}</p>}
        {!loading && !error && suggestions.length === 0 && <p>No workout suggestions found.</p>}
        {!loading && !error && suggestions.length > 0 && (
          <ul>
            {suggestions.map((workout) => <li key={workout.title}><strong>{workout.title}</strong>: {workout.reason}</li>)}
          </ul>
        )}
      </div>
    </section>
  );
}
