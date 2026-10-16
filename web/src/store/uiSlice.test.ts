import { describe, expect, it } from 'vitest';
import {
  chartModeChanged, driverFollowed, highlightToggled, highlighted, initialUiState, preferencesLoaded, standingsViewChanged, topNChanged, uiSlice,
} from './uiSlice';

const reduce = uiSlice.reducer;

describe('uiSlice', () => {
  it('starts with sensible defaults', () => {
    expect(reduce(undefined, { type: '@@init' })).toEqual(initialUiState);
  });

  it('toggles the highlight on and off', () => {
    let s = reduce(initialUiState, highlightToggled('hamilton'));
    expect(s.highlighted).toBe('hamilton');
    s = reduce(s, highlightToggled('max_verstappen'));
    expect(s.highlighted).toBe('max_verstappen');
    expect(reduce(s, highlightToggled('max_verstappen')).highlighted).toBeNull();
  });

  it('clears the highlight when switching between drivers and constructors', () => {
    const s = reduce(reduce(initialUiState, highlighted('hamilton')), standingsViewChanged('constructors'));
    expect(s).toMatchObject({ standingsView: 'constructors', highlighted: null });
  });

  it('follows a driver from another page', () => {
    const s = reduce({ ...initialUiState, standingsView: 'constructors' }, driverFollowed('norris'));
    expect(s).toMatchObject({ standingsView: 'drivers', highlighted: 'norris' });
  });

  it('updates display preferences and merges loaded ones', () => {
    let s = reduce(initialUiState, topNChanged('5'));
    s = reduce(s, chartModeChanged('table'));
    expect(s).toMatchObject({ topN: '5', chartMode: 'table' });
    expect(reduce(s, preferencesLoaded({ theme: 'dark' }))).toMatchObject({ theme: 'dark', topN: '5' });
  });
});
