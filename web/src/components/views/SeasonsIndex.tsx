'use client';
import Link from 'next/link';
import { teamColorFor } from '@/lib/colors';
import { driverLabel, fmtPoints } from '@/lib/format';
import { useGetMetaQuery, useGetSeasonsQuery } from '@/store/api';
import { Sparkline } from '../Sparkline';
import { useResolvedTheme } from '../Providers';
import { ErrorState, Skeleton, TeamSwatch } from '../ui';

export function SeasonsIndex() {
  const { data: seasons, error, refetch } = useGetSeasonsQuery();
  const { data: meta } = useGetMetaQuery();
  const theme = useResolvedTheme();

  return (
    <div>
      <header className="mb-8 max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">The hybrid era & beyond</p>
        <h1 className="mt-2 font-display text-4xl font-bold uppercase leading-[0.95] tracking-tight sm:text-6xl">
          Every title fight, round by round
        </h1>
        <p className="mt-4 text-base text-ink-2 sm:text-lg">
          Pick a season to see how the championship unfolded, compare any two drivers head-to-head, or dig into a circuit&apos;s history.
        </p>
        {meta && (
          <dl className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-2">
            <div><dt className="inline text-ink-3">Seasons </dt><dd className="inline font-semibold text-ink tabular">{meta.fromSeason}–{meta.toSeason}</dd></div>
            <div><dt className="inline text-ink-3">Races </dt><dd className="inline font-semibold text-ink tabular">{meta.races}</dd></div>
            <div><dt className="inline text-ink-3">Drivers </dt><dd className="inline font-semibold text-ink tabular">{meta.drivers}</dd></div>
            <div><dt className="inline text-ink-3">Circuits </dt><dd className="inline font-semibold text-ink tabular">{meta.circuits}</dd></div>
          </dl>
        )}
      </header>

      {error ? (
        <ErrorState message="We couldn't load the seasons." onRetry={() => refetch()} />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy={!seasons}>
          {!seasons
            ? Array.from({ length: 6 }, (_, i) => <li key={i}><Skeleton className="h-48" /></li>)
            : seasons.map((s) => {
                const [first, second] = s.contenders;
                const teams = new Map<string, number>();
                return (
                  <li key={s.year}>
                    <Link
                      href={`/season/${s.year}`}
                      className="group block h-full rounded-2xl border border-line bg-surface p-5 transition hover:-translate-y-0.5 hover:border-line-strong hover:shadow-md"
                      data-testid={`season-card-${s.year}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="font-display text-4xl font-bold tabular leading-none">{s.year}</span>
                        {s.inProgress ? (
                          <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent">In progress · R{s.rounds}</span>
                        ) : (
                          <span className="text-xs text-ink-3 tabular">{s.rounds} rounds</span>
                        )}
                      </div>
                      <div className="mt-4 flex items-center gap-2">
                        {s.championTeam && <TeamSwatch constructorId={s.championTeam.constructorId} />}
                        <span className="font-semibold">{s.champion?.name}</span>
                        <span className="text-sm text-ink-3">· {s.championTeam?.name}</span>
                      </div>
                      <p className="mt-1 text-sm text-ink-2">
                        {s.inProgress ? 'Leads' : 'Won'} by <span className="font-semibold text-ink tabular">{fmtPoints(s.championMargin)}</span> pts
                        {second && <> over {driverLabel(second)}</>}
                        {first && second && s.championMargin < 15 && <span className="ml-1 font-semibold text-accent">· tight</span>}
                      </p>
                      <div className="mt-4">
                        <Sparkline
                          label={`Title fight: ${s.contenders.map((c) => `${c.name} ${fmtPoints(c.points)}`).join(', ')}`}
                          series={s.contenders.map((c) => {
                            const n = teams.get(c.constructorId) ?? 0;
                            teams.set(c.constructorId, n + 1);
                            return { id: c.driverId, color: teamColorFor(c.constructorId, theme), values: c.cumulative, dashed: n > 0 };
                          })}
                        />
                        <div className="mt-2 flex gap-3 text-xs text-ink-2">
                          {s.contenders.map((c) => (
                            <span key={c.driverId} className="inline-flex items-center gap-1 tabular">
                              <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: teamColorFor(c.constructorId, theme) }} />
                              {driverLabel(c)} {fmtPoints(c.points)}
                            </span>
                          ))}
                        </div>
                      </div>
                      <span className="mt-4 inline-block text-sm font-medium text-accent group-hover:underline">Explore season →</span>
                    </Link>
                  </li>
                );
              })}
        </ul>
      )}
    </div>
  );
}
