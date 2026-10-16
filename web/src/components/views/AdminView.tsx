'use client';
import { useState } from 'react';
import { dataMode } from '@/lib/api';
import { ROLE_LABEL } from '@/lib/auth/roles';
import { useGetSeasonsQuery, useRefreshSeasonMutation } from '@/store/api';
import { useGetUsersQuery } from '@/store/authApi';
import { Card, ErrorState, Skeleton } from '../ui';

export function AdminView() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-5xl font-bold uppercase leading-none tracking-tight">Admin</h1>
        <p className="mt-3 max-w-2xl text-ink-2">Users and their roles, and data maintenance.</p>
      </header>
      <div className="grid gap-6 lg:grid-cols-2">
        <UsersCard />
        <RefreshCard />
      </div>
    </div>
  );
}

function UsersCard() {
  const { data, error, refetch } = useGetUsersQuery();
  return (
    <Card title="Users">
      {error ? (
        <ErrorState message="We couldn't load users." onRetry={() => refetch()} />
      ) : !data ? (
        <Skeleton className="h-32" />
      ) : (
        <table className="w-full text-sm">
          <caption className="sr-only">Users and roles</caption>
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-ink-3">
              <th scope="col" className="py-2">Name</th><th scope="col" className="py-2">Email</th><th scope="col" className="py-2">Role</th>
            </tr>
          </thead>
          <tbody>
            {data.map((u) => (
              <tr key={u.id} className="border-t border-line">
                <td className="py-2 font-medium">{u.name}</td>
                <td className="py-2 text-ink-2">{u.email}</td>
                <td className="py-2"><span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-semibold">{ROLE_LABEL[u.role]}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="mt-3 text-xs text-ink-3">Roles are hierarchical: Viewer → Analyst (+ head-to-head) → Admin (+ this page).</p>
    </Card>
  );
}

function RefreshCard() {
  const { data: seasons } = useGetSeasonsQuery();
  const [year, setYear] = useState<number | null>(null);
  const [refresh, { isLoading, isSuccess, error }] = useRefreshSeasonMutation();
  const selected = year ?? seasons?.[0]?.year ?? null;
  const live = dataMode === 'live';

  return (
    <Card title="Refresh season data">
      <p className="text-sm text-ink-2">Re-ingests one season from Jolpica-F1 into the API&apos;s database and recomputes the standings.</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="text-sm">
          <span className="sr-only">Season</span>
          <select value={selected ?? ''} onChange={(e) => setYear(Number(e.target.value))} disabled={!live}
            className="rounded-md border border-line bg-surface px-2 py-1.5 font-semibold tabular disabled:opacity-60">
            {seasons?.map((s) => <option key={s.year} value={s.year}>{s.year}</option>)}
          </select>
        </label>
        <button onClick={() => selected && refresh(selected)} disabled={!live || isLoading || !selected}
          className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-bg hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
          {isLoading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>
      {!live && (
        <p className="mt-3 rounded-lg bg-surface-2 p-3 text-sm text-ink-2">
          Disabled in this deployment: it runs on a static snapshot exported by the .NET API, so there is no database to refresh.
          Run the app locally against the API (live mode) to use it.
        </p>
      )}
      {isSuccess && <p role="status" className="mt-3 text-sm font-medium text-good">Season {selected} refreshed.</p>}
      {error && <p role="alert" className="mt-3 text-sm font-medium text-accent">Refresh failed ({'status' in error ? error.status : 'error'}).</p>}
    </Card>
  );
}
