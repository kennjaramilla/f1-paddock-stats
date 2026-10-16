'use client';
import Link from 'next/link';
import { useMemo } from 'react';
import { fmtPoints } from '@/lib/format';
import { useGetDriversQuery } from '@/store/api';
import { useListParams } from '@/lib/useUrlState';
import { filterDrivers } from '../DriverCombobox';
import { EmptyState, ErrorState, Skeleton, TeamSwatch } from '../ui';

const SORTS = ['points'] as const;

export function DriversView() {
  const { q, setQuery } = useListParams(SORTS, 'points');
  const { data, error, refetch } = useGetDriversQuery();
  const list = useMemo(
    () => (data ? (q ? filterDrivers(data, q, 200) : [...data].sort((a, b) => b.points - a.points)) : []),
    [data, q],
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-5xl font-bold uppercase leading-none tracking-tight">Drivers</h1>
        <p className="mt-3 max-w-2xl text-ink-2">Everyone who started a race in the dataset, ranked by points scored.</p>
      </header>
      <label className="block max-w-sm">
        <span className="sr-only">Search drivers</span>
        <input type="search" defaultValue={q} placeholder="Search by name or code (e.g. HAM)"
          onChange={(e) => setQuery(e.target.value)}
          className="h-11 w-full rounded-xl border border-line bg-surface px-4 text-base outline-none focus:border-focus focus:ring-2 focus:ring-focus/30" />
      </label>
      {error ? (
        <ErrorState message="We couldn't load drivers." onRetry={() => refetch()} />
      ) : !data ? (
        <Skeleton className="h-96" />
      ) : list.length === 0 ? (
        <EmptyState title="No drivers found">Nothing matches “{q}”.</EmptyState>
      ) : (
        <div className="-mx-4 overflow-x-auto sm:mx-0">
          <table className="w-full min-w-[560px] text-sm tabular">
            <caption className="sr-only">Drivers</caption>
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-ink-3">
                <th scope="col" className="px-4 py-2">Driver</th>
                <th scope="col" className="px-2 py-2">Seasons</th>
                <th scope="col" className="px-2 py-2 text-right">Starts</th>
                <th scope="col" className="px-2 py-2 text-right">Wins</th>
                <th scope="col" className="px-2 py-2 text-right">Titles</th>
                <th scope="col" className="px-4 py-2 text-right">Points</th>
              </tr>
            </thead>
            <tbody>
              {list.map((d) => {
                const last = d.seasons.at(-1)!;
                return (
                  <tr key={d.driverId} className="border-t border-line hover:bg-surface-2">
                    <td className="px-4 py-2">
                      <Link href={`/drivers/${d.driverId}`} className="inline-flex items-center gap-2 font-medium hover:text-accent">
                        <TeamSwatch constructorId={last.constructorId} />
                        {d.givenName} {d.familyName}
                        {d.code && <span className="text-xs font-normal text-ink-3">{d.code}</span>}
                      </Link>
                    </td>
                    <td className="px-2 py-2 text-ink-2">{d.seasons[0].season === last.season ? last.season : `${d.seasons[0].season}–${last.season}`}</td>
                    <td className="px-2 py-2 text-right">{d.starts}</td>
                    <td className="px-2 py-2 text-right">{d.wins || ''}</td>
                    <td className="px-2 py-2 text-right font-semibold">{d.titles || ''}</td>
                    <td className="px-4 py-2 text-right font-semibold">{fmtPoints(d.points)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
