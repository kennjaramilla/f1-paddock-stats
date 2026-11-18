import { describe, expect, it } from 'vitest';
import { groupTeams, newDrivers, seasonSpan } from './teams';
import type { ConstructorSeasonRow } from './types';

describe('seasonSpan', () => {
  it('collapses consecutive seasons into runs', () => {
    expect(seasonSpan([2016, 2014, 2015, 2019])).toBe('2014–2016, 2019');
    expect(seasonSpan([2026])).toBe('2026');
  });
});

describe('groupTeams', () => {
  it('splits the latest grid from former teams', () => {
    const team = (constructorId: string, name: string, seasons: number[]) => ({ constructorId, name, nationality: null, seasons });
    const { latest, current, former } = groupTeams([
      team('sauber', 'Sauber', [2014, 2015, 2024, 2025]),
      team('mclaren', 'McLaren', [2025, 2026]),
      team('audi', 'Audi', [2026]),
      team('manor', 'Manor', [2016]),
    ]);
    expect(latest).toBe(2026);
    expect(current.map((t) => t.constructorId)).toEqual(['audi', 'mclaren']);
    expect(former.map((t) => t.constructorId)).toEqual(['sauber', 'manor']);
  });
});

describe('newDrivers', () => {
  const season = (s: number, ids: string[]): ConstructorSeasonRow => ({
    season: s, inProgress: false, position: 1, points: 0, wins: 0, podiums: 0, drivers: ids.map((driverId) => ({ driverId, code: null, name: driverId })),
  });

  it('flags drivers who were not in the team the year before', () => {
    const rows = [season(2025, ['hamilton', 'leclerc']), season(2024, ['sainz', 'leclerc'])];
    expect([...newDrivers(rows, 0)]).toEqual(['hamilton']);
    expect(newDrivers(rows, 1).size).toBe(0);
  });
});
