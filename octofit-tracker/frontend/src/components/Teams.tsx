import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Team = { name: string; mascot: string; members: string[] };

export default function Teams() {
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getJson<{ teams: Team[] }>('/api/teams')
      .then(({ teams: result }) => {
        if (active) setTeams(result);
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
        <h2 className="h4">Teams</h2>
        <p>Manage teams and members.</p>
        {error ? (
          <p role="alert">Unable to load teams: {error}</p>
        ) : teams === null ? (
          <p role="status">Loading teams...</p>
        ) : teams.length === 0 ? (
          <p>No teams yet.</p>
        ) : (
          <ul>
            {teams.map((team) => (
              <li key={team.name}>
                {team.name} ({team.mascot}){team.members.length > 0 ? ` - ${team.members.join(', ')}` : ''}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
