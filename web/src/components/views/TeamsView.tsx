'use client';
import Link from 'next/link';
import { groupTeams, seasonSpan } from '@/lib/teams';
import type { ConstructorIndexItem } from '@/lib/types';
import { useGetConstructorsQuery } from '@/store/api';
import { Card, ErrorState, Skeleton, TeamSwatch } from '../ui';

export function TeamsView() {
  const { data, error, refetch } = useGetConstructorsQuery();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-5xl font-bold uppercase leading-none tracking-tight">Teams</h1>
        <p className="mt-3 max-w-2xl text-ink-2">Every constructor in the dataset. Open a team for its titles, wins and driver line-ups by season.</p>
      </header>
      {error ? (
        <ErrorState message="We couldn't load teams." onRetry={() => refetch()} />
      ) : !data ? (
        <Skeleton className="h-96" />
      ) : (
        <TeamGroups teams={data} />
      )}
    </div>
  );
}

function TeamGroups({ teams }: { teams: ConstructorIndexItem[] }) {
  const { latest, current, former } = groupTeams(teams);
  return (
    <>
      <Card title={`On the ${latest} grid`}>
        <TeamList teams={current} />
      </Card>
      {former.length > 0 && (
        <Card title="Former teams">
          <TeamList teams={former} />
        </Card>
      )}
    </>
  );
}

function TeamList({ teams }: { teams: ConstructorIndexItem[] }) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3" data-cy="team-list">
      {teams.map((t) => (
        <li key={t.constructorId}>
          <Link href={`/teams/${t.constructorId}`} className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5 hover:border-accent hover:bg-surface-2">
            <TeamSwatch constructorId={t.constructorId} className="h-8 w-1.5" />
            <span className="min-w-0">
              <span className="block truncate font-semibold">{t.name}</span>
              <span className="block text-xs text-ink-3 tabular">{t.nationality && `${t.nationality} · `}{seasonSpan(t.seasons)}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
