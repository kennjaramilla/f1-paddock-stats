import { describe, expect, it } from 'vitest';
import { resolveUrl } from './api';
import { driverLabel, fmtPct, fmtPoints, ordinal, shortRace } from './format';
import { spreadLabels } from './labels';
import { buildSeries } from './series';
import type { SeasonDetail } from './types';

describe('resolveUrl', () => {
  it('maps routes to the static snapshot by default', () => {
    expect(resolveUrl('seasons/2021', false)).toBe('/data/seasons/2021.json');
  });
  it('maps routes to the same-origin API proxy in live mode', () => {
    expect(resolveUrl('/circuits/monza/', true)).toBe('/api/live/circuits/monza');
  });
});

describe('format', () => {
  it('formats points, percentages and ordinals', () => {
    expect(fmtPoints(395.5)).toBe('395.5');
    expect(fmtPoints(25)).toBe('25');
    expect(fmtPct(0.456)).toBe('46%');
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22].map(ordinal)).toEqual(['1st', '2nd', '3rd', '4th', '11th', '12th', '13th', '21st', '22nd']);
  });
  it('shortens race names and derives codes', () => {
    expect(shortRace('Abu Dhabi Grand Prix')).toBe('Abu Dhabi');
    expect(driverLabel({ code: null, name: 'Nico Hülkenberg' })).toBe('HÜL');
  });
});

describe('spreadLabels', () => {
  it('pushes overlapping labels apart while keeping order', () => {
    const out = spreadLabels([{ id: 'a', y: 10 }, { id: 'b', y: 12 }, { id: 'c', y: 100 }], 14, 0, 200);
    expect(out.map((o) => o.labelY)).toEqual([10, 24, 100]);
  });
  it('keeps labels inside the bottom bound', () => {
    const out = spreadLabels([{ y: 195 }, { y: 196 }], 14, 0, 200);
    expect(out[1].labelY).toBeLessThanOrEqual(200);
    expect(out[1].labelY - out[0].labelY).toBeGreaterThanOrEqual(14);
  });
});

describe('buildSeries', () => {
  const season = {
    year: 2021, inProgress: false, races: [], reconciliation: { matches: true, checked: 3, officialRound: 1, mismatches: [] },
    drivers: [
      { driverId: 'max_verstappen', code: 'VER', name: 'Max Verstappen', constructorId: 'red_bull', cumulative: [25] },
      { driverId: 'hamilton', code: 'HAM', name: 'Lewis Hamilton', constructorId: 'mercedes', cumulative: [18] },
      { driverId: 'perez', code: 'PER', name: 'Sergio Perez', constructorId: 'red_bull', cumulative: [10] },
    ],
    constructors: [{ constructorId: 'red_bull', name: 'Red Bull', cumulative: [35] }],
  } as unknown as SeasonDetail;

  it('dashes the second car of a team so colour is not the only cue', () => {
    const s = buildSeries(season, { view: 'drivers', top: 'all' }, 'light');
    expect(s.map((x) => [x.label, x.dashed])).toEqual([['VER', false], ['HAM', false], ['PER', true]]);
    expect(s[0].color).toBe(s[2].color);
  });

  it('respects top-N and the constructors view', () => {
    expect(buildSeries(season, { view: 'drivers', top: '5' }, 'light')).toHaveLength(3);
    expect(buildSeries(season, { view: 'constructors', top: '10' }, 'dark').map((s) => s.label)).toEqual(['Red Bull']);
  });
});

describe('isNotFound', () => {
  it('treats API 404s and missing snapshot files as not found', async () => {
    const { isNotFound } = await import('@/store/api');
    expect(isNotFound({ status: 404, data: null })).toBe(true);
    expect(isNotFound({ status: 'PARSING_ERROR', originalStatus: 404, data: '<html>', error: 'x' })).toBe(true);
    expect(isNotFound({ status: 500, data: null })).toBe(false);
    expect(isNotFound(undefined)).toBe(false);
  });
});
