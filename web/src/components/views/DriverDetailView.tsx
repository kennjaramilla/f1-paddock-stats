'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { teamColorFor } from '@/lib/colors';
import { driverLabel, fmtPoints, ordinal } from '@/lib/format';
import { teammatePairs } from '@/lib/h2h';
import { useGetDriversQuery } from '@/store/api';
import { useAppDispatch } from '@/store/store';
import { driverFollowed } from '@/store/uiSlice';
import { useResolvedTheme } from '../Providers';
import { Card, EmptyState, ErrorState, PageSkeleton, Stat, TeamSwatch } from '../ui';

export function DriverDetailView() {
  const { id } = useParams<{ id: string }>();
  const { data, error, refetch } = useGetDriversQuery();
  const theme = useResolvedTheme();
  const dispatch = useAppDispatch();
  const followDriver = (driverId: string) => dispatch(driverFollowed(driverId));

  if (error) return <ErrorState message="We couldn't load this driver." onRetry={() => refetch()} />;
  if (!data) return <PageSkeleton />;
  const d = data.find((x) => x.driverId === id);
  if (!d) return <EmptyState title="Driver not found"><Link href="/drivers" className="text-accent underline">All drivers</Link></EmptyState>;

  const worst = Math.max(...d.seasons.map((s) => s.position), 10);
  const best = d.seasons.reduce((b, s) => (s.position < b.position ? s : b), d.seasons[0]);
  const mates = d.seasons.map((s) => {
    const pair = teammatePairs(data, s.season).find((p) => p.a.driverId === d.driverId || p.b.driverId === d.driverId);
    return { season: s.season, mate: pair ? (pair.a.driverId === d.driverId ? pair.b : pair.a) : undefined };
  });

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb" className="text-sm text-ink-2"><Link href="/drivers" className="hover:text-ink">Drivers</Link> <span className="text-ink-3">/</span> {d.givenName} {d.familyName}</nav>
      <header className="flex items-center gap-4">
        <TeamSwatch constructorId={d.seasons.at(-1)!.constructorId} className="h-14 w-2.5" />
        <div>
          <p className="text-sm font-medium uppercase tracking-wider text-ink-3">{d.nationality}{d.number && ` · #${d.number}`}</p>
          <h1 className="font-display text-5xl font-bold uppercase leading-none tracking-tight">{d.givenName} {d.familyName}</h1>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Titles" value={d.titles} />
        <Stat label="Wins" value={d.wins} hint={`${d.podiums} podiums`} />
        <Stat label="Poles" value={d.poles} />
        <Stat label="Starts" value={d.starts} />
        <Stat label="Best season" value={ordinal(best.position)} hint={`${best.season} · ${best.constructorName}`} />
      </div>

      <Card title="Championship finish by season">
        <ol className="flex h-56 items-end gap-1.5 sm:gap-3" aria-label="Championship position per season">
          {d.seasons.map((s) => {
            const h = ((worst + 1 - s.position) / worst) * 100;
            return (
              <li key={s.season} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                <span className="text-xs font-semibold tabular">P{s.position}</span>
                <Link href={`/season/${s.season}`} onClick={() => followDriver(d.driverId)} className="w-full max-w-12 rounded-t-md transition hover:opacity-80"
                  style={{ height: `${h}%`, background: teamColorFor(s.constructorId, theme) }}
                  aria-label={`${s.season}: ${ordinal(s.position)} with ${s.constructorName}, ${fmtPoints(s.points)} points`} />
                <span className="text-[11px] text-ink-3 tabular">{String(s.season).slice(2)}</span>
              </li>
            );
          })}
        </ol>
        <p className="mt-3 text-xs text-ink-3">Taller = better finish. Click a bar to open that season with {d.familyName} highlighted.</p>
      </Card>

      <Card title="Season by season">
        <div className="-mx-4 overflow-x-auto sm:mx-0">
          <table className="w-full min-w-[520px] text-sm tabular">
            <caption className="sr-only">Seasons</caption>
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-ink-3">
                <th scope="col" className="px-4 py-2 sm:px-2">Season</th><th scope="col" className="px-2 py-2">Team</th>
                <th scope="col" className="px-2 py-2 text-right">Pos</th><th scope="col" className="px-2 py-2 text-right">Pts</th>
                <th scope="col" className="px-2 py-2 text-right">Wins</th><th scope="col" className="px-4 py-2 sm:px-2">Teammate</th>
              </tr>
            </thead>
            <tbody>
              {[...d.seasons].reverse().map((s) => {
                const mate = mates.find((m) => m.season === s.season)?.mate;
                return (
                  <tr key={s.season} className="border-t border-line">
                    <td className="px-4 py-2 sm:px-2"><Link href={`/season/${s.season}`} onClick={() => followDriver(d.driverId)} className="font-semibold hover:text-accent hover:underline">{s.season}</Link></td>
                    <td className="px-2 py-2"><span className="inline-flex items-center gap-2"><TeamSwatch constructorId={s.constructorId} />{s.constructorName}</span></td>
                    <td className="px-2 py-2 text-right">{ordinal(s.position)}</td>
                    <td className="px-2 py-2 text-right font-semibold">{fmtPoints(s.points)}</td>
                    <td className="px-2 py-2 text-right">{s.wins || ''}</td>
                    <td className="px-4 py-2 sm:px-2">
                      {mate ? (
                        <Link href={`/compare?a=${d.driverId}&b=${mate.driverId}&from=${s.season}&to=${s.season}`} className="text-accent hover:underline">
                          vs {driverLabel({ code: mate.code, name: mate.familyName })} →
                        </Link>
                      ) : '—'}
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
