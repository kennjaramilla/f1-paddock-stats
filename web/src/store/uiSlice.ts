import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type ThemePref = 'light' | 'dark' | 'system';
export type StandingsView = 'drivers' | 'constructors';
export type TopN = '5' | '10' | 'all';
export type ChartMode = 'chart' | 'table';

export interface UiState {
  theme: ThemePref;
  standingsView: StandingsView;
  topN: TopN;
  chartMode: ChartMode;
  /** Highlighted driver or constructor; kept across seasons so a driver can be followed year to year. */
  highlighted: string | null;
}

export type Preferences = Pick<UiState, 'theme' | 'standingsView' | 'topN' | 'chartMode'>;

export const initialUiState: UiState = { theme: 'system', standingsView: 'drivers', topN: '10', chartMode: 'chart', highlighted: null };

export const uiSlice = createSlice({
  name: 'ui',
  initialState: initialUiState,
  reducers: {
    themeChanged: (s, a: PayloadAction<ThemePref>) => { s.theme = a.payload; },
    standingsViewChanged: (s, a: PayloadAction<StandingsView>) => {
      s.standingsView = a.payload;
      // Driver and constructor ids differ, so the highlight no longer applies.
      s.highlighted = null;
    },
    topNChanged: (s, a: PayloadAction<TopN>) => { s.topN = a.payload; },
    chartModeChanged: (s, a: PayloadAction<ChartMode>) => { s.chartMode = a.payload; },
    highlighted: (s, a: PayloadAction<string | null>) => { s.highlighted = a.payload; },
    highlightToggled: (s, a: PayloadAction<string>) => { s.highlighted = s.highlighted === a.payload ? null : a.payload; },
    /** Opens the drivers view with this driver highlighted (links from other pages). */
    driverFollowed: (s, a: PayloadAction<string>) => {
      s.standingsView = 'drivers';
      s.highlighted = a.payload;
    },
    preferencesLoaded: (s, a: PayloadAction<Partial<Preferences>>) => ({ ...s, ...a.payload }),
  },
});

export const { themeChanged, standingsViewChanged, topNChanged, chartModeChanged, highlighted, highlightToggled, driverFollowed, preferencesLoaded } = uiSlice.actions;
