import { createSelector } from '@reduxjs/toolkit';
import type { ThemeName } from '@/lib/colors';
import { buildSeries } from '@/lib/series';
import { paddockApi } from './api';
import type { RootState } from './store';

export const selectUi = (s: RootState) => s.ui;
export const selectStandingsView = (s: RootState) => s.ui.standingsView;
export const selectTopN = (s: RootState) => s.ui.topN;
export const selectHighlighted = (s: RootState) => s.ui.highlighted;

const selectSeasonData = (s: RootState, year: number) => paddockApi.endpoints.getSeason.select(year)(s).data;

/** Chart lines for a season under the current view, top-N and theme. Memoized: recomputes only when an input changes. */
export const selectChartSeries = createSelector(
  [selectSeasonData, selectStandingsView, selectTopN, (_: RootState, __: number, theme: ThemeName) => theme],
  (season, view, top, theme) => (season ? buildSeries(season, { view, top }, theme) : []),
);

/** The highlighted entry if it exists in this season's current view; otherwise null. */
export const selectSeasonFocus = createSelector(
  [selectSeasonData, selectStandingsView, selectHighlighted],
  (season, view, id) => {
    if (!season || !id) return null;
    const found = view === 'drivers' ? season.drivers.some((d) => d.driverId === id) : season.constructors.some((c) => c.constructorId === id);
    return found ? id : null;
  },
);
