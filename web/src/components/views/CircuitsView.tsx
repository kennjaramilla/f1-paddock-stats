'use client';
import Link from 'next/link';
import { useMemo } from 'react';
import { driverLabel, fmtPct } from '@/lib/format';
import { useGetCircuitsQuery } from '@/store/api';
import { useListParams } from '@/lib/useUrlState';
import type { CircuitIndexItem } from '@/lib/types';
import { EmptyState, ErrorState, Segmented, Skeleton } from '../ui';

const SORTS = ['races', 'pole', 'name'] as const;
type Sort = (typeof SORTS)[number];

export function sortCircuits(list: CircuitIndexItem[], sort: Sort, q: string): CircuitIndexItem[] {
  const needle = q.trim().toLowerCase();
  const filtered = needle
    ? list.filter((c) => [c.name, c.locality, c.country].some((v) => v?.toLowerCase().includes(needle)))
    : list;
  const by: Record<Sort, (a: CircuitIndexItem, b: CircuitIndexItem) => number> = {
    races: (a, b) => b.races - a.races || a.name.localeCompare(b.name),
    pole: (a, b) => b.poleToWinRate - a.poleToWinRate || b.races - a.races,
    name: (a, b) => a.name.localeCompare(b.name),
  };
  return [...filtered].sort(by[sort]);
}

export function CircuitsView() {
  const { q, sort, setQuery, setSort } = useListParams(SORTS, 'races');
  const { data, error, refetch } = useGetCircuitsQuery();
  const list = useMemo(() => (data ? sortCircuits(data, sort, q) : []), [data, sort, q]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-5xl font-bold uppercase leading-none tracking-tight">Circuits</h1>
        <p className="mt-3 max-w-2xl text-ink-2">Where qualifying matters most, who rules each track, and every winner since 2014.</p>
      </header>
      <div className="flex flex-wrap items-center gap-4">
        <label className="relative w-full max-w-sm">
          <span className="sr-only">Search circuits</span>
          <input
            type="search"
            defaultValue={q}
            placeholder="Search by circuit, city or country"
            onChange={(e) => setQuery(e.target.value)}
            className="h-11 w-full rounded-xl border border-line bg-surface px-4 text-base outline-none focus:border-focus focus:ring-2 focus:ring-focus/30"
            data-testid="circuit-search"
          />
        </label>
        <Segmented label="Sort" value={sort} onChange={setSort}
          options={[{ value: 'races', label: 'Most raced' }, { value: 'pole', label: 'Pole matters' }, { value: 'name', label: 'A–Z' }]} />
      </div>
      {error ? (
        <ErrorState message="We couldn't load circuits." onRetry={() => refetch()} />
      ) : !data ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-40" />)}</div>
      ) : list.length === 0 ? (
        <EmptyState title="No circuits found">Nothing matches “{q}”. Try a country, like “Italy”.</EmptyState>
      ) : (
        <>
          <p className="text-sm text-ink-3" aria-live="polite">{list.length} circuits</p>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((c) => (
              <li key={c.circuitId}>
                <Link href={`/circuits/${c.circuitId}`} className="block h-full rounded-2xl border border-line bg-surface p-5 transition hover:-translate-y-0.5 hover:border-line-strong hover:shadow-md">
                  <div className="text-xs font-medium uppercase tracking-wider text-ink-3">{c.locality}, {c.country}</div>
                  <div className="mt-1 font-display text-2xl font-semibold uppercase leading-tight">{c.name}</div>
                  <div className="mt-4 flex items-end justify-between gap-3 text-sm">
                    <div>
                      <div className="tabular"><span className="font-semibold">{c.races}</span> <span className="text-ink-3">races · {c.firstSeason === c.lastSeason ? c.firstSeason : `${c.firstSeason}–${c.lastSeason}`}</span></div>
                      {c.lastWinner && <div className="text-ink-2">Last winner <span className="font-semibold text-ink">{driverLabel(c.lastWinner)}</span></div>}
                    </div>
                    <PoleMeter rate={c.poleToWinRate} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export function PoleMeter({ rate, size = 52 }: { rate: number; size?: number }) {
  const r = size / 2 - 5;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-2" title="Share of races won from pole position">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth="6" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--accent)" strokeWidth="6" strokeLinecap="round"
          strokeDasharray={`${c * rate} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <div className="text-right leading-tight">
        <div className="font-display text-xl font-semibold tabular">{fmtPct(rate)}</div>
        <div className="text-[11px] text-ink-3">won from pole</div>
      </div>
    </div>
  );
}
