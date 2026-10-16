import type { DriverIndexItem, ResultRow, SeasonResults } from './types';

export type Side = 'a' | 'b';

export interface H2HRace {
  season: number;
  round: number;
  raceName: string;
  teammates: boolean;
  a: ResultRow;
  b: ResultRow;
  aQuali: number | null;
  bQuali: number | null;
  /** Who finished ahead in the race. */
  raceWinner: Side;
  qualiWinner: Side | null;
  /** Positive = A ahead by that many places. */
  gap: number;
}

export interface DriverTotals { starts: number; points: number; wins: number; podiums: number; poles: number; dnfs: number; bestFinish: number | null }

export interface H2HSummary {
  races: H2HRace[];
  race: { a: number; b: number };
  quali: { a: number; b: number };
  teammateRaces: number;
  totals: { a: DriverTotals; b: DriverTotals };
}

export const isClassified = (r: ResultRow) => /^\d+$/.test(r.positionText);

const emptyTotals = (): DriverTotals => ({ starts: 0, points: 0, wins: 0, podiums: 0, poles: 0, dnfs: 0, bestFinish: null });

/** Head-to-head across seasons. Totals cover every race each driver started; battles only shared races. */
export function headToHead(seasons: SeasonResults[], a: string, b: string): H2HSummary {
  const races: H2HRace[] = [];
  const totals = { a: emptyTotals(), b: emptyTotals() };

  for (const season of [...seasons].sort((x, y) => x.year - y.year)) {
    for (const race of season.races) {
      const qa = race.qualifying.find((q) => q.driverId === a)?.position ?? null;
      const qb = race.qualifying.find((q) => q.driverId === b)?.position ?? null;
      const ra = race.race.find((r) => r.driverId === a);
      const rb = race.race.find((r) => r.driverId === b);
      const sprintPts = (id: string) => race.sprint.filter((s) => s.driverId === id).reduce((s, r) => s + r.points, 0);

      for (const [side, row, q, id] of [['a', ra, qa, a], ['b', rb, qb, b]] as const) {
        if (!row) continue;
        const t = totals[side];
        t.starts++;
        t.points += row.points + sprintPts(id);
        if (row.position === 1) t.wins++;
        if (row.position <= 3) t.podiums++;
        if (q === 1) t.poles++;
        if (!isClassified(row)) t.dnfs++;
        else t.bestFinish = t.bestFinish == null ? row.position : Math.min(t.bestFinish, row.position);
      }

      if (!ra || !rb) continue;
      races.push({
        season: season.year,
        round: race.round,
        raceName: race.name,
        teammates: ra.constructorId === rb.constructorId,
        a: ra,
        b: rb,
        aQuali: qa,
        bQuali: qb,
        raceWinner: ra.position < rb.position ? 'a' : 'b',
        qualiWinner: qa != null && qb != null ? (qa < qb ? 'a' : 'b') : null,
        gap: rb.position - ra.position,
      });
    }
  }

  for (const t of [totals.a, totals.b]) t.points = Math.round(t.points * 100) / 100;

  return {
    races,
    race: { a: races.filter((r) => r.raceWinner === 'a').length, b: races.filter((r) => r.raceWinner === 'b').length },
    quali: { a: races.filter((r) => r.qualiWinner === 'a').length, b: races.filter((r) => r.qualiWinner === 'b').length },
    teammateRaces: races.filter((r) => r.teammates).length,
    totals,
  };
}

/** Seasons both drivers raced in. */
export function sharedSeasons(a: DriverIndexItem | undefined, b: DriverIndexItem | undefined): number[] {
  if (!a || !b) return [];
  const bs = new Set(b.seasons.map((s) => s.season));
  return a.seasons.map((s) => s.season).filter((y) => bs.has(y));
}

export interface TeammatePair { season: number; constructorId: string; constructorName: string; a: DriverIndexItem; b: DriverIndexItem }

/** Teammate pairings for a season, using each driver's main team that year. */
export function teammatePairs(drivers: DriverIndexItem[], season: number): TeammatePair[] {
  const byTeam = new Map<string, { name: string; drivers: { d: DriverIndexItem; pos: number }[] }>();
  for (const d of drivers) {
    const s = d.seasons.find((x) => x.season === season);
    if (!s) continue;
    const entry = byTeam.get(s.constructorId) ?? { name: s.constructorName, drivers: [] };
    entry.drivers.push({ d, pos: s.position });
    byTeam.set(s.constructorId, entry);
  }
  const pairs: TeammatePair[] = [];
  for (const [constructorId, { name, drivers: ds }] of byTeam) {
    const [x, y] = ds.sort((p, q) => p.pos - q.pos);
    if (x && y) pairs.push({ season, constructorId, constructorName: name, a: x.d, b: y.d });
  }
  return pairs.sort((p, q) => Math.min(...[p.a, p.b].map((d) => d.seasons.find((s) => s.season === season)!.position)) -
    Math.min(...[q.a, q.b].map((d) => d.seasons.find((s) => s.season === season)!.position)));
}
