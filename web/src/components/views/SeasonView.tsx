'use client';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { driverLabel, fmtDate, fmtPoints, ordinal, plural, shortRace } from '@/lib/format';
import { isNotFound, useGetSeasonQuery, useGetSeasonsQuery } from '@/store/api';
import { selectChartSeries, selectSeasonFocus, selectUi } from '@/store/selectors';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { chartModeChanged, highlightToggled, highlighted, standingsViewChanged, topNChanged } from '@/store/uiSlice';
import type { SeasonDetail } from '@/lib/types';
import { ProgressionChart } from '../ProgressionChart';
import { useResolvedTheme } from '../Providers';
import { Card, EmptyState, ErrorState, PageSkeleton, Segmented, Stat, TeamSwatch } from '../ui';
import { CumulativeTable } from '../CumulativeTable';

export function SeasonView() {
  const params = useParams<{ year: string }>();
  const year = Number(params.year);
  const valid = Number.isInteger(year);
  const { data: season, error, refetch } = useGetSeasonQuery(year, { skip: !valid });
  const { data: seasons } = useGetSeasonsQuery();
  const theme = useResolvedTheme();
  const dispatch = useAppDispatch();
  const { standingsView: view, topN: top, chartMode: mode } = useAppSelector(selectUi);
  const series = useAppSelector((s) => selectChartSeries(s, year, theme));
  const focus = useAppSelector((s) => selectSeasonFocus(s, year));


  if (!valid || isNotFound(error))
    return <EmptyState title="Season not found">We only have data for {seasons ? `${seasons.at(-1)?.year}–${seasons[0]?.year}` : 'the hybrid era onwards'}. <Link className="text-accent underline" href="/">Browse seasons</Link></EmptyState>;
  if (error) return <ErrorState message="We couldn't load this season." onRetry={() => refetch()} />;
  if (!season) return <PageSkeleton />;

  const champ = season.drivers[0];
  const runnerUp = season.drivers[1];
  const consChamp = season.constructors[0];
  const winners = new Set(season.races.map((r) => r.winner?.driverId).filter(Boolean));
  const sprints = season.races.filter((r) => r.hasSprint).length;

  const roundNames = season.races.map((r) => r.name);

  return (
    <div className="space-y-6">
      <SeasonSwitcher year={year} years={seasons?.map((s) => s.year) ?? [year]} />

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl font-bold uppercase leading-none tracking-tight sm:text-6xl">
            {year} <span className="text-ink-3">Season</span>
          </h1>
          <p className="mt-3 text-lg text-ink-2">
            {champ && (
              <>
                <span className="font-semibold text-ink">{champ.name}</span> {season.inProgress ? 'leads' : 'won the title'} by{' '}
                <span className="font-semibold text-ink tabular">{fmtPoints(champ.points - (runnerUp?.points ?? 0))}</span> points
                {runnerUp && <> over {runnerUp.name}</>}
                {season.inProgress && <> after {plural(season.races.length, 'round')}</>}.
              </>
            )}
          </p>
        </div>
        <ReconciliationBadge season={season} />
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label={season.inProgress ? 'Leader' : 'Champion'} value={champ ? driverLabel(champ) : '—'} hint={champ && `${champ.constructorName} · ${plural(champ.wins, 'win')}`} />
        <Stat label={season.inProgress ? 'Leading team' : 'Constructors'} value={consChamp?.name ?? '—'} hint={consChamp && `${fmtPoints(consChamp.points)} pts`} />
        <Stat label="Rounds" value={season.races.length} hint={sprints ? `${plural(sprints, 'sprint')}` : 'No sprints'} />
        <Stat label="Different winners" value={winners.size} hint={`${plural(season.drivers.filter((d) => d.points > 0).length, 'driver')} scored`} />
      </div>

      <Card
        title={view === 'drivers' ? "Drivers' championship" : "Constructors' championship"}
        actions={
          <>
            <Segmented label="Show" value={view} onChange={(v) => dispatch(standingsViewChanged(v))}
              options={[{ value: 'drivers', label: 'Drivers' }, { value: 'constructors', label: 'Teams' }]} />
            <Segmented label="Top" value={top} onChange={(v) => dispatch(topNChanged(v))}
              options={[{ value: '5', label: '5' }, { value: '10', label: '10' }, { value: 'all', label: 'All' }]} />
            <Segmented label="View" value={mode} onChange={(v) => dispatch(chartModeChanged(v))}
              options={[{ value: 'chart', label: 'Chart' }, { value: 'table', label: 'Table' }]} />
          </>
        }
      >
        {mode === 'chart' ? (
          <>
            <ProgressionChart
              title={`Cumulative ${view === 'drivers' ? 'driver' : 'constructor'} points by round, ${year}`}
              series={series}
              roundNames={roundNames}
              focus={focus}
              onFocus={(id) => dispatch(highlighted(id))}
            />
            <p className="mt-2 text-xs text-ink-3">
              Hover or use arrow keys to scrub rounds · click a line or label to highlight · dashed = second car of the same team
            </p>
          </>
        ) : (
          <CumulativeTable series={series} roundNames={roundNames} />
        )}
      </Card>

      {focus && <FocusPanel season={season} id={focus} view={view} onClear={() => dispatch(highlighted(null))} />}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card title="Standings">
          <StandingsTable season={season} view={view} focus={focus} onFocus={(id) => dispatch(highlightToggled(id))} />
        </Card>
        <Card title="Race by race">
          <ol className="divide-y divide-line">
            {season.races.map((r) => (
              <li key={r.round} className="flex items-center gap-3 py-2 text-sm">
                <span className="w-8 shrink-0 text-xs text-ink-3 tabular">R{r.round}</span>
                <div className="min-w-0 flex-1">
                  <Link href={`/circuits/${r.circuitId}`} className="font-medium hover:text-accent hover:underline">{shortRace(r.name)}</Link>
                  <div className="text-xs text-ink-3">{fmtDate(r.date)}{r.hasSprint && <span className="ml-1.5 rounded bg-surface-2 px-1 py-px font-medium text-ink-2">Sprint</span>}</div>
                </div>
                {r.winner && r.winnerTeam && (
                  <span className="inline-flex items-center gap-1.5 font-semibold tabular" title={`Winner: ${r.winner.name}`}>
                    <TeamSwatch constructorId={r.winnerTeam.constructorId} />
                    {driverLabel(r.winner)}
                    {r.pole?.driverId === r.winner.driverId && <span className="rounded bg-surface-2 px-1 py-px text-[10px] font-semibold uppercase text-ink-2" title="Won from pole">Pole</span>}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </div>
  );
}

function SeasonSwitcher({ year, years }: { year: number; years: number[] }) {
  const router = useRouter();
  const sorted = [...years].sort((a, b) => a - b);
  const idx = sorted.indexOf(year);
  const prev = sorted[idx - 1];
  const next = sorted[idx + 1];
  const href = (y: number) => `/season/${y}`;
  return (
    <nav aria-label="Season" className="flex items-center gap-2">
      <Link href="/" className="text-sm text-ink-2 hover:text-ink">Seasons</Link>
      <span className="text-ink-3" aria-hidden>/</span>
      {prev ? <Link href={href(prev)} className="rounded-md border border-line px-2 py-1 text-sm hover:bg-surface-2" aria-label={`Previous season, ${prev}`}>← {prev}</Link> : null}
      <label className="sr-only" htmlFor="season-select">Season</label>
      <select
        id="season-select"
        value={year}
        onChange={(e) => router.push(href(Number(e.target.value)))}
        className="rounded-md border border-line bg-surface px-2 py-1 text-sm font-semibold tabular"
      >
        {[...sorted].reverse().map((y) => <option key={y} value={y}>{y}</option>)}
      </select>
      {next ? <Link href={href(next)} className="rounded-md border border-line px-2 py-1 text-sm hover:bg-surface-2" aria-label={`Next season, ${next}`}>{next} →</Link> : null}
    </nav>
  );
}

function ReconciliationBadge({ season }: { season: SeasonDetail }) {
  const r = season.reconciliation;
  return (
    <p
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${r.matches ? 'border-good/30 text-good' : 'border-warn/40 text-warn'}`}
      title={r.matches ? 'Points are computed from race and sprint results by the .NET API, then checked against the official standings.' : r.mismatches.join('; ')}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
        {r.matches ? <path d="M5 12l5 5L20 7" /> : <path d="M12 8v5M12 16h.01" />}
      </svg>
      {r.matches ? `Computed totals match official standings (${r.checked} drivers)` : `${r.mismatches.length} differences vs official standings`}
    </p>
  );
}

function StandingsTable({ season, view, focus, onFocus }: { season: SeasonDetail; view: 'drivers' | 'constructors'; focus: string | null; onFocus: (id: string) => void }) {
  const leader = view === 'drivers' ? season.drivers[0]?.points ?? 0 : season.constructors[0]?.points ?? 0;
  const rowCls = (id: string) => `border-t border-line ${focus === id ? 'bg-accent-soft' : 'hover:bg-surface-2'}`;
  return (
    <div className="-mx-4 overflow-x-auto sm:mx-0">
      <table className="w-full min-w-[480px] text-sm tabular">
        <caption className="sr-only">{view === 'drivers' ? 'Driver' : 'Constructor'} standings {season.year}</caption>
        <thead>
          <tr className="text-left text-xs uppercase tracking-wider text-ink-3">
            <th scope="col" className="w-10 px-4 py-2 sm:px-2">Pos</th>
            <th scope="col" className="px-2 py-2">{view === 'drivers' ? 'Driver' : 'Team'}</th>
            <th scope="col" className="px-2 py-2 text-right">Pts</th>
            <th scope="col" className="px-2 py-2 text-right">Gap</th>
            <th scope="col" className="px-2 py-2 text-right">Wins</th>
            {view === 'drivers' && <><th scope="col" className="px-2 py-2 text-right">Podiums</th><th scope="col" className="px-4 py-2 text-right sm:px-2">Poles</th></>}
          </tr>
        </thead>
        <tbody>
          {view === 'drivers'
            ? season.drivers.map((d) => (
                <tr key={d.driverId} className={rowCls(d.driverId)} aria-selected={focus === d.driverId}>
                  <td className="px-4 py-2 text-ink-3 sm:px-2">{d.position}</td>
                  <td className="px-2 py-2">
                    <button onClick={() => onFocus(d.driverId)} className="flex items-center gap-2 text-left" aria-pressed={focus === d.driverId}>
                      <TeamSwatch constructorId={d.constructorId} />
                      <span className="font-medium">{d.name}</span>
                      <span className="hidden text-xs text-ink-3 sm:inline">{d.constructorName}</span>
                    </button>
                  </td>
                  <td className="px-2 py-2 text-right font-semibold">{fmtPoints(d.points)}</td>
                  <td className="px-2 py-2 text-right text-ink-3">{d.position === 1 ? '—' : `−${fmtPoints(leader - d.points)}`}</td>
                  <td className="px-2 py-2 text-right">{d.wins || ''}</td>
                  <td className="px-2 py-2 text-right">{d.podiums || ''}</td>
                  <td className="px-4 py-2 text-right sm:px-2">{d.poles || ''}</td>
                </tr>
              ))
            : season.constructors.map((c) => (
                <tr key={c.constructorId} className={rowCls(c.constructorId)} aria-selected={focus === c.constructorId}>
                  <td className="px-4 py-2 text-ink-3 sm:px-2">{c.position}</td>
                  <td className="px-2 py-2">
                    <button onClick={() => onFocus(c.constructorId)} className="flex items-center gap-2 text-left" aria-pressed={focus === c.constructorId}>
                      <TeamSwatch constructorId={c.constructorId} />
                      <span className="font-medium">{c.name}</span>
                    </button>
                  </td>
                  <td className="px-2 py-2 text-right font-semibold">{fmtPoints(c.points)}</td>
                  <td className="px-2 py-2 text-right text-ink-3">{c.position === 1 ? '—' : `−${fmtPoints(leader - c.points)}`}</td>
                  <td className="px-2 py-2 text-right">{c.wins || ''}</td>
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
}

function FocusPanel({ season, id, view, onClear }: { season: SeasonDetail; id: string; view: 'drivers' | 'constructors'; onClear: () => void }) {
  if (view === 'drivers') {
    const d = season.drivers.find((x) => x.driverId === id)!;
    const mate = season.drivers.find((x) => x.driverId !== d.driverId && x.constructorId === d.constructorId);
    return (
      <section aria-label={`${d.name} summary`} className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl border border-line bg-surface px-5 py-4">
        <div className="flex items-center gap-3">
          <TeamSwatch constructorId={d.constructorId} className="h-8 w-2" />
          <div>
            <div className="font-display text-2xl font-semibold uppercase leading-none">{d.name}</div>
            <div className="text-sm text-ink-3">{d.constructorName} · {ordinal(d.position)} with {fmtPoints(d.points)} pts</div>
          </div>
        </div>
        <dl className="flex gap-5 text-sm tabular">
          {[['Wins', d.wins], ['Podiums', d.podiums], ['Poles', d.poles], ['Best', d.bestFinish ? ordinal(d.bestFinish) : '—']].map(([k, v]) => (
            <div key={k as string}><dt className="text-xs uppercase tracking-wider text-ink-3">{k}</dt><dd className="font-semibold">{v}</dd></div>
          ))}
        </dl>
        <div className="ml-auto flex flex-wrap gap-2">
          {mate && (
            <Link href={`/compare?a=${d.driverId}&b=${mate.driverId}&from=${season.year}&to=${season.year}`}
              className="rounded-lg bg-ink px-3 py-2 text-sm font-medium text-bg hover:opacity-90">
              Compare with teammate {driverLabel(mate)} →
            </Link>
          )}
          <Link href={`/drivers/${d.driverId}`} className="rounded-lg border border-line px-3 py-2 text-sm font-medium hover:bg-surface-2">Career</Link>
          <button onClick={onClear} className="rounded-lg px-3 py-2 text-sm text-ink-2 hover:text-ink">Clear</button>
        </div>
      </section>
    );
  }
  const c = season.constructors.find((x) => x.constructorId === id)!;
  const [a, b] = c.driverIds;
  return (
    <section aria-label={`${c.name} summary`} className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-surface px-5 py-4">
      <TeamSwatch constructorId={c.constructorId} className="h-8 w-2" />
      <div>
        <div className="font-display text-2xl font-semibold uppercase leading-none">{c.name}</div>
        <div className="text-sm text-ink-3">{ordinal(c.position)} with {fmtPoints(c.points)} pts · {plural(c.wins, 'win')}</div>
      </div>
      <div className="ml-auto flex gap-2">
        {a && b && (
          <Link href={`/compare?a=${a}&b=${b}&from=${season.year}&to=${season.year}`} className="rounded-lg bg-ink px-3 py-2 text-sm font-medium text-bg hover:opacity-90">
            Compare drivers →
          </Link>
        )}
        <button onClick={onClear} className="rounded-lg px-3 py-2 text-sm text-ink-2 hover:text-ink">Clear</button>
      </div>
    </section>
  );
}
