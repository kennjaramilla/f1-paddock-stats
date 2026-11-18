'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { teamColorFor } from '@/lib/colors';
import { driverLabel, fmtPoints, ordinal, plural } from '@/lib/format';
import { newDrivers, seasonSpan } from '@/lib/teams';
import { isNotFound, useGetConstructorQuery } from '@/store/api';
import { useResolvedTheme } from '../Providers';
import { Card, EmptyState, ErrorState, PageSkeleton, Stat, TeamSwatch } from '../ui';

export function TeamDetailView() {
  const { id } = useParams<{ id: string }>();
  const { data: t, error, refetch } = useGetConstructorQuery(id);
  const theme = useResolvedTheme();

  if (isNotFound(error)) return <EmptyState title="Team not found"><Link href="/teams" className="text-accent underline">All teams</Link></EmptyState>;
  if (error) return <ErrorState message="We couldn't load this team." onRetry={() => refetch()} />;
  if (!t) return <PageSkeleton />;

  const chrono = [...t.seasons].reverse();
  const worst = Math.max(...t.seasons.map((s) => s.position), 10);
  const best = t.seasons.reduce((b, s) => (s.position < b.position ? s : b), t.seasons[0]);
  const colour = teamColorFor(t.constructorId, theme);

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb" className="text-sm text-ink-2"><Link href="/teams" className="hover:text-ink">Teams</Link> <span className="text-ink-3">/</span> {t.name}</nav>
      <header className="flex items-center gap-4">
        <TeamSwatch constructorId={t.constructorId} className="h-14 w-2.5" />
        <div>
          <p className="text-sm font-medium uppercase tracking-wider text-ink-3">{t.nationality && `${t.nationality} · `}{seasonSpan(t.seasons.map((s) => s.season))}</p>
          <h1 className="font-display text-5xl font-bold uppercase leading-none tracking-tight">{t.name}</h1>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5" data-cy="team-stats">
        <Stat label="Titles" value={t.titles} />
        <Stat label="Wins" value={t.wins} hint={`${t.podiums} podiums`} />
        <Stat label="One-twos" value={t.oneTwos} />
        <Stat label="Poles" value={t.poles} hint={`${plural(t.starts, 'race')}`} />
        <Stat label="Best season" value={ordinal(best.position)} hint={`${best.season} · ${fmtPoints(best.points)} pts`} />
      </div>

      <Card title="Constructors' finish by season">
        <ol className="flex h-56 items-end gap-1.5 sm:gap-3" aria-label="Constructors' championship position per season">
          {chrono.map((s) => (
            <li key={s.season} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
              <span className="text-xs font-semibold tabular">P{s.position}</span>
              <Link href={`/season/${s.season}`} className="w-full max-w-12 rounded-t-md transition hover:opacity-80"
                style={{ height: `${((worst + 1 - s.position) / worst) * 100}%`, background: colour }}
                aria-label={`${s.season}: ${ordinal(s.position)}, ${fmtPoints(s.points)} points${s.inProgress ? ' so far' : ''}`} />
              <span className="text-[11px] text-ink-3 tabular">{String(s.season).slice(2)}</span>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-xs text-ink-3">Taller = better finish. Click a bar to open that season.</p>
      </Card>

      <Card title="Season by season">
        <div className="-mx-4 overflow-x-auto sm:mx-0">
          <table className="w-full min-w-[560px] text-sm tabular" data-cy="team-seasons">
            <caption className="sr-only">Seasons</caption>
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-ink-3">
                <th scope="col" className="px-4 py-2 sm:px-2">Season</th>
                <th scope="col" className="px-2 py-2 text-right">Pos</th><th scope="col" className="px-2 py-2 text-right">Pts</th>
                <th scope="col" className="px-2 py-2 text-right">Wins</th><th scope="col" className="px-2 py-2 text-right">Podiums</th>
                <th scope="col" className="px-4 py-2 sm:px-2">Drivers</th>
              </tr>
            </thead>
            <tbody>
              {t.seasons.map((s, i) => {
                const joined = newDrivers(t.seasons, i);
                return (
                  <tr key={s.season} className="border-t border-line">
                    <td className="px-4 py-2 sm:px-2">
                      <Link href={`/season/${s.season}`} className="font-semibold hover:text-accent hover:underline">{s.season}</Link>
                      {s.inProgress && <span className="ml-1.5 text-xs text-ink-3">in progress</span>}
                    </td>
                    <td className="px-2 py-2 text-right">{ordinal(s.position)}</td>
                    <td className="px-2 py-2 text-right font-semibold">{fmtPoints(s.points)}</td>
                    <td className="px-2 py-2 text-right">{s.wins || ''}</td>
                    <td className="px-2 py-2 text-right">{s.podiums || ''}</td>
                    <td className="px-4 py-2 sm:px-2">
                      <ul className="flex flex-wrap gap-x-3 gap-y-1">
                        {s.drivers.map((d) => (
                          <li key={d.driverId}>
                            <Link href={`/drivers/${d.driverId}`} className="hover:text-accent hover:underline" title={d.name}>{driverLabel(d)}</Link>
                            {joined.has(d.driverId) && <span className="ml-1 text-[10px] font-semibold uppercase text-accent">new</span>}
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
