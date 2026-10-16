import { beforeEach, describe, expect, it } from 'vitest';
import type { SeasonDetail } from '@/lib/types';
import { paddockApi } from './api';
import { PREFS_KEY } from './preferences';
import { selectChartSeries, selectSeasonFocus } from './selectors';
import { makeStore, type AppStore } from './store';
import { highlighted, standingsViewChanged, topNChanged } from './uiSlice';

const season = {
  year: 2021, inProgress: false, races: [], reconciliation: { matches: true, checked: 3, officialRound: 22, mismatches: [] },
  drivers: [
    { driverId: 'max_verstappen', code: 'VER', name: 'Max Verstappen', constructorId: 'red_bull', cumulative: [25, 43] },
    { driverId: 'hamilton', code: 'HAM', name: 'Lewis Hamilton', constructorId: 'mercedes', cumulative: [18, 43] },
    { driverId: 'perez', code: 'PER', name: 'Sergio Perez', constructorId: 'red_bull', cumulative: [10, 20] },
  ],
  constructors: [{ constructorId: 'red_bull', name: 'Red Bull', cumulative: [35, 63] }],
} as unknown as SeasonDetail;

describe('selectors', () => {
  let store: AppStore;
  beforeEach(async () => {
    localStorage.clear();
    store = makeStore();
    await store.dispatch(paddockApi.util.upsertQueryData('getSeason', 2021, season));
  });

  it('builds chart series for the current view and top-N', () => {
    expect(selectChartSeries(store.getState(), 2021, 'light').map((s) => s.label)).toEqual(['VER', 'HAM', 'PER']);
    store.dispatch(standingsViewChanged('constructors'));
    expect(selectChartSeries(store.getState(), 2021, 'light').map((s) => s.label)).toEqual(['Red Bull']);
  });

  it('is memoized: same inputs return the same array', () => {
    const a = selectChartSeries(store.getState(), 2021, 'light');
    store.dispatch(highlighted('hamilton'));
    expect(selectChartSeries(store.getState(), 2021, 'light')).toBe(a);
    store.dispatch(topNChanged('5'));
    expect(selectChartSeries(store.getState(), 2021, 'dark')).not.toBe(a);
  });

  it('returns [] before the season is loaded', () => {
    expect(selectChartSeries(store.getState(), 1999, 'light')).toEqual([]);
  });

  it('only exposes a highlight that exists in this season and view', () => {
    store.dispatch(highlighted('hamilton'));
    expect(selectSeasonFocus(store.getState(), 2021)).toBe('hamilton');
    store.dispatch(highlighted('rosberg'));
    expect(selectSeasonFocus(store.getState(), 2021)).toBeNull();
  });

  it('persists display preferences through the listener, not the highlight', () => {
    store.dispatch(topNChanged('all'));
    store.dispatch(highlighted('hamilton'));
    expect(JSON.parse(localStorage.getItem(PREFS_KEY)!)).toEqual({ theme: 'system', standingsView: 'drivers', topN: 'all', chartMode: 'chart' });
  });
});
