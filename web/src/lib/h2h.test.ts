import { describe, expect, it } from 'vitest';
import { drivers, seasonResults } from '@/test/fixtures';
import { headToHead, sharedSeasons, teammatePairs } from './h2h';

describe('headToHead', () => {
  const s = headToHead(seasonResults, 'hamilton', 'rosberg');

  it('only counts races both drivers started as battles', () => {
    expect(s.races).toHaveLength(3);
    expect(s.teammateRaces).toBe(3);
  });

  it('decides the race battle by finishing order, including double DNFs', () => {
    // R1 ROS ahead, R2 both retired (HAM classified ahead), R3 HAM ahead
    expect(s.race).toEqual({ a: 2, b: 1 });
    expect(s.races[0].raceWinner).toBe('b');
    expect(s.races[0].gap).toBe(-1);
  });

  it('counts qualifying battles separately', () => {
    expect(s.quali).toEqual({ a: 2, b: 1 });
  });

  it('totals cover every start and include sprint points', () => {
    const vs = headToHead(seasonResults, 'hamilton', 'max_verstappen');
    expect(vs.totals.a.starts).toBe(4);
    expect(vs.totals.a.points).toBe(18 + 0 + 25 + 25 + 2);
    expect(vs.totals.b.points).toBe(25 + 0 + 3);
    expect(vs.totals.a.dnfs).toBe(1);
    expect(vs.totals.a.poles).toBe(3);
    expect(vs.races.every((r) => !r.teammates)).toBe(true);
  });

  it('returns an empty battle when drivers never met', () => {
    const none = headToHead(seasonResults, 'rosberg', 'perez');
    expect(none.races).toHaveLength(0);
    expect(none.race).toEqual({ a: 0, b: 0 });
  });
});

describe('sharedSeasons / teammatePairs', () => {
  const byId = new Map(drivers.map((d) => [d.driverId, d]));

  it('finds overlapping seasons', () => {
    expect(sharedSeasons(byId.get('hamilton'), byId.get('max_verstappen'))).toEqual([2016, 2021]);
    expect(sharedSeasons(byId.get('rosberg'), byId.get('perez'))).toEqual([]);
    expect(sharedSeasons(undefined, byId.get('perez'))).toEqual([]);
  });

  it('pairs teammates per season, best-placed team first', () => {
    const pairs = teammatePairs(drivers, 2021);
    expect(pairs.map((p) => [p.constructorId, p.a.driverId, p.b.driverId])).toEqual([['red_bull', 'max_verstappen', 'perez']]);
    expect(teammatePairs(drivers, 2016)[0]).toMatchObject({ constructorId: 'mercedes', a: { driverId: 'rosberg' } });
  });
});
