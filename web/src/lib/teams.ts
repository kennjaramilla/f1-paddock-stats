import type { ConstructorIndexItem, ConstructorSeasonRow } from './types';

/** "2014–2026", or one year; gaps show as separate runs: "2014–2016, 2019". */
export function seasonSpan(seasons: number[]): string {
  const sorted = [...seasons].sort((a, b) => a - b);
  const runs: [number, number][] = [];
  for (const y of sorted) {
    const last = runs.at(-1);
    if (last && y === last[1] + 1) last[1] = y;
    else runs.push([y, y]);
  }
  return runs.map(([a, b]) => (a === b ? String(a) : `${a}–${b}`)).join(', ');
}

/** Teams on the latest grid first, then former teams by their last season. */
export function groupTeams(teams: ConstructorIndexItem[]) {
  const latest = Math.max(...teams.flatMap((t) => t.seasons));
  const byName = (a: ConstructorIndexItem, b: ConstructorIndexItem) => a.name.localeCompare(b.name);
  const current = teams.filter((t) => t.seasons.includes(latest)).sort(byName);
  const former = teams
    .filter((t) => !t.seasons.includes(latest))
    .sort((a, b) => Math.max(...b.seasons) - Math.max(...a.seasons) || byName(a, b));
  return { latest, current, former };
}

/** Drivers who joined compared with the previous season (rows are newest first). */
export function newDrivers(rows: ConstructorSeasonRow[], index: number): Set<string> {
  const before = rows[index + 1];
  if (!before) return new Set();
  const prev = new Set(before.drivers.map((d) => d.driverId));
  return new Set(rows[index].drivers.filter((d) => !prev.has(d.driverId)).map((d) => d.driverId));
}
