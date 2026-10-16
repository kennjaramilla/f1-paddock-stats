'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { teamColorFor } from '@/lib/colors';
import { driverLabel, plural, shortRace } from '@/lib/format';
import { isNotFound, useGetCircuitQuery } from '@/store/api';
import type { WinCount } from '@/lib/types';
import { useResolvedTheme } from '../Providers';
import { Card, EmptyState, ErrorState, PageSkeleton, Stat, TeamSwatch } from '../ui';
import { PoleMeter } from './CircuitsView';

export function CircuitDetailView() {
  const { id } = useParams<{ id: string }>();
  const { data: c, error, refetch } = useGetCircuitQuery(id);
  const theme = useResolvedTheme();

  if (isNotFound(error)) return <EmptyState title="Circuit not found"><Link href="/circuits" className="text-accent underline">All circuits</Link></EmptyState>;
  if (error) return <ErrorState message="We couldn't load this circuit." onRetry={() => refetch()} />;
  if (!c) return <PageSkeleton />;

  const topDriver = c.winsByDriver[0];
  const fromBehind = c.races.reduce((best, r) => (r.winnerGrid > (best?.winnerGrid ?? 0) ? r : best), c.races[0]);

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb" className="text-sm text-ink-2"><Link href="/circuits" className="hover:text-ink">Circuits</Link> <span className="text-ink-3">/</span> {c.name}</nav>
      <header>
        <p className="text-sm font-medium uppercase tracking-wider text-ink-3">{c.locality}, {c.country}</p>
        <h1 className="mt-1 font-display text-5xl font-bold uppercase leading-none tracking-tight">{c.name}</h1>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Races" value={c.races.length} hint={`${c.races.at(-1)?.season}–${c.races[0]?.season}`} />
        <div className="rounded-xl border border-line bg-surface px-4 py-3">
          <div className="text-xs font-medium uppercase tracking-wider text-ink-3">Pole to win</div>
          <div className="mt-1"><PoleMeter rate={c.poleToWinRate} size={44} /></div>
        </div>
        <Stat label="Most wins" value={topDriver ? topDriver.wins : '—'} hint={topDriver?.name} />
        <Stat label="Furthest back to win" value={fromBehind ? (fromBehind.winnerGrid ? `P${fromBehind.winnerGrid}` : 'Pit lane') : '—'}
          hint={fromBehind && `${driverLabel(fromBehind.winner)}, ${fromBehind.season}`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <div className="space-y-6">
          <Card title="Wins by team"><WinBars rows={c.winsByConstructor} color={(id) => teamColorFor(id, theme)} total={c.races.length} /></Card>
          <Card title="Wins by driver"><WinBars rows={c.winsByDriver.slice(0, 8)} color={() => 'var(--ink-2)'} total={c.races.length} /></Card>
        </div>
        <Card title="Every winner">
          <div className="-mx-4 overflow-x-auto sm:mx-0">
            <table className="w-full min-w-[420px] text-sm tabular">
              <caption className="sr-only">Winners at {c.name}</caption>
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-ink-3">
                  <th scope="col" className="px-4 py-2 sm:px-2">Season</th>
                  <th scope="col" className="px-2 py-2">Winner</th>
                  <th scope="col" className="px-2 py-2 text-right">Grid</th>
                  <th scope="col" className="px-4 py-2 sm:px-2">Pole</th>
                </tr>
              </thead>
              <tbody>
                {c.races.map((r) => (
                  <tr key={`${r.season}-${r.round}`} className="border-t border-line">
                    <td className="px-4 py-2 sm:px-2">
                      <Link href={`/season/${r.season}`} className="font-semibold hover:text-accent hover:underline">{r.season}</Link>
                      {shortRace(r.raceName) !== shortRace(c.races[0].raceName) && <div className="text-xs text-ink-3">{shortRace(r.raceName)}</div>}
                    </td>
                    <td className="px-2 py-2">
                      <span className="inline-flex items-center gap-2">
                        <TeamSwatch constructorId={r.winnerTeam.constructorId} />
                        <span className="font-medium">{r.winner.name}</span>
                        <span className="hidden text-xs text-ink-3 sm:inline">{r.winnerTeam.name}</span>
                      </span>
                    </td>
                    <td className="px-2 py-2 text-right">{r.winnerGrid || 'PL'}</td>
                    <td className="px-4 py-2 sm:px-2">
                      {r.wonFromPole
                        ? <span className="rounded bg-accent-soft px-1.5 py-0.5 text-xs font-semibold text-accent">From pole</span>
                        : <span className="text-ink-2">{r.pole ? driverLabel(r.pole) : '—'}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

function WinBars({ rows, color, total }: { rows: WinCount[]; color: (id: string) => string; total: number }) {
  const max = Math.max(1, ...rows.map((r) => r.wins));
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.id} className="grid grid-cols-[120px_1fr_auto] items-center gap-3 text-sm">
          <span className="truncate font-medium">{r.name}</span>
          <div className="h-3 rounded-full bg-surface-2"><div className="h-3 rounded-full" style={{ width: `${(r.wins / max) * 100}%`, background: color(r.id) }} /></div>
          <span className="w-16 text-right tabular text-ink-2">{plural(r.wins, 'win')}<span className="sr-only"> of {total}</span></span>
        </li>
      ))}
    </ul>
  );
}
