'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { contrast, teamColorFor } from '@/lib/colors';
import { driverLabel, fmtPoints, ordinal, shortRace } from '@/lib/format';
import { headToHead, sharedSeasons, teammatePairs, type H2HRace, type H2HSummary } from '@/lib/h2h';
import { useGetDriversQuery, useGetSeasonResultsQuery, useGetSeasonsQuery } from '@/store/api';
import type { DriverIndexItem } from '@/lib/types';
import { useCompareParams } from '@/lib/useUrlState';
import { DriverCombobox } from '../DriverCombobox';
import { useResolvedTheme } from '../Providers';
import { Card, EmptyState, ErrorState, PageSkeleton, Segmented, Skeleton } from '../ui';

export const FEATURED = [
  { a: 'hamilton', b: 'rosberg', from: 2014, to: 2016, label: 'Hamilton vs Rosberg', note: 'Mercedes, 2014–16' },
  { a: 'max_verstappen', b: 'hamilton', from: 2021, to: 2021, label: 'Verstappen vs Hamilton', note: 'The 2021 decider' },
  { a: 'norris', b: 'piastri', from: 2023, to: 2025, label: 'Norris vs Piastri', note: 'McLaren, 2023–25' },
  { a: 'leclerc', b: 'sainz', from: 2021, to: 2024, label: 'Leclerc vs Sainz', note: 'Ferrari, 2021–24' },
  { a: 'max_verstappen', b: 'ricciardo', from: 2016, to: 2018, label: 'Verstappen vs Ricciardo', note: 'Red Bull, 2016–18' },
];

export function CompareView() {
  const drivers = useGetDriversQuery();
  const seasons = useGetSeasonsQuery();
  const theme = useResolvedTheme();

  const years = useMemo(() => seasons.data?.map((s) => s.year).sort((a, b) => a - b) ?? [], [seasons.data]);
  const bounds = { min: years[0] ?? 1950, max: years.at(-1) ?? 2100 };
  const [state, update] = useCompareParams(bounds);
  const byId = useMemo(() => new Map(drivers.data?.map((d) => [d.driverId, d])), [drivers.data]);
  const A = state.a ? byId.get(state.a) : undefined;
  const B = state.b ? byId.get(state.b) : undefined;

  const shared = sharedSeasons(A, B);
  const defaultRange = shared.length ? [shared[0], shared.at(-1)!] : A && B ? [Math.min(A.seasons[0].season, B.seasons[0].season), Math.max(A.seasons.at(-1)!.season, B.seasons.at(-1)!.season)] : [0, 0];
  const from = state.from ?? defaultRange[0];
  const to = state.to ?? defaultRange[1];
  const rangeYears = A && B ? years.filter((y) => y >= from && y <= to && (A.seasons.some((s) => s.season === y) || B.seasons.some((s) => s.season === y))) : [];
  const results = useGetSeasonResultsQuery(rangeYears, { skip: rangeYears.length === 0 });
  const summary = useMemo(() => (results.data && A && B ? headToHead(results.data, A.driverId, B.driverId) : null), [results.data, A, B]);

  if (drivers.error || seasons.error) return <ErrorState message="We couldn't load drivers." onRetry={() => { drivers.refetch(); seasons.refetch(); }} />;
  if (!drivers.data || !seasons.data) return <PageSkeleton />;

  const colorOf = (d: DriverIndexItem | undefined) => {
    const inRange = d?.seasons.filter((s) => s.season >= from && s.season <= to);
    return d ? teamColorFor((inRange?.at(-1) ?? d.seasons.at(-1)!).constructorId, theme) : 'var(--ink-3)';
  };
  const colorA = colorOf(A);
  let colorB = colorOf(B);
  // Teammates share a livery colour; give B a neutral tone so the two sides stay distinct.
  if (A && B && colorA.startsWith('#') && colorB.startsWith('#') && contrast(colorA, colorB) < 1.6) colorB = theme === 'dark' ? '#c3c4cc' : '#44454f';

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-5xl font-bold uppercase leading-none tracking-tight">Head-to-head</h1>
        <p className="mt-3 max-w-2xl text-ink-2">Pick any two drivers. We count who finished ahead in every race they both started, plus qualifying battles and season totals.</p>
      </header>

      <Card>
        <div className="grid items-end gap-3 md:grid-cols-[1fr_auto_1fr]">
          <DriverCombobox testId="driver-a" label="Driver A" drivers={drivers.data} value={state.a} exclude={state.b}
            onChange={(id) => update({ a: id, from: null, to: null })} />
          <button
            onClick={() => update({ a: state.b, b: state.a })}
            disabled={!state.a && !state.b}
            className="mx-auto mb-1 grid h-10 w-10 place-items-center rounded-full border border-line text-ink-2 hover:bg-surface-2 disabled:opacity-40"
            aria-label="Swap drivers"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M7 7h11l-3-3M17 17H6l3 3" /></svg>
          </button>
          <DriverCombobox testId="driver-b" label="Driver B" drivers={drivers.data} value={state.b} exclude={state.a}
            onChange={(id) => update({ b: id, from: null, to: null })} />
        </div>
        {A && B && (
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            <span className="text-xs font-medium uppercase tracking-wider text-ink-3">Seasons</span>
            <YearSelect label="From" value={from} years={years} onChange={(y) => update({ from: y, to: Math.max(y, to) })} />
            <span className="text-ink-3">to</span>
            <YearSelect label="To" value={to} years={years} onChange={(y) => update({ to: y, from: Math.min(y, from) })} />
            {shared.length > 0 && (state.from != null || state.to != null) && (
              <button className="text-accent underline" onClick={() => update({ from: null, to: null })}>Reset to shared seasons</button>
            )}
          </div>
        )}
        <QuickPicks drivers={drivers.data} years={years} onPick={(p) => update({ a: p.a, b: p.b, from: p.from, to: p.to })} />
      </Card>

      {!A || !B ? (
        <EmptyState title="Choose two drivers">Search above, or start with a classic rivalry.</EmptyState>
      ) : results.error ? (
        <ErrorState message="We couldn't load race results." onRetry={() => results.refetch()} />
      ) : !summary ? (
        <div className="space-y-4" role="status" aria-label="Loading head-to-head"><Skeleton className="h-40" /><Skeleton className="h-96" /></div>
      ) : (
        <Results A={A} B={B} summary={summary} colorA={colorA} colorB={colorB} from={from} to={to} />
      )}
    </div>
  );
}

function YearSelect({ label, value, years, onChange }: { label: string; value: number; years: number[]; onChange: (y: number) => void }) {
  return (
    <label className="inline-flex items-center">
      <span className="sr-only">{label} season</span>
      <select value={value} onChange={(e) => onChange(Number(e.target.value))} className="rounded-md border border-line bg-surface px-2 py-1 font-semibold tabular">
        {years.map((y) => <option key={y} value={y}>{y}</option>)}
      </select>
    </label>
  );
}

function QuickPicks({ drivers, years, onPick }: { drivers: DriverIndexItem[]; years: number[]; onPick: (p: { a: string; b: string; from: number; to: number }) => void }) {
  const [season, setSeason] = useState(years.at(-1) ?? 2025);
  const ids = new Set(drivers.map((d) => d.driverId));
  const pairs = teammatePairs(drivers, season);
  return (
    <div className="mt-5 space-y-3 border-t border-line pt-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-ink-3">Rivalries</span>
        {FEATURED.filter((f) => ids.has(f.a) && ids.has(f.b)).map((f) => (
          <button key={f.label} onClick={() => onPick(f)} className="rounded-full border border-line px-3 py-1 text-sm hover:border-line-strong hover:bg-surface-2">
            {f.label} <span className="text-ink-3">· {f.note}</span>
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-xs font-medium uppercase tracking-wider text-ink-3" htmlFor="tm-season">Teammates in</label>
        <select id="tm-season" value={season} onChange={(e) => setSeason(Number(e.target.value))} className="rounded-md border border-line bg-surface px-2 py-0.5 text-sm font-semibold tabular">
          {[...years].reverse().map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        {pairs.map((p) => (
          <button key={p.constructorId} onClick={() => onPick({ a: p.a.driverId, b: p.b.driverId, from: season, to: season })}
            className="rounded-full border border-line px-3 py-1 text-sm hover:border-line-strong hover:bg-surface-2">
            <span className="text-ink-3">{p.constructorName}:</span> {driverLabel({ code: p.a.code, name: p.a.familyName })} v {driverLabel({ code: p.b.code, name: p.b.familyName })}
          </button>
        ))}
      </div>
    </div>
  );
}

function Results({ A, B, summary, colorA, colorB, from, to }: { A: DriverIndexItem; B: DriverIndexItem; summary: H2HSummary; colorA: string; colorB: string; from: number; to: number }) {
  const [only, setOnly] = useState<'all' | 'teammates'>('all');
  const codeA = driverLabel({ code: A.code, name: A.familyName });
  const codeB = driverLabel({ code: B.code, name: B.familyName });
  const races = only === 'teammates' ? summary.races.filter((r) => r.teammates) : summary.races;
  const rangeLabel = from === to ? `${from}` : `${from}–${to}`;

  return (
    <div className="space-y-6" data-testid="h2h-results">
      <section aria-label="Head-to-head summary" className="grid gap-4 lg:grid-cols-2">
        <Battle title="Race battle" a={summary.race.a} b={summary.race.b} codeA={codeA} codeB={codeB} colorA={colorA} colorB={colorB}
          hint={`Finished ahead in ${summary.races.length} shared races${summary.teammateRaces ? ` · ${summary.teammateRaces} as teammates` : ''}`} />
        <Battle title="Qualifying battle" a={summary.quali.a} b={summary.quali.b} codeA={codeA} codeB={codeB} colorA={colorA} colorB={colorB}
          hint="Out-qualified the other on the same weekend" />
      </section>

      <Card title={`Totals · ${rangeLabel}`}>
        <TotalsTable A={A} B={B} summary={summary} colorA={colorA} colorB={colorB} codeA={codeA} codeB={codeB} />
      </Card>

      <Card
        title="Who beat whom, race by race"
        actions={summary.teammateRaces > 0 && summary.teammateRaces < summary.races.length ? (
          <Segmented label="Races" value={only} onChange={setOnly} options={[{ value: 'all', label: 'All shared' }, { value: 'teammates', label: 'As teammates' }]} />
        ) : undefined}
      >
        {races.length === 0 ? (
          <EmptyState title="No shared races">{A.familyName} and {B.familyName} never started the same race in {rangeLabel}. Try a wider season range.</EmptyState>
        ) : (
          <RaceBars races={races} codeA={codeA} codeB={codeB} colorA={colorA} colorB={colorB} />
        )}
      </Card>
    </div>
  );
}

function Battle({ title, a, b, codeA, codeB, colorA, colorB, hint }: { title: string; a: number; b: number; codeA: string; codeB: string; colorA: string; colorB: string; hint: string }) {
  const total = a + b || 1;
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-3">{title}</h2>
      <div className="mt-2 flex items-end justify-between font-display font-bold tabular leading-none">
        <span className="text-5xl" style={{ color: colorA }}>{a}<span className="ml-2 text-xl text-ink">{codeA}</span></span>
        <span className="text-5xl" style={{ color: colorB }}><span className="mr-2 text-xl text-ink">{codeB}</span>{b}</span>
      </div>
      <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-surface-2" role="img" aria-label={`${codeA} ${a}, ${codeB} ${b}`}>
        <div style={{ width: `${(a / total) * 100}%`, background: colorA }} />
        <div className="w-0.5 bg-surface" />
        <div style={{ width: `${(b / total) * 100}%`, background: colorB }} />
      </div>
      <p className="mt-2 text-xs text-ink-3">{hint}</p>
    </div>
  );
}

function TotalsTable({ A, B, summary, colorA, colorB, codeA, codeB }: { A: DriverIndexItem; B: DriverIndexItem; summary: H2HSummary; colorA: string; colorB: string; codeA: string; codeB: string }) {
  const ta = summary.totals.a, tb = summary.totals.b;
  const rows: [string, number, number, (n: number) => string, boolean?][] = [
    ['Starts', ta.starts, tb.starts, String],
    ['Points', ta.points, tb.points, fmtPoints],
    ['Wins', ta.wins, tb.wins, String],
    ['Podiums', ta.podiums, tb.podiums, String],
    ['Poles', ta.poles, tb.poles, String],
    ['DNFs', ta.dnfs, tb.dnfs, String, true],
    ['Best finish', ta.bestFinish ?? 99, tb.bestFinish ?? 99, (n) => (n === 99 ? '—' : ordinal(n)), true],
  ];
  return (
    <table className="w-full text-sm tabular">
      <caption className="sr-only">Totals for {A.familyName} and {B.familyName}</caption>
      <thead>
        <tr className="text-xs uppercase tracking-wider text-ink-3">
          <th scope="col" className="w-2/5 py-2 text-right">{codeA}</th>
          <th scope="col" className="py-2 text-center"><span className="sr-only">Stat</span></th>
          <th scope="col" className="w-2/5 py-2 text-left">{codeB}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([label, a, b, fmt, lowerIsBetter]) => {
          const max = Math.max(a, b, 1);
          const better = a === b ? null : (lowerIsBetter ? a < b : a > b) ? 'a' : 'b';
          const barA = lowerIsBetter ? 0 : (a / max) * 100;
          const barB = lowerIsBetter ? 0 : (b / max) * 100;
          return (
            <tr key={label} className="border-t border-line">
              <td className="py-2">
                <div className="flex items-center justify-end gap-2">
                  <div className="hidden h-2 flex-1 justify-end sm:flex"><div className="h-2 rounded-l-full" style={{ width: `${barA}%`, background: colorA, opacity: 0.85 }} /></div>
                  <span className={`w-12 text-right ${better === 'a' ? 'font-bold' : 'text-ink-2'}`}>{fmt(a)}</span>
                </div>
              </td>
              <th scope="row" className="px-3 py-2 text-center text-xs font-medium uppercase tracking-wider text-ink-3">{label}</th>
              <td className="py-2">
                <div className="flex items-center gap-2">
                  <span className={`w-12 ${better === 'b' ? 'font-bold' : 'text-ink-2'}`}>{fmt(b)}</span>
                  <div className="hidden h-2 flex-1 sm:flex"><div className="h-2 rounded-r-full" style={{ width: `${barB}%`, background: colorB, opacity: 0.85 }} /></div>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

const MAX_GAP = 10;

/** Diverging bars: left = A finished ahead, right = B ahead; length = places between them. */
function RaceBars({ races, codeA, codeB, colorA, colorB }: { races: H2HRace[]; codeA: string; codeB: string; colorA: string; colorB: string }) {
  const bySeason = new Map<number, H2HRace[]>();
  for (const r of races) bySeason.set(r.season, [...(bySeason.get(r.season) ?? []), r]);
  const pos = (r: H2HRace['a']) => (/^\d+$/.test(r.positionText) ? `P${r.position}` : r.positionText === 'R' ? 'DNF' : r.positionText);

  return (
    <div>
      <div className="mb-2 grid grid-cols-[minmax(84px,140px)_1fr_1fr] gap-2 text-xs font-semibold uppercase tracking-wider text-ink-3 sm:grid-cols-[180px_1fr_1fr]">
        <span />
        <span className="text-right">← {codeA} ahead</span>
        <span>{codeB} ahead →</span>
      </div>
      <div className="space-y-5">
        {[...bySeason].map(([season, rs]) => (
          <section key={season} aria-label={`${season} season`}>
            <h3 className="mb-1 font-display text-lg font-semibold tabular">{season}</h3>
            <ul className="space-y-0.5">
              {rs.map((r) => {
                const w = (Math.min(Math.abs(r.gap), MAX_GAP) / MAX_GAP) * 100;
                const aAhead = r.raceWinner === 'a';
                const text = `${shortRace(r.raceName)}: ${codeA} ${pos(r.a)}, ${codeB} ${pos(r.b)}`;
                return (
                  <li key={`${r.season}-${r.round}`} className="grid grid-cols-[minmax(84px,140px)_1fr_1fr] items-center gap-2 text-xs sm:grid-cols-[180px_1fr_1fr]" title={text}>
                    <span className="truncate text-ink-2"><span className="text-ink-3 tabular">R{r.round}</span> {shortRace(r.raceName)}</span>
                    <div className="flex h-5 items-center justify-end gap-1.5 border-r border-line-strong pr-0">
                      {aAhead && <span className="whitespace-nowrap tabular text-ink-2">{pos(r.a)} <span className="text-ink-3">v {pos(r.b)}</span></span>}
                      <div className="h-3.5 rounded-l" style={{ width: aAhead ? `max(${w}%, 6px)` : 0, background: colorA }} />
                    </div>
                    <div className="flex h-5 items-center gap-1.5">
                      <div className="h-3.5 rounded-r" style={{ width: !aAhead ? `max(${w}%, 6px)` : 0, background: colorB }} />
                      {!aAhead && <span className="whitespace-nowrap tabular text-ink-2">{pos(r.b)} <span className="text-ink-3">v {pos(r.a)}</span></span>}
                    </div>
                    <span className="sr-only">{text}, {aAhead ? codeA : codeB} ahead</span>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
      <p className="mt-4 text-xs text-ink-3">Bar length = places between them (capped at {MAX_GAP}). Labels show the leading driver&apos;s finish first. <Link href="/circuits" className="underline">Circuit histories →</Link></p>
    </div>
  );
}
